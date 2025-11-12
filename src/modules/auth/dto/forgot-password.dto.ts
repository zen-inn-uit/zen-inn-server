import { IsEmail, IsString, Length, Matches } from 'class-validator';


export class ForgotPasswordRequestDto {
    @IsEmail()
    email: string;
}


export class ForgotPasswordVerifyDto {
    @IsEmail()
    email: string;


    @IsString()
    @Length(6, 6)
    code: string;
}


export class ForgotPasswordResetDto {
    @IsEmail()
    email: string;


    @IsString()
    @Length(8, 72)
    @Matches(/^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s])|(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])).+$/)
    newPassword: string;
}