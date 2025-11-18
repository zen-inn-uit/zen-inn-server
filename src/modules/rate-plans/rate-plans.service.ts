import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RatePlan } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateRatePlanDto, UpdateRatePlanDto } from './dto';
import { RatePlanMapper } from './mappers';

@Injectable()
export class RatePlansService {
  constructor(private readonly prisma: PrismaService) {}

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
      return await this.prisma.ratePlan.create({
        data: {
          roomId,
          name: dto.name,
          description: dto.description,
          rateCode: dto.rateCode,
          basePrice: dto.basePrice,
          minLos: dto.minLos ?? 1,
          maxLos: dto.maxLos,
          validFrom,
          validUntil,
          cancellationPolicy: dto.cancellationPolicy,
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
        where: { roomId },
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
          room: { hotelId },
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
          room: { hotelId },
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

      return await this.prisma.ratePlan.update({
        where: { id: ratePlanId },
        data: updateData,
      });
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
          room: { hotelId },
        },
      });

      if (!ratePlan) {
        throw new NotFoundException('Rate plan không tồn tại');
      }

      await this.prisma.ratePlan.delete({ where: { id: ratePlanId } });
      return { success: true, message: 'Xóa rate plan thành công' };
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
          roomId,
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
}
