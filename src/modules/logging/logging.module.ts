import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { PrismaService } from '../../prisma.service';

@Global()
@Module({
  controllers: [LoggingController],
  providers: [LoggingService, PrismaService],
  exports: [LoggingService],
})
export class LoggingModule {}
