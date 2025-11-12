import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma.service';
import { Provider, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

@Injectable()
export class OauthService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService, // dùng để phát hành tokens
  ) {}

  // ========== GOOGLE ==========
  async handleGoogleCallback(code: string) {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });

    const idToken = tokenRes.data.id_token;
    const access = tokenRes.data.access_token;

    const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access}` },
    });

    const { sub, email, email_verified, name, picture } = userinfoRes.data;

    if (!email) throw new UnauthorizedException('Google did not return email');

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        provider: Provider.GOOGLE,
        providerId: sub,
        // nếu email_verified = true → kích hoạt
        emailVerifiedAt: email_verified ? new Date() : null,
        status: email_verified ? 'ACTIVE' : 'PENDING',
      },
      create: {
        email,
        role: Role.CUSTOMER,
        provider: Provider.GOOGLE,
        providerId: sub,
        emailVerifiedAt: email_verified ? new Date() : null,
        status: email_verified ? 'ACTIVE' : 'PENDING',
      },
    });

    // Phát hành tokens (AuthService đã có issueTokens)
    return this['issueTokensFor'](user.id, user.role);
  }

  // ========== FACEBOOK ==========
  async handleFacebookCallback(code: string) {
    // exchange code -> access token
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        code,
      },
    });

    const access = tokenRes.data.access_token;
    // fetch profile + email
    const meRes = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,email,picture', access_token: access },
    });

    const { id, name, email } = meRes.data;

    if (!email) {
      // FB đôi khi không trả email → bạn có thể yêu cầu user nhập email sau
      throw new UnauthorizedException('Facebook did not return email');
    }

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        provider: 'FACEBOOK',
        providerId: id,
        // FB không có flag email_verified như Google; coi như verified để tiện luồng đăng ký
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
      create: {
        email,
        role: Role.CUSTOMER,
        provider: 'FACEBOOK',
        providerId: id,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return this['issueTokensFor'](user.id, user.role);
  }

  // helper: dùng method phát hành tokens từ AuthService
  private async issueTokensFor(userId: string, role: Role) {
    // AuthService.issueTokens() là private; tạo 1 wrapper public nếu cần:
    // C1: thêm method public ở AuthService
    return (this.auth as any).issueTokens(userId, role); // tạm thời sử dụng, tốt hơn là tạo public wrapper
  }
}
