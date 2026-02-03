import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum SortByEnum {
  RECOMMENDED = 'recommended',
  PRICE_ASC = 'price_asc',
  RATING_DESC = 'rating_desc',
}

export class SearchHotelDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  location?: string; // Alias for city

  @IsOptional()
  @IsString()
  checkIn?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  checkOut?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  adults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SortByEnum)
  sortBy?: SortByEnum;

  // Filter parameters
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    }
    return Array.isArray(value) ? value.map(Number) : [];
  })
  @IsArray()
  starRatings?: number[]; // e.g., [3, 4, 5] for 3-star, 4-star, 5-star hotels

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  amenities?: string[]; // Array of amenity names or IDs

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  roomTypes?: string[]; // e.g., ['Suite', 'Deluxe', 'Villa']
}
