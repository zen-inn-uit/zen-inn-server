import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiProperty({
    example: 5,
    description: 'Số phòng còn lại có sẵn (I-01)',
  })
  @IsInt()
  @Min(0)
  availableCount: number;

  @ApiProperty({
    example: 10,
    description: 'Tổng số phòng loại này',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalCount?: number;
}
