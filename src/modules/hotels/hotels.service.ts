import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelStatus, KycStatus } from '@prisma/client';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.hotel.create({
      data: {
        partnerId: partner.id,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        starRating: dto.starRating,
        phone: dto.phone,
        description: dto.description,
        images: dto.images ?? [],
        status: HotelStatus.DRAFT,
      },
    });
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

    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.starRating !== undefined ? { starRating: dto.starRating } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
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

    return { success: true };
  }
}
