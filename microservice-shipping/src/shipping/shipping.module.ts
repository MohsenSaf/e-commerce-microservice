import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      { name: 'ORDER_SERVICE',        transport: Transport.TCP, options: { port: 4005 } },
      { name: 'NOTIFICATION_SERVICE', transport: Transport.TCP, options: { port: 4008 } },
    ]),
  ],
  providers: [ShippingService],
  controllers: [ShippingController],
})
export class ShippingModule {}
