import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssetsModule } from './modules/assets/assets.module';
import { PartnersModule } from './modules/partners/partners.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    MailerModule,
    AuthModule,
    AssetsModule,
    PartnersModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule { }
