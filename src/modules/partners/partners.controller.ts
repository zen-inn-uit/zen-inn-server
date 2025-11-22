import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PartnersService } from './partners.service';
import { UpsertPartnerDto } from './dto/upsert-partner.dto';
import { CreateKycDocDto } from './dto/create-kyc-doc.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { KycStatus, Role } from '@prisma/client';

type AuthReq = Request & { user?: any };

@ApiTags('Partners')
@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  // ========= PARTNER – SELF =========

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Post('partners/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update partner profile' })
  async upsertMyPartner(@Req() req: AuthReq, @Body() dto: UpsertPartnerDto) {
    const userId = req.user.sub as string;
    return this.partners.getOrCreateMyPartner(userId, dto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Get('partners/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current partner profile' })
  async getMyPartner(@Req() req: AuthReq) {
    const userId = req.user.sub as string;
    return this.partners.getMyPartner(userId);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Post('partners/me/kyc/docs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload KYC document' })
  async addMyKycDoc(@Req() req: AuthReq, @Body() dto: CreateKycDocDto) {
    const userId = req.user.sub as string;
    return this.partners.addKycDocForMe(userId, dto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.CUSTOMER)
  @Get('partners/me/kyc/docs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List KYC documents' })
  async listMyKycDocs(@Req() req: AuthReq) {
    const userId = req.user.sub as string;
    return this.partners.listMyKycDocs(userId);
  }

  // ========= ADMIN – REVIEW =========

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/partners')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all partners (admin only)' })
  @ApiQuery({
    name: 'status',
    enum: KycStatus,
    required: false,
    description: 'Filter by KYC status',
  })
  async listPartnersAdmin(@Query('status') status?: KycStatus) {
    return this.partners.listPartnersForAdmin(status);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/partners/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve partner KYC (admin only)' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  async approve(@Req() req: AuthReq, @Param('id') partnerId: string) {
    const adminId = req.user.sub as string;
    return this.partners.approvePartner(adminId, partnerId);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/partners/:id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject partner KYC (admin only)' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  async reject(@Req() req: AuthReq, @Param('id') partnerId: string) {
    const adminId = req.user.sub as string;
    return this.partners.rejectPartner(adminId, partnerId);
  }
}
