import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      'Password with at least 8 chars and 3 of: uppercase, lowercase, number, special',
  })
  @IsString()
  @Length(8, 72)
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s])|(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])).+$/,
    {
      message:
        'Password must include at least 3 of: lower, upper, number, special.',
    },
  )
  password: string;
}
