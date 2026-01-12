import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PartnerRoomsController } from './partner-rooms.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [RoomsController, PartnerRoomsController],
  providers: [RoomsService, PrismaService],
})
export class RoomsModule {}
