// src/modules/assets/assets.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreatePresignDto } from './dto/create-presign.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import type { Request } from 'express';

type AuthReq = Request & { user?: any };

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @UseGuards(JwtAccessGuard)
  @Post('presign')
  async presign(@Req() req: AuthReq, @Body() dto: CreatePresignDto) {
    const payload: any = req.user;
    const userId: string = payload.sub;
    return this.assets.createPresignedUpload(userId, dto);
  }
}
