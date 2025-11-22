import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryBookingDto {
  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Filter bookings from this date',
    required: false,
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filter bookings to this date',
    required: false,
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
