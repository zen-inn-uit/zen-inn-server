// src/modules/assets/assets.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CloudinaryService } from './cloudinary.service';
import { CreatePresignDto } from './dto/create-presign.dto';
import { UploadBase64ImageDto } from './dto/upload-base64-image.dto';
import { UploadBase64ImagesDto } from './dto/upload-base64-images.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import type { Request } from 'express';

type AuthReq = Request & { user?: any };

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @UseGuards(JwtAccessGuard)
  @Post('presign')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for S3/MinIO upload' })
  async presign(@Req() req: AuthReq, @Body() dto: CreatePresignDto) {
    const payload: any = req.user;
    const userId: string = payload.sub;
    return this.assets.createPresignedUpload(userId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Post('upload-image')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a single base64 image to Cloudinary' })
  async uploadBase64Image(@Body() dto: UploadBase64ImageDto) {
    const url = await this.cloudinary.uploadBase64Image(
      dto.image,
      dto.folder || 'hotels',
    );
    return { url };
  }

  @UseGuards(JwtAccessGuard)
  @Post('upload-images')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple base64 images to Cloudinary' })
  async uploadBase64Images(@Body() dto: UploadBase64ImagesDto) {
    const urls = await this.cloudinary.uploadMultipleBase64Images(
      dto.images,
      dto.folder || 'hotels',
    );
    return { urls };
  }
}
