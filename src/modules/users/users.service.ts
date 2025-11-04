import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Provider, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createPasswordUser(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, passwordHash, status: UserStatus.PENDING, provider: Provider.PASSWORD },
    });
  }

  upsertOAuthUser(email: string, provider: Provider, providerId: string, verified = false) {
    return this.prisma.user.upsert({
      where: { email },
      update: { provider, providerId, emailVerifiedAt: verified ? new Date() : null, status: UserStatus.ACTIVE },
      create: { email, provider, providerId, emailVerifiedAt: verified ? new Date() : null, status: UserStatus.ACTIVE },
    });
  }
}
