import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateBookingStyleDto {
  @ApiProperty({ example: 'Free cancellation anytime' })
  @IsString()
  style: string;

  @ApiPropertyOptional({ example: 'Hủy miễn phí bất cứ lúc nào' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'cancel' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdateBookingStyleDto {
  @ApiPropertyOptional({ example: 'Free cancellation anytime' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: 'Hủy miễn phí bất cứ lúc nào' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'cancel' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;
}
