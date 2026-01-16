import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
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

@ApiTags('Reviews')
@Controller('partners/reviews')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews for partner hotels with filters' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by star rating (1-5)' })
  @ApiQuery({ name: 'hotelId', required: false, type: String, description: 'Filter by hotel ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in comment text' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  findAll(@Req() req: AuthRequest, @Query() query: QueryReviewsDto) {
    const userId = req.user.sub;
    return this.reviewsService.findAllForPartner(userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics for partner' })
  getStats(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.reviewsService.getStatsForPartner(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single review detail' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.reviewsService.findOne(userId, id);
  }

  @Patch(':id/reply')
  @ApiOperation({ summary: 'Add or update partner reply to review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  replyToReview(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    const userId = req.user.sub;
    return this.reviewsService.replyToReview(userId, id, dto);
  }
}

// ============= CUSTOMER ENDPOINTS =============
@ApiTags('Reviews - Customer')
@Controller('bookings')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@ApiBearerAuth()
export class CustomerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/review')
  @ApiOperation({ summary: 'Create a review for a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  createReview(
    @Req() req: AuthRequest,
    @Param('id') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = req.user.sub;
    return this.reviewsService.createReview(userId, bookingId, dto);
  }
}

// ============= ADMIN ENDPOINTS =============
@ApiTags('Reviews - Admin')
@Controller('admin/reviews')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews (admin only)' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by star rating (1-5)' })
  @ApiQuery({ name: 'hotelId', required: false, type: String, description: 'Filter by hotel ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in comment text' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  findAll(@Query() query: QueryReviewsDto) {
    return this.reviewsService.findAllForAdmin(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
