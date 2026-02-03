import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SenderType, HotelStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createOrGetConversation(userId: string, hotelId: string) {
    // First, verify hotel exists and is active
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        OR: [{ id: hotelId }, { slug: hotelId }],
        deletedAt: null,
        status: HotelStatus.ACTIVE,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found or not available');
    }

    // Use the actual hotel ID (in case slug was provided)
    const actualHotelId = hotel.id;

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        userId_hotelId: {
          userId,
          hotelId: actualHotelId,
        },
      },
      include: {
        hotel: {
          include: {
            images: { take: 1 },
          },
        },
        user: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          hotelId: actualHotelId,
        },
        include: {
          hotel: {
            include: {
              images: { take: 1 },
            },
          },
          user: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    return conversation;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: SenderType,
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      select: {
        id: true,
        updatedAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            starRating: true,
            images: {
              select: { url: true },
              take: 1,
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        messages: {
          select: {
            content: true,
            createdAt: true,
            senderType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: SenderType.HOTEL,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20, // Chỉ lấy 20 hội thoại mới nhất
    });

    return conversations.map((conv) => ({
      ...conv,
      unreadCount: conv._count.messages,
      lastMessage: conv.messages[0] || null,
    }));
  }

  async getTotalUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        isRead: false,
        senderType: SenderType.HOTEL,
        conversation: {
          userId,
        },
      },
    });

    return { unreadCount: count };
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    // First check if user owns this conversation
    const userConversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (userConversation) {
      // User is marking hotel messages as read
      await this.prisma.message.updateMany({
        where: {
          conversationId,
          senderType: SenderType.HOTEL,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      return { success: true };
    }

    // Check if user is a partner and owns the hotel in this conversation
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: true },
    });

    if (partner) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          hotelId: { in: partner.hotels.map((h) => h.id) },
        },
      });

      if (conversation) {
        // Partner is marking user messages as read
        await this.prisma.message.updateMany({
          where: {
            conversationId,
            senderType: SenderType.USER,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
        return { success: true };
      }
    }

    throw new NotFoundException('Conversation not found or unauthorized');
  }

  async getPartnerConversations(partnerUserId: string) {
    // First get partner with timeout protection
    const partner = await this.prisma.partner.findUnique({
      where: { userId: partnerUserId },
      select: {
        id: true,
        hotels: {
          select: { id: true },
        },
      },
    });

    if (!partner || partner.hotels.length === 0) {
      return [];
    }

    const hotelIds = partner.hotels.map((h) => h.id);

    // Simplified query with fewer joins
    const conversations = await this.prisma.conversation.findMany({
      where: { hotelId: { in: hotelIds } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            starRating: true,
            images: {
              take: 1,
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit to recent 50 conversations
    });

    // Count unread messages separately for better performance
    const conversationIds = conversations.map((c) => c.id);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        isRead: false,
        senderType: SenderType.USER,
      },
      _count: { id: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((uc) => [uc.conversationId, uc._count.id]),
    );

    // Transform to include unread count
    return conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(conv.id) || 0,
      lastMessage: conv.messages[0] || null,
    }));
  }

  async getPartnerTotalUnreadCount(partnerUserId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId: partnerUserId },
      include: { hotels: true },
    });

    if (!partner) {
      return { unreadCount: 0 };
    }

    const hotelIds = partner.hotels.map((h) => h.id);

    const count = await this.prisma.message.count({
      where: {
        isRead: false,
        senderType: SenderType.USER, // Count unread messages from users
        conversation: {
          hotelId: { in: hotelIds },
        },
      },
    });

    return { unreadCount: count };
  }

  async getConversationDetails(conversationId: string, userId: string) {
    // First check if user has access to this conversation (either as user or partner)
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            starRating: true,
            images: {
              take: 1,
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user owns this conversation
    if (conversation.userId === userId) {
      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId,
          isRead: false,
          senderType: SenderType.HOTEL,
        },
      });

      return {
        ...conversation,
        unreadCount,
        lastMessage: conversation.messages[0] || null,
      };
    }

    // Check if user is a partner and owns the hotel
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { hotels: { select: { id: true } } },
    });

    if (partner) {
      const hotelIds = partner.hotels.map((h) => h.id);
      if (hotelIds.includes(conversation.hotelId)) {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId,
            isRead: false,
            senderType: SenderType.USER,
          },
        });

        return {
          ...conversation,
          unreadCount,
          lastMessage: conversation.messages[0] || null,
        };
      }
    }

    throw new NotFoundException('Conversation not found or unauthorized');
  }
}
