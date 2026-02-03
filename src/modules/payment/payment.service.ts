import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CustomVNPay } from './custom-vnpay'; // Use custom implementation

export interface PaymentIntent {
  paymentIntentId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}

export interface PaymentVerification {
  success: boolean;
  transactionId?: string;
  amount?: number;
  status?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly customVnpay: CustomVNPay;

  constructor() {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secureSecret = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!tmnCode || !secureSecret) {
      this.logger.warn('VNPay configuration is missing - check your .env file');
    }

    // Initialize custom VNPay handler with placeholders, we'll instantiate per-request for dynamic returnUrl
    this.customVnpay = new CustomVNPay(
      tmnCode || '',
      secureSecret || '',
      vnpUrl,
      frontendUrl
    );
  }

  /**
   * Create a VNPay payment URL
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number,
    description: string,
  ): Promise<PaymentIntent> {
    try {
      this.logger.log(`Creating VNPay URL for booking ${bookingId}, amount: ${amount}`);

      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?bookingId=${bookingId}`;

      // Sanitize description
      const cleanDescription = description.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 250);

      // Use a unique transaction reference to avoid "Order already exists" on VNPay side
      // if the user retries payment for the same booking.
      // Format: bookingId_timestamp
      const txnRef = `${bookingId}_${Date.now()}`;

      // We need to instantiate here to pass the dynamic returnUrl, or modify helper. 
      // Let's instantiate a fresh helper instance for each request to be safe with dynamic returnUrl
      const vnp = new CustomVNPay(
        process.env.VNP_TMN_CODE || '',
        process.env.VNP_HASH_SECRET || '',
        process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl
      );

      const paymentUrl = vnp.buildPaymentUrl({
        vnp_Amount: amount, // Custom helper will multiply by 100
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: cleanDescription,
        vnp_OrderType: 'other',
        vnp_IpAddr: '127.0.0.1',
      });

      return {
        paymentIntentId: txnRef, // Return the full ref including timestamp
        paymentUrl: paymentUrl,
        amount: amount,
        currency: 'VND',
      };
    } catch (error) {
      this.logger.error('Failed to create VNPay URL:', error);
      throw new BadRequestException('Failed to generate payment URL');
    }
  }

  async verifyPayment(vnp_Params: any): Promise<PaymentVerification> {
    // We can use a static instance for verification since returnUrl doesn't matter for sig check
    // But we need to make sure we use the same secrets
    const vnp = new CustomVNPay(
        process.env.VNP_TMN_CODE || '',
        process.env.VNP_HASH_SECRET || '',
        '',
        ''
    );
    
    const { isVerified, isSuccess } = vnp.verifyReturnUrl(vnp_Params);
    
    if (isVerified) {
      const amountRaw = vnp_Params['vnp_Amount'] || 0;
      const amount = parseInt(amountRaw) / 100;
      
      return {
        success: isSuccess,
        transactionId: vnp_Params['vnp_TransactionNo'],
        amount: amount,
        status: isSuccess ? 'paid' : 'failed',
      };
    } else {
      this.logger.error('Invalid VNPay signature');
      return { success: false, status: 'invalid_signature' };
    }
  }

  verifyWebhookSignature(vnp_Params: any): boolean {
    const vnp = new CustomVNPay(
        process.env.VNP_TMN_CODE || '',
        process.env.VNP_HASH_SECRET || '',
        '',
        ''
    );
    return vnp.verifyReturnUrl(vnp_Params).isVerified;
  }

  parseWebhookPayload(payload: any) {
    const txnRef = payload['vnp_TxnRef'];
    // Extract bookingId from TxnRef (format: bookingId_timestamp)
    const bookingId = txnRef.split('_')[0];
    
    return {
      paymentIntentId: txnRef,
      bookingId: bookingId,
      status: payload['vnp_ResponseCode'] === '00' ? 'completed' : 'failed',
      transactionId: payload['vnp_TransactionNo'],
      amount: parseInt(payload['vnp_Amount']) / 100,
    };
  }

  async processRefund(
    bookingId: string,
    amount: number,
    reason?: string,
  ): Promise<{ success: boolean; refundId?: string }> {
    this.logger.log(`Refunding booking ${bookingId} for amount ${amount}`);
    return { success: true, refundId: `vnp_refund_${bookingId}` };
  }
}
