import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLogsDto {
  @ApiPropertyOptional({
    description: 'Filter by event category',
    example: 'booking',
  })
  @IsOptional()
  @IsString()
  eventCategory?: string;

  @ApiPropertyOptional({
    description: 'Filter by event type',
    example: 'booking_created',
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: 'Filter by severity',
    enum: ['info', 'warning', 'error'],
  })
  @IsOptional()
  @IsIn(['info', 'warning', 'error'])
  severity?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'user_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource ID',
    example: 'booking_123',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
