import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';
import { GenerateTripDto } from './dto/generate-trip.dto';
// import { ActivityType } from '@prisma/client';

// Local enum for ActivityType if Prisma client is having issues
export enum ActivityType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  DINING = 'DINING',
  ACTIVITY = 'ACTIVITY',
  EXPERIENCE = 'EXPERIENCE',
  RELAXATION = 'RELAXATION',
  TRANSPORTATION = 'TRANSPORTATION',
}

@Injectable()
export class AIPlannerService {
  private readonly logger = new Logger(AIPlannerService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY')!;
    this.baseUrl = this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
    this.model = this.configService.get<string>('OPENROUTER_MODEL') || 'meta-llama/llama-3.3-70b-instruct';
    
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not defined in environment variables');
    }
  }

  async generateTrip(userId: string, dto: GenerateTripDto) {
    // Step 1: Parse trip details from description if not provided
    let tripDetails = {
      destination: dto.destination,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults,
      children: dto.children,
      budget: dto.budget,
      preferences: dto.preferences,
    };

    // If critical fields are missing, use AI to parse from description
    if (!dto.destination || !dto.checkIn || !dto.checkOut || !dto.adults) {
      this.logger.log('Parsing trip details from description using AI...');
      const parsedDetails = await this.parseTripDescription(dto.description);
      
      tripDetails = {
        destination: dto.destination || parsedDetails.destination,
        checkIn: dto.checkIn || parsedDetails.checkIn,
        checkOut: dto.checkOut || parsedDetails.checkOut,
        adults: dto.adults ?? parsedDetails.adults,
        children: dto.children ?? parsedDetails.children,
        budget: dto.budget || parsedDetails.budget,
        preferences: dto.preferences?.length ? dto.preferences : parsedDetails.preferences,
      };
      
      this.logger.log(`Parsed details: ${JSON.stringify(tripDetails)}`);
    }

    let hotelInfo = '';
    if (dto.hotelId) {
      const hotel = await this.prisma.hotel.findUnique({
        where: { id: dto.hotelId },
        include: {
          reviews: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });
      if (hotel) {
        hotelInfo = `
Accommodation: ${hotel.name}
Address: ${hotel.address}, ${hotel.city}, ${hotel.country}
Description: ${hotel.description}
Recent Guest Feedback: ${hotel.reviews.map(r => r.comment).join('; ')}
`;
      }
    }

    const prompt = this.createPrompt({ ...dto, ...tripDetails }, hotelInfo);
    const startTime = Date.now();
    this.logger.log(`Starting AI trip generation for ${tripDetails.destination}...`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel planner. You provide highly detailed, realistic, and personalized travel itineraries. You MUST return your response in valid JSON format. Always include specific times, location names, and estimated costs.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Zen Inn AI Planner',
          },
          timeout: 120000, // 120 seconds for OpenRouter response
        },
      );

      const aiResponse = response.data.choices[0].message.content;
      this.logger.log(`AI Response received in ${Date.now() - startTime}ms`);
      
      const itinerary = JSON.parse(this.cleanJsonResponse(aiResponse));
      const dbStartTime = Date.now();

      // Store in database with parsed details
      const trip = await (this.prisma as any).trip.create({
        data: {
          userId,
          destination: tripDetails.destination,
          checkIn: tripDetails.checkIn,
          checkOut: tripDetails.checkOut,
          adults: tripDetails.adults,
          children: tripDetails.children || 0,
          budget: tripDetails.budget,
          preferences: tripDetails.preferences || [],
          hotelId: dto.hotelId,
          days: {
            create: itinerary.days.map((day: any) => ({
              dayNumber: day.dayNumber,
              date: new Date(new Date(tripDetails.checkIn || new Date()).getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000),
              activities: {
                create: day.activities.map((act: any) => ({
                  name: act.name,
                  description: act.description,
                  time: act.time,
                  type: this.mapActivityType(act.type),
                  location: act.location,
                  price: act.price,
                  imageUrl: act.imageUrl,
                  displayOrder: act.displayOrder || 0,
                })),
              },
            })),
          },
        },
        include: {
          days: {
            include: {
              activities: true,
            },
          },
        },
      });

      this.logger.log(`Trip saved to database in ${Date.now() - dbStartTime}ms. Total process time: ${Date.now() - startTime}ms`);
      return trip;
    } catch (error) {
      this.logger.error(`AI Trip Generation failed: ${error.message}`, error.stack);
      if (error.response?.data) {
        this.logger.error(`OpenRouter Error: ${JSON.stringify(error.response.data)}`);
      }
      throw new InternalServerErrorException('Failed to generate trip itinerary. Please try again later.');
    }
  }

  private async parseTripDescription(description: string): Promise<any> {
    const prompt = `Extract trip details from this description: "${description}"

Return ONLY valid JSON with this exact structure (no additional text):
{
  "destination": "City, Country",
  "checkIn": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "checkOut": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "adults": number,
  "children": number,
  "budget": "ECONOMY|MODERATE|LUXURY",
  "preferences": ["preference1", "preference2"]
}

Rules:
- If dates are relative (e.g., "3 days"), calculate from today: ${new Date().toISOString()}
- If only duration given (e.g., "3-day trip"), set checkIn to today and checkOut to today + duration
- Default adults to 2 if not specified
- Default children to 0 if not specified
- Infer budget from keywords (cheap/budget=ECONOMY, moderate/mid-range=MODERATE, luxury/premium=LUXURY)
- Extract preferences from activities mentioned (e.g., "coffee tours" → ["coffee", "tours"])`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a data extraction expert. You MUST return ONLY valid JSON, nothing else.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const aiResponse = response.data.choices[0].message.content;
      const parsed = JSON.parse(this.cleanJsonResponse(aiResponse));
      
      // Convert string dates to Date objects
      return {
        ...parsed,
        checkIn: new Date(parsed.checkIn),
        checkOut: new Date(parsed.checkOut),
      };
    } catch (error) {
      this.logger.error(`Failed to parse trip description: ${error.message}`);
      throw new InternalServerErrorException('Could not understand trip description. Please provide destination, dates, and number of travelers.');
    }
  }


  private createPrompt(dto: GenerateTripDto, hotelInfo: string): string {
    // These should be guaranteed to exist after parsing, but add safety checks
    const checkIn = dto.checkIn || new Date();
    const checkOut = dto.checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const durationDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Create a concise ${durationDays}-day itinerary for ${dto.destination || 'the destination'}.
Dates: ${checkIn.toDateString()} to ${checkOut.toDateString()}
Guests: ${dto.adults || 2}A, ${dto.children || 0}C
Budget: ${dto.budget || 'Moderate'}
Vibe: ${dto.preferences?.join(', ') || 'Mixed'}
${dto.description ? `Note: ${dto.description}` : ''}
${hotelInfo}

Requirements:
1. MAX 2-3 activities/day for faster generation.
2. Keep "description" under 12 words.
3. JSON ONLY. No text before/after.
Structure:
{
  "days": [
    {
      "dayNumber": 1,
      "activities": [
        {
          "time": "09:00 AM",
          "name": "...",
          "description": "...",
          "type": "DINING|ACTIVITY|CHECK_IN|CHECK_OUT|EXPERIENCE|RELAXATION|TRANSPORTATION",
          "location": "...",
          "price": "...",
          "displayOrder": 0
        }
      ]
    }
  ]
}`;
  }

  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }
    return content.trim();
  }

  private mapActivityType(type: string): ActivityType {
    const upperType = type?.toUpperCase() || 'ACTIVITY';
    if (Object.values(ActivityType).includes(upperType as ActivityType)) {
      return upperType as ActivityType;
    }
    return ActivityType.ACTIVITY;
  }

  async getTrip(userId: string, tripId: string) {
    const trip = await (this.prisma as any).trip.findFirst({
      where: { id: tripId, userId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            activities: { orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async getUserTrips(userId: string) {
    return (this.prisma as any).trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        days: {
          include: { activities: true },
        },
      },
    });
  }

  async deleteTrip(userId: string, tripId: string) {
    const trip = await this.getTrip(userId, tripId);
    await (this.prisma as any).trip.delete({
      where: { id: trip.id },
    });
    return { success: true };
  }
}
