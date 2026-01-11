import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/index';
import { Role } from '@prisma/client';
import { RoomResponseDto } from './dto';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('partners/rooms')
export class PartnerRoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Tất cả các phòng của partner' })
  @ApiOkResponse({ type: [RoomResponseDto] })
  findAll(@Request() req: Record<string, unknown>) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findAllForPartner(userId);
  }

  @Get(':id')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Chi tiết một phòng của partner' })
  @ApiOkResponse({ type: RoomResponseDto })
  async findOne(
    @Request() req: Record<string, unknown>,
    @Param('id') id: string,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findOneByIdForPartner(userId, id);
  }
}
