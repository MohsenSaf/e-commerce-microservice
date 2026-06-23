import { Controller, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';

@Controller('')
export class CartController {
  constructor(
    private cartService: CartService,
    @Inject('PRODUCT_SERVICE') private productClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
  ) {}

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('cart.get')
  async getCart(@Payload() payload: any) {
    const { user } = payload;
    return this.cartService.getCart(user.sub);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('cart.add')
  async addItem(@Payload() payload: any) {
    const { addItemDto, user }: { addItemDto: AddItemDto; user: any } = payload;

    // 1. Validate product exists and snapshot its current price
    let product: any;
    try {
      product = await firstValueFrom(
        this.productClient.send('product.get', { id: addItemDto.productId }),
      );
    } catch {
      throw new RpcException({
        statusCode: 404,
        message: `Product ${addItemDto.productId} not found`,
      });
    }

    // 2. Check inventory availability
    const availability = await firstValueFrom(
      this.inventoryClient.send('inventory.availability', {
        productId: addItemDto.productId,
        quantity: addItemDto.quantity,
      }),
    );

    if (!availability.isAvailable) {
      throw new RpcException({
        statusCode: 409,
        message: `Insufficient stock: requested ${addItemDto.quantity}, available ${availability.available}`,
      });
    }

    return this.cartService.addItem(user.sub, addItemDto, Number(product.price));
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('cart.update')
  async updateItem(@Payload() payload: any) {
    const {
      productId,
      updateItemDto,
      user,
    }: { productId: string; updateItemDto: UpdateItemDto; user: any } = payload;

    // Check stock for the new quantity
    const availability = await firstValueFrom(
      this.inventoryClient.send('inventory.availability', {
        productId,
        quantity: updateItemDto.quantity,
      }),
    );

    if (!availability.isAvailable) {
      throw new RpcException({
        statusCode: 409,
        message: `Insufficient stock: requested ${updateItemDto.quantity}, available ${availability.available}`,
      });
    }

    return this.cartService.updateItem(user.sub, productId, updateItemDto);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('cart.remove')
  async removeItem(@Payload() payload: any) {
    const { productId, user } = payload;
    return this.cartService.removeItem(user.sub, productId);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('cart.clear')
  async clearCart(@Payload() payload: any) {
    const { user } = payload;
    return this.cartService.clearCart(user.sub);
  }

  // Internal — called by Order service (no auth guard needed, service-to-service)
  @MessagePattern('cart.checkout')
  async checkoutCart(@Payload() payload: any) {
    const { userId } = payload;
    return this.cartService.checkoutCart(userId);
  }
}
