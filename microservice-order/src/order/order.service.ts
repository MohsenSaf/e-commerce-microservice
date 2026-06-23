import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async placeOrder(
    userId: string,
    dto: PlaceOrderDto,
    cartItems: Array<{ productId: string; quantity: number; price: number }>,
    cartTotal: string,
  ) {
    // Cart checkout (fetching items + clearing cart) is handled in the controller
    // before calling this method. By the time we're here, inventory has already
    // been decremented per item too. We just persist the order.
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total: parseFloat(cartTotal),
          notes: dto.notes,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      return order;
    });
  }

  async getOrder(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
    }

    // Users can only see their own orders
    if (!isAdmin && order.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return order;
  }

  async getUserOrders(userId: string, page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { total, page, list: orders };
  }

  async getAllOrders(page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.order.count(),
    ]);

    return { total, page, list: orders };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async cancelOrder(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
    }

    if (!isAdmin && order.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    const cancellable = ['PENDING', 'CONFIRMED'];
    if (!cancellable.includes(order.status)) {
      throw new RpcException({
        statusCode: 409,
        message: `Cannot cancel an order with status ${order.status}`,
      });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });
  }

  // Called by Reviews service to verify a user has a delivered order for a product
  async hasOrderedProduct(userId: string, productId: string): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: { some: { productId } },
      },
    });
    return !!order;
  }
}
