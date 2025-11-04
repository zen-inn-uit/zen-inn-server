import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async sendOtp(email: string, code: string, purpose = 'Your OTP') {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@example.com',
      to: email,
      subject: `[ZenInn] ${purpose}`,
      html: `<p>Your OTP is <b>${code}</b> (expires in 10 minutes).</p>`,
    });
  }
}
