import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { OtpPurpose, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type { SignOptions, Secret } from 'jsonwebtoken';

const now = () => new Date();
const ttlMinutes = (m: number) => new Date(Date.now() + m * 60 * 1000);

// 👉 THÊM 2 biến secret tường minh (bắt buộc có trong .env)
const accessSecret: Secret = (process.env.JWT_ACCESS_SECRET ?? '') as string;
const refreshSecret: Secret = (process.env.JWT_REFRESH_SECRET ?? '') as string;
if (!accessSecret || !refreshSecret) {
  throw new Error('Missing JWT secrets. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private mailer: MailerService,
  ) { }

  private signAccess(sub: string, role: string, sid: string) {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_TTL || '15m') as jwt.SignOptions['expiresIn'],
      issuer: 'zen-inn',
    };
    return jwt.sign({ sub, role, sid }, accessSecret, options);
  }

  private signRefresh(sub: string, sid: string) {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_TTL || '30d') as jwt.SignOptions['expiresIn'],
      issuer: 'zen-inn',
    };
    return jwt.sign({ sub, sid }, refreshSecret, options);
  }
  private async createSession(userId: string, refresh: string, ua?: string, ip?: string) {
    const refreshHash = await argon2.hash(refresh);
    await this.prisma.authSession.create({ data: { userId, refreshHash, userAgent: ua, ip } });
  }
  private async verifyRefresh(userId: string, token: string) {
    try { jwt.verify(token, process.env.JWT_REFRESH_SECRET!); } catch { throw new UnauthorizedException(); }
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' }, take: 20,
    });
    for (const s of sessions) if (await argon2.verify(s.refreshHash, token)) return s;
    throw new UnauthorizedException('refresh_not_recognized');
  }
  private async issueTokens(userId: string, role: string, ua?: string, ip?: string) {
    const sid = crypto.randomUUID();
    const accessToken = this.signAccess(userId, role, sid);
    const refreshToken = this.signRefresh(userId, sid);
    await this.createSession(userId, refreshToken, ua, ip);
    return { accessToken, refreshToken };
  }

  private async createAndSendOtp(userId: string, email: string, purpose: OtpPurpose) {
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = await argon2.hash(code);
    await this.prisma.otpCode.create({ data: { userId, purpose, codeHash, expiresAt: ttlMinutes(10) } });
    await this.mailer.sendOtp(email, code, purpose);
  }
  private async consumeOtp(userId: string, purpose: OtpPurpose, code: string) {
    const rec = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!rec || rec.expiresAt < now()) throw new UnauthorizedException('otp_expired');
    const ok = await argon2.verify(rec.codeHash, code);
    if (!ok) throw new UnauthorizedException('otp_invalid');
    await this.prisma.otpCode.update({ where: { id: rec.id }, data: { consumedAt: now() } });
  }

  async register(email: string, password?: string) {
    const found = await this.users.findByEmail(email);
    if (found) throw new BadRequestException('email_exists');
    const passwordHash = password ? await argon2.hash(password) : null;
    const user = await this.users.createPasswordUser(email, passwordHash!);
    await this.createAndSendOtp(user.id, user.email, OtpPurpose.VERIFY_EMAIL);
    return { user: { id: user.id, email: user.email }, requiresEmailVerify: true };
  }

  async verifyEmail(email: string, code: string, ua?: string, ip?: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    await this.consumeOtp(user.id, OtpPurpose.VERIFY_EMAIL, code);
    await this.prisma.user.update({ where: { id: user.id }, data: { status: UserStatus.ACTIVE, emailVerifiedAt: now() } });
    return this.issueTokens(user.id, user.role, ua, ip);
  }

  async loginPassword(email: string, password: string, ua?: string, ip?: string) {
    const user = await this.users.findByEmail(email);
    if (!user?.passwordHash) throw new UnauthorizedException();
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.role, ua, ip);
  }

  async requestLoginOtp(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    await this.createAndSendOtp(user.id, email, OtpPurpose.LOGIN);
    return { ok: true };
  }

  async verifyLoginOtp(email: string, code: string, ua?: string, ip?: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    await this.consumeOtp(user.id, OtpPurpose.LOGIN, code);
    return this.issueTokens(user.id, user.role, ua, ip);
  }

  async refresh(userId: string, refreshToken: string) {
    await this.verifyRefresh(userId, refreshToken);
    const payload: any = jwt.decode(refreshToken) || {};
    const role = payload?.role ?? 'CUSTOMER';
    return this.issueTokens(userId, role);
  }

  async logout(userId: string, refreshToken: string) {
    const session = await this.verifyRefresh(userId, refreshToken);
    await this.prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: now() } });
    return { ok: true };
  }
}
