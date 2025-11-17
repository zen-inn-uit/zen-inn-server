import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';
import { KycStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async verifyHotelOwnership(userId: string, hotelId: string) {
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

  async createForUser(userId: string, hotelId: string, dto: CreateRoomDto) {
    await this.verifyHotelOwnership(userId, hotelId);

    const amenityIdsToConnect: string[] = [];

    if (dto.amenities && dto.amenities.length > 0) {
      for (const amenity of dto.amenities) {
        // DTO validation ensures name and category are present
        const name = amenity.name;
        const category = amenity.category;
        const description = amenity.description;
        const icon = amenity.icon;

        let amenityRecord = await this.prisma.amenity.findFirst({
          where: { name },
        });

        if (!amenityRecord) {
          amenityRecord = await this.prisma.amenity.create({
            data: {
              name,
              description: description || null,
              icon: icon || null,
              category: category as Parameters<never>,
            },
          });
        }

        amenityIdsToConnect.push(amenityRecord.id);
      }
    }

    return this.prisma.room.create({
      data: {
        hotelId,
        name: dto.name,
        roomType: dto.roomType,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice,
        discountPercent: dto.discountPercent,
        capacity: dto.capacity,
        area: dto.area,
        availableCount: dto.availableCount,
        totalCount: dto.totalCount,
        images: {
          create: (dto.images ?? []).map((url, index) => ({
            url,
            displayOrder: index,
          })),
        },
        beds: {
          create: (dto.beds ?? []).map((bed) => ({
            bedType: bed.bedType as Parameters<never>,
            quantity: bed.quantity,
          })),
        },
        amenities: {
          create: amenityIdsToConnect.map((amenityId) => ({
            amenityId,
          })),
        },
      },
      include: {
        images: true,
        beds: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        deals: true,
        bookingStyles: true,
      },
    });
  }

  async findAllForUser(userId: string, hotelId: string) {
    await this.verifyHotelOwnership(userId, hotelId);

    return this.prisma.room.findMany({
      where: {
        hotelId,
      },
      include: {
        images: true,
        beds: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        deals: true,
        bookingStyles: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, hotelId: string, roomId: string) {
    await this.verifyHotelOwnership(userId, hotelId);

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hotelId,
      },
      include: {
        images: true,
        beds: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        deals: true,
        bookingStyles: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    return room;
  }

  async updateForUser(
    userId: string,
    hotelId: string,
    roomId: string,
    dto: UpdateRoomDto,
  ) {
    await this.verifyHotelOwnership(userId, hotelId);

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hotelId,
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    const amenityIdsToConnect: string[] = [];

    if (dto.amenities && dto.amenities.length > 0) {
      for (const amenity of dto.amenities) {
        const amenityName = amenity?.name;
        const amenityDescription = amenity?.description;
        const amenityIcon = amenity?.icon;
        const amenityCategory = amenity?.category;

        if (!amenityName) continue;

        let amenityRecord = await this.prisma.amenity.findFirst({
          where: { name: amenityName },
        });

        if (!amenityRecord) {
          amenityRecord = await this.prisma.amenity.create({
            data: {
              name: amenityName,
              description: amenityDescription || null,
              icon: amenityIcon || null,
              category: amenityCategory as Parameters<never>,
            },
          });
        }

        amenityIdsToConnect.push(amenityRecord.id);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.roomType !== undefined) updateData.roomType = dto.roomType;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.originalPrice !== undefined)
      updateData.originalPrice = dto.originalPrice;
    if (dto.discountPercent !== undefined)
      updateData.discountPercent = dto.discountPercent;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.area !== undefined) updateData.area = dto.area;
    if (dto.availableCount !== undefined)
      updateData.availableCount = dto.availableCount;
    if (dto.totalCount !== undefined) updateData.totalCount = dto.totalCount;

    if (dto.images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: (dto.images ?? []).map((url, index) => ({
          url,
          displayOrder: index,
        })),
      };
    }

    if (dto.beds !== undefined) {
      updateData.beds = {
        deleteMany: {},
        create: dto.beds,
      };
    }

    if (dto.amenities !== undefined) {
      updateData.amenities = {
        deleteMany: {},
        create: amenityIdsToConnect.map((amenityId) => ({
          amenityId,
        })),
      };
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: updateData,
      include: {
        images: true,
        beds: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        deals: true,
        bookingStyles: true,
      },
    });
  }

  async removeForUser(userId: string, hotelId: string, roomId: string) {
    await this.verifyHotelOwnership(userId, hotelId);

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hotelId,
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng.');
    }

    await this.prisma.room.delete({
      where: { id: roomId },
    });

    return { success: true };
  }
}
