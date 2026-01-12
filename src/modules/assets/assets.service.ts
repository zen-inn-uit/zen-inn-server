// src/modules/assets/assets.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { CreatePresignDto } from './dto/create-presign.dto';
import type { AssetScope } from './asset-scope.type';

@Injectable()
export class AssetsService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly ttlSeconds: number;

  constructor() {
    this.bucket = process.env.S3_BUCKET_PUBLIC || 'hotel-assets';
    this.ttlSeconds = Number(process.env.ASSET_PRESIGN_TTL || 900);

    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'ap-southeast-1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  async createPresignedUpload(userId: string, dto: CreatePresignDto) {
    const key = this.buildKey(userId, dto.scope, dto.fileName);

    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
      // (optional) ACL: 'public-read' nếu dùng S3 public
    });

    const uploadUrl = await getSignedUrl(this.s3, putCmd, {
      expiresIn: this.ttlSeconds,
    });

    const baseUrl = this.buildPublicBaseUrl();
    const publicUrl = `${baseUrl}/${this.bucket}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  private slugFileName(name: string) {
    return name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-]/g, '')
      .toLowerCase();
  }

  private buildKey(userId: string, scope: AssetScope, fileName: string) {
    const slug = this.slugFileName(fileName);
    const uuid = randomUUID();
    const date = new Date();
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');

    // => kyc/{userId}/2025-03/uuid-file.jpg
    return `${scope}/${userId}/${y}-${m}/${uuid}-${slug}`;
  }

  private buildPublicBaseUrl() {
    // Nếu bạn dùng reverse proxy: có thể hardcode base public URL ở đây
    // VD: https://cdn.zeninn.local
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    return endpoint.replace(/\/$/, '');
  }
}
