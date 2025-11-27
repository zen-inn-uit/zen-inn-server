import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LoggingService } from '../logging/logging.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelStatus, KycStatus, Prisma } from '@prisma/client';

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Lấy partner tương ứng với user và kiểm tra KYC đã được duyệt hay chưa.
   */
  private async getApprovedPartnerForUser(userId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Bạn chưa đăng ký đối tác (Partner).');
    }

    if (partner.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException('Hồ sơ KYC của bạn chưa được duyệt.');
    }

    return partner;
  }

  /**
   * Partner tạo khách sạn mới (Booking.com style).
   * Ban đầu status = DRAFT, sau này có thể chuyển ACTIVE khi hoàn tất cấu hình.
   */
  async createForUser(userId: string, dto: CreateHotelDto) {
    const partner = await this.getApprovedPartnerForUser(userId);

    const hotel = await this.prisma.hotel.create({
      data: {
        partnerId: partner.id,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        starRating: dto.starRating,
        phone: dto.phone,
        description: dto.description,
        images: {
          create: (dto.images ?? []).map((url, index) => ({
            url,
            displayOrder: index,
          })),
        },
        status: HotelStatus.DRAFT,
      },
    });

    // Log hotel creation
    await this.loggingService.logHotelEvent(
      'hotel_created',
      hotel.id,
      userId,
      `Hotel created: ${dto.name}`,
      {
        hotelName: dto.name,
        city: dto.city,
        country: dto.country,
      },
    );

    return hotel;
  }

  /**
   * Danh sách khách sạn của partner (chỉ hotel chưa bị xóa mềm).
   */
  async findAllForUser(userId: string) {
    const partner = await this.getApprovedPartnerForUser(userId);

    return this.prisma.hotel.findMany({
      where: {
        partnerId: partner.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Chi tiết một khách sạn thuộc về partner hiện tại.
   */
  async findOneForUser(userId: string, hotelId: string) {
    const partner = await this.getApprovedPartnerForUser(userId);

    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        partnerId: partner.id,
        deletedAt: null,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn.');
    }

    return hotel;
  }

  /**
   * Cập nhật thông tin khách sạn (Booking-style fields).
   */
  async updateForUser(userId: string, hotelId: string, dto: UpdateHotelDto) {
    const partner = await this.getApprovedPartnerForUser(userId);

    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        partnerId: partner.id,
        deletedAt: null,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn.');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.starRating !== undefined) updateData.starRating = dto.starRating;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;

    // Xử lý images: xóa tất cả cũ và tạo mới
    if (dto.images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: (dto.images ?? []).map((url, index) => ({
          url,
          displayOrder: index,
        })),
      };
    }

    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: updateData as Prisma.HotelUpdateInput,
    }).then(async (updatedHotel) => {
      // Log hotel update
      await this.loggingService.logHotelEvent(
        'hotel_updated',
        hotelId,
        userId,
        `Hotel updated: ${updatedHotel.name}`,
        { changes: dto },
      );
      return updatedHotel;
    });
  }

  /**
   * Xóa mềm khách sạn.
   */
  async removeForUser(userId: string, hotelId: string) {
    const partner = await this.getApprovedPartnerForUser(userId);

    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        partnerId: partner.id,
        deletedAt: null,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn.');
    }

    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { deletedAt: new Date(), status: HotelStatus.INACTIVE },
    });

    // Log hotel deletion
    await this.loggingService.logHotelEvent(
      'hotel_deleted',
      hotelId,
      userId,
      `Hotel soft deleted: ${hotel.name}`,
    );

    return { success: true };
  }
}
