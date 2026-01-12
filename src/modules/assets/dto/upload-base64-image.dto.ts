import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadBase64ImageDto {
  @ApiProperty({
    description: 'Base64 encoded image',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  image: string;

  @ApiProperty({
    description: 'Folder to store image in Cloudinary',
    example: 'hotels',
    required: false,
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
