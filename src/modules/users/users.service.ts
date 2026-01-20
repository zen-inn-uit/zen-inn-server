import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Provider, UserStatus } from '@prisma/client';
import { UserProfileDto, UpdateUserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createPasswordUser(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: UserStatus.PENDING,
        provider: Provider.PASSWORD,
      },
    });
  }

  upsertOAuthUser(
    email: string,
    provider: Provider,
    providerId: string,
    verified = false,
  ) {
    return this.prisma.user.upsert({
      where: { email },
      update: {
        provider,
        providerId,
        emailVerifiedAt: verified ? new Date() : null,
        status: UserStatus.ACTIVE,
      },
      create: {
        email,
        provider,
        providerId,
        emailVerifiedAt: verified ? new Date() : null,
        status: UserStatus.ACTIVE,
      },
    });
  }

  /**
   * Get user profile (public fields for customer)
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      language: user.language,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const updateData: Record<string, unknown> = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.language !== undefined) updateData.language = dto.language;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      language: user.language,
      createdAt: user.createdAt,
    };
  }
}
