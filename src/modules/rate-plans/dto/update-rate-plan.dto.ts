import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRatePlanDto {
  @ApiPropertyOptional({
    example: 'Standard Rate',
    description: 'Tên rate plan',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Giá chuẩn cho các ngày thường',
    description: 'Mô tả chi tiết',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'STD',
    description: 'Mã rate plan',
  })
  @IsOptional()
  @IsString()
  rateCode?: string;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Giá cơ bản (tính theo cent)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum length of stay',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minLos?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Maximum length of stay',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLos?: number;

  @ApiPropertyOptional({
    example: '2025-11-18T00:00:00Z',
    description: 'Ngày bắt đầu áp dụng',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Ngày kết thúc áp dụng',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    example: 'Free before 48h',
    description: 'Chính sách hủy',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    example: 100,
    description: '% hoàn tiền (0-100)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  refundablePercent?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Yêu cầu đặt cọc',
  })
  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @ApiPropertyOptional({
    example: 20,
    description: '% đặt cọc (0-100)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  depositPercent?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bữa sáng',
  })
  @IsOptional()
  @IsBoolean()
  includesBreakfast?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bữa tối',
  })
  @IsOptional()
  @IsBoolean()
  includesDinner?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Bao gồm bãi đỗ xe',
  })
  @IsOptional()
  @IsBoolean()
  includesParking?: boolean;

  @ApiPropertyOptional({
    example: 'Wifi miễn phí',
    description: 'Các dịch vụ khác bao gồm',
  })
  @IsOptional()
  @IsString()
  otherInclusions?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số khách tiêu chuẩn tối thiểu',
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
  })
  @IsOptional()
  @IsBoolean()
  modificationAllowed?: boolean;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Phí thay đổi (tính theo cent)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  modificationFee?: number;

  @ApiPropertyOptional({
    example: 'BAR',
    description: 'Loại rate plan',
  })
  @IsOptional()
  @IsString()
  rateType?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Kích hoạt rate plan',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'cl...',
    description: 'ID của khách sạn nếu muốn giới hạn cho khách sạn đó',
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}
