import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Hotel ID to start conversation with',
    example: 'hotel_123',
  })
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}
