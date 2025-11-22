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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Xác nhận đặt phòng</h2>
        <p>Xin chào <strong>${bookingDetails.guestName}</strong>,</p>
        <p>Đặt phòng của bạn đã được xác nhận thành công!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Chi tiết đặt phòng</h3>
          <p><strong>Mã đặt phòng:</strong> ${bookingDetails.bookingId}</p>
          <p><strong>Khách sạn:</strong> ${bookingDetails.hotelName}</p>
          <p><strong>Phòng:</strong> ${bookingDetails.roomName}</p>
          <p><strong>Ngày nhận phòng:</strong> ${bookingDetails.checkIn.toLocaleDateString('vi-VN')}</p>
          <p><strong>Ngày trả phòng:</strong> ${bookingDetails.checkOut.toLocaleDateString('vi-VN')}</p>
          <p><strong>Số đêm:</strong> ${bookingDetails.nightCount}</p>
          <p><strong>Số khách:</strong> ${bookingDetails.guestCount}</p>
          <p><strong>Tổng tiền:</strong> ${(bookingDetails.totalPrice / 100).toLocaleString('vi-VN')} VNĐ</p>
        </div>
        
        <p>Cảm ơn bạn đã đặt phòng với chúng tôi!</p>
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    `;

    await this.transporter.sendMail({
      to,
      from: this.from(),
      subject: `Xác nhận đặt phòng #${bookingDetails.bookingId}`,
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
