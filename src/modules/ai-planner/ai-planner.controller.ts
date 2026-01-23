import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIPlannerService } from './ai-planner.service';
import { GenerateTripDto } from './dto/generate-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';

@ApiTags('AI Planner')
@Controller('ai-planner')
export class AIPlannerController {
  constructor(private readonly aiPlannerService: AIPlannerService) {}

  @Post('generate')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new AI trip itinerary' })
  @ApiResponse({ status: 201, type: TripResponseDto })
  async generateTrip(@Req() req: any, @Body() dto: GenerateTripDto) {
    const userId = req.user.sub;
    return this.aiPlannerService.generateTrip(userId, dto);
  }

  @Get('trips')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all saved trips for the current user' })
  @ApiResponse({ status: 200, type: [TripResponseDto] })
  async getUserTrips(@Req() req: any) {
    const userId = req.user.sub;
    return this.aiPlannerService.getUserTrips(userId);
  }

  @Get('trips/:id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a specific trip' })
  @ApiResponse({ status: 200, type: TripResponseDto })
  async getTrip(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.aiPlannerService.getTrip(userId, id);
  }

  @Delete('trips/:id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a saved trip' })
  @ApiResponse({ status: 200 })
  async deleteTrip(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.aiPlannerService.deleteTrip(userId, id);
  }
}
