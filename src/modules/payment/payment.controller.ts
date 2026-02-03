import { Controller, Get, Query, Logger, Inject, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Verified IPN (Instant Payment Notification) from VNPay
   * ensuring server-to-server updates even if user closes browser
   */
  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query: any) {
    this.logger.log(`Received VNPay IPN: ${JSON.stringify(query)}`);

    try {
      // 1. Verify signature
      const verification = await this.paymentService.verifyPayment(query);
      if (!verification.success) {
        return { RspCode: '97', Message: 'Invalid Signature' };
      }

      // 2. Check transaction status from VNPay response
      if (verification.status === 'paid') {
        // Use helper to extract clean bookingId from vnp_TxnRef (which may contain timestamp)
        const payload = this.paymentService.parseWebhookPayload(query);
        const bookingId = payload.bookingId;
        const transactionId = payload.transactionId;

        this.logger.log(`IPN processing for bookingId: ${bookingId}, txnRef: ${payload.paymentIntentId}`);

        // 3. Update booking status
        // We call confirmBooking which handles everything (email, status update)
        // Note: verifyPayment check inside confirmBooking was removed/bypassed logic
        await this.bookingsService.confirmBooking(bookingId, transactionId);

        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Payment failed or cancelled
        return { RspCode: '00', Message: 'Confirm Success' }; // We still acknowledge receipt
      }
    } catch (error) {
      this.logger.error('IPN processing error:', error);
      return { RspCode: '99', Message: 'Unknown Error' };
    }
  }

  /**
   * Return URL for user redirection (optional if frontend handles it, but good to have)
   */
  @Get('vnpay_return')
  async vnpayReturn(@Query() query: any) {
     const verification = await this.paymentService.verifyPayment(query);
     // Usually we redirect to frontend here with status
     // But frontend URL is already set in vnp_ReturnUrl
     // This endpoint might be used if vnp_ReturnUrl points here
     return verification;
  }
}
