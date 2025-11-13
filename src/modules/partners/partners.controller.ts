import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PartnersService } from './partners.service';
import { UpsertPartnerDto } from './dto/upsert-partner.dto';
import { CreateKycDocDto } from './dto/create-kyc-doc.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { KycStatus, Role } from '@prisma/client';

type AuthReq = Request & { user?: any };

@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  // ========= PARTNER – SELF =========

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER) // tuỳ: cho CUSTOMER mở hồ sơ partner
  @Post('partners/me')
  async upsertMyPartner(@Req() req: AuthReq, @Body() dto: UpsertPartnerDto) {
    const userId = req.user.sub as string;
    return this.partners.getOrCreateMyPartner(userId, dto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Get('partners/me')
  async getMyPartner(@Req() req: AuthReq) {
    const userId = req.user.sub as string;
    return this.partners.getMyPartner(userId);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Post('partners/me/kyc/docs')
  async addMyKycDoc(@Req() req: AuthReq, @Body() dto: CreateKycDocDto) {
    const userId = req.user.sub as string;
    return this.partners.addKycDocForMe(userId, dto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Get('partners/me/kyc/docs')
  async listMyKycDocs(@Req() req: AuthReq) {
    const userId = req.user.sub as string;
    return this.partners.listMyKycDocs(userId);
  }

  // ========= ADMIN – REVIEW =========

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/partners')
  async listPartnersAdmin(@Query('status') status?: KycStatus) {
    return this.partners.listPartnersForAdmin(status);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/partners/:id/approve')
  async approve(@Req() req: AuthReq, @Param('id') partnerId: string) {
    const adminId = req.user.sub as string;
    return this.partners.approvePartner(adminId, partnerId);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/partners/:id/reject')
  async reject(@Req() req: AuthReq, @Param('id') partnerId: string) {
    const adminId = req.user.sub as string;
    return this.partners.rejectPartner(adminId, partnerId);
  }
}
