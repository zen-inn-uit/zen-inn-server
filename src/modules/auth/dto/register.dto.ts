import { IsEmail, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Optional password',
    required: false,
  })
  @IsOptional()
  @Length(8, 72)
  password?: string;
}
