import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CancellationPoliciesService } from './cancellation-policies.service';
import {
  CreateCancellationPolicyDto,
  UpdateCancellationPolicyDto,
} from './dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthUser {
  sub: string;
  role: Role;
  sid: string;
}

interface AuthRequest extends Request {
  user: AuthUser;
}

@ApiTags('Cancellation Policies')
@Controller('partners/cancellation-policies')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
@ApiBearerAuth()
export class CancellationPoliciesController {
  constructor(
    private readonly cancellationPoliciesService: CancellationPoliciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cancellation policy' })
  @ApiResponse({
    status: 201,
    description: 'Cancellation policy created successfully',
  })
  create(@Req() req: AuthRequest, @Body() dto: CreateCancellationPolicyDto) {
    const userId = req.user.sub;
    return this.cancellationPoliciesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cancellation policies for current partner' })
  @ApiResponse({ status: 200, description: 'List of cancellation policies' })
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.cancellationPoliciesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cancellation policy details by ID' })
  @ApiParam({ name: 'id', description: 'Cancellation Policy ID' })
  @ApiResponse({ status: 200, description: 'Cancellation policy details' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.cancellationPoliciesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cancellation policy' })
  @ApiParam({ name: 'id', description: 'Cancellation Policy ID' })
  @ApiResponse({
    status: 200,
    description: 'Cancellation policy updated successfully',
  })
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCancellationPolicyDto,
  ) {
    const userId = req.user.sub;
    return this.cancellationPoliciesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a cancellation policy' })
  @ApiParam({ name: 'id', description: 'Cancellation Policy ID' })
  @ApiResponse({
    status: 200,
    description: 'Cancellation policy deactivated successfully',
  })
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.cancellationPoliciesService.remove(userId, id);
  }
}
