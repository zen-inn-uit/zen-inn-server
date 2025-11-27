import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

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
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiKey = process.env.SEPAY_API_KEY || '';
    this.apiUrl = process.env.SEPAY_API_URL || 'https://api.sepay.vn';
    this.webhookSecret = process.env.SEPAY_WEBHOOK_SECRET || '';

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    });

    if (!this.apiKey) {
      this.logger.warn('SEPAY_API_KEY is not configured');
    }
  }

  /**
   * Create a payment intent
   * @param bookingId Booking ID
   * @param amount Amount in cents
   * @param description Payment description
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number,
    description: string,
  ): Promise<PaymentIntent> {
    try {
      this.logger.log(
        `Creating payment intent for booking ${bookingId}, amount: ${amount}`,
      );

      // SEPAY API call structure (adjust based on actual SEPAY API documentation)
      const response = await this.client.post('/v1/payments', {
        amount: amount,
        currency: 'VND',
        description: description,
        reference: bookingId,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment-success`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment-cancel`,
      });

      const data = response.data;

      return {
        paymentIntentId: data.id || data.paymentIntentId,
        paymentUrl: data.paymentUrl || data.url,
        amount: amount,
        currency: 'VND',
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);

      // For development/testing purposes, return a mock payment intent
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Using mock payment intent for development');
        return {
          paymentIntentId: `mock_${bookingId}_${Date.now()}`,
          paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment/${bookingId}`,
          amount: amount,
          currency: 'VND',
        };
      }

      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Verify payment from webhook or callback
   * @param paymentIntentId Payment intent ID
   */
  async verifyPayment(paymentIntentId: string): Promise<PaymentVerification> {
    try {
      this.logger.log(`Verifying payment: ${paymentIntentId}`);

      const response = await this.client.get(`/v1/payments/${paymentIntentId}`);
      const data = response.data;

      return {
        success: data.status === 'completed' || data.status === 'success',
        transactionId: data.transactionId || data.id,
        amount: data.amount,
        status: data.status,
      };
    } catch (error) {
      this.logger.error('Failed to verify payment:', error);

      // For development/testing, auto-verify mock payments
      if (
        process.env.NODE_ENV === 'development' &&
        paymentIntentId.startsWith('mock_')
      ) {
        this.logger.warn('Auto-verifying mock payment for development');
        return {
          success: true,
          transactionId: paymentIntentId,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: 'failed',
      };
    }
  }

  /**
   * Process refund for a payment
   * @param transactionId Transaction ID
   * @param amount Amount to refund in cents
   * @param reason Refund reason
   */
  async processRefund(
    transactionId: string,
    amount: number,
    reason?: string,
  ): Promise<{ success: boolean; refundId?: string }> {
    try {
      this.logger.log(
        `Processing refund for transaction ${transactionId}, amount: ${amount}`,
      );

      const response = await this.client.post('/v1/refunds', {
        transactionId: transactionId,
        amount: amount,
        reason: reason || 'Booking cancellation',
      });

      const data = response.data;

      return {
        success: true,
        refundId: data.id || data.refundId,
      };
    } catch (error) {
      this.logger.error('Failed to process refund:', error);

      // For development/testing
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Mock refund processed for development');
        return {
          success: true,
          refundId: `refund_${transactionId}_${Date.now()}`,
        };
      }

      return {
        success: false,
      };
    }
  }

  /**
   * Verify webhook signature
   * @param payload Webhook payload
   * @param signature Signature from webhook header
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload
   * @param payload Raw webhook payload
   */
  parseWebhookPayload(payload: any): {
    paymentIntentId: string;
    status: string;
    transactionId?: string;
    amount?: number;
  } {
    return {
      paymentIntentId: payload.paymentIntentId || payload.id,
      status: payload.status,
      transactionId: payload.transactionId,
      amount: payload.amount,
    };
  }
}
