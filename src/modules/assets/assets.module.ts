// src/modules/assets/assets.module.ts
import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, CloudinaryService],
  exports: [AssetsService, CloudinaryService],
})
export class AssetsModule {}
