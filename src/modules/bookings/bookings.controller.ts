import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CancelBookingDto,
  QueryBookingDto,
} from './dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, BookingStatus } from '@prisma/client';
import { Request } from 'express';
import { PaymentService } from '../payment/payment.service';

interface AuthUser {
  sub: string;
  role: Role;
  sid: string;
}

interface AuthRequest extends Request {
  user: AuthUser;
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  private readonly logger = new Logger(BookingsController.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentService: PaymentService,
  ) {}

  // ========== Customer Endpoints ==========

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Created',
        data: {
          booking: {
            id: 'booking-id',
            status: 'PENDING',
            checkIn: '2026-02-01T00:00:00.000Z',
            checkOut: '2026-02-03T00:00:00.000Z',
            totalPrice: 200,
            paymentStatus: 'PENDING',
            room: {
              id: 'room-id',
              name: 'Deluxe Room',
              hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
            },
          },
          paymentUrl: 'https://payment.provider.com/intent/xyz',
        },
      },
    },
  })
  async createBooking(@Req() req: AuthRequest, @Body() dto: CreateBookingDto) {
    const userId = req.user.sub;
    return this.bookingsService.createBooking(userId, dto);
  }

  @Get()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my bookings' })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          items: [
            {
              id: 'booking-id',
              status: 'CONFIRMED',
              checkIn: '2026-02-01T00:00:00.000Z',
              checkOut: '2026-02-03T00:00:00.000Z',
              totalPrice: 200,
              room: {
                id: 'room-id',
                name: 'Deluxe Room',
                hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
                images: [{ url: 'https://example.com/image.jpg' }],
              },
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    },
  })
  async getBookings(@Req() req: AuthRequest, @Query() query: QueryBookingDto) {
    const userId = req.user.sub;
    return this.bookingsService.getBookings(userId, query);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          booking: {
            id: 'booking-id',
            status: 'CONFIRMED',
            checkIn: '2026-02-01T00:00:00.000Z',
            checkOut: '2026-02-03T00:00:00.000Z',
            totalPrice: 200,
            room: {
              id: 'room-id',
              name: 'Deluxe Room',
              hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
              images: [{ url: 'https://example.com/image.jpg' }],
              beds: [{ type: 'Queen', count: 1 }],
              amenities: [{ amenity: { name: 'WiFi' } }],
            },
          },
        },
      },
    },
  })
  async getBookingById(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.bookingsService.getBookingById(userId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modify a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          booking: {
            id: 'booking-id',
            status: 'CONFIRMED',
            checkIn: '2026-02-02T00:00:00.000Z',
            checkOut: '2026-02-04T00:00:00.000Z',
            totalPrice: 240,
            room: {
              id: 'room-id',
              name: 'Deluxe Room',
              hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
            },
          },
        },
      },
    },
  })
  async updateBooking(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    const userId = req.user.sub;
    return this.bookingsService.updateBooking(userId, id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          booking: {
            id: 'booking-id',
            status: 'CANCELLED',
            checkIn: '2026-02-01T00:00:00.000Z',
            checkOut: '2026-02-03T00:00:00.000Z',
            totalPrice: 200,
            room: {
              id: 'room-id',
              name: 'Deluxe Room',
              hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
            },
          },
        },
      },
    },
  })
  async cancelBooking(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const userId = req.user.sub;
    return this.bookingsService.cancelBooking(userId, id, dto);
  }

  // ========== Partner Endpoints ==========

  @Get('partners/bookings')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings for my hotels (Partner only)' })
  @ApiResponse({
    status: 200,
    description: 'List of bookings for partner hotels',
  })
  async getPartnerBookings(
    @Req() req: AuthRequest,
    @Query() query: QueryBookingDto,
  ) {
    const userId = req.user.sub;
    return this.bookingsService.getBookingsForPartner(userId, query);
  }

  @Patch(':id/status')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Partner only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateBookingStatus(id, status);
  }

  // ========== Webhook Endpoint ==========

  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SEPAY payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleSepayWebhook(@Req() req: RawBodyRequest<Request>) {
    try {
      // Get raw body for signature verification
      const signature = req.headers['x-sepay-signature'] as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rawBody = req.body;

      // Verify webhook signature
      if (signature) {
        const isValid = this.paymentService.verifyWebhookSignature(
          JSON.stringify(rawBody),
          signature,
        );

        if (!isValid) {
          this.logger.warn('Invalid webhook signature');
          return { success: false, message: 'Invalid signature' };
        }
      }

      // Parse webhook payload
      const payload = this.paymentService.parseWebhookPayload(rawBody);

      this.logger.log(
        `Received webhook for payment: ${payload.paymentIntentId}`,
      );

      const booking = await this.bookingsService['prisma'].booking.findFirst({
        where: {
          paymentIntentId: payload.paymentIntentId,
        },
      });

      if (!booking) {
        this.logger.warn(
          `Booking not found for payment: ${payload.paymentIntentId}`,
        );
        return { success: false, message: 'Booking not found' };
      }

      // If payment is successful, confirm the booking
      if (payload.status === 'completed' || payload.status === 'success') {
        await this.bookingsService.confirmBooking(
          booking.id,
          payload.transactionId || payload.paymentIntentId,
        );

        this.logger.log(`Booking ${booking.id} confirmed via webhook`);
        return { success: true, message: 'Booking confirmed' };
      }

      // If payment failed, you might want to handle it
      if (payload.status === 'failed') {
        this.logger.warn(`Payment failed for booking: ${booking.id}`);
        // Optionally: cancel booking, restore room availability, etc.
      }

      return { success: true, message: 'Webhook received' };
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }
}
