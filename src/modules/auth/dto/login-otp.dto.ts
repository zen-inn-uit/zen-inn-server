import { IsEmail, Length } from 'class-validator';
export class LoginOtpRequestDto { @IsEmail() email: string; }
export class LoginOtpVerifyDto {
  @IsEmail() email: string;
  @Length(6, 6) code: string;
}
