// src/modules/partners/dto/upsert-partner.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertPartnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;
}
