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
import { SearchHotelDto } from './dto/search-hotel.dto';
import { SearchHotelsResponseDto, HotelDetailResponseDto } from './dto/hotel-response.dto';

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

    const hotels = await this.prisma.hotel.findMany({
      where: {
        partnerId: partner.id,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform images to array of URLs
    return hotels.map(hotel => ({
      ...hotel,
      images: hotel.images.map(img => img.url),
    }));
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
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn.');
    }

    // Transform images to array of URLs
    return {
      ...hotel,
      images: hotel.images.map(img => img.url),
    };
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

  /**
   * PUBLIC: Search available hotels for guests
   * Filters by city, availability based on inventory, and applies sorting
   * NOTE: V1 implementation uses simple logic; pricing aggregation is placeholder
   */
  async searchPublicHotels(dto: SearchHotelDto): Promise<SearchHotelsResponseDto> {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.HotelWhereInput = {
      deletedAt: null,
      status: HotelStatus.ACTIVE,
    };

    if (dto.city) {
      where.city = {
        contains: dto.city,
        mode: 'insensitive',
      };
    }

    // Fetch hotels with pagination
    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        include: {
          images: {
            take: 1,
            orderBy: { displayOrder: 'asc' },
          },
          rooms: {
            where: { availableCount: { gt: 0 } },
            include: {
              inventory: {
                where: dto.checkIn
                  ? {
                      date: {
                        gte: new Date(dto.checkIn),
                      },
                    }
                  : undefined,
              },
              ratePlans: {
                take: 1,
              },
            },
          },
        },
        orderBy: this.getSortOrder(dto.sortBy),
        skip,
        take: limit,
      }),
      this.prisma.hotel.count({ where }),
    ]);

    const items = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      address: hotel.address,
      thumbnailUrl: hotel.images.length > 0 ? hotel.images[0].url : null,
      rating: null, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count reviews
      startingPrice:
        hotel.rooms.length > 0
          ? Math.min(
              ...hotel.rooms.map(r => r.ratePlans[0]?.basePrice || r.inventory[0]?.price || 0),
            ) || null
          : null,
      currency: 'USD', // TODO: Make configurable
      availableRoomsCount: hotel.rooms.length || null,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * PUBLIC: Get hotel detail with room listings for guest booking
   * NOTE: V1 returns null for pricing/availability if dates not provided
   */
  async getPublicHotelDetail(
    hotelId: string,
    checkIn?: string,
    checkOut?: string,
    adults?: number,
    rooms?: number,
  ): Promise<HotelDetailResponseDto | null> {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        deletedAt: null,
        status: HotelStatus.ACTIVE,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        rooms: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' },
            },
            beds: true,
            inventory: {
              where: checkIn
                ? {
                    date: {
                      gte: new Date(checkIn),
                      ...(checkOut && { lte: new Date(checkOut) }),
                    },
                  }
                : undefined,
            },
            ratePlans: {
              take: 1,
            },
            cancellationPolicy: true,
          },
        },
      },
    });

    if (!hotel) {
      return null;
    }

    const roomDtos = hotel.rooms.map(room => {
      const bedInfo =
        room.beds.length > 0
          ? room.beds.map(b => `${b.quantity} ${b.bedType}`).join(', ')
          : null;

      let pricePerNight: number | null = null;
      if (checkIn && room.inventory.length > 0) {
        pricePerNight = room.inventory[0].price || room.ratePlans[0]?.basePrice || null;
      } else if (room.ratePlans[0]) {
        pricePerNight = room.ratePlans[0].basePrice;
      }

      return {
        roomId: room.id,
        roomName: room.name,
        maxGuests: room.capacity,
        bedInfo,
        images: room.images.map(img => img.url),
        pricePerNight,
        currency: 'USD', // TODO: Make configurable
        availableCount: checkIn ? room.inventory.length : room.availableCount,
        refundable: room.ratePlans[0]?.refundablePercent === 100 || null,
        cancellationPolicyText: room.cancellationPolicy?.name || null,
      };
    });

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        address: hotel.address,
        images: hotel.images.map(img => img.url),
        rating: null, // TODO: Calculate from reviews
        reviewCount: 0, // TODO: Count reviews
        facilities: [], // TODO: Map from amenities
      },
      rooms: roomDtos,
    };
  }

  /**
   * Helper: Get sort order for hotel search
   */
  private getSortOrder(sortBy?: string): Prisma.HotelOrderByWithRelationInput {
    // TODO: Implement proper sorting
    // For now, default to newest first
    return { createdAt: 'desc' };
  }
}
