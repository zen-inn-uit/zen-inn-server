import { IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKycDocDto {
  @ApiProperty({
    example: 'business_license',
    description: 'Document type/kind',
  })
  @IsString()
  @MaxLength(50)
  kind: string;

  @ApiProperty({
    example: 'https://s3.example.com/docs/license.pdf',
    description: 'URL to document',
  })
  @IsUrl()
  url: string;
}
