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
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthUser {
  sub: string; // userId
  role: Role;
  sid: string;
}

interface AuthRequest extends Request {
  user: AuthUser;
}

@Controller('partners/hotels')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateHotelDto) {
    const userId = req.user.sub;
    return this.hotelsService.createForUser(userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.hotelsService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.hotelsService.findOneForUser(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
  ) {
    const userId = req.user.sub;
    return this.hotelsService.updateForUser(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.hotelsService.removeForUser(userId, id);
  }
}
