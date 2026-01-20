export class WishlistItemDto {
  id: string;
  hotelId: string;
  name: string;
  city: string;
  address: string;
  thumbnailUrl: string | null;
  rating: number | null;
  reviewCount: number;
  startingPrice: number | null;
  currency: string;
  createdAt: Date;
}

export class WishlistResponseDto {
  items: WishlistItemDto[];
  meta: {
    total: number;
  };
}

export class WishlistAddResponseDto {
  id: string;
  userId: string;
  hotelId: string;
  createdAt: Date;
}
