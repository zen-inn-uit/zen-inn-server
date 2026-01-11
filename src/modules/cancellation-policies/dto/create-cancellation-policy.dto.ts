import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateCancellationPolicyDto {
  @ApiProperty({ example: 'Flexible', description: 'Policy name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: 'Free cancellation up to 48 hours before check-in',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 48,
    description: 'Hours before check-in for free cancellation',
  })
  @IsInt()
  @Min(0)
  freeCancellationHours: number;

  @ApiProperty({
    example: 50,
    description: 'Refund percentage after free cancellation window (0-100)',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  refundablePercent: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Refund percentage for no-show (0-100)',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  noShowRefundPercent?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether modifications are allowed',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  modificationAllowed?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Modification fee as percentage of booking total (0-100)',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  modificationFeePercent?: number;

  @ApiPropertyOptional({
    example: 'cl...',
    description: 'ID của khách sạn nếu muốn giới hạn cho khách sạn đó',
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}
