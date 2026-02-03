import { ApiProperty } from '@nestjs/swagger';

export class CalendarBookingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  guestName: string;

  @ApiProperty()
  guestEmail: string;

  @ApiProperty()
  roomName: string;

  @ApiProperty()
  hotelName: string;

  @ApiProperty()
  checkIn: Date;

  @ApiProperty()
  checkOut: Date;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  isCheckIn: boolean;

  @ApiProperty()
  isCheckOut: boolean;

  @ApiProperty()
  isOngoing: boolean;
}

export class CalendarDayDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  checkIns: number;

  @ApiProperty()
  checkOuts: number;

  @ApiProperty()
  ongoingStays: number;

  @ApiProperty({ type: [CalendarBookingDto] })
  bookings: CalendarBookingDto[];
}

export class BookingCalendarResponseDto {
  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty({ type: [CalendarDayDto] })
  calendar: CalendarDayDto[];
}
