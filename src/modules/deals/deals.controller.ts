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
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from './dto';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/index';
import { Role } from '@prisma/client';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('partners/hotels/:hotelId/rooms/:roomId/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({
    summary: 'Tạo deal',
    description:
      'Tạo các gói giá cơ bản như Early Bird, Late Escape, Flash Sale, Seasonal',
  })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiCreatedResponse()
  create(@Param('roomId') roomId: string, @Body() dto: CreateDealDto) {
    return this.dealsService.createForRoom(roomId, dto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Danh sách deals của phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiOkResponse()
  findAll(@Param('roomId') roomId: string) {
    return this.dealsService.findAllForRoom(roomId);
  }

  @Get(':dealId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Chi tiết deal' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiOkResponse()
  findOne(@Param('dealId') dealId: string) {
    return this.dealsService.findOne(dealId);
  }

  @Patch(':dealId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Cập nhật deal' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiOkResponse()
  update(@Param('dealId') dealId: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(dealId, dto);
  }

  @Delete(':dealId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Xóa deal' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiOkResponse()
  remove(@Param('dealId') dealId: string) {
    return this.dealsService.remove(dealId);
  }
}
