import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OauthService } from './oauth.service';

@Controller()
export class OauthController {
  constructor(private readonly oauth: OauthService) {}

  // ===== Google =====
  // B1: mở trang consent (bạn có thể redirect sang google)
  @Get('oauth/google')
  googleStart(@Res() res: Response) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  // B2: callback nhận code
  @Get('oauth/google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.oauth.handleGoogleCallback(code);
    // Tuỳ bạn: redirect về FE kèm token, hoặc hiển thị JSON
    return res.json({ accessToken, refreshToken });
  }

  // ===== Facebook =====
  @Get('auth/facebook')
  facebookStart(@Res() res: Response) {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
      response_type: 'code',
      scope: 'email,public_profile',
    });
    res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`);
  }

  @Get('auth/facebook/callback')
  async facebookCallback(@Query('code') code: string, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.oauth.handleFacebookCallback(code);
    return res.json({ accessToken, refreshToken });
  }
}
