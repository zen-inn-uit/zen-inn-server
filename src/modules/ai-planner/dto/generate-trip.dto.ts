import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TripBudget {
  ECONOMY = 'ECONOMY',
  MODERATE = 'MODERATE',
  LUXURY = 'LUXURY',
}

export class GenerateTripDto {
  @ApiProperty({ 
    example: 'A 3-day trip to Da Lat, Vietnam from March 15-17, 2026 for 2 adults with a moderate budget. We love coffee tours, lake activities, and local cuisine.',
    description: 'Natural language description of the trip. AI will parse destination, dates, travelers, budget, and preferences from this.'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Da Lat, Vietnam' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkIn?: Date;

  @ApiPropertyOptional({ example: '2026-05-05T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkOut?: Date;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  children?: number = 0;

  @ApiPropertyOptional({ enum: TripBudget, example: TripBudget.MODERATE })
  @IsEnum(TripBudget)
  @IsOptional()
  budget?: TripBudget;

  @ApiPropertyOptional({ example: ['relaxing', 'nature', 'romantic'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[] = [];

  @ApiPropertyOptional({ example: 'cm3h5l7p60000ux2z...', description: 'Optional associated hotel ID' })
  @IsString()
  @IsOptional()
  hotelId?: string;
}
