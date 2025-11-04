import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto, LoginOtpRequestDto, LoginOtpVerifyDto } from './dto';
import { JwtAccessGuard, JwtRefreshGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: any) {
    return this.auth.verifyEmail(dto.email, dto.code, req.headers['user-agent'], req.ip);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.auth.loginPassword(dto.email, dto.password, req.headers['user-agent'], req.ip);
  }

  @Post('login/otp/request')
  requestOtp(@Body() dto: LoginOtpRequestDto) {
    return this.auth.requestLoginOtp(dto.email);
  }

  @Post('login/otp/verify')
  verifyOtp(@Body() dto: LoginOtpVerifyDto, @Req() req: any) {
    return this.auth.verifyLoginOtp(dto.email, dto.code, req.headers['user-agent'], req.ip);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: any, @Headers('authorization') authz?: string) {
    const refreshToken = authz?.startsWith('Bearer ') ? authz.slice(7) : '';
    return this.auth.refresh(req.user.sub, refreshToken);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  logout(@Req() req: any, @Headers('authorization') authz?: string) {
    const refreshToken = authz?.startsWith('Bearer ') ? authz.slice(7) : '';
    return this.auth.logout(req.user.sub, refreshToken);
  }

  @UseGuards(JwtAccessGuard)
  @Get('profile')
  profile(@Req() req: any) {
    return { userId: req.user.sub, role: req.user.role };
  }
}
