import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RatePlansController } from './rate-plans.controller';
import { PartnerRatePlansController } from './partner-rate-plans.controller';
import { RatePlansService } from './rate-plans.service';

@Module({
  controllers: [RatePlansController, PartnerRatePlansController],
  providers: [RatePlansService, PrismaService],
})
export class RatePlansModule {}
