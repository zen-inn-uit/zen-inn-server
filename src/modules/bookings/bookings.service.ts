/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaymentService } from '../payment/payment.service';
import { MailerService } from '../mailer/mailer.service';
import { LoggingService } from '../logging/logging.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CancelBookingDto,
  QueryBookingDto,
  BookingCalendarResponseDto,
} from './dto';
import { Booking, BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly mailer: MailerService,
    private readonly loggingService: LoggingService,
  ) {}

  // Public getter for prisma (for webhook access)
  getPrismaClient() {
    return this.prisma;
  }

  /**
   * Reserve a room (lock + create booking) - DEMO MODE: No payment required
   * This is called from review page - auto confirm on success
   */
  async reserveBooking(userId: string, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Validate dates
    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    if (checkInDate < now) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Calculate night count
    const nightCount = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get room details
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: { hotel: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Validate guest count
    if (dto.guestCount > room.capacity) {
      throw new BadRequestException(
        `Guest count (${dto.guestCount}) exceeds room capacity (${room.capacity})`,
      );
    }

    // Acquire Redis lock - THIS IS WHERE RACE CONDITION IS PREVENTED
    const lockKey = this.redis.getBookingLockKey(dto.roomId, checkIn, checkOut);
    const lockAcquired = await this.redis.acquireLock(lockKey, 30); // 30 seconds lock

    if (!lockAcquired) {
      throw new ConflictException(
        'Hiện phòng này đã hết, vui lòng chọn phòng khác.',
      );
    }

    try {
      // Check availability
      if (room.availableCount <= 0) {
        throw new BadRequestException('Hiện phòng này đã hết, vui lòng chọn phòng khác.');
      }

      // Check for conflicting bookings
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          roomId: dto.roomId,
          status: {
            in: [BookingStatus.CONFIRMED], // Only check confirmed bookings
          },
          OR: [
            {
              AND: [
                { checkIn: { lte: checkIn } },
                { checkOut: { gt: checkIn } },
              ],
            },
            {
              AND: [
                { checkIn: { lt: checkOut } },
                { checkOut: { gte: checkOut } },
              ],
            },
            {
              AND: [
                { checkIn: { gte: checkIn } },
                { checkOut: { lte: checkOut } },
              ],
            },
          ],
        },
      });

      if (conflictingBookings.length > 0) {
        throw new ConflictException(
          'This room is already booked for the selected dates',
        );
      }

      // Get rate plan for price calculation
      const ratePlan = dto.ratePlanId
        ? await this.prisma.ratePlan.findUnique({
            where: { id: dto.ratePlanId },
          })
        : await this.prisma.ratePlan.findFirst({
            where: {
              rooms: { some: { id: dto.roomId } },
              active: true,
            },
            orderBy: { basePrice: 'asc' },
          });

      if (!ratePlan) {
        throw new BadRequestException(
          'No active rate plan found for this room',
        );
      }

      // Calculate price (in VND)
      const pricePerNight = ratePlan.basePrice;
      const subtotal = pricePerNight * nightCount;
      const taxRate = 0.1; // 10%
      const taxes = Math.round(subtotal * taxRate);
      const totalPrice = subtotal + taxes;

      // Create CONFIRMED booking (bypass payment in demo mode)
      const booking = await this.prisma.booking.create({
        data: {
          userId,
          roomId: dto.roomId,
          ratePlanId: ratePlan.id,
          checkIn,
          checkOut,
          guestName: dto.guestName,
          guestEmail: dto.guestEmail,
          guestPhone: dto.guestPhone,
          guestCount: dto.guestCount,
          nightCount,
          totalPrice,
          paymentMethod: 'CASH', // Default to CASH
          specialRequests: dto.specialRequests,
          status: BookingStatus.CONFIRMED, // Auto-confirm
          paymentStatus: PaymentStatus.COMPLETED, // Mark as completed
        },
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
        },
      });

      // Decrement available count
      await this.prisma.room.update({
        where: { id: dto.roomId },
        data: { availableCount: { decrement: 1 } },
      });

      // Log booking creation
      await this.loggingService.logBookingEvent(
        'booking_created',
        booking.id,
        userId,
        `Booking created and confirmed for ${room.name} at ${room.hotel.name}`,
        {
          roomId: dto.roomId,
          hotelId: room.hotel.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
        totalPrice,
          nightCount,
          paymentMethod: 'CASH',
        },
      );

      // Send confirmation email
      try {
        await this.mailer.sendBookingConfirmation(
          booking.guestEmail,
          {
            bookingId: booking.id,
            guestName: booking.guestName,
            hotelName: booking.room.hotel.name,
            roomName: booking.room.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            nightCount: booking.nightCount,
            guestCount: booking.guestCount,
            totalPrice: booking.totalPrice,
          },
        );
      } catch (error) {
        this.logger.error('Failed to send confirmation email:', error);
      }

      this.logger.log(
        `Booking confirmed: ${booking.id} for user ${userId}`,
      );

      return {
        success: true,
        booking,
        message: 'Booking confirmed successfully!',
      };
    } finally {
      // Always release the lock
      await this.redis.releaseLock(lockKey);
    }
  }

  /**
   * Confirm booking after payment is completed
   */
  async confirmBookingAfterPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: { hotel: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return { booking, message: 'Booking already confirmed' };
    }

    // Update booking status
    const confirmedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
      },
      include: {
        room: {
          include: { hotel: true },
        },
      },
    });

    // Decrement available count
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: { availableCount: { decrement: 1 } },
    });

    // Release Redis lock
    const lockKey = await this.redis.get(`booking:lock:info:${bookingId}`);
    if (lockKey) {
      await this.redis.releaseLock(lockKey);
      await this.redis.del(`booking:lock:info:${bookingId}`);
    }

    // Send confirmation email
    try {
      await this.mailer.sendBookingConfirmation(
        booking.guestEmail,
        {
          bookingId: confirmedBooking.id,
          guestName: confirmedBooking.guestName,
          hotelName: confirmedBooking.room.hotel.name,
          roomName: confirmedBooking.room.name,
          checkIn: confirmedBooking.checkIn,
          checkOut: confirmedBooking.checkOut,
          nightCount: confirmedBooking.nightCount,
          guestCount: confirmedBooking.guestCount,
          totalPrice: confirmedBooking.totalPrice,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send confirmation email:', error);
    }

    this.logger.log(`Booking confirmed: ${bookingId}`);

    return { booking: confirmedBooking };
  }

  /**
   * Create a new booking with Redis locking to prevent race conditions
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Validate dates
    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    if (checkInDate < now) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Calculate night count
    const nightCount = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get room details
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: {
        hotel: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Validate guest count
    if (dto.guestCount > room.capacity) {
      throw new BadRequestException(
        `Guest count (${dto.guestCount}) exceeds room capacity (${room.capacity})`,
      );
    }

    // Acquire Redis lock
    const lockKey = this.redis.getBookingLockKey(dto.roomId, checkIn, checkOut);
    const lockAcquired = await this.redis.acquireLock(lockKey, 15);

    if (!lockAcquired) {
      throw new ConflictException(
        'Hiện phòng này đã hết, vui lòng chọn phòng khác.',
      );
    }

    try {
      // Check availability
      if (room.availableCount <= 0) {
        throw new BadRequestException('Hiện phòng này đã hết, vui lòng chọn phòng khác.');
      }

      // Check for conflicting bookings
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          roomId: dto.roomId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
          OR: [
            {
              AND: [
                { checkIn: { lte: checkIn } },
                { checkOut: { gt: checkIn } },
              ],
            },
            {
              AND: [
                { checkIn: { lt: checkOut } },
                { checkOut: { gte: checkOut } },
              ],
            },
            {
              AND: [
                { checkIn: { gte: checkIn } },
                { checkOut: { lte: checkOut } },
              ],
            },
          ],
        },
      });

      // Get rate plan for price calculation
      const ratePlan = dto.ratePlanId
        ? await this.prisma.ratePlan.findUnique({
            where: { id: dto.ratePlanId },
          })
        : await this.prisma.ratePlan.findFirst({
            where: {
              rooms: { some: { id: dto.roomId } },
              active: true,
            },
            orderBy: { basePrice: 'asc' },
          });

      if (!ratePlan) {
        throw new BadRequestException(
          'No active rate plan found for this room',
        );
      }

      const totalPrice = ratePlan.basePrice * nightCount;

      const booking = await this.prisma.booking.create({
        data: {
          userId,
          roomId: dto.roomId,
          ratePlanId: ratePlan.id,
          checkIn,
          checkOut,
          nightCount,
          guestName: dto.guestName,
          guestEmail: dto.guestEmail,
          guestPhone: dto.guestPhone,
          guestCount: dto.guestCount,
          totalPrice,
          paymentMethod: 'CASH', // Default to CASH
          paymentStatus: PaymentStatus.PENDING,
          specialRequests: dto.specialRequests,
          status: BookingStatus.PENDING,
        },
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
        },
      });

      // Decrement available count
      await this.prisma.room.update({
        where: { id: dto.roomId },
        data: {
          availableCount: {
            decrement: 1,
          },
        },
      });

      // Create payment intent
      let paymentUrl = '';
      let paymentIntentId = '';

      try {
        const paymentIntent = await this.paymentService.createPaymentIntent(
          booking.id,
          totalPrice,
          `Booking ${booking.id} - ${room.hotel.name} - ${room.name}`,
        );
        paymentUrl = paymentIntent.paymentUrl;
        paymentIntentId = paymentIntent.paymentIntentId;

        // Update booking with payment intent ID
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentIntentId,
          },
        });
      } catch (error) {
        this.logger.error('Failed to create payment intent:', error);
        // Continue without payment URL for now
      }

      // Log booking creation
      await this.loggingService.logBookingEvent(
        'booking_created',
        booking.id,
        userId,
        `Booking created for room ${room.name} at ${room.hotel.name}`,
        {
          roomId: dto.roomId,
          hotelId: room.hotel.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          totalPrice,
          nightCount,
        },
      );

      return {
        booking,
        paymentUrl: paymentUrl || null,
      };
    } finally {
      // Always release the lock
      await this.redis.releaseLock(lockKey);
    }
  }

  /**
   * Confirm booking after successful payment (called by webhook)
   */
  async confirmBooking(bookingId: string, transactionId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      this.logger.warn(`Booking ${bookingId} is already confirmed`);
      return booking;
    }

    // Payment verification should be done by the caller (PaymentController via IPN)
    // or we should implementation QueryDR to verify status if called manually.
    // For now, we assume the caller has verified the payment.


    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        transactionId,
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    try {
      await this.mailer.sendBookingConfirmation(
        updatedBooking.guestEmail as string,
        {
          bookingId: updatedBooking.id,
          guestName: updatedBooking.guestName as string,
          hotelName: updatedBooking.room.hotel.name,
          roomName: updatedBooking.room.name,
          checkIn: updatedBooking.checkIn,
          checkOut: updatedBooking.checkOut,
          nightCount: updatedBooking.nightCount as number,
          guestCount: updatedBooking.guestCount as number,
          totalPrice: updatedBooking.totalPrice as number,
        },
      );

      // Send payment receipt
      await this.mailer.sendPaymentReceipt(updatedBooking.guestEmail, {
        bookingId: updatedBooking.id,
        guestName: updatedBooking.guestName,
        transactionId,
        amount: updatedBooking.totalPrice,
        paymentMethod: updatedBooking.paymentMethod,
        paidAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to send confirmation emails:', error);
    }

    // Log booking confirmation
    await this.loggingService.logBookingEvent(
      'booking_confirmed',
      bookingId,
      booking.userId,
      `Booking confirmed for ${booking.room.name} at ${booking.room.hotel.name}`,
      {
        transactionId,
        totalPrice: booking.totalPrice,
      },
    );

    return updatedBooking;
  }

  /**
   * Get bookings for a customer
   */
  async getBookings(userId: string, query: QueryBookingDto) {
    const { status, fromDate, toDate, page = 1, limit = 10 } = query;

    interface WhereClause {
      userId: string;
      status?: BookingStatus;
      checkIn?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.checkIn = {};
      if (fromDate) {
        where.checkIn.gte = new Date(fromDate);
      }
      if (toDate) {
        where.checkIn.lte = new Date(toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          room: {
            include: {
              hotel: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        room: {
          include: {
            hotel: true,
            images: true,
            beds: true,
            amenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only generate payment URL if not already generated (to avoid regenerating on every poll)
    // Check if booking has a recent transaction reference (within last 15 minutes)
    let paymentUrl: string | undefined;
    if (
      booking.status === BookingStatus.PENDING &&
      ((booking.paymentMethod as string) === 'VNPAY' || (booking.paymentMethod as string) === 'SEPAY')
    ) {
      // Only regenerate if paymentIntentId is missing or older than 15 minutes
      const shouldRegenerateUrl = 
        !booking.paymentIntentId || 
        (Date.now() - new Date(booking.updatedAt).getTime() > 15 * 60 * 1000);
      
      if (shouldRegenerateUrl) {
        const paymentIntent = await this.paymentService.createPaymentIntent(
          booking.id,
          booking.totalPrice,
          `Booking for ${booking.room.name} at ${booking.room.hotel.name}`,
        );
        paymentUrl = paymentIntent.paymentUrl;
        
        // Update booking with new payment intent ID to avoid regenerating
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { paymentIntentId: paymentIntent.paymentIntentId },
        });
      }
    }

    return { 
      booking: {
        ...booking,
        paymentUrl // Attach the dynamic paymentUrl
      }
    };
  }

  /**
   * Update a booking
   */
  async updateBooking(
    userId: string,
    bookingId: string,
    dto: UpdateBookingDto,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be modified');
    }

    if (booking.checkIn < new Date()) {
      throw new BadRequestException('Cannot modify past bookings');
    }

    let lockKey: string | null = null;
    let lockAcquired = false;

    try {
      if (dto.checkIn || dto.checkOut) {
        const newCheckIn = dto.checkIn
          ? new Date(dto.checkIn)
          : booking.checkIn;
        const newCheckOut = dto.checkOut
          ? new Date(dto.checkOut)
          : booking.checkOut;

        if (newCheckOut <= newCheckIn) {
          throw new BadRequestException(
            'Check-out date must be after check-in date',
          );
        }

        lockKey = this.redis.getBookingLockKey(
          booking.roomId,
          newCheckIn,
          newCheckOut,
        );
        lockAcquired = await this.redis.acquireLock(lockKey, 15);

        if (!lockAcquired) {
          throw new ConflictException(
            'Another booking is being processed. Please try again.',
          );
        }

        const conflictingBookings = await this.prisma.booking.findMany({
          where: {
            roomId: booking.roomId,
            id: { not: bookingId },
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
            OR: [
              {
                AND: [
                  { checkIn: { lte: newCheckIn } },
                  { checkOut: { gt: newCheckIn } },
                ],
              },
              {
                AND: [
                  { checkIn: { lt: newCheckOut } },
                  { checkOut: { gte: newCheckOut } },
                ],
              },
              {
                AND: [
                  { checkIn: { gte: newCheckIn } },
                  { checkOut: { lte: newCheckOut } },
                ],
              },
            ],
          },
        });

        if (conflictingBookings.length > 0) {
          throw new ConflictException(
            'Room is not available for the selected dates',
          );
        }
      }

      const updateData: Partial<Booking> = {};

      if (dto.checkIn) {
        updateData.checkIn = new Date(dto.checkIn);
      }
      if (dto.checkOut) {
        updateData.checkOut = new Date(dto.checkOut);
      }
      if (dto.guestCount !== undefined) {
        if (dto.guestCount > booking.room.capacity) {
          throw new BadRequestException(
            `Guest count exceeds room capacity (${booking.room.capacity})`,
          );
        }
        updateData.guestCount = dto.guestCount;
      }
      if (dto.specialRequests !== undefined) {
        updateData.specialRequests = dto.specialRequests;
      }

      if (dto.checkIn || dto.checkOut) {
        const newCheckIn = dto.checkIn
          ? new Date(dto.checkIn)
          : booking.checkIn;
        const newCheckOut = dto.checkOut
          ? new Date(dto.checkOut)
          : booking.checkOut;
        const nightCount = Math.ceil(
          (newCheckOut.getTime() - newCheckIn.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        updateData.nightCount = nightCount;
        
        // Get price from rate plan
        const ratePlan = await this.prisma.ratePlan.findFirst({
          where: {
            id: (booking as any).ratePlanId || undefined,
            rooms: { some: { id: booking.roomId } },
          },
          orderBy: { basePrice: 'asc' },
        });

        if (ratePlan) {
          updateData.totalPrice = ratePlan.basePrice * nightCount;
        }
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
        },
      });

      try {
        await this.mailer.sendBookingModification(updatedBooking.guestEmail, {
          bookingId: updatedBooking.id,
          guestName: updatedBooking.guestName,
          hotelName: updatedBooking.room.hotel.name,
          roomName: updatedBooking.room.name,
          checkIn: updatedBooking.checkIn,
          checkOut: updatedBooking.checkOut,
          nightCount: updatedBooking.nightCount,
          guestCount: updatedBooking.guestCount,
          totalPrice: updatedBooking.totalPrice,
        });
      } catch (error) {
        this.logger.error('Failed to send modification email:', error);
      }

      // Log booking modification
      await this.loggingService.logBookingEvent(
        'booking_modified',
        bookingId,
        userId,
        `Booking modified for ${updatedBooking.room.name}`,
        {
          changes: dto,
        },
      );

      return {
        booking: updatedBooking,
        message: 'Booking updated successfully',
      };
    } finally {
      if (lockKey && lockAcquired) {
        await this.redis.releaseLock(lockKey);
      }
    }
  }

  async cancelBooking(
    userId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be cancelled');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.cancellationReason,
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: {
        availableCount: {
          increment: 1,
        },
      },
    });

    let refundAmount: number | undefined;
    if (
      booking.paymentStatus === PaymentStatus.COMPLETED &&
      booking.transactionId
    ) {
      try {
        const refund = await this.paymentService.processRefund(
          booking.transactionId,
          booking.totalPrice,
          dto.cancellationReason,
        );

        if (refund.success) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: PaymentStatus.REFUNDED,
            },
          });
          refundAmount = booking.totalPrice;
        }
      } catch (error) {
        this.logger.error('Failed to process refund:', error);
      }
    }

    try {
      await this.mailer.sendBookingCancellation(updatedBooking.guestEmail, {
        bookingId: updatedBooking.id,
        guestName: updatedBooking.guestName,
        hotelName: updatedBooking.room.hotel.name,
        roomName: updatedBooking.room.name,
        checkIn: updatedBooking.checkIn,
        checkOut: updatedBooking.checkOut,
        refundAmount,
      });
    } catch (error) {
      this.logger.error('Failed to send cancellation email:', error);
    }

    // Log booking cancellation
    await this.loggingService.logBookingEvent(
      'booking_cancelled',
      bookingId,
      userId,
      `Booking cancelled for ${updatedBooking.room.name} at ${updatedBooking.room.hotel.name}`,
      {
        cancellationReason: dto.cancellationReason,
        refundAmount,
      },
    );

    return {
      booking: updatedBooking,
      message: 'Booking cancelled successfully',
    };
  }

  async getBookingsForPartner(userId: string, query: QueryBookingDto) {
    const { status, fromDate, toDate, page = 1, limit = 10 } = query;

    // Get partner
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: {
        hotels: {
          include: {
            rooms: true,
          },
        },
      },
    });

    if (!partner) {
      throw new ForbiddenException('You are not registered as a partner');
    }

    const roomIds = partner.hotels.flatMap((hotel) =>
      hotel.rooms.map((room) => room.id),
    );

    interface WhereClause {
      roomId: {
        in: string[];
      };
      status?: BookingStatus;
      checkIn?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = {
      roomId: {
        in: roomIds,
      },
    };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.checkIn = {};
      if (fromDate) {
        where.checkIn.gte = new Date(fromDate);
      }
      if (toDate) {
        where.checkIn.lte = new Date(toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingByIdForPartner(userId: string, bookingId: string) {
    // Get partner
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: {
        hotels: {
          include: {
            rooms: true,
          },
        },
      },
    });

    if (!partner) {
      throw new ForbiddenException('You are not registered as a partner');
    }

    const roomIds = partner.hotels.flatMap((hotel) =>
      hotel.rooms.map((room) => room.id),
    );

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        roomId: { in: roomIds },
      },
      include: {
        room: {
          include: {
            hotel: true,
            images: true,
            beds: true,
            amenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        ratePlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found or does not belong to your hotels',
      );
    }

    return { booking };
  }

  async getBookingsCalendarForPartner(
    userId: string,
    year: number,
    month: number,
  ): Promise<BookingCalendarResponseDto> {
    // Get partner
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: {
        hotels: {
          include: {
            rooms: true,
          },
        },
      },
    });

    if (!partner) {
      throw new ForbiddenException('You are not registered as a partner');
    }

    const roomIds = partner.hotels.flatMap((hotel) =>
      hotel.rooms.map((room) => room.id),
    );

    // Get first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all bookings for the month
    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        OR: [
          {
            AND: [
              { checkIn: { gte: startDate } },
              { checkIn: { lte: endDate } },
            ],
          },
          {
            AND: [
              { checkOut: { gte: startDate } },
              { checkOut: { lte: endDate } },
            ],
          },
          {
            AND: [
              { checkIn: { lte: startDate } },
              { checkOut: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    // Group bookings by date
    interface CalendarDay {
      date: string;
      checkIns: number;
      checkOuts: number;
      ongoingStays: number;
      bookings: Array<{
        id: string;
        status: string;
        guestName: string;
        guestEmail: string;
        roomName: string;
        hotelName: string;
        checkIn: Date;
        checkOut: Date;
        totalPrice: number;
        isCheckIn: boolean;
        isCheckOut: boolean;
        isOngoing: boolean;
      }>;
    }

    const calendarMap = new Map<string, CalendarDay>();

    // Initialize all days of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
      calendarMap.set(dateStr, {
        date: dateStr,
        checkIns: 0,
        checkOuts: 0,
        ongoingStays: 0,
        bookings: [],
      });
    }

    // Populate with bookings
    bookings.forEach((booking) => {
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);

      // Iterate through each day of the booking
      const currentDate = new Date(
        Math.max(checkInDate.getTime(), startDate.getTime()),
      );
      const bookingEndDate = new Date(
        Math.min(checkOutDate.getTime(), endDate.getTime()),
      );

      while (currentDate <= bookingEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = calendarMap.get(dateStr);

        if (dayData) {
          const isCheckIn =
            currentDate.toDateString() === checkInDate.toDateString();
          const isCheckOut =
            currentDate.toDateString() === checkOutDate.toDateString();
          const isOngoing = !isCheckIn && !isCheckOut;

          if (isCheckIn) dayData.checkIns++;
          if (isCheckOut) dayData.checkOuts++;
          if (isOngoing) dayData.ongoingStays++;

          dayData.bookings.push({
            id: booking.id,
            status: booking.status,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            roomName: booking.room.name,
            hotelName: booking.room.hotel.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            totalPrice: booking.totalPrice,
            isCheckIn,
            isCheckOut,
            isOngoing,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Convert map to array and filter out empty days
    const calendar = Array.from(calendarMap.values()).filter(
      (day) => day.bookings.length > 0,
    );

    return {
      year,
      month,
      totalBookings: bookings.length,
      calendar,
    };
  }

  async updateBookingStatusByPartner(
    userId: string,
    bookingId: string,
    status: BookingStatus,
  ) {
    // Verify partner owns this booking
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: {
        hotels: {
          include: {
            rooms: true,
          },
        },
      },
    });

    if (!partner) {
      throw new ForbiddenException('You are not registered as a partner');
    }

    const roomIds = partner.hotels.flatMap((hotel) =>
      hotel.rooms.map((room) => room.id),
    );

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        roomId: { in: roomIds },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found or does not belong to your hotels',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Log the status update
    await this.loggingService.logBookingEvent(
      'booking_status_updated',
      bookingId,
      userId,
      `Booking status updated to ${status} by partner`,
      {
        oldStatus: booking.status,
        newStatus: status,
      },
    );

    return {
      booking: updatedBooking,
      message: 'Booking status updated successfully',
    };
  }

  // Deprecated: use updateBookingStatusByPartner instead
  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        room: true,
        user: true,
      },
    });
  }
}
