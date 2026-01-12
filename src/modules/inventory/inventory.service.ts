import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BulkUpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy dữ liệu kho phòng theo dải ngày cho tất cả các phòng thuộc khách sạn
   */
  async getInventoryRange(userId: string, hotelId: string, startDate: string, endDate: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id: hotelId, partner: { userId } },
      include: {
        rooms: {
          include: {
            inventory: {
              where: {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
            ratePlans: {
              where: { active: true },
              take: 1
            }
          },
        },
      },
    });

    if (!hotel) {
      throw new ForbiddenException('Bạn không có quyền truy cập khách sạn này');
    }

    return hotel.rooms.map(room => ({
      id: room.id,
      name: room.name,
      roomType: room.roomType,
      totalCount: room.totalCount,
      basePrice: room.ratePlans[0]?.basePrice || 0,
      inventory: room.inventory,
    }));
  }

  /**
   * Cập nhật số lượng, giá hoặc stop-sell hàng loạt cho một phòng
   */
  async updateBulk(userId: string, roomId: string, dto: BulkUpdateInventoryDto) {
    const room = await this.prisma.room.findFirst({
      where: { 
        id: roomId,
        hotel: { partner: { userId } }
      }
    });

    if (!room) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phòng này');
    }

    const operations = dto.updates.map(update => {
      const date = new Date(update.date);
      date.setUTCHours(0, 0, 0, 0);

      return this.prisma.roomInventory.upsert({
        where: {
          roomId_date: {
            roomId,
            date,
          },
        },
        update: {
          available: update.available,
          price: update.price,
          isStopSell: update.isStopSell,
        },
        create: {
          roomId,
          date,
          available: update.available ?? room.totalCount,
          price: update.price,
          isStopSell: update.isStopSell ?? false,
        },
      });
    });

    await Promise.all(operations);

    return {
      success: true,
      message: 'Cập nhật kho phòng thành công',
    };
  }
}
