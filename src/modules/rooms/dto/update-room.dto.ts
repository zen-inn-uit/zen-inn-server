import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsPositive,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsArray,
  IsUrl,
} from 'class-validator';

class UpdateBedDto {
  @ApiPropertyOptional({
    enum: ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK'],
    example: 'QUEEN',
  })
  @IsOptional()
  @IsString()
  bedType?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;
}

class UpdateAmenityDto {
  @ApiPropertyOptional({ example: 'Air conditioning' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Điều hòa không khí' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Danh mục tiện nghi (ROOM_FEATURE, BATHROOM, ENTERTAINMENT, CONVENIENCE, SAFETY, ACCESSIBILITY)',
    enum: [
      'ROOM_FEATURE',
      'BATHROOM',
      'ENTERTAINMENT',
      'CONVENIENCE',
      'SAFETY',
      'ACCESSIBILITY',
    ],
    example: 'ROOM_FEATURE',
  })
  category?: string;

  @ApiPropertyOptional({ example: 'ac' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: 'Deluxe Double Room' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Phòng Deluxe' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ example: 'Phòng nghỉ dưỡng cao cấp' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Giá mỗi đêm (tính theo cent)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 6000000 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  originalPrice?: number;

  @ApiPropertyOptional({ example: 17 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  availableCount?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  totalCount?: number;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    type: [UpdateBedDto],
    example: [
      { bedType: 'QUEEN', quantity: 1 },
      { bedType: 'SINGLE', quantity: 1 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBedDto)
  beds?: UpdateBedDto[];

  @ApiPropertyOptional({
    type: [UpdateAmenityDto],
    example: [
      { name: 'Air conditioning', category: 'ROOM_FEATURE' },
      { name: 'Free Wifi', category: 'CONVENIENCE' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAmenityDto)
  amenities?: UpdateAmenityDto[];
}
