import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { LoggingService } from './logging.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('System Logs')
@Controller('admin/logs')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  @ApiOperation({ summary: 'Get system logs (Admin only)' })
  @ApiQuery({ name: 'eventCategory', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'List of system logs with pagination',
  })
  async getLogs(@Query() query: QueryLogsDto) {
    return this.loggingService.getLogs(query);
  }
}
