import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';

@Controller('')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // Internal — called by Order, Payment, Shipping services. No auth guard:
  // these are trusted service-to-service calls, not user-facing.
  @MessagePattern('notification.send')
  async send(@Payload() payload: { sendNotificationDto: SendNotificationDto }) {
    return this.notificationService.send(payload.sendNotificationDto);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('notification.getMyNotifications')
  async getMyNotifications(@Payload() payload: any) {
    const { page = 1, pageSize = 20, unreadOnly = false, user } = payload;
    return this.notificationService.getMyNotifications(
      user.sub,
      Number(page),
      Number(pageSize),
      Boolean(unreadOnly),
    );
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('notification.unreadCount')
  async getUnreadCount(@Payload() payload: any) {
    return this.notificationService.getUnreadCount(payload.user.sub);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('notification.markAsRead')
  async markAsRead(@Payload() payload: any) {
    const { notificationId, user } = payload;
    return this.notificationService.markAsRead(notificationId, user.sub);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('notification.markAllAsRead')
  async markAllAsRead(@Payload() payload: any) {
    return this.notificationService.markAllAsRead(payload.user.sub);
  }
}
