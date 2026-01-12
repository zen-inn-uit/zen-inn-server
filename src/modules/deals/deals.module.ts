import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DealsController],
  providers: [DealsService, PrismaService],
})
export class DealsModule {}
