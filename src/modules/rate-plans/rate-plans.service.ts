import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RatePlan } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { LoggingService } from '../logging/logging.service';
import { CreateRatePlanDto, UpdateRatePlanDto } from './dto';
import { RatePlanMapper } from './mappers';

@Injectable()
export class RatePlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Tạo rate plan chung cho partner (không gắn với phòng cụ thể ngay)
   */
  async createStandalone(userId: string, dto: CreateRatePlanDto): Promise<RatePlan> {
    const partner = await this.prisma.partner.findFirst({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);

    if (validFrom >= validUntil) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    return this.prisma.ratePlan.create({
      data: {
        partnerId: partner.id,
        name: dto.name,
        description: dto.description,
        rateCode: dto.rateCode,
        basePrice: dto.basePrice,
        minLos: dto.minLos ?? 1,
        maxLos: dto.maxLos,
        validFrom,
        validUntil,
        refundablePercent: dto.refundablePercent ?? 100,
        depositRequired: dto.depositRequired ?? false,
        depositPercent: dto.depositPercent ?? 0,
        includesBreakfast: dto.includesBreakfast ?? false,
        includesDinner: dto.includesDinner ?? false,
        includesParking: dto.includesParking ?? false,
        otherInclusions: dto.otherInclusions,
        minGuestCount: dto.minGuestCount ?? 1,
        maxGuestCount: dto.maxGuestCount,
        modificationAllowed: dto.modificationAllowed ?? true,
        modificationFee: dto.modificationFee ?? 0,
        rateType: dto.rateType,
        active: dto.active ?? true,
        cancellationPolicyId: dto.cancellationPolicyId,
        hotelId: dto.hotelId,
      },
    });
  }


  /**
   * Tạo rate plan mới cho phòng (I-02)
   */
  async create(
    userId: string,
    hotelId: string,
    roomId: string,
    dto: CreateRatePlanDto,
  ): Promise<RatePlan> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Verify room belongs to hotel
      const room = await this.prisma.room.findFirst({
        where: { id: roomId, hotelId },
      });

      if (!room) {
        throw new NotFoundException('Phòng không tồn tại');
      }

      // Validate dates
      const validFrom = new Date(dto.validFrom);
      const validUntil = new Date(dto.validUntil);

      if (validFrom >= validUntil) {
        throw new BadRequestException(
          'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
        );
      }

      // Create rate plan
      const ratePlan = await this.prisma.ratePlan.create({
        data: {
          partnerId: hotel.partnerId,
          rooms: { connect: { id: roomId } },
          name: dto.name,
          description: dto.description,
          rateCode: dto.rateCode,
          basePrice: dto.basePrice,
          minLos: dto.minLos ?? 1,
          maxLos: dto.maxLos,
          validFrom,
          validUntil,
          // cancellationPolicy is now a relation, use assignCancellationPolicy() to set it
          refundablePercent: dto.refundablePercent ?? 100,
          depositRequired: dto.depositRequired ?? false,
          depositPercent: dto.depositPercent ?? 0,
          includesBreakfast: dto.includesBreakfast ?? false,
          includesDinner: dto.includesDinner ?? false,
          includesParking: dto.includesParking ?? false,
          otherInclusions: dto.otherInclusions,
          minGuestCount: dto.minGuestCount ?? 1,
          maxGuestCount: dto.maxGuestCount,
          modificationAllowed: dto.modificationAllowed ?? true,
          modificationFee: dto.modificationFee ?? 0,
          rateType: dto.rateType,
          active: dto.active ?? true,
        },
      });

      // Log rate plan creation
      await this.loggingService.log({
        eventType: 'rate_plan_created',
        eventCategory: 'rate_plan' as any,
        severity: 'info' as any,
        message: `Rate plan created: ${dto.name} for room ${roomId}`,
        userId,
        resourceId: ratePlan.id,
        resourceType: 'rate_plan',
        metadata: { ratePlanName: dto.name, roomId, basePrice: dto.basePrice },
      });

      return ratePlan;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi tạo rate plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy danh sách rate plans của phòng
   */
  /**
   * Lấy tất cả rate plans của partner
   */
  async findAllForPartner(userId: string): Promise<RatePlan[]> {
    try {
      const partner = await this.prisma.partner.findUnique({
        where: { userId },
      });

      if (!partner) {
        throw new ForbiddenException('User is not a partner');
      }

      return await this.prisma.ratePlan.findMany({
        where: {
          partnerId: partner.id,
          active: true,
        },
        include: {
          cancellationPolicy: true,
          rooms: {
            select: {
              hotelId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(
        `Lỗi khi lấy danh sách rate plans của partner: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findAll(
    userId: string,
    hotelId: string,
    roomId: string,
  ): Promise<RatePlan[]> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Verify room belongs to hotel
      const room = await this.prisma.room.findFirst({
        where: { id: roomId, hotelId },
      });

      if (!room) {
        throw new NotFoundException('Phòng không tồn tại');
      }

      return await this.prisma.ratePlan.findMany({
        where: {
          rooms: { some: { id: roomId } },
        },
        orderBy: { validFrom: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi lấy danh sách rate plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy chi tiết một rate plan
   */
  async findOne(
    userId: string,
    hotelId: string,
    ratePlanId: string,
  ): Promise<RatePlan> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Get rate plan and verify it belongs to hotel
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          rooms: { some: { hotelId } },
        },
      });

      if (!ratePlan) {
        throw new NotFoundException('Rate plan không tồn tại');
      }

      return ratePlan;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi lấy chi tiết rate plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Cập nhật rate plan
   */
  async update(
    userId: string,
    hotelId: string,
    ratePlanId: string,
    dto: UpdateRatePlanDto,
  ): Promise<RatePlan> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Get rate plan and verify it belongs to hotel
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          rooms: { some: { hotelId } },
        },
      });

      if (!ratePlan) {
        throw new NotFoundException('Rate plan không tồn tại');
      }

      // Validate dates if provided
      if (dto.validFrom || dto.validUntil) {
        const validFrom = dto.validFrom
          ? new Date(dto.validFrom)
          : ratePlan.validFrom;
        const validUntil = dto.validUntil
          ? new Date(dto.validUntil)
          : ratePlan.validUntil;

        if (validFrom >= validUntil) {
          throw new BadRequestException(
            'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
          );
        }
      }

      // Map DTO to update data using mapper
      const updateData = RatePlanMapper.mapUpdateDtoToData(dto);

      const updatedPlan = await this.prisma.ratePlan.update({
        where: { id: ratePlanId },
        data: updateData,
      });

      // Log rate plan update
      await this.loggingService.log({
        eventType: 'rate_plan_updated',
        eventCategory: 'rate_plan' as any,
        severity: 'info' as any,
        message: `Rate plan updated: ${ratePlan.name}`,
        userId,
        resourceId: ratePlanId,
        resourceType: 'rate_plan',
        metadata: { changes: dto },
      });

      return updatedPlan;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi cập nhật rate plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Xóa rate plan
   */
  async remove(
    userId: string,
    hotelId: string,
    ratePlanId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Get rate plan and verify it belongs to hotel
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          rooms: { some: { hotelId } },
        },
      });

      if (!ratePlan) {
        throw new NotFoundException('Rate plan không tồn tại');
      }

      await this.prisma.ratePlan.update({
        where: { id: ratePlanId },
        data: { active: false },
      });

      // Log rate plan deletion
      await this.loggingService.log({
        eventType: 'rate_plan_deleted',
        eventCategory: 'rate_plan' as any,
        severity: 'info' as any,
        message: `Rate plan deleted: ${ratePlan.name}`,
        userId,
        resourceId: ratePlanId,
        resourceType: 'rate_plan',
      });

      return { success: true, message: 'Rate plan deactivated successfully' };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi xóa rate plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy active rate plans của phòng cho khách hàng
   */
  async getActiveForRoom(roomId: string): Promise<Partial<RatePlan>[]> {
    try {
      return await this.prisma.ratePlan.findMany({
        where: {
          rooms: { some: { id: roomId } },
          active: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
        orderBy: { basePrice: 'asc' },
        select: {
          id: true,
          name: true,
          rateCode: true,
          description: true,
          basePrice: true,
          minLos: true,
          cancellationPolicy: true,
          refundablePercent: true,
          includesBreakfast: true,
          includesDinner: true,
          includesParking: true,
          otherInclusions: true,
          rateType: true,
        },
      });
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy active rate plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Gán chính sách hủy cho rate plan (I-04)
   */
  async assignCancellationPolicy(
    userId: string,
    hotelId: string,
    ratePlanId: string,
    cancellationPolicyId: string | null,
  ): Promise<RatePlan> {
    try {
      // Verify hotel belongs to user
      const hotel = await this.prisma.hotel.findFirst({
        where: { id: hotelId, partner: { userId } },
      });

      if (!hotel) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập khách sạn này',
        );
      }

      // Get rate plan and verify it belongs to hotel
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          rooms: { some: { hotelId } },
        },
      });

      if (!ratePlan) {
        throw new NotFoundException('Rate plan không tồn tại');
      }

      // If cancellationPolicyId is provided, verify it exists and belongs to partner
      if (cancellationPolicyId) {
        const partner = await this.prisma.partner.findUnique({
          where: { userId },
        });

        if (!partner) {
          throw new ForbiddenException('User is not a partner');
        }

        const policy = await this.prisma.cancellationPolicy.findFirst({
          where: {
            id: cancellationPolicyId,
            partnerId: partner.id,
            active: true,
          },
        });

        if (!policy) {
          throw new NotFoundException(
            'Cancellation policy not found or inactive',
          );
        }
      }

      // Update rate plan with cancellation policy
      return await this.prisma.ratePlan.update({
        where: { id: ratePlanId },
        data: {
          cancellationPolicyId,
        },
        include: {
          cancellationPolicy: true,
        },
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Lỗi khi gán chính sách hủy: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
