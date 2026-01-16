import { IsInt, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5 stars', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
