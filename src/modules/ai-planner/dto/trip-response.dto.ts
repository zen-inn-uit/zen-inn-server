import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

export class TripActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  time: string;

  @ApiProperty({ enum: ActivityType })
  type: ActivityType;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  price?: string;

  @ApiPropertyOptional()
  imageUrl?: string;
}

export class TripDayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dayNumber: number;

  @ApiProperty()
  date: Date;

  @ApiProperty({ type: [TripActivityResponseDto] })
  activities: TripActivityResponseDto[];
}

export class TripResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  destination: string;

  @ApiProperty()
  checkIn: Date;

  @ApiProperty()
  checkOut: Date;

  @ApiProperty()
  adults: number;

  @ApiProperty()
  children: number;

  @ApiPropertyOptional()
  budget?: string;

  @ApiProperty({ type: [String] })
  preferences: string[];

  @ApiPropertyOptional()
  hotelId?: string;

  @ApiProperty({ type: [TripDayResponseDto] })
  days: TripDayResponseDto[];

  @ApiProperty()
  createdAt: Date;
}
