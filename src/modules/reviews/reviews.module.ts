import { Module } from '@nestjs/common';
import { ReviewsController, CustomerReviewsController, AdminReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ReviewsController, CustomerReviewsController, AdminReviewsController],
  providers: [ReviewsService, PrismaService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
