// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    // Đăng ký Passport + strategy mặc định là 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Các module khác mà Auth phụ thuộc
    UsersModule,
    MailerModule,
  ],
  controllers: [
    AuthController,
    OauthController,
  ],
  providers: [
    AuthService,
    OauthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    PrismaService,
  ],
  // Cho phép module khác (vd: Guards, resolvers…) inject AuthService
  exports: [AuthService],
})
export class AuthModule {}
