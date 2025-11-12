import { IsEmail, IsString, Length, Matches } from 'class-validator';


export class SetPasswordDto {
    @IsEmail()
    email: string;


    @IsString()
    @Length(8, 72)
    // At least 3 of 4: uppercase, lowercase, digit, special char (example regex)
    @Matches(/^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s])|(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])).+$/,
        { message: 'Password must include at least 3 of: lower, upper, number, special.' })
    password: string;
}