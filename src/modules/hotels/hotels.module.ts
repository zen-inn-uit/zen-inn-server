import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { PublicHotelsController } from './public-hotels.controller';
import { HotelsService } from './hotels.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [HotelsController, PublicHotelsController],
  providers: [HotelsService, PrismaService],
  exports: [HotelsService],
})
export class HotelsModule {}
