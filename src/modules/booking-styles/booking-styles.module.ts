import { Module } from '@nestjs/common';
import { BookingStylesService } from './booking-styles.service';
import { BookingStylesController } from './booking-styles.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [BookingStylesController],
  providers: [BookingStylesService, PrismaService],
})
export class BookingStylesModule {}
