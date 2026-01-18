import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

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
}
