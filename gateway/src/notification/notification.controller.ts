import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { extractToken } from 'src/utils/extarctToken';

@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  async getMyNotifications(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('unreadOnly') unreadOnly: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.notificationClient.send('notification.getMyNotifications', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
        unreadOnly: unreadOnly === 'true',
      }),
    );
  }

  @Get('count')
  async getUnreadCount(@Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.notificationClient.send('notification.unreadCount', { token }),
    );
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.notificationClient.send('notification.markAllAsRead', { token }),
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') notificationId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.notificationClient.send('notification.markAsRead', {
        token,
        notificationId,
      }),
    );
  }
}
