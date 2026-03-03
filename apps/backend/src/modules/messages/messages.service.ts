import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReplyMessageDto } from './dto/reply-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(senderId: string, dto: SendMessageDto) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: dto.partnerId, deletedAt: null },
      include: {
        partnerUsers: { where: { role: 'OWNER' }, take: 1 },
      },
    });
    if (!partner) throw new NotFoundException('Veterinaria no encontrada');
    if (!partner.partnerUsers.length) {
      throw new BadRequestException('Esta veterinaria no tiene usuario asociado');
    }

    const receiverId = partner.partnerUsers[0].userId;
    if (senderId === receiverId) {
      throw new BadRequestException('No puedes enviarte mensajes a ti mismo');
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        partnerId: dto.partnerId,
        body: dto.body,
      },
    });
  }

  async getUserInbox(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true } },
        receiver: { select: { id: true, email: true } },
      },
    });

    const grouped = new Map<string, (typeof messages)[number]>();
    for (const msg of messages) {
      if (!grouped.has(msg.partnerId)) {
        grouped.set(msg.partnerId, msg);
      }
    }

    const partnerIds = [...grouped.keys()];
    const partners = await this.prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, legalName: true },
    });
    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    return [...grouped.entries()].map(([partnerId, lastMsg]) => ({
      partnerId,
      partnerName: partnerMap.get(partnerId)?.legalName ?? 'Desconocido',
      lastMessage: lastMsg.body,
      lastMessageAt: lastMsg.createdAt,
      unreadCount: messages.filter(
        (m) => m.partnerId === partnerId && m.receiverId === userId && m.status === 'SENT',
      ).length,
    }));
  }

  async getConversation(userId: string, partnerId: string) {
    return this.prisma.message.findMany({
      where: {
        partnerId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true } },
      },
    });
  }

  async getPartnerInbox(userId: string) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
    });
    if (!partnerUser) throw new ForbiddenException('No tienes perfil de empresa');

    const messages = await this.prisma.message.findMany({
      where: { partnerId: partnerUser.partnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true } },
        receiver: { select: { id: true, email: true } },
      },
    });

    // Group by the other user (the USER, not the partner owner)
    const grouped = new Map<string, (typeof messages)[number]>();
    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!grouped.has(otherUserId)) {
        grouped.set(otherUserId, msg);
      }
    }

    return [...grouped.entries()].map(([otherUserId, lastMsg]) => {
      const otherUser =
        lastMsg.senderId === userId ? lastMsg.receiver : lastMsg.sender;
      return {
        userId: otherUserId,
        userEmail: otherUser.email,
        lastMessage: lastMsg.body,
        lastMessageAt: lastMsg.createdAt,
        unreadCount: messages.filter((m) => {
          const msgOtherUserId = m.senderId === userId ? m.receiverId : m.senderId;
          return (
            msgOtherUserId === otherUserId &&
            m.receiverId === userId &&
            m.status === 'SENT'
          );
        }).length,
      };
    });
  }

  async getPartnerThread(partnerUserId: string, otherUserId: string) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId: partnerUserId },
    });
    if (!partnerUser) throw new ForbiddenException('No tienes perfil de empresa');

    return this.prisma.message.findMany({
      where: {
        partnerId: partnerUser.partnerId,
        OR: [
          { senderId: partnerUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: partnerUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true } },
      },
    });
  }

  async reply(partnerUserId: string, dto: ReplyMessageDto) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId: partnerUserId },
    });
    if (!partnerUser) throw new ForbiddenException('No tienes perfil de empresa');

    const exists = await this.prisma.message.findFirst({
      where: { partnerId: partnerUser.partnerId, senderId: dto.receiverId },
    });
    if (!exists)
      throw new BadRequestException('Este usuario no ha iniciado una conversación');

    return this.prisma.message.create({
      data: {
        senderId: partnerUserId,
        receiverId: dto.receiverId,
        partnerId: partnerUser.partnerId,
        body: dto.body,
      },
    });
  }

  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.receiverId !== userId) throw new ForbiddenException();

    return this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'READ', readAt: new Date() },
    });
  }
}
