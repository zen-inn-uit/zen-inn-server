import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGatewayGateway } from './chat.gateway/chat.gateway.gateway';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGatewayGateway, PrismaService]
})
export class ChatModule {}
