import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadBase64ImagesDto {
  @ApiProperty({
    description: 'Array of base64 encoded images',
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Folder to store images in Cloudinary',
    example: 'hotels',
    required: false,
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
