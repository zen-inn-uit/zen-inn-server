import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  IsNotEmpty,
} from 'class-validator';

class CreateBedDto {
  @ApiProperty({
    enum: ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK'],
    example: 'QUEEN',
  })
  @IsString()
  bedType: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}

class CreateAmenityDto {
  @ApiProperty({ example: 'Air conditioning' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Điều hòa không khí' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
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
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'ac' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateRoomDto {
  @ApiProperty({ example: 'Deluxe Double Room' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Phòng Deluxe' })
  @IsString()
  roomType: string;

  @ApiPropertyOptional({ example: 'Phòng nghỉ dưỡng cao cấp' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 5000000,
    description: 'Giá mỗi đêm (tính theo cent)',
  })
  @IsInt()
  @IsPositive()
  price: number;

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

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  capacity: number;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsPositive()
  availableCount: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsPositive()
  totalCount: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/image1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    type: [CreateBedDto],
    example: [
      { bedType: 'QUEEN', quantity: 1 },
      { bedType: 'SINGLE', quantity: 1 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBedDto)
  beds?: CreateBedDto[];

  @ApiPropertyOptional({
    type: [CreateAmenityDto],
    example: [
      { name: 'Air conditioning', category: 'ROOM_FEATURE' },
      { name: 'Free Wifi', category: 'CONVENIENCE' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAmenityDto)
  amenities?: CreateAmenityDto[];
}
