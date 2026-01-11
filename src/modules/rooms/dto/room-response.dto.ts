import { ApiProperty } from '@nestjs/swagger';

export class RoomImageDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  url: string;

  @ApiProperty({ example: 0 })
  displayOrder: number;
}

export class BedDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({
    enum: ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK'],
    example: 'QUEEN',
  })
  bedType: string;

  @ApiProperty({ example: 1 })
  quantity: number;
}

export class AmenityDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'Air conditioning' })
  name: string;

  @ApiProperty({ example: 'Điều hòa không khí' })
  description?: string;

  @ApiProperty({ example: 'ac' })
  icon?: string;

  @ApiProperty({ example: 'ROOM_FEATURE' })
  category: string;
}

export class RoomAmenityDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty()
  amenity: AmenityDto;
}

export class DealDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'Late Escape Deal' })
  name: string;

  @ApiProperty({ example: 'Đặt muộn hơn để có giá tốt hơn' })
  description?: string;

  @ApiProperty({ example: 'LATE_ESCAPE' })
  dealType: string;

  @ApiProperty({ example: 'Save 20%' })
  badge?: string;
}

export class RoomBookingStyleDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'Free cancellation anytime' })
  style: string;

  @ApiProperty({ example: 'Hủy miễn phí bất cứ lúc nào' })
  description?: string;

  @ApiProperty({ example: 'cancel' })
  icon?: string;

  @ApiProperty({ example: 0 })
  priority: number;
}

export class RoomResponseDto {
  @ApiProperty({ example: 'cljxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'cljxxxxxxxx' })
  hotelId: string;

  @ApiProperty({ example: 'Deluxe Double Room' })
  name: string;

  @ApiProperty({ example: 'Phòng Deluxe' })
  roomType: string;

  @ApiProperty({ example: 'Phòng nghỉ dưỡng cao cấp' })
  description?: string;

  @ApiProperty({
    example: 5000000,
    description: 'Giá mỗi đêm (tính theo cent)',
  })
  price: number;

  @ApiProperty({ example: 6000000 })
  originalPrice?: number;

  @ApiProperty({ example: 17 })
  discountPercent?: number;

  @ApiProperty({ example: 2 })
  capacity: number;

  @ApiProperty({ example: 35.5 })
  area?: number;

  @ApiProperty({ example: 5 })
  availableCount: number;

  @ApiProperty({ example: 10 })
  totalCount: number;

  @ApiProperty({ type: [RoomImageDto] })
  images: RoomImageDto[];

  @ApiProperty({ type: [BedDto] })
  beds: BedDto[];

  @ApiProperty({ type: [RoomAmenityDto] })
  amenities: RoomAmenityDto[];

  @ApiProperty({ type: [DealDto] })
  deals: DealDto[];

  @ApiProperty({ type: [RoomBookingStyleDto] })
  bookingStyles: RoomBookingStyleDto[];

  @ApiProperty({ example: 'cljxxxxxxxx' })
  cancellationPolicyId?: string;

  @ApiProperty({ example: '2025-11-17T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-11-17T10:00:00Z' })
  updatedAt: string;
}
