import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { UpdateUserProfileDto, UserProfileDto } from './dto/user-profile.dto';
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

/**
 * User Profile Controller
 * Endpoints for customer profile management (/api/me)
 */
@ApiTags('User Profile')
@Controller('me')
@UseGuards(JwtAccessGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  async getProfile(@Req() req: AuthRequest): Promise<UserProfileDto> {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(req.user.sub, dto);
  }
}
