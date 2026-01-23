import { Module } from '@nestjs/common';
import { AIPlannerService } from './ai-planner.service';
import { AIPlannerController } from './ai-planner.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AIPlannerController],
  providers: [AIPlannerService, PrismaService],
  exports: [AIPlannerService],
})
export class AIPlannerModule {}
