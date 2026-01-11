import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateInventoryDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin số lượng phòng (I-01)
   */
  async getInventory(userId: string, hotelId: string, roomId: string) {
    // Verify hotel belongs to user
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        partner: {
          userId,
        },
      },
    });

    if (!hotel) {
      throw new ForbiddenException('Bạn không có quyền truy cập khách sạn này');
    }

    // Get room inventory
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hotelId,
      },
      select: {
        id: true,
        name: true,
        roomType: true,
        availableCount: true,
        totalCount: true,
        capacity: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }

    return {
      data: room,
    };
  }

  /**
   * Cập nhật số lượng phòng (I-01)
   */
  async updateInventory(
    userId: string,
    hotelId: string,
    roomId: string,
    dto: UpdateInventoryDto,
  ) {
    // Verify hotel belongs to user
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        partner: {
          userId,
        },
      },
    });

    if (!hotel) {
      throw new ForbiddenException('Bạn không có quyền truy cập khách sạn này');
    }

    // Verify room belongs to hotel
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hotelId,
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }

    // Validation: availableCount không được vượt quá totalCount
    const totalCount = dto.totalCount ?? room.totalCount;
    if (dto.availableCount > totalCount) {
      throw new BadRequestException(
        `Số phòng còn lại (${dto.availableCount}) không được vượt quá tổng số phòng (${totalCount})`,
      );
    }

    // Update inventory
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        availableCount: dto.availableCount,
        ...(dto.totalCount && { totalCount: dto.totalCount }),
      },
      select: {
        id: true,
        name: true,
        roomType: true,
        availableCount: true,
        totalCount: true,
        capacity: true,
      },
    });

    return {
      data: updated,
      message: 'Cập nhật số lượng phòng thành công',
    };
  }
}
