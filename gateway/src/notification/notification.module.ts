import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'NOTIFICATION_SERVICE', transport: Transport.TCP, options: { port: 4008 } },
    ]),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
