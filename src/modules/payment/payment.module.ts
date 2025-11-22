import { Module } from '@nestjs/common';
import { SepayService } from './payment.service';

@Module({
  providers: [SepayService],
  exports: [SepayService],
})
export class PaymentModule {}
