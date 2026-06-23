import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Inject,
  HttpCode,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
  ) {}

  // Place order from current cart
  @Post()
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.place', { token, placeOrderDto }),
    );
  }

  // Get the authenticated user's own orders
  @Get('my')
  async getMyOrders(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.myOrders', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // ADMIN: get all orders
  @Get()
  async getAllOrders(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.all', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // Get a specific order by ID
  @Get(':id')
  async getOrder(@Param('id') orderId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.get', { token, orderId }),
    );
  }

  // ADMIN: update order status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.updateStatus', {
        token,
        orderId,
        updateOrderStatusDto,
      }),
    );
  }

  // Cancel an order (user: own orders only; admin: any order)
  @Delete(':id')
  @HttpCode(200)
  async cancelOrder(@Param('id') orderId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.orderClient.send('order.cancel', { token, orderId }),
    );
  }
}
