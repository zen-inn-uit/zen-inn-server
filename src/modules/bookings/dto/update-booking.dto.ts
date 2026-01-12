import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBookingDto {
  @ApiProperty({ description: 'Check-in date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiProperty({ description: 'Check-out date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiProperty({ description: 'Special requests', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
