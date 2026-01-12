import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export enum EventCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  AUTH = 'auth',
  KYC = 'kyc',
  HOTEL = 'hotel',
  ROOM = 'room',
  RATE_PLAN = 'rate_plan',
  CANCELLATION_POLICY = 'cancellation_policy',
}

export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

@Injectable()
export class LoggingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a system event
   */
  async log(params: {
    eventType: string;
    eventCategory: EventCategory;
    severity: EventSeverity;
    message: string;
    userId?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.systemLog.create({
        data: {
          eventType: params.eventType,
          eventCategory: params.eventCategory,
          severity: params.severity,
          message: params.message,
          userId: params.userId,
          resourceId: params.resourceId,
          resourceType: params.resourceType,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // Don't throw errors from logging to avoid breaking the main flow
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Log booking events
   */
  async logBookingEvent(
    eventType: string,
    bookingId: string,
    userId: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory: EventCategory.BOOKING,
      severity: EventSeverity.INFO,
      message,
      userId,
      resourceId: bookingId,
      resourceType: 'booking',
      metadata,
    });
  }

  /**
   * Log payment events
   */
  async logPaymentEvent(
    eventType: string,
    paymentId: string,
    userId: string,
    message: string,
    severity: EventSeverity = EventSeverity.INFO,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory: EventCategory.PAYMENT,
      severity,
      message,
      userId,
      resourceId: paymentId,
      resourceType: 'payment',
      metadata,
    });
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: string,
    userId: string,
    message: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory: EventCategory.AUTH,
      severity: EventSeverity.INFO,
      message,
      userId,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Log KYC events
   */
  async logKycEvent(
    eventType: string,
    partnerId: string,
    userId: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory: EventCategory.KYC,
      severity: EventSeverity.INFO,
      message,
      userId,
      resourceId: partnerId,
      resourceType: 'partner',
      metadata,
    });
  }

  /**
   * Log hotel events
   */
  async logHotelEvent(
    eventType: string,
    hotelId: string,
    userId: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory: EventCategory.HOTEL,
      severity: EventSeverity.INFO,
      message,
      userId,
      resourceId: hotelId,
      resourceType: 'hotel',
      metadata,
    });
  }

  /**
   * Log error events
   */
  async logError(
    eventType: string,
    eventCategory: EventCategory,
    message: string,
    userId?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
  ) {
    return this.log({
      eventType,
      eventCategory,
      severity: EventSeverity.ERROR,
      message,
      userId,
      resourceId,
      metadata,
    });
  }

  /**
   * Get system logs with filtering and pagination
   */
  async getLogs(params: {
    eventCategory?: string;
    eventType?: string;
    severity?: string;
    userId?: string;
    resourceId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.eventCategory) {
      where.eventCategory = params.eventCategory;
    }
    if (params.eventType) {
      where.eventType = params.eventType;
    }
    if (params.severity) {
      where.severity = params.severity;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.resourceId) {
      where.resourceId = params.resourceId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
