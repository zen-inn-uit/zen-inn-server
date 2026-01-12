import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { BulkUpdateInventoryDto } from './dto/update-inventory.dto';

interface AuthRequest extends Request {
  user: { sub: string; role: Role };
}

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('hotels/:hotelId/inventory')
  @ApiOperation({
    summary: 'Lấy dữ liệu kho phòng theo dải ngày cho khách sạn',
  })
  async getHotelInventory(
    @Request() req: AuthRequest,
    @Param('hotelId') hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const userId = req.user.sub;
    return this.inventoryService.getInventoryRange(userId, hotelId, startDate, endDate);
  }

  @Patch('rooms/:roomId/inventory')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cập nhật kho phòng hàng loạt cho một phòng (giá, số lượng, stop-sell)',
  })
  async updateRoomInventory(
    @Request() req: AuthRequest,
    @Param('roomId') roomId: string,
    @Body() dto: BulkUpdateInventoryDto,
  ) {
    const userId = req.user.sub;
    return this.inventoryService.updateBulk(userId, roomId, dto);
  }
}
