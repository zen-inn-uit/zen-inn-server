import { Module } from '@nestjs/common';
import { CancellationPoliciesService } from './cancellation-policies.service';
import { CancellationPoliciesController } from './cancellation-policies.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [CancellationPoliciesController],
  providers: [CancellationPoliciesService, PrismaService],
  exports: [CancellationPoliciesService],
})
export class CancellationPoliciesModule {}
