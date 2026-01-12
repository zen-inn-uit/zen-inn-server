import { IsString, IsDateString, IsOptional, IsInt, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiProperty({ example: '2026-01-12T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  available?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isStopSell?: boolean;
}

export class BulkUpdateInventoryDto {
  @ApiProperty({ example: 'roomId_123' })
  @IsString()
  roomId: string;

  @ApiProperty({ type: [UpdateInventoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInventoryDto)
  updates: UpdateInventoryDto[];
}
