import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ForgotPasswordVerifyDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ForgotPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsString()
  @Length(8, 72)
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s])|(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])).+$/,
  )
  newPassword: string;
}
