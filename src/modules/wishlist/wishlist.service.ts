import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { WishlistItemDto, WishlistResponseDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all wishlist items for a user
   */
  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlistItems = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        hotel: {
          include: {
            images: {
              take: 1,
              orderBy: { displayOrder: 'asc' },
            },
            rooms: {
              include: {
                ratePlans: {
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: WishlistItemDto[] = wishlistItems.map(item => ({
      id: item.id,
      hotelId: item.hotel.id,
      name: item.hotel.name,
      city: item.hotel.city,
      address: item.hotel.address,
      thumbnailUrl:
        item.hotel.images.length > 0 ? item.hotel.images[0].url : null,
      rating: null, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count reviews
      startingPrice:
        item.hotel.rooms.length > 0
          ? Math.min(
              ...item.hotel.rooms.map(
                r => r.ratePlans[0]?.basePrice || 0,
              ),
            ) || null
          : null,
      currency: 'USD', // TODO: Make configurable
      createdAt: item.createdAt,
    }));

    return {
      items,
      meta: {
        total: items.length,
      },
    };
  }

  /**
   * Add hotel to wishlist
   */
  async addToWishlist(
    userId: string,
    hotelId: string,
  ) {
    // Check if hotel exists
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_hotelId: { userId, hotelId },
      },
    });

    if (existing) {
      throw new ConflictException('Hotel already in wishlist');
    }

    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        userId,
        hotelId,
      },
    });

    return {
      id: wishlistItem.id,
      userId: wishlistItem.userId,
      hotelId: wishlistItem.hotelId,
      createdAt: wishlistItem.createdAt,
    };
  }

  /**
   * Remove hotel from wishlist
   */
  async removeFromWishlist(userId: string, hotelId: string) {
    const result = await this.prisma.wishlistItem.deleteMany({
      where: {
        userId,
        hotelId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `Wishlist item not found for hotel ${hotelId}`,
      );
    }

    return { success: true };
  }

  /**
   * Check if hotel is in user's wishlist
   */
  async isInWishlist(userId: string, hotelId: string): Promise<boolean> {
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_hotelId: { userId, hotelId },
      },
    });
    return !!item;
  }
}
