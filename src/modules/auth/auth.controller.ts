import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

interface JwtPayload {
  sub: string;
  role: string;
  sid: string;
  iat: number;
  exp: number;
  iss: string;
}

type AuthReq = Request & { user?: JwtPayload };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ======= Sign-up (email → otp → verify → set-password → tokens)
  @Post('register')
  @ApiOperation({ summary: 'Register with email' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  async register(@Body() dto: RegisterDto) {
    await this.auth.register(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.email, dto.code);
  }

  @Post('set-password')
  @ApiOperation({ summary: 'Set password and issue JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens issued' })
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.auth.setPasswordAndIssueTokens(dto.email, dto.password);
  }

  // ======= Sign-in (email + password)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Tokens issued' })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  // ======= OTP Sign-in (optional)
  @Post('login/otp/request')
  @ApiOperation({ summary: 'Request OTP for passwordless login' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  async requestLoginOtp(@Body() dto: LoginOtpRequestDto) {
    await this.auth.requestLoginOtp(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('login/otp/verify')
  @ApiOperation({ summary: 'Verify OTP and issue tokens' })
  @ApiResponse({ status: 200, description: 'Tokens issued' })
  async verifyLoginOtp(@Body() dto: LoginOtpVerifyDto) {
    return this.auth.verifyLoginOtp(dto.email, dto.code);
  }

  // ======= Refresh / Logout (Bearer refresh token)
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New tokens issued' })
  async refresh(@Req() req: AuthReq) {
    const payload = req.user!;
    return this.auth.rotateTokens(payload.sub, payload.sid);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke session' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Req() req: AuthReq) {
    const payload = req.user!;
    await this.auth.revokeSession(payload.sub, payload.sid);
    return { ok: true };
  }

  // ======= Forgot password (no login required)
  @Post('forgot-password/request')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  async forgotRequest(@Body() dto: ForgotPasswordRequestDto) {
    await this.auth.forgotPasswordRequest(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('forgot-password/verify')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified' })
  async forgotVerify(@Body() dto: ForgotPasswordVerifyDto) {
    await this.auth.forgotPasswordVerify(dto.email, dto.code);
    return { ok: true };
  }

  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async forgotReset(@Body() dto: ForgotPasswordResetDto) {
    await this.auth.forgotPasswordReset(dto.email, dto.newPassword);
    return { ok: true };
  }

  // ======= Change password (must be logged in via access token)
  @UseGuards(JwtAccessGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Req() req: AuthReq, @Body() dto: ChangePasswordDto) {
    const payload = req.user!;
    await this.auth.changePassword(
      payload.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    return { ok: true };
  }

  // ======= Profile (Bearer access token)
  @UseGuards(JwtAccessGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async profile(@Req() req: AuthReq) {
    const payload = req.user!;
    return this.auth.getProfile(payload.sub);
  }
}
