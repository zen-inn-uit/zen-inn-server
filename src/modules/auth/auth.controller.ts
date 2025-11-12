import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  LoginOtpRequestDto,
  LoginOtpVerifyDto,
  SetPasswordDto,
  ForgotPasswordRequestDto,
  ForgotPasswordVerifyDto,
  ForgotPasswordResetDto,
  ChangePasswordDto,
} from './dto';
import { JwtAccessGuard } from './guards/jwt.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { Request } from 'express';

type AuthReq = Request & { user?: any };


@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }


  // ======= Sign-up (email → otp → verify → set-password → tokens)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.auth.register(dto.email);
    return { message: 'OTP sent' };
  }


  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.email, dto.code);
    // Option A: return { verified: true }
    // Option B: issue tokens immediately if you want (current design issues tokens in set-password)
  }


  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    // sets password only if user is verified
    return this.auth.setPasswordAndIssueTokens(dto.email, dto.password);
  }


  // ======= Sign-in (email + password)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }


  // ======= OTP Sign-in (optional)
  @Post('login/otp/request')
  async requestLoginOtp(@Body() dto: LoginOtpRequestDto) {
    await this.auth.requestLoginOtp(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('login/otp/verify')
  async verifyLoginOtp(@Body() dto: LoginOtpVerifyDto) {
    return this.auth.verifyLoginOtp(dto.email, dto.code);
  }


  // ======= Refresh / Logout (Bearer refresh token)
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: AuthReq) {
    const payload: any = req.user; // from JwtRefreshStrategy.validate
    return this.auth.rotateTokens(payload.sub, payload.sid);
  }


  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(@Req() req: AuthReq) {
    const payload: any = req.user;
    await this.auth.revokeSession(payload.sub, payload.sid);
    return { ok: true };
  }


  // ======= Forgot password (no login required)
  @Post('forgot-password/request')
  async forgotRequest(@Body() dto: ForgotPasswordRequestDto) {
    await this.auth.forgotPasswordRequest(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('forgot-password/verify')
  async forgotVerify(@Body() dto: ForgotPasswordVerifyDto) {
    await this.auth.forgotPasswordVerify(dto.email, dto.code);
    return { ok: true };
  }


  @Post('forgot-password/reset')
  async forgotReset(@Body() dto: ForgotPasswordResetDto) {
    await this.auth.forgotPasswordReset(dto.email, dto.newPassword);
    return { ok: true };
  }


  // ======= Change password (must be logged in via access token)
  @UseGuards(JwtAccessGuard)
  @Post('change-password')
  async changePassword(@Req() req: AuthReq, @Body() dto: ChangePasswordDto) {
    const payload: any = req.user;
    await this.auth.changePassword(payload.sub, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }

  // ======= Profile (Bearer access token)
  @UseGuards(JwtAccessGuard)
  @Get('profile')
  async profile(@Req() req: AuthReq) {
    const payload: any = req.user; // { sub, role, sid, ... }
    return this.auth.getProfile(payload.sub);
  }
}