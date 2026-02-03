import * as crypto from 'crypto';

interface PaymentParams {
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_Amount: number;
  vnp_IpAddr?: string;
}

interface VNPayParams {
  [key: string]: string | number;
}

export class CustomVNPay {
  constructor(
    private tmnCode: string,
    private secureSecret: string,
    private vnpUrl: string,
    private returnUrl: string,
  ) {}

  buildPaymentUrl(params: PaymentParams): string {
    const vnp_Params: VNPayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.vnp_TxnRef,
      vnp_OrderInfo: params.vnp_OrderInfo,
      vnp_OrderType: params.vnp_OrderType,
      vnp_Amount: params.vnp_Amount * 100, // VNPay requires amount * 100
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: params.vnp_IpAddr || '127.0.0.1',
      vnp_CreateDate: this.formatDate(new Date()),
    };

    // Sort parameters alphabetically by key
    const sortedParams = this.sortObject(vnp_Params);

    // Create sign data string for hashing
    // IMPORTANT: Values must NOT be URL encoded when creating signature
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    // Calculate HMAC-SHA512 hash
    const hmac = crypto.createHmac('sha512', this.secureSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VNPay Payment URL Generation ===');
    console.log('SignData:', signData);
    console.log('SecureHash:', signed);
    console.log('TmnCode:', this.tmnCode);

    // Build final URL with URL encoding
    const queryParams = Object.keys(sortedParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(
            String(sortedParams[key]),
          )}`,
      )
      .join('&');

    const finalUrl = `${this.vnpUrl}?${queryParams}&vnp_SecureHash=${signed}`;

    console.log('Final URL:', finalUrl);
    console.log('====================================\n');

    return finalUrl;
  }

  verifyReturnUrl(vnp_Params: Record<string, string>): {
    isVerified: boolean;
    isSuccess: boolean;
  } {
    const secureHash = vnp_Params['vnp_SecureHash'];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    // Remove secure hash fields before verification
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params alphabetically
    const sortedParams = this.sortObject(vnp_Params);

    // Build sign data (values should be decoded already by framework)
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    // Calculate hash
    const hmac = crypto.createHmac('sha512', this.secureSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VNPay Return URL Verification ===');
    console.log('SignData:', signData);
    console.log('Expected Hash:', secureHash);
    console.log('Calculated Hash:', signed);
    console.log('Match:', secureHash === signed);
    console.log('Response Code:', responseCode);
    console.log('====================================\n');

    return {
      isVerified: secureHash === signed,
      isSuccess: responseCode === '00',
    };
  }

  private sortObject(
    obj: Record<string, string | number>,
  ): Record<string, string | number> {
    const sorted: Record<string, string | number> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const value = obj[key];
      if (value !== '' && value !== undefined && value !== null) {
        sorted[key] = value;
      }
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    // Ensure we use VN time (GMT+7) regardless of server timezone
    const vnTime = new Date(
      date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const yyyy = vnTime.getFullYear();
    const mm = String(vnTime.getMonth() + 1).padStart(2, '0');
    const dd = String(vnTime.getDate()).padStart(2, '0');
    const HH = String(vnTime.getHours()).padStart(2, '0');
    const MM = String(vnTime.getMinutes()).padStart(2, '0');
    const ss = String(vnTime.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${HH}${MM}${ss}`;
  }
}
