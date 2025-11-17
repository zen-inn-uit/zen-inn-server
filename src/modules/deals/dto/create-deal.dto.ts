import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'Late Escape Deal' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Đặt muộn hơn để có giá tốt hơn' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ['LATE_ESCAPE', 'EARLY_BIRD', 'FLASH_SALE', 'SEASONAL'],
    example: 'LATE_ESCAPE',
  })
  @IsString()
  dealType: string;

  @ApiPropertyOptional({ example: 'Save 20%' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ example: '2025-11-17T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  validUntil: string;
}

export class UpdateDealDto {
  @ApiPropertyOptional({ example: 'Late Escape Deal' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Đặt muộn hơn để có giá tốt hơn' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['LATE_ESCAPE', 'EARLY_BIRD', 'FLASH_SALE', 'SEASONAL'],
    example: 'LATE_ESCAPE',
  })
  @IsOptional()
  @IsString()
  dealType?: string;

  @ApiPropertyOptional({ example: 'Save 20%' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: '2025-11-17T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
