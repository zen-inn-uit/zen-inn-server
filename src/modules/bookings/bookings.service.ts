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
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaymentService } from '../payment/payment.service';
import { MailerService } from '../mailer/mailer.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CancelBookingDto,
  QueryBookingDto,
} from './dto';
import { Booking, BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paymentService: PaymentService,
    private readonly mailer: MailerService,
  ) {}

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
    if (checkIn < now) {
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
        'Another booking is being processed for this room and dates. Please try again.',
      );
    }

    try {
      // Check availability
      if (room.availableCount <= 0) {
        throw new BadRequestException('No rooms available');
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

      if (conflictingBookings.length > 0) {
        throw new ConflictException(
          'Room is not available for the selected dates',
        );
      }

      const totalPrice = room.price * nightCount;

      const booking = await this.prisma.booking.create({
        data: {
          userId,
          roomId: dto.roomId,
          checkIn,
          checkOut,
          nightCount,
          guestName: dto.guestName,
          guestEmail: dto.guestEmail,
          guestPhone: dto.guestPhone,
          guestCount: dto.guestCount,
          totalPrice,
          paymentMethod: dto.paymentMethod,
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

      return {
        data: {
          ...booking,
          paymentUrl,
        },
        message: 'Booking created successfully. Please complete payment.',
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

    // Verify payment with SEPAY
    const paymentVerification = await this.paymentService.verifyPayment(
      booking.paymentIntentId as string,
    );

    if (!paymentVerification.success) {
      throw new BadRequestException('Payment verification failed');
    }

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
      data: bookings,
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

    return { data: booking };
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
        updateData.totalPrice = booking.room.price * nightCount;
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

      return {
        data: updatedBooking,
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

    return {
      data: updatedBooking,
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
}
