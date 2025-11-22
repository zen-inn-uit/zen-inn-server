import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { HotelStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHotelDto {
  @ApiProperty({ example: 'Zen Inn Downtown', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: 'Ho Chi Minh', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'Vietnam', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country?: string;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  starRating?: number;

  @ApiProperty({ example: '+84-28-1234-5678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: ['https://s3.example.com/hotel1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    enum: HotelStatus,
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  status?: HotelStatus;
}
