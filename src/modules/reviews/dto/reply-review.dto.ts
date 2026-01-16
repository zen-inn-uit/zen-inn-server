import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyReviewDto {
  @ApiProperty({ description: 'Partner reply to the review', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reply: string;
}
