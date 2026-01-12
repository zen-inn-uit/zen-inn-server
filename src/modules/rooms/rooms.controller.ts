import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, RoomResponseDto } from './dto';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/index';
import { Role } from '@prisma/client';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('partners/hotels/:hotelId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Tạo phòng mới' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiCreatedResponse({ type: RoomResponseDto })
  create(
    @Request() req: Record<string, unknown>,
    @Param('hotelId') hotelId: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.createForUser(userId, hotelId, createRoomDto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Danh sách phòng của khách sạn' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiOkResponse({ type: [RoomResponseDto] })
  findAll(
    @Request() req: Record<string, unknown>,
    @Param('hotelId') hotelId: string,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findAllForUser(userId, hotelId);
  }

  @Get(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Chi tiết phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiOkResponse({ type: RoomResponseDto })
  findOne(
    @Request() req: Record<string, unknown>,
    @Param('hotelId') hotelId: string,
    @Param('id') id: string,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findOneForUser(userId, hotelId, id);
  }

  @Patch(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiOkResponse({ type: RoomResponseDto })
  update(
    @Request() req: Record<string, unknown>,
    @Param('hotelId') hotelId: string,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.updateForUser(userId, hotelId, id, updateRoomDto);
  }

  @Delete(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Xóa phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  remove(
    @Request() req: Record<string, unknown>,
    @Param('hotelId') hotelId: string,
    @Param('id') id: string,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.removeForUser(userId, hotelId, id);
  }
}
