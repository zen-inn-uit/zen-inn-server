import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { KycStatus, Role } from '@prisma/client';
import { UpsertPartnerDto } from './dto/upsert-partner.dto';
import { CreateKycDocDto } from './dto/create-kyc-doc.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  // Lấy hoặc tạo Partner cho user hiện tại
  async getOrCreateMyPartner(userId: string, dto?: UpsertPartnerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const partner = await this.prisma.partner.upsert({
      where: { userId: userId },
      update: {
        ...(dto?.company ? { company: dto.company } : {}),
      },
      create: {
        userId: userId,
        company: dto?.company,
        kycStatus: KycStatus.PENDING,
      },
    });

    return partner;
  }

  async getMyPartner(userId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { user: true, hotels: true },
    });
    if (!partner) throw new NotFoundException('Partner profile not found');
    return partner;
  }

  async addKycDocForMe(userId: string, dto: CreateKycDocDto) {
    const partner = await this.prisma.partner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException('Partner profile not found');

    const doc = await this.prisma.kycDocument.create({
      data: {
        partnerId: partner.id,
        kind: dto.kind,
        url: dto.url,
      },
    });

    // khi có doc mới, đảm bảo status là PENDING
    if (partner.kycStatus === KycStatus.REJECTED) {
      await this.prisma.partner.update({
        where: { id: partner.id },
        data: { kycStatus: KycStatus.PENDING },
      });
    }

    return doc;
  }

  async listMyKycDocs(userId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException('Partner profile not found');

    return this.prisma.kycDocument.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============== ADMIN SIDE =================

  async listPartnersForAdmin(status?: KycStatus) {
    return this.prisma.partner.findMany({
      where: status ? { kycStatus: status } : undefined,
      include: {
        user: true,
        kycDocuments: true, // sẽ định nghĩa relation ngược ở Partner
      },
    });
  }

  async approvePartner(adminId: string, partnerId: string) {
    // optional: kiểm tra admin có tồn tại hay không
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can approve partners');
    }

    const partner = await this.prisma.partner.update({
      where: { id: partnerId },
      data: { kycStatus: KycStatus.APPROVED },
      include: { user: true },
    });

    // tuỳ bạn: auto nâng role user thành PARTNER nếu chưa có
    if (partner.user.role !== Role.PARTNER) {
      await this.prisma.user.update({
        where: { id: partner.userId },
        data: { role: Role.PARTNER },
      });
    }

    return partner;
  }

  async rejectPartner(adminId: string, partnerId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can reject partners');
    }

    const partner = await this.prisma.partner.update({
      where: { id: partnerId },
      data: { kycStatus: KycStatus.REJECTED },
    });

    return partner;
  }
}
