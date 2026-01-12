import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RatePlan } from '@prisma/client';
import { RatePlansService } from './rate-plans.service';
import { CreateRatePlanDto } from './dto';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

interface AuthRequest extends Request {
  user: { sub: string; role: Role };
}

@ApiTags('Rate Plans')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('partners/rate-plans')
export class PartnerRatePlansController {
  constructor(private readonly ratePlansService: RatePlansService) {}

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Lấy tất cả rate plans của partner' })
  @ApiOkResponse({
    isArray: true,
  })
  async findAll(@Request() req: AuthRequest): Promise<RatePlan[]> {
    const userId = req.user.sub;
    return this.ratePlansService.findAllForPartner(userId);
  }

  @Post()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Tạo rate plan mới (standalone)' })
  @ApiCreatedResponse({
    type: Object, // Better to use a DTO or specific type if available
  })
  async create(
    @Request() req: AuthRequest,
    @Body() dto: CreateRatePlanDto,
  ): Promise<RatePlan> {
    const userId = req.user.sub;
    return this.ratePlansService.createStandalone(userId, dto);
  }
}
