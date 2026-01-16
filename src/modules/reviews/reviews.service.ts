import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all reviews for partner's hotels with filters
   */
  async findAllForPartner(userId: string, query: QueryReviewsDto) {
    // Get partner
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: true },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const hotelIds = partner.hotels.map(h => h.id);

    if (hotelIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 10,
      };
    }

    // Build where clause
    const where: any = {
      hotelId: { in: hotelIds },
    };

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.hotelId) {
      // Verify hotel belongs to partner
      if (!hotelIds.includes(query.hotelId)) {
        throw new ForbiddenException('Hotel does not belong to this partner');
      }
      where.hotelId = query.hotelId;
    }

    if (query.search) {
      where.comment = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Get reviews
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          hotel: {
            select: {
              id: true,
              name: true,
            },
          },
          booking: {
            select: {
              id: true,
              room: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
    };
  }

  /**
   * Get review statistics for partner
   */
  async getStatsForPartner(userId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: true },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const hotelIds = partner.hotels.map(h => h.id);

    if (hotelIds.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ],
      };
    }

    // Get all reviews
    const reviews = await this.prisma.review.findMany({
      where: { hotelId: { in: hotelIds } },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating breakdown
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: ratingCounts[rating as keyof typeof ratingCounts],
    }));

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingBreakdown,
    };
  }

  /**
   * Get single review detail
   */
  async findOne(userId: string, reviewId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: true },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const hotelIds = partner.hotels.map(h => h.id);

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!hotelIds.includes(review.hotelId)) {
      throw new ForbiddenException('This review does not belong to your hotels');
    }

    return review;
  }

  /**
   * Reply to a review
   */
  async replyToReview(userId: string, reviewId: string, dto: ReplyReviewDto) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: true },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const hotelIds = partner.hotels.map(h => h.id);

    // Get review
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!hotelIds.includes(review.hotelId)) {
      throw new ForbiddenException('This review does not belong to your hotels');
    }

    // Update reply
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: dto.reply,
        repliedAt: new Date(),
        repliedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Customer creates a review for a booking
   */
  async createReview(userId: string, bookingId: string, dto: CreateReviewDto) {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      throw new ForbiddenException('This booking does not belong to you');
    }

    // Check if booking is completed (checked out)
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('You can only review completed bookings');
    }

    // Check if already reviewed
    if (booking.review) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    // Check if checkout date has passed
    const now = new Date();
    if (booking.checkOut > now) {
      throw new BadRequestException('You can only review after checkout');
    }

    // Create review
    return this.prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: userId,
        hotelId: booking.room.hotelId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Admin: Get all reviews with filters
   */
  async findAllForAdmin(query: QueryReviewsDto) {
    const where: any = {};

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.hotelId) {
      where.hotelId = query.hotelId;
    }

    if (query.search) {
      where.comment = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          hotel: {
            select: {
              id: true,
              name: true,
              partner: {
                select: {
                  id: true,
                  company: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              room: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Delete a review
   */
  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true, message: 'Review deleted successfully' };
  }
}
