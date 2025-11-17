import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BookingStylesService } from './booking-styles.service';
import { CreateBookingStyleDto, UpdateBookingStyleDto } from './dto';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/index';
import { Role } from '@prisma/client';

@ApiTags('Booking Styles')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('api/partners/hotels/:hotelId/rooms/:roomId/booking-styles')
export class BookingStylesController {
  constructor(private readonly bookingStylesService: BookingStylesService) {}

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Tạo booking style mới' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiCreatedResponse()
  create(@Param('roomId') roomId: string, @Body() dto: CreateBookingStyleDto) {
    return this.bookingStylesService.createForRoom(roomId, dto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Danh sách booking styles của phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiOkResponse()
  findAll(@Param('roomId') roomId: string) {
    return this.bookingStylesService.findAllForRoom(roomId);
  }

  @Get(':styleId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Chi tiết booking style' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'styleId', description: 'Style ID' })
  @ApiOkResponse()
  findOne(@Param('styleId') styleId: string) {
    return this.bookingStylesService.findOne(styleId);
  }

  @Patch(':styleId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Cập nhật booking style' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'styleId', description: 'Style ID' })
  @ApiOkResponse()
  update(
    @Param('styleId') styleId: string,
    @Body() dto: UpdateBookingStyleDto,
  ) {
    return this.bookingStylesService.update(styleId, dto);
  }

  @Delete(':styleId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Xóa booking style' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'styleId', description: 'Style ID' })
  @ApiOkResponse()
  remove(@Param('styleId') styleId: string) {
    return this.bookingStylesService.remove(styleId);
  }
}
