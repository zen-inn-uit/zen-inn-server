import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma.service';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  controllers: [AuthController, OauthController], 
  providers: [AuthService, OauthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
