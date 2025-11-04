import { IsEmail, IsOptional, Length } from 'class-validator';
export class RegisterDto {
  @IsEmail() email: string;
  @IsOptional() @Length(8, 72) password?: string;
}
