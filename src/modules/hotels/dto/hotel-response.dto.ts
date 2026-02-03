export class HotelSearchItemDto {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  thumbnailUrl: string | null;
  rating: number | null;
  reviewCount: number;
  startingPrice: number | null;
  currency: string;
  availableRoomsCount: number | null;
  maxGuests: number | null;
  bedroomCount: number | null;
}

export class SearchHotelsResponseDto {
  items: HotelSearchItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export class RoomDetailDto {
  roomId: string;
  roomName: string;
  maxGuests: number;
  bedInfo: string | null;
  images: string[];
  pricePerNight: number | null;
  currency: string;
  availableCount: number | null;
  refundable: boolean | null;
  cancellationPolicyText: string | null;
}

export class HotelDetailResponseDto {
  hotel: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    country: string;
    images: string[];
    rating: number | null;
    reviewCount: number;
    facilities: string[];
    phone: string | null;
  };
  rooms: RoomDetailDto[];
}
