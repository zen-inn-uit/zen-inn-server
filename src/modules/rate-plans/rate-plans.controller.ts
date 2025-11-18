import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RatePlan } from '@prisma/client';
import { RatePlansService } from './rate-plans.service';
import { CreateRatePlanDto, UpdateRatePlanDto } from './dto';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

interface AuthRequest extends Request {
  user: { sub: string; role: Role };
}

@ApiTags('Rate Plans')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('partners/hotels/:hotelId/rooms/:roomId/rate-plans')
export class RatePlansController {
  constructor(private readonly ratePlansService: RatePlansService) {}

  @Post()
  @Roles(Role.PARTNER)
  @HttpCode(201)
  @ApiOperation({
    summary: 'Tạo rate plan mới (I-02: Tạo các gói giá cơ bản)',
  })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiCreatedResponse({
    schema: {
      example: {
        id: 'rp-123',
        name: 'Standard Rate',
        rateCode: 'STD',
        basePrice: 500000,
        validFrom: '2025-11-18T00:00:00Z',
        validUntil: '2025-12-31T23:59:59Z',
        cancellationPolicy: 'Free before 48h',
        refundablePercent: 100,
        includesBreakfast: false,
        active: true,
      },
    },
  })
  async create(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
    @Body() dto: CreateRatePlanDto,
  ): Promise<RatePlan> {
    const userId = req.user.sub;
    return this.ratePlansService.create(userId, hotelId, roomId, dto);
  }

  @Get()
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Lấy danh sách rate plans của phòng' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiOkResponse({
    isArray: true,
    schema: {
      example: [
        {
          id: 'rp-123',
          name: 'Standard Rate',
          basePrice: 500000,
          validFrom: '2025-11-18T00:00:00Z',
        },
      ],
    },
  })
  async findAll(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
  ): Promise<RatePlan[]> {
    const userId = req.user.sub;
    return this.ratePlansService.findAll(userId, hotelId, roomId);
  }

  @Get(':ratePlanId')
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Lấy chi tiết một rate plan' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'ratePlanId', description: 'Rate Plan ID' })
  @ApiOkResponse()
  async findOne(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('ratePlanId') ratePlanId: string,
  ): Promise<RatePlan> {
    const userId = req.user.sub;
    return this.ratePlansService.findOne(userId, hotelId, ratePlanId);
  }

  @Patch(':ratePlanId')
  @Roles(Role.PARTNER)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cập nhật rate plan' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'ratePlanId', description: 'Rate Plan ID' })
  @ApiOkResponse()
  async update(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body() dto: UpdateRatePlanDto,
  ): Promise<RatePlan> {
    const userId = req.user.sub;
    return this.ratePlansService.update(userId, hotelId, ratePlanId, dto);
  }

  @Delete(':ratePlanId')
  @Roles(Role.PARTNER)
  @HttpCode(200)
  @ApiOperation({ summary: 'Xóa rate plan' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'ratePlanId', description: 'Rate Plan ID' })
  @ApiOkResponse()
  async remove(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('ratePlanId') ratePlanId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.sub;
    return this.ratePlansService.remove(userId, hotelId, ratePlanId);
  }
}
