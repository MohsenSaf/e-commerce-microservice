import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      { name: 'ORDER_SERVICE',        transport: Transport.TCP, options: { port: 4005 } },
      { name: 'NOTIFICATION_SERVICE', transport: Transport.TCP, options: { port: 4008 } },
    ]),
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
