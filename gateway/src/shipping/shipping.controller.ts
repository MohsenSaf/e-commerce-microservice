import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('shipping')
export class ShippingController {
  constructor(
    @Inject('SHIPPING_SERVICE') private readonly shippingClient: ClientProxy,
  ) {}

  // ADMIN: create shipment for a confirmed order
  @Post()
  async createShipment(
    @Body() createShipmentDto: CreateShipmentDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.shippingClient.send('shipping.create', { token, createShipmentDto }),
    );
  }

  // Public tracking — no token required
  @Get('track/:trackingNumber')
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return firstValueFrom(
      this.shippingClient.send('shipping.track', { trackingNumber }),
    );
  }

  // User: get their own shipments
  @Get('my')
  async getMyShipments(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.shippingClient.send('shipping.myShipments', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // ADMIN: all shipments
  @Get()
  async getAllShipments(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.shippingClient.send('shipping.all', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // Get shipment by order ID
  @Get('order/:orderId')
  async getShipmentByOrder(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.shippingClient.send('shipping.getByOrder', { token, orderId }),
    );
  }

  // ADMIN: update shipment status (also syncs order status)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') shipmentId: string,
    @Body() updateShipmentStatusDto: UpdateShipmentStatusDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.shippingClient.send('shipping.updateStatus', {
        token,
        shipmentId,
        updateShipmentStatusDto,
      }),
    );
  }
}
