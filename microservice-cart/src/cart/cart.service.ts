import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { AddItemDto } from '@/cart/dto/add-item.dto';
import { UpdateItemDto } from '@/cart/dto/update-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // ── helpers ────────────────────────────────────────────────────────────

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: true },
    });
  }

  // ── public operations ──────────────────────────────────────────────────

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      // Return an empty cart shape instead of a 404
      return { userId, items: [], total: '0.00' };
    }

    const total = cart.items
      .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
      .toFixed(2);

    return { ...cart, total };
  }

  async addItem(
    userId: string,
    dto: AddItemDto,
    productPrice: number,
  ) {
    // productPrice is resolved by the controller before calling this method
    // (the controller calls the Product service TCP and passes the price in)

    const cart = await this.getOrCreateCart(userId);

    const existing = cart.items.find((i) => i.productId === dto.productId);

    let item: any;

    if (existing) {
      // Item already in cart → increment quantity
      item = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: dto.quantity } },
      });
    } else {
      item = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          price: productPrice,
        },
      });
    }

    return item;
  }

  async updateItem(userId: string, productId: string, dto: UpdateItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({ statusCode: 404, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.productId === productId);

    if (!item) {
      throw new RpcException({
        statusCode: 404,
        message: 'Item not in cart',
      });
    }

    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({ statusCode: 404, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.productId === productId);

    if (!item) {
      throw new RpcException({
        statusCode: 404,
        message: 'Item not in cart',
      });
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      throw new RpcException({ statusCode: 404, message: 'Cart not found' });
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { message: 'Cart cleared' };
  }

  // ── called by Order service when an order is placed ───────────────────
  // Returns the full cart contents for an order to process, then clears it.

  async checkoutCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new RpcException({ statusCode: 400, message: 'Cart is empty' });
    }

    const total = cart.items
      .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
      .toFixed(2);

    return { cartId: cart.id, userId, items: cart.items, total };
  }
}
