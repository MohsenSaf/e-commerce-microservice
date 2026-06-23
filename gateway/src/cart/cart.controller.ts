import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Inject,
  HttpCode,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('cart')
export class CartController {
  constructor(
    @Inject('CART_SERVICE') private readonly cartClient: ClientProxy,
  ) {}

  @Get()
  async getCart(@Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(this.cartClient.send('cart.get', { token }));
  }

  @Post('items')
  async addItem(@Body() addItemDto: AddItemDto, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.cartClient.send('cart.add', { token, addItemDto }),
    );
  }

  @Patch('items/:productId')
  async updateItem(
    @Param('productId') productId: string,
    @Body() updateItemDto: UpdateItemDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.cartClient.send('cart.update', { token, productId, updateItemDto }),
    );
  }

  @Delete('items/:productId')
  @HttpCode(204)
  async removeItem(@Param('productId') productId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.cartClient.send('cart.remove', { token, productId }),
    );
  }

  @Delete()
  @HttpCode(204)
  async clearCart(@Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(this.cartClient.send('cart.clear', { token }));
  }
}
