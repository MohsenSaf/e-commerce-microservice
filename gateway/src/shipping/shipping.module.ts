import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'SHIPPING_SERVICE', transport: Transport.TCP, options: { port: 4007 } },
    ]),
  ],
  controllers: [ShippingController],
})
export class ShippingModule {}
