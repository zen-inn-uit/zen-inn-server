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
import { SearchHotelsResponseDto, HotelDetailResponseDto, HotelSearchItemDto } from './dto/hotel-response.dto';

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
      where.OR = [
        { city: { contains: dto.city, mode: 'insensitive' } },
        { address: { contains: dto.city, mode: 'insensitive' } },
        { name: { contains: dto.city, mode: 'insensitive' } },
      ];
    }

    // Availability check if dates are provided
    // For V1, we still fetch hotels and filter, but a more robust implementation 
    // would use a subquery or join with inventory.
    
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
            where: {
              ...(dto.adults ? { capacity: { gte: dto.adults } } : {}),
            },
            include: {
              inventory: {
                where: dto.checkIn && dto.checkOut
                  ? {
                      date: {
                        gte: new Date(dto.checkIn),
                        lt: new Date(dto.checkOut),
                      },
                      available: { gte: dto.rooms || 1 },
                      isStopSell: false,
                    }
                  : undefined,
              },
              ratePlans: {
                where: { active: true },
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

    // Calculate nights for correctly checking availability
    const nights = (dto.checkIn && dto.checkOut) 
      ? Math.ceil((new Date(dto.checkOut).getTime() - new Date(dto.checkIn).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const items = (hotels as any[])
      .filter(hotel => {
        // If dates provided, ensure at least one room has availability for ALL nights
        if (nights > 0) {
          return hotel.rooms.some(room => room.inventory.length === nights);
        }
        return hotel.rooms.length > 0;
      })
      .map(hotel => {
        // Find the lowest price among available rooms
        const availableRooms = nights > 0 
          ? hotel.rooms.filter(room => room.inventory.length === nights)
          : hotel.rooms;
        
        const startingPrice = availableRooms.length > 0
          ? Math.min(...availableRooms.map(r => {
              if (nights > 0) {
                // Sum price for all nights
                return r.inventory.reduce((sum, inv) => sum + (inv.price || r.ratePlans[0]?.basePrice || 0), 0);
              }
              return r.ratePlans[0]?.basePrice || 0;
            }))
          : null;

        // Calculate max guests and bedroom count from available rooms
        const maxGuests = availableRooms.length > 0
          ? Math.max(...availableRooms.map(r => r.capacity))
          : null;
        
        const bedroomCount = availableRooms.length > 0
          ? Math.max(...availableRooms.map(r => r.beds?.length || 0))
          : null;

        return {
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          address: hotel.address,
          thumbnailUrl: hotel.images.length > 0 ? hotel.images[0].url : null,
          rating: hotel.starRating || null,
          reviewCount: 0, // TODO: Count reviews
          startingPrice,
          currency: 'USD',
          availableRoomsCount: availableRooms.length || null,
          maxGuests,
          bedroomCount,
        };
      });

    return {
      items,
      meta: {
        page,
        limit,
        total, // Note: total is for the initial query, filtering might reduce actual count per page
      },
    };
  }

  /**
   * PUBLIC: Get featured hotels for home page
   * Returns random selection of active hotels with their ratings
   */
  async getFeaturedHotels(limit: number = 10): Promise<HotelSearchItemDto[]> {
    // Get all active hotels with their first image and reviews
    const hotels = await this.prisma.hotel.findMany({
      where: {
        deletedAt: null,
        status: HotelStatus.ACTIVE,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        rooms: {
          include: {
            beds: true,
            ratePlans: {
              where: {
                active: true,
              },
              orderBy: {
                basePrice: 'asc',
              },
              take: 1,
            },
          },
        },
      },
      take: 100, // Get more than needed for randomization
    });

    // Transform and calculate ratings
    const hotelItems: HotelSearchItemDto[] = hotels.map(hotel => {
      const reviewCount = hotel.reviews.length;
      const averageRating = reviewCount > 0
        ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;

      // Get starting price from cheapest room
      let startingPrice: number | null = null;
      for (const room of hotel.rooms) {
        if (room.ratePlans.length > 0) {
          const price = room.ratePlans[0].basePrice;
          if (startingPrice === null || price < startingPrice) {
            startingPrice = price;
          }
        }
      }

      // Calculate max guests and bedroom count
      const maxGuests = hotel.rooms.length > 0
        ? Math.max(...hotel.rooms.map(r => r.capacity))
        : null;
      
      const bedroomCount = hotel.rooms.length > 0
        ? Math.max(...hotel.rooms.map(r => r.beds?.length || 0))
        : null;

      return {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        address: hotel.address,
        thumbnailUrl: hotel.images[0]?.url || null,
        rating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        reviewCount,
        startingPrice,
        currency: 'USD',
        availableRoomsCount: hotel.rooms.reduce((sum, room) => sum + room.availableCount, 0),
        maxGuests,
        bedroomCount,
      };
    });

    // Shuffle array randomly
    const shuffled = hotelItems.sort(() => Math.random() - 0.5);

    // Return requested number of hotels
    return shuffled.slice(0, Math.min(limit, shuffled.length));
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
            amenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!hotel) {
      return null;
    }

    // Calculate average rating and review count
    const reviewCount = hotel.reviews.length;
    const averageRating = reviewCount > 0
      ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

    // Collect unique facilities from all rooms' amenities
    const facilitiesSet = new Set<string>();
    hotel.rooms.forEach(room => {
      room.amenities.forEach(ra => {
        facilitiesSet.add(ra.amenity.name);
      });
    });
    const facilities = Array.from(facilitiesSet);

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
        country: hotel.country,
        images: hotel.images.map(img => img.url),
        rating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        reviewCount,
        facilities,
      },
      rooms: roomDtos,
    };
  }

  /**
   * Helper: Get sort order for hotel search
   */
  private getSortOrder(sortBy?: string): Prisma.HotelOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_asc':
        // Note: For now we sort by hotel creation as a fallback
        // Proper price sorting would require a more complex query or denormalized data
        return { createdAt: 'desc' };
      case 'rating_desc':
        return { starRating: 'desc' };
      case 'recommended':
      default:
        return { createdAt: 'desc' };
    }
  }
}
