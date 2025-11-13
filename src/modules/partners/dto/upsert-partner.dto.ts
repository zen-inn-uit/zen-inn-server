import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertPartnerDto {
  @ApiProperty({
    example: 'ZenInn Hotels Ltd',
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;
}
