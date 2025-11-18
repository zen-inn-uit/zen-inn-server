import {
  Controller,
  Get,
  Patch,
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
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto';

interface AuthRequest extends Request {
  user: { sub: string; role: Role };
}

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners/hotels/:hotelId/rooms/:roomId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy thông tin số lượng phòng có sẵn',
  })
  @ApiParam({ name: 'hotelId', description: 'ID của khách sạn' })
  @ApiParam({ name: 'roomId', description: 'ID của phòng' })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 'room-123',
          name: 'Deluxe Double Room',
          roomType: 'Double Room',
          availableCount: 5,
          totalCount: 10,
          price: 50000,
          capacity: 2,
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập khách sạn' })
  @ApiNotFoundResponse({ description: 'Phòng không tồn tại' })
  async getInventory(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
  ) {
    const userId = req.user.sub;
    return this.inventoryService.getInventory(userId, hotelId, roomId);
  }

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cập nhật số lượng phòng có sẵn (I-01)',
  })
  @ApiParam({ name: 'hotelId', description: 'ID của khách sạn' })
  @ApiParam({ name: 'roomId', description: 'ID của phòng' })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 'room-123',
          name: 'Deluxe Double Room',
          roomType: 'Double Room',
          availableCount: 5,
          totalCount: 10,
          price: 50000,
          capacity: 2,
        },
        message: 'Cập nhật số lượng phòng thành công',
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập khách sạn' })
  @ApiNotFoundResponse({ description: 'Phòng không tồn tại' })
  @ApiBadRequestResponse({
    description: 'Số phòng còn lại vượt quá tổng số phòng',
  })
  async updateInventory(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    const userId = req.user.sub;
    return this.inventoryService.updateInventory(userId, hotelId, roomId, dto);
  }
}
