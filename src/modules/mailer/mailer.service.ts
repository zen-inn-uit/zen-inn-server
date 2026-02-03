// src/modules/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // false cho 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // dùng App Password của Gmail
    },
    tls:
      process.env.SMTP_TLS_INSECURE === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  private from() {
    return process.env.MAIL_FROM || process.env.SMTP_USER;
  }

  async sendVerifyEmail(to: string, code: string) {
    const html = `<p>Mã xác minh email của bạn là: <b>${code}</b></p>`;
    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: 'Verify your email',
      html,
    });
  }

  async sendLoginOtp(to: string, code: string) {
    const html = `<p>Mã đăng nhập của bạn: <b>${code}</b></p>`;
    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: 'Login OTP',
      html,
    });
  }

  async sendResetOtp(to: string, code: string) {
    const html = `<p>Mã đặt lại mật khẩu: <b>${code}</b></p>`;
    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: 'Reset password OTP',
      html,
    });
  }

  async sendBookingConfirmation(
    to: string,
    bookingDetails: {
      bookingId: string;
      guestName: string;
      hotelName: string;
      roomName: string;
      checkIn: Date;
      checkOut: Date;
      nightCount: number;
      guestCount: number;
      totalPrice: number;
    },
  ) {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt phòng</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border: 3px solid #60463d; border-radius: 20px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #60463d 0%, #8b7355 100%); padding: 50px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 50px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                Đặt phòng thành công!
              </h1>
              <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                Mã đặt phòng: <strong>#${bookingDetails.bookingId.substring(0, 12).toUpperCase()}</strong>
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <p style="margin: 0; font-size: 18px; color: #60463d; line-height: 1.6;">
                Xin chào <strong style="color: #60463d; font-size: 20px;">${bookingDetails.guestName}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #60463d; line-height: 1.8; opacity: 0.9;">
                Chúc mừng! Đặt phòng của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết về đặt phòng của bạn.
              </p>
            </td>
          </tr>

          <!-- Hotel Info -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: rgba(96, 70, 61, 0.05); border: 3px solid #60463d; border-radius: 15px; overflow: hidden;">
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="margin: 0 0 25px 0; color: #60463d; font-size: 24px; font-weight: 700;">
                      🏨 ${bookingDetails.hotelName}
                    </h2>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #60463d;">
                      <p style="margin: 0; color: #60463d; font-size: 16px; font-weight: 600;">
                        <strong>Loại phòng:</strong> ${bookingDetails.roomName}
                      </p>
                    </div>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; border: 2px solid #60463d;">
                      <p style="margin: 0 0 10px 0; color: #60463d; font-size: 16px; font-weight: 600;">
                        <strong>Số khách:</strong> ${bookingDetails.guestCount} người
                      </p>
                      <p style="margin: 0; color: #60463d; font-size: 16px; font-weight: 600;">
                        <strong>Số đêm:</strong> ${bookingDetails.nightCount} đêm
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Check-in/out Dates -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding-right: 10px;">
                    <div style="background-color: rgba(96, 70, 61, 0.05); border: 3px solid #60463d; padding: 25px; border-radius: 15px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #60463d; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        Nhận phòng
                      </p>
                      <p style="margin: 0 0 8px 0; color: #60463d; font-size: 40px; font-weight: 700;">
                        ${new Date(bookingDetails.checkIn).getDate()}
                      </p>
                      <p style="margin: 0 0 8px 0; color: #60463d; font-size: 14px; font-weight: 600;">
                        ${formatDate(bookingDetails.checkIn)}
                      </p>
                      <p style="margin: 0; color: #8b7355; font-size: 13px; font-weight: 600;">
                        Từ 14:00
                      </p>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 10px;">
                    <div style="background-color: rgba(96, 70, 61, 0.05); border: 3px solid #60463d; padding: 25px; border-radius: 15px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #60463d; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        Trả phòng
                      </p>
                      <p style="margin: 0 0 8px 0; color: #60463d; font-size: 40px; font-weight: 700;">
                        ${new Date(bookingDetails.checkOut).getDate()}
                      </p>
                      <p style="margin: 0 0 8px 0; color: #60463d; font-size: 14px; font-weight: 600;">
                        ${formatDate(bookingDetails.checkOut)}
                      </p>
                      <p style="margin: 0; color: #8b7355; font-size: 13px; font-weight: 600;">
                        Trước 12:00
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total Price -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #60463d 0%, #8b7355 100%); padding: 30px; border-radius: 15px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600;">
                  Tổng chi phí
                </p>
                <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700;">
                  ${formatPrice(bookingDetails.totalPrice)}
                </p>
                <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 600;">
                  💳 Thanh toán tại khách sạn
                </p>
        </div>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: rgba(96, 70, 61, 0.05); border: 3px solid #60463d; padding: 25px; border-radius: 15px;">
                <h3 style="margin: 0 0 20px 0; color: #60463d; font-size: 20px; font-weight: 700;">
                  📌 Lưu ý quan trọng
                </h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #60463d; font-size: 15px; line-height: 2;">
                  <li style="margin-bottom: 10px; font-weight: 600;">Mang theo CMND/CCCD khi nhận phòng</li>
                  <li style="margin-bottom: 10px; font-weight: 600;">Đến khách sạn trước 14:00 ngày nhận phòng</li>
                  <li style="margin-bottom: 10px; font-weight: 600;">Thanh toán tại quầy lễ tân khách sạn</li>
                  <li style="font-weight: 600;">Vui lòng lưu lại email này để xác nhận booking</li>
                </ul>
      </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: rgba(96, 70, 61, 0.03); text-align: center; border-top: 3px solid #60463d;">
              <p style="margin: 0 0 10px 0; color: #60463d; font-size: 16px; font-weight: 600;">
                Cảm ơn bạn đã đặt phòng với <strong style="color: #60463d;">Zen Inn</strong>! 🏨
              </p>
              <p style="margin: 0; color: #8b7355; font-size: 13px;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: `🎉 Xác nhận đặt phòng #${bookingDetails.bookingId.substring(0, 8).toUpperCase()} - ${bookingDetails.hotelName}`,
      html,
    });
  }

  async sendBookingCancellation(
    to: string,
    bookingDetails: {
      bookingId: string;
      guestName: string;
      hotelName: string;
      roomName: string;
      checkIn: Date;
      checkOut: Date;
      refundAmount?: number;
    },
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Hủy đặt phòng</h2>
        <p>Xin chào <strong>${bookingDetails.guestName}</strong>,</p>
        <p>Đặt phòng của bạn đã được hủy thành công.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Thông tin đặt phòng đã hủy</h3>
          <p><strong>Mã đặt phòng:</strong> ${bookingDetails.bookingId}</p>
          <p><strong>Khách sạn:</strong> ${bookingDetails.hotelName}</p>
          <p><strong>Phòng:</strong> ${bookingDetails.roomName}</p>
          <p><strong>Ngày nhận phòng:</strong> ${bookingDetails.checkIn.toLocaleDateString('vi-VN')}</p>
          <p><strong>Ngày trả phòng:</strong> ${bookingDetails.checkOut.toLocaleDateString('vi-VN')}</p>
          ${bookingDetails.refundAmount ? `<p><strong>Số tiền hoàn lại:</strong> ${(bookingDetails.refundAmount / 100).toLocaleString('vi-VN')} VNĐ</p>` : ''}
        </div>
        
        ${bookingDetails.refundAmount ? '<p>Số tiền sẽ được hoàn lại vào tài khoản của bạn trong vòng 5-7 ngày làm việc.</p>' : ''}
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    `;

    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: `Hủy đặt phòng #${bookingDetails.bookingId}`,
      html,
    });
  }

  async sendBookingModification(
    to: string,
    bookingDetails: {
      bookingId: string;
      guestName: string;
      hotelName: string;
      roomName: string;
      checkIn: Date;
      checkOut: Date;
      nightCount: number;
      guestCount: number;
      totalPrice: number;
    },
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Thay đổi đặt phòng</h2>
        <p>Xin chào <strong>${bookingDetails.guestName}</strong>,</p>
        <p>Đặt phòng của bạn đã được cập nhật thành công!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Chi tiết đặt phòng mới</h3>
          <p><strong>Mã đặt phòng:</strong> ${bookingDetails.bookingId}</p>
          <p><strong>Khách sạn:</strong> ${bookingDetails.hotelName}</p>
          <p><strong>Phòng:</strong> ${bookingDetails.roomName}</p>
          <p><strong>Ngày nhận phòng:</strong> ${bookingDetails.checkIn.toLocaleDateString('vi-VN')}</p>
          <p><strong>Ngày trả phòng:</strong> ${bookingDetails.checkOut.toLocaleDateString('vi-VN')}</p>
          <p><strong>Số đêm:</strong> ${bookingDetails.nightCount}</p>
          <p><strong>Số khách:</strong> ${bookingDetails.guestCount}</p>
          <p><strong>Tổng tiền:</strong> ${(bookingDetails.totalPrice / 100).toLocaleString('vi-VN')} VNĐ</p>
        </div>
        
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    `;

    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: `Cập nhật đặt phòng #${bookingDetails.bookingId}`,
      html,
    });
  }

  async sendPaymentReceipt(
    to: string,
    paymentDetails: {
      bookingId: string;
      guestName: string;
      transactionId: string;
      amount: number;
      paymentMethod: string;
      paidAt: Date;
    },
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Biên lai thanh toán</h2>
        <p>Xin chào <strong>${paymentDetails.guestName}</strong>,</p>
        <p>Thanh toán của bạn đã được xử lý thành công!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Chi tiết thanh toán</h3>
          <p><strong>Mã đặt phòng:</strong> ${paymentDetails.bookingId}</p>
          <p><strong>Mã giao dịch:</strong> ${paymentDetails.transactionId}</p>
          <p><strong>Số tiền:</strong> ${(paymentDetails.amount / 100).toLocaleString('vi-VN')} VNĐ</p>
          <p><strong>Phương thức:</strong> ${paymentDetails.paymentMethod}</p>
          <p><strong>Thời gian:</strong> ${paymentDetails.paidAt.toLocaleString('vi-VN')}</p>
        </div>
        
        <p>Cảm ơn bạn đã thanh toán!</p>
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    `;

    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: `Biên lai thanh toán #${paymentDetails.transactionId}`,
      html,
    });
  }
}
