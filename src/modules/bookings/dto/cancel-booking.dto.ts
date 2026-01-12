import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({ description: 'Reason for cancellation', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
