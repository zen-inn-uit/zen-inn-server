import { IsString, Length, Matches } from 'class-validator';


export class ChangePasswordDto {
    @IsString()
    currentPassword: string;


    @IsString()
    @Length(8, 72)
    @Matches(/^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s])|(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])).+$/)
    newPassword: string;
}