import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatePlanDto {
  @ApiProperty({
    example: 'Standard Rate',
    description:
      'Tên rate plan (e.g., "BAR", "Non-refundable Rate", "Breakfast Included")',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Giá chuẩn cho các ngày thường',
    description: 'Mô tả chi tiết về rate plan',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'STD',
    description: 'Mã rate plan (e.g., "BAR", "NR", "BIC")',
  })
  @IsOptional()
  @IsString()
  rateCode?: string;

  @ApiProperty({
    example: 500000,
    description: 'Giá cơ bản (tính theo cent, vd 500000 = 5000đ)',
  })
  @IsInt()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum length of stay (số đêm)',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minLos?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Maximum length of stay (số đêm)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLos?: number;

  @ApiProperty({
    example: '2025-11-18T00:00:00Z',
    description: 'Ngày bắt đầu áp dụng',
  })
  @IsDateString()
  validFrom: string;

  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    description: 'Ngày kết thúc áp dụng',
  })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({
    example: 'Free before 48h',
    description:
      'Chính sách hủy (e.g., "Free before 48h", "No refund", "Non-refundable")',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    example: 100,
    description: '% hoàn tiền (0-100)',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  refundablePercent?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Yêu cầu đặt cọc',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @ApiPropertyOptional({
    example: 20,
    description: '% đặt cọc (0-100) nếu depositRequired = true',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  depositPercent?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bữa sáng',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includesBreakfast?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bữa tối',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includesDinner?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bãi đỗ xe',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includesParking?: boolean;

  @ApiPropertyOptional({
    example: 'Wifi miễn phí, minibar',
    description: 'Các dịch vụ khác bao gồm',
  })
  @IsOptional()
  @IsString()
  otherInclusions?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số khách tiêu chuẩn tối thiểu',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minGuestCount?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Số khách tối đa',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxGuestCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Cho phép thay đổi booking',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  modificationAllowed?: boolean;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Phí thay đổi (tính theo cent)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  modificationFee?: number;

  @ApiPropertyOptional({
    example: 'BAR',
    description: 'Loại rate plan (e.g., "BAR", "CORPORATE", "LONG_STAY")',
  })
  @IsOptional()
  @IsString()
  rateType?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Kích hoạt rate plan',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
