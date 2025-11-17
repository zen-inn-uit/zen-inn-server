import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDealDto, UpdateDealDto } from './dto';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForRoom(roomId: string, dto: CreateDealDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    return this.prisma.deal.create({
      data: {
        roomId,
        name: dto.name,
        description: dto.description,
        dealType: dto.dealType as Parameters<never>,
        badge: dto.badge,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
      },
    });
  }

  async findAllForRoom(roomId: string) {
    return this.prisma.deal.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(dealId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal.');
    return deal;
  }

  async update(dealId: string, dto: UpdateDealDto) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal.');

    return this.prisma.deal.update({
      where: { id: dealId },
      data: {
        name: dto.name,
        description: dto.description,
        dealType: dto.dealType as Parameters<never>,
        badge: dto.badge,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async remove(dealId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Không tìm thấy deal.');

    await this.prisma.deal.delete({ where: { id: dealId } });
    return { success: true };
  }
}
