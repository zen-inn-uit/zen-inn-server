import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateBookingStyleDto, UpdateBookingStyleDto } from './dto';

@Injectable()
export class BookingStylesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForRoom(roomId: string, dto: CreateBookingStyleDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    return this.prisma.roomBookingStyle.create({
      data: {
        roomId,
        style: dto.style,
        description: dto.description,
        icon: dto.icon,
        priority: dto.priority ?? 0,
      },
    });
  }

  async findAllForRoom(roomId: string) {
    return this.prisma.roomBookingStyle.findMany({
      where: { roomId },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(styleId: string) {
    const style = await this.prisma.roomBookingStyle.findUnique({
      where: { id: styleId },
    });
    if (!style) throw new NotFoundException('Không tìm thấy booking style.');
    return style;
  }

  async update(styleId: string, dto: UpdateBookingStyleDto) {
    const style = await this.prisma.roomBookingStyle.findUnique({
      where: { id: styleId },
    });
    if (!style) throw new NotFoundException('Không tìm thấy booking style.');

    return this.prisma.roomBookingStyle.update({
      where: { id: styleId },
      data: {
        style: dto.style,
        description: dto.description,
        icon: dto.icon,
        priority: dto.priority,
      },
    });
  }

  async remove(styleId: string) {
    const style = await this.prisma.roomBookingStyle.findUnique({
      where: { id: styleId },
    });
    if (!style) throw new NotFoundException('Không tìm thấy booking style.');

    await this.prisma.roomBookingStyle.delete({ where: { id: styleId } });
    return { success: true };
  }
}
