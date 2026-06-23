import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ShippingModule } from './shipping/shipping.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    AuthModule,
    ProductModule,
    InventoryModule,
    CartModule,
    OrderModule,
    PaymentModule,
    ShippingModule,
    NotificationModule,
    ReviewModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
