import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: { port: 4002 },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: { port: 4004 },
      },
    ]),
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
