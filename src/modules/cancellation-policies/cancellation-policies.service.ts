import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LoggingService } from '../logging/logging.service';
import {
  CreateCancellationPolicyDto,
  UpdateCancellationPolicyDto,
} from './dto';

@Injectable()
export class CancellationPoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async create(userId: string, dto: CreateCancellationPolicyDto) {
    // Get partner for this user
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const policy = await this.prisma.cancellationPolicy.create({
      data: {
        partnerId: partner.id,
        name: dto.name,
        description: dto.description,
        freeCancellationHours: dto.freeCancellationHours,
        refundablePercent: dto.refundablePercent,
        noShowRefundPercent: dto.noShowRefundPercent ?? 0,
        modificationAllowed: dto.modificationAllowed ?? true,
        modificationFeePercent: dto.modificationFeePercent ?? 0,
      },
    });

    // Log policy creation
    await this.loggingService.log({
      eventType: 'cancellation_policy_created',
      eventCategory: 'cancellation_policy' as any,
      severity: 'info' as any,
      message: `Cancellation policy created: ${dto.name}`,
      userId,
      resourceId: policy.id,
      resourceType: 'cancellation_policy',
      metadata: { policyName: dto.name },
    });

    return policy;
  }

  async findAll(userId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    return this.prisma.cancellationPolicy.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const policy = await this.prisma.cancellationPolicy.findUnique({
      where: { id },
      include: {
        ratePlans: {
          select: {
            id: true,
            name: true,
            rooms: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException('Cancellation policy not found');
    }

    if (policy.partnerId !== partner.id) {
      throw new ForbiddenException(
        'You do not have access to this cancellation policy',
      );
    }

    return policy;
  }

  async update(userId: string, id: string, dto: UpdateCancellationPolicyDto) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const policy = await this.prisma.cancellationPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Cancellation policy not found');
    }

    if (policy.partnerId !== partner.id) {
      throw new ForbiddenException(
        'You do not have access to this cancellation policy',
      );
    }

    return this.prisma.cancellationPolicy.update({
      where: { id },
      data: dto,
    }).then(async (updatedPolicy) => {
      // Log policy update
      await this.loggingService.log({
        eventType: 'cancellation_policy_updated',
        eventCategory: 'cancellation_policy' as any,
        severity: 'info' as any,
        message: `Cancellation policy updated: ${updatedPolicy.name}`,
        userId,
        resourceId: id,
        resourceType: 'cancellation_policy',
        metadata: { changes: dto },
      });
      return updatedPolicy;
    });
  }

  async remove(userId: string, id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('User is not a partner');
    }

    const policy = await this.prisma.cancellationPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Cancellation policy not found');
    }

    if (policy.partnerId !== partner.id) {
      throw new ForbiddenException(
        'You do not have access to this cancellation policy',
      );
    }

    // Soft delete by setting active to false
    const deactivatedPolicy = await this.prisma.cancellationPolicy.update({
      where: { id },
      data: { active: false },
    });

    // Log policy deletion
    await this.loggingService.log({
      eventType: 'cancellation_policy_deleted',
      eventCategory: 'cancellation_policy' as any,
      severity: 'info' as any,
      message: `Cancellation policy deactivated: ${deactivatedPolicy.name}`,
      userId,
      resourceId: id,
      resourceType: 'cancellation_policy',
    });

    return deactivatedPolicy;
  }
}
