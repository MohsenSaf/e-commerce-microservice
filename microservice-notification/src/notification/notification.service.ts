import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async send(dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId:   dto.userId,
        type:     dto.type,
        title:    dto.title,
        message:  dto.message,
        metadata: dto.metadata ?? {},
      },
    });

    // Simulate email/push dispatch — log only, no real SMTP
    console.log(
      `[Notification] ${dto.type} → user ${dto.userId}: ${dto.title}`,
    );

    return notification;
  }

  async getMyNotifications(
    userId: string,
    page: number,
    pageSize: number,
    unreadOnly: boolean,
  ) {
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
    const skip  = pageSize ? (page - 1) * pageSize : 0;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { total, page, list: notifications };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new RpcException({ statusCode: 404, message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data:  { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });
    return { marked: count };
  }
}
