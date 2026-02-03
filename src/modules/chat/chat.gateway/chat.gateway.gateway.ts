import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGatewayGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      // client.handshake.auth.token or query.token
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        // client.disconnect(); // Allow for now? Or disconnect.
        return;
      }

      // Verify token
      const payload: any = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'secret',
      );
      // Attach user info to socket
      (client as any).user = payload;
      
      console.log('Client connected:', client.id, payload.sub);
    } catch (e) {
      console.error('Socket connection auth error:', e.message);
      // client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.conversationId);
    console.log(`Client ${client.id} joined room ${data.conversationId}`);
    return { event: 'joined_conversation', data: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      senderType: 'USER' | 'HOTEL';
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('send_message', data);
    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.senderType,
        data.content,
      );
      // Broadcast to room (including sender)
      this.server.to(data.conversationId).emit('receive_message', message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  }
}
