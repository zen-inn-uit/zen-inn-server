import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssetsModule } from './modules/assets/assets.module';
import { PartnersModule } from './modules/partners/partners.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { DealsModule } from './modules/deals/deals.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RatePlansModule } from './modules/rate-plans/rate-plans.module';
import { RedisModule } from './modules/redis/redis.module';
import { PaymentModule } from './modules/payment/payment.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CancellationPoliciesModule } from './modules/cancellation-policies/cancellation-policies.module';
import { LoggingModule } from './modules/logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    RedisModule,
    UsersModule,
    MailerModule,
    AuthModule,
    AssetsModule,
    PartnersModule,
    HotelsModule,
    RoomsModule,
    DealsModule,
    InventoryModule,
    RatePlansModule,
    PaymentModule,
    BookingsModule,
    CancellationPoliciesModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
