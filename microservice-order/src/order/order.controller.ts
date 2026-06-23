import { Controller, Inject, UseGuards } from '@nestjs/common';
import {
  ClientProxy,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { OrderService } from './order.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('')
export class OrderController {
  constructor(
    private orderService: OrderService,
    @Inject('CART_SERVICE') private cartClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
  ) {}

  private notify(userId: string, type: string, title: string, message: string, metadata?: any) {
    this.notificationClient
      .send('notification.send', { sendNotificationDto: { userId, type, title, message, metadata } })
      .subscribe({ error: (e) => console.error('[notify] order error:', e) });
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('order.place')
  async placeOrder(@Payload() payload: any) {
    const { placeOrderDto, user }: { placeOrderDto: PlaceOrderDto; user: any } =
      payload;

    // 1. Checkout the cart — fetches items and returns them (does NOT clear yet)
    let cart: any;
    try {
      cart = await firstValueFrom(
        this.cartClient.send('cart.checkout', { userId: user.sub }),
      );
    } catch (err) {
      throw new RpcException({
        statusCode: 400,
        message: err?.error?.message || 'Cart is empty or not found',
      });
    }

    const { items, total } = cart;

    // 2. Decrement inventory for each item in the cart
    //    If any item is out of stock, we throw before writing the order.
    const decremented: string[] = [];
    try {
      for (const item of items) {
        await firstValueFrom(
          this.inventoryClient.send('inventory.decrement', {
            productId: item.productId,
            decrementDto: { quantity: item.quantity, reason: `order placement` },
          }),
        );
        decremented.push(item.productId);
      }
    } catch (err) {
      // Roll back inventory decrements that already succeeded
      for (const productId of decremented) {
        const decrementedItem = items.find(
          (i: any) => i.productId === productId,
        );
        await firstValueFrom(
          this.inventoryClient.send('inventory.restock', {
            productId,
            restockDto: {
              quantity: decrementedItem.quantity,
              reason: 'order rollback',
            },
          }),
        ).catch(() => {
          // Best-effort rollback — log but don't throw
          console.error(`Failed to roll back inventory for ${productId}`);
        });
      }

      throw new RpcException({
        statusCode: 409,
        message: err?.error?.message || 'Insufficient stock for one or more items',
      });
    }

    // 3. Persist the order
    const order = await this.orderService.placeOrder(
      user.sub,
      placeOrderDto,
      items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: Number(i.price),
      })),
      total,
    );

    // 4. Clear the cart now that the order is saved
    await firstValueFrom(
      this.cartClient.send('cart.clear', { user: { sub: user.sub } }),
    ).catch(() => {
      console.warn(`Could not clear cart for user ${user.sub} after order ${order.id}`);
    });

    // 5. Notify user
    this.notify(
      user.sub,
      'ORDER_PLACED',
      'Order placed!',
      `Your order #${order.id.slice(0, 8)} has been placed successfully. Total: $${order.total}`,
      { orderId: order.id },
    );

    return order;
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('order.get')
  async getOrder(@Payload() payload: any) {
    const { orderId, user } = payload;
    return this.orderService.getOrder(
      orderId,
      user.sub,
      user.role === 'ADMIN',
    );
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('order.myOrders')
  async getMyOrders(@Payload() payload: any) {
    const { page = 1, pageSize = 10, user } = payload;
    return this.orderService.getUserOrders(user.sub, page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('order.all')
  async getAllOrders(@Payload() payload: any) {
    const { page = 1, pageSize = 10 } = payload;
    return this.orderService.getAllOrders(page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('order.updateStatus')
  async updateStatus(@Payload() payload: any) {
    const {
      orderId,
      updateOrderStatusDto,
    }: { orderId: string; updateOrderStatusDto: UpdateOrderStatusDto } = payload;
    return this.orderService.updateStatus(orderId, updateOrderStatusDto);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('order.cancel')
  async cancelOrder(@Payload() payload: any) {
    const { orderId, user } = payload;
    const order = await this.orderService.cancelOrder(
      orderId,
      user.sub,
      user.role === 'ADMIN',
    );

    this.notify(
      order.userId,
      'ORDER_CANCELLED',
      'Order cancelled',
      `Your order #${order.id.slice(0, 8)} has been cancelled.`,
      { orderId: order.id },
    );

    return order;
  }

  // Internal — called by Reviews service to verify purchase before allowing review
  @MessagePattern('order.hasOrderedProduct')
  async hasOrderedProduct(@Payload() payload: any) {
    const { userId, productId } = payload;
    const result = await this.orderService.hasOrderedProduct(userId, productId);
    return { hasOrdered: result };
  }
}
