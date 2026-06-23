import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      { name: 'CART_SERVICE',         transport: Transport.TCP, options: { port: 4003 } },
      { name: 'INVENTORY_SERVICE',    transport: Transport.TCP, options: { port: 4004 } },
      { name: 'NOTIFICATION_SERVICE', transport: Transport.TCP, options: { port: 4008 } },
    ]),
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
