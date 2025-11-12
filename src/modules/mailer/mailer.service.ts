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
    tls: process.env.SMTP_TLS_INSECURE === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  private from() {
    return process.env.MAIL_FROM || process.env.SMTP_USER;
  }

  async sendVerifyEmail(to: string, code: string) {
    const html = `<p>Mã xác minh email của bạn là: <b>${code}</b></p>`;
    await this.transporter.sendMail({ to, from: this.from(), subject: 'Verify your email', html });
  }

  async sendLoginOtp(to: string, code: string) {
    const html = `<p>Mã đăng nhập của bạn: <b>${code}</b></p>`;
    await this.transporter.sendMail({ to, from: this.from(), subject: 'Login OTP', html });
  }

  async sendResetOtp(to: string, code: string) {
    const html = `<p>Mã đặt lại mật khẩu: <b>${code}</b></p>`;
    await this.transporter.sendMail({ to, from: this.from(), subject: 'Reset password OTP', html });
  }
}
