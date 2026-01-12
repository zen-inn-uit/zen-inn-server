import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthUser {
  sub: string;
  role: Role;
  sid: string;
}

interface AuthRequest extends Request {
  user: AuthUser;
}

@ApiTags('Hotels')
@Controller('partners/hotels')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
@ApiBearerAuth()
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hotel' })
  create(@Req() req: AuthRequest, @Body() dto: CreateHotelDto) {
    const userId = req.user.sub;
    return this.hotelsService.createForUser(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all hotels for current partner' })
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.hotelsService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hotel details by ID' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.hotelsService.findOneForUser(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hotel information' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
  ) {
    const userId = req.user.sub;
    return this.hotelsService.updateForUser(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hotel (soft delete)' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.hotelsService.removeForUser(userId, id);
  }
}
