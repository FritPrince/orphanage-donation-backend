import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationChannel, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const { data, ...rest } = dto;
    return this.prisma.notification.create({
      data: { ...rest, data: (data as Prisma.InputJsonValue) ?? Prisma.JsonNull, sentAt: new Date() },
    });
  }

  async notify(
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel = NotificationChannel.EMAIL,
    data?: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, body, channel, data: data ?? Prisma.JsonNull, sentAt: new Date() },
    });
  }

  async findForUser(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification introuvable');
    if (notif.userId !== userId) throw new ForbiddenException('Accès refusé');

    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Toutes les notifications marquées comme lues' };
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { unread: count };
  }
}
