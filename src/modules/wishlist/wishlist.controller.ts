import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
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

/**
 * Wishlist Controller
 * Endpoints for customers to manage their hotel wishlist
 */
@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  async getWishlist(@Req() req: AuthRequest) {
    return this.wishlistService.getWishlist(req.user.sub);
  }

  @Post(':hotelId')
  @ApiOperation({ summary: 'Add hotel to wishlist' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiResponse({ status: 201, description: 'Hotel added to wishlist' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  @ApiResponse({ status: 409, description: 'Hotel already in wishlist' })
  async addToWishlist(
    @Req() req: AuthRequest,
    @Param('hotelId') hotelId: string,
  ) {
    return this.wishlistService.addToWishlist(req.user.sub, hotelId);
  }

  @Delete(':hotelId')
  @ApiOperation({ summary: 'Remove hotel from wishlist' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiResponse({ status: 200, description: 'Hotel removed from wishlist' })
  @ApiResponse({ status: 404, description: 'Hotel not found in wishlist' })
  async removeFromWishlist(
    @Req() req: AuthRequest,
    @Param('hotelId') hotelId: string,
  ) {
    return this.wishlistService.removeFromWishlist(req.user.sub, hotelId);
  }
}
