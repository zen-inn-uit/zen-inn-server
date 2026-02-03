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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CancelBookingDto,
  QueryBookingDto,
  BookingCalendarResponseDto,
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

  @Post('reserve')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Reserve and confirm a room (DEMO: No payment, instant confirmation)',
    description: 'Bypass payment - instant booking confirmation. Returns success immediately if room is available.'
  })
  @ApiResponse({
    status: 201,
    description: 'Room booked and confirmed successfully - redirect to success page',
    schema: {
      example: {
        success: true,
        booking: {
          id: 'clz1234567890',
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          checkIn: '2026-02-25T00:00:00.000Z',
          checkOut: '2026-02-27T00:00:00.000Z',
          totalPrice: 2200000,
          nightCount: 2,
          guestCount: 2,
          guestName: 'Nguyễn Văn A',
          guestEmail: 'nguyenvana@example.com',
          guestPhone: '+84123456789',
          paymentMethod: 'CASH',
          room: {
            id: 'room-id',
            name: 'Deluxe Double Room',
            hotel: {
              id: 'hotel-id',
              name: 'Zen Inn Hanoi'
            }
          }
        },
        message: 'Booking confirmed successfully! Redirect to success page.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Room already booked or another user is booking (Redis lock)',
    schema: {
      example: {
        statusCode: 409,
        message: 'Another booking is being processed for this room and dates. Please try again in a few seconds.',
        error: 'Conflict'
      }
    }
  })
  async reserveBooking(@Req() req: AuthRequest, @Body() dto: CreateBookingDto) {
    const userId = req.user.sub;
    return this.bookingsService.reserveBooking(userId, dto);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm booking after payment' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async confirmBooking(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.bookingsService.confirmBookingAfterPayment(id, userId);
  }

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

  @Get('partner/list')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings for my hotels (Partner only)' })
  @ApiResponse({
    status: 200,
    description: 'List of bookings for partner hotels',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          data: [
            {
              id: 'booking-id',
              status: 'CONFIRMED',
              checkIn: '2026-02-01T00:00:00.000Z',
              checkOut: '2026-02-03T00:00:00.000Z',
              guestName: 'John Doe',
              guestEmail: 'john@example.com',
              guestPhone: '+84123456789',
              guestCount: 2,
              totalPrice: 200,
              room: {
                id: 'room-id',
                name: 'Deluxe Room',
                hotel: { id: 'hotel-id', name: 'Zen Inn Hanoi' },
              },
              user: {
                id: 'user-id',
                email: 'customer@example.com',
              },
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    },
  })
  async getPartnerBookings(
    @Req() req: AuthRequest,
    @Query() query: QueryBookingDto,
  ) {
    const userId = req.user.sub;
    return this.bookingsService.getBookingsForPartner(userId, query);
  }

  @Get('partner/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking detail (Partner only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking details for partner',
  })
  async getPartnerBookingById(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user.sub;
    return await this.bookingsService.getBookingByIdForPartner(userId, id);
  }

  @Get('partner/calendar/:year/:month')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bookings calendar view for a specific month (Partner only)',
  })
  @ApiParam({ name: 'year', description: 'Year (e.g., 2026)' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Calendar view of bookings grouped by date',
  })
  @ApiOkResponse({ type: BookingCalendarResponseDto })
  async getPartnerBookingsCalendar(
    @Req() req: AuthRequest,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const userId = req.user.sub;
    return await this.bookingsService.getBookingsCalendarForPartner(
      userId,
      parseInt(year),
      parseInt(month),
    );
  }

  @Patch('partner/:id/status')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Partner only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  async updateBookingStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    const userId = req.user.sub;
    return await this.bookingsService.updateBookingStatusByPartner(
      userId,
      id,
      status,
    );
  }

  // ========== Webhook Endpoint ==========

  @Get('webhook/vnpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VNPAY payment IPN' })
  @ApiResponse({ status: 200, description: 'IPN processed' })
  async handleVnpayIpn(@Query() query: Record<string, string>) {
    try {
      this.logger.log('Received VNPAY IPN');

      // Verify webhook signature
      const isValid = this.paymentService.verifyWebhookSignature(query);

      if (!isValid) {
        this.logger.warn('Invalid VNPAY IPN signature');
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      // Parse webhook payload
      const payload = this.paymentService.parseWebhookPayload(query);

      this.logger.log(
        `Received IPN for payment: ${payload.paymentIntentId}, booking: ${
          payload.bookingId ?? 'unknown'
        }`,
      );

      // Find booking by ID
      const booking = await this.bookingsService
        .getPrismaClient()
        .booking.findFirst({
        where: {
            id: payload.bookingId ?? '',
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
