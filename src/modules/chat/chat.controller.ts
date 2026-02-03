import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start or get existing conversation with a hotel' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created or retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid hotel ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async startConversation(
    @Req() req,
    @Body() dto: CreateConversationDto,
  ) {
    // Start conversation as USER
    const userId = req.user.sub;
    
    if (!dto.hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      const conversation = await this.chatService.createOrGetConversation(
        userId,
        dto.hotelId,
      );
      
      if (!conversation) {
        throw new NotFoundException('Hotel not found');
      }

      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create conversation',
      );
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user (Messenger inbox)' })
  @ApiResponse({
    status: 200,
    description: 'User conversations retrieved successfully with unread counts',
  })
  async getUserConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get total unread messages count for badge notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@Req() req) {
    // Check if user is a partner by trying to get partner record
    try {
      const partnerCount =
        await this.chatService.getPartnerTotalUnreadCount(req.user.sub);
      if (partnerCount.unreadCount > 0 || req.user.role === 'PARTNER') {
        return partnerCount;
      }
    } catch (e) {
      // Not a partner, continue to user count
    }

    // Default to user count
    return this.chatService.getTotalUnreadCount(req.user.sub);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
  })
  async markAsRead(@Req() req, @Param('id') conversationId: string) {
    return this.chatService.markConversationAsRead(conversationId, req.user.sub);
  }

  @Get('conversations/user')
  @ApiOperation({ summary: '[Deprecated] Use GET /conversations instead' })
  async getUserConversationsDeprecated(@Req() req) {
    return this.chatService.getUserConversations(req.user.sub);
  }

  @Get('conversations/partner')
  @ApiOperation({ summary: 'Get all conversations for partner hotels' })
  @ApiResponse({
    status: 200,
    description: 'Partner conversations retrieved successfully',
  })
  async getPartnerConversations(@Req() req) {
    return this.chatService.getPartnerConversations(req.user.sub);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation with details' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
  })
  async getConversation(@Req() req, @Param('id') id: string) {
    if (!id || id.length < 10) {
      throw new BadRequestException('Invalid conversation ID');
    }
    return this.chatService.getConversationDetails(id, req.user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  async getMessages(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Conversation ID is required');
    }
    
    // Check if it's a valid CUID or UUID-like string
    if (id.length < 10) {
      throw new BadRequestException('Invalid conversation ID');
    }

    return this.chatService.getMessages(id);
  }
}
