// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma.service';
import { MailerService } from '../../modules/mailer/mailer.service';
import { OtpPurpose, Provider, Role } from '@prisma/client';

const now = () => new Date();
const inMinutes = (m: number) => new Date(Date.now() + m * 60 * 1000);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}
  private signAccess(sub: string, role: Role, sid: string) {
    return jwt.sign({ sub, role, sid }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
      issuer: 'zen-inn',
    } as any);
  }

  private signRefresh(sub: string, sid: string) {
    return jwt.sign({ sub, sid }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
      issuer: 'zen-inn',
    } as any);
  }

  private async createSession(userId: string) {
    const session = await this.prisma.authSession.create({
      data: {
        userId,
        refreshHash: '', // thêm dòng này để hợp schema
        createdAt: now(),
      },
    });

    const refreshToken = this.signRefresh(userId, session.id);
    const refreshHash = await argon2.hash(refreshToken);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { refreshHash },
    });

    return { sessionId: session.id, refreshToken };
  }

  private async issueTokens(userId: string, role: Role) {
    const { sessionId, refreshToken } = await this.createSession(userId);
    const accessToken = this.signAccess(userId, role, sessionId);
    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  }

  // ===== Common finders
  private async mustGetUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Email not found');
    return user;
  }

  // =========================================================================
  // 1) SIGN-UP (email → send OTP → verify → set-password → tokens)
  // =========================================================================

  async register(email: string) {
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: Role.CUSTOMER,
        status: 'PENDING',
        provider: Provider.PASSWORD,
      },
    });

    const code = this.generateOtp();
    const codeHash = await argon2.hash(code);
    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: OtpPurpose.VERIFY_EMAIL,
        codeHash,
        expiresAt: inMinutes(5),
      },
    });

    await this.mailer.sendVerifyEmail(email, code);
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.mustGetUserByEmail(email);

    // lấy OTP VERIFY_EMAIL mới nhất còn hạn và chưa consume
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: OtpPurpose.VERIFY_EMAIL,
        consumedAt: null,
        expiresAt: { gt: now() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('OTP not found/expired');

    const ok = await argon2.verify(otp.codeHash, code);
    if (!ok) throw new BadRequestException('Invalid OTP');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now(), status: 'ACTIVE' },
      }),
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: now() },
      }),
    ]);

    return { verified: true };
  }

  async setPasswordAndIssueTokens(email: string, password: string) {
    const user = await this.mustGetUserByEmail(email);
    if (!user.emailVerifiedAt)
      throw new BadRequestException('Email not verified');

    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, provider: Provider.PASSWORD },
    });

    return this.issueTokens(user.id, user.role);
  }

  // =========================================================================
  // 2) SIGN-IN (email + password)
  // =========================================================================

  async login(email: string, password: string) {
    const user = await this.mustGetUserByEmail(email);
    if (!user.emailVerifiedAt || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.role);
  }

  // =========================================================================
  // 3) OTP SIGN-IN (optional)
  // =========================================================================

  async requestLoginOtp(email: string) {
    const user = await this.mustGetUserByEmail(email);
    if (!user.emailVerifiedAt)
      throw new BadRequestException('Email not verified');

    const code = this.generateOtp();
    const codeHash = await argon2.hash(code);
    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: OtpPurpose.LOGIN,
        codeHash,
        expiresAt: inMinutes(5),
      },
    });

    await this.mailer.sendLoginOtp(email, code);
    // console.log('[DEV] LOGIN OTP for', email, '=>', code);
  }

  async verifyLoginOtp(email: string, code: string) {
    const user = await this.mustGetUserByEmail(email);

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: OtpPurpose.LOGIN,
        consumedAt: null,
        expiresAt: { gt: now() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('OTP not found/expired');

    const ok = await argon2.verify(otp.codeHash, code);
    if (!ok) throw new BadRequestException('Invalid OTP');

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now() },
    });

    return this.issueTokens(user.id, user.role);
  }

  // =========================================================================
  // 4) REFRESH (rotate) / LOGOUT
  // =========================================================================

  async rotateTokens(userId: string, sessionId: string) {
    // Revoke phiên cũ, tạo phiên mới
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: now() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user.id, user.role);
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: now() },
    });
  }

  // =========================================================================
  // 5) FORGOT / RESET PASSWORD  (purpose = RESET)
  // =========================================================================

  async forgotPasswordRequest(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // trả generic để tránh lộ tài khoản
    if (!user || !user.emailVerifiedAt) return;

    const code = this.generateOtp();
    const codeHash = await argon2.hash(code);
    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: OtpPurpose.RESET,
        codeHash,
        expiresAt: inMinutes(5),
      },
    });
    await this.mailer.sendResetOtp(email, code);
    // console.log('[DEV] RESET OTP for', email, '=>', code);
  }

  async forgotPasswordVerify(email: string, code: string) {
    const user = await this.mustGetUserByEmail(email);
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: OtpPurpose.RESET,
        consumedAt: null,
        expiresAt: { gt: now() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('OTP not found/expired');
    const ok = await argon2.verify(otp.codeHash, code);
    if (!ok) throw new BadRequestException('Invalid OTP');

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now() },
    });
    return { ok: true };
  }

  async forgotPasswordReset(email: string, newPassword: string) {
    const user = await this.mustGetUserByEmail(email);
    const hash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash, provider: Provider.PASSWORD },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now() },
      }),
    ]);
  }

  // =========================================================================
  // 6) CHANGE PASSWORD (need access token)
  // =========================================================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new BadRequestException('Invalid user');

    const ok = await argon2.verify(user.passwordHash, currentPassword);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    const hash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hash, provider: Provider.PASSWORD },
      }),
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now() },
      }),
    ]);
  }

  // =========================================================================
  // 7) PROFILE
  // =========================================================================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partner: true }, // hoặc profile khác nếu bạn có
    });
    if (!user) throw new BadRequestException('Not found');

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      provider: user.provider,
      verified: !!user.emailVerifiedAt,
      partner: user.partner || null,
    };
  }

  // AuthService
  public async issueTokensForUser(userId: string, role: Role) {
    return this['issueTokens'](userId, role);
  }
}
