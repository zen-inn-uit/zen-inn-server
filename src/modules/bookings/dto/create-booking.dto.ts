/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEmail,
  IsInt,
  Min,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Room ID' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ description: 'Rate Plan ID', required: false })
  @IsString()
  @IsOptional()
  ratePlanId?: string;

  @ApiProperty({
    description: 'Check-in date (ISO 8601)',
    example: '2026-02-25',
  })
  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @ApiProperty({
    description: 'Check-out date (ISO 8601)',
    example: '2026-02-27',
  })
  @IsDateString()
  @IsNotEmpty()
  @ValidateIf(
    (o: CreateBookingDto) => new Date(o.checkOut) > new Date(o.checkIn),
    {
      message: 'Check-out date must be after check-in date',
    },
  )
  checkOut: string;

  @ApiProperty({ description: 'Guest full name' })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiProperty({ description: 'Guest email' })
  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @ApiProperty({ description: 'Guest phone number' })
  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1 })
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiProperty({ description: 'Special requests', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
