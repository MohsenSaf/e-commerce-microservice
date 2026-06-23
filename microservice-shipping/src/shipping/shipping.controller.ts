import { Controller, Inject, UseGuards } from '@nestjs/common';
import {
  ClientProxy,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ShippingService } from './shipping.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

// Maps shipment statuses that should trigger an order status update
const SHIPMENT_TO_ORDER_STATUS: Record<string, string | null> = {
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  PENDING: null,
  PROCESSING: null,
  OUT_FOR_DELIVERY: null,
  FAILED: null,
};

@Controller('')
export class ShippingController {
  constructor(
    private shippingService: ShippingService,
    @Inject('ORDER_SERVICE') private orderClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
  ) {}

  private notify(userId: string, type: string, title: string, message: string, metadata?: any) {
    this.notificationClient
      .send('notification.send', { sendNotificationDto: { userId, type, title, message, metadata } })
      .subscribe({ error: (e) => console.error('[notify] shipping error:', e) });
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('shipping.create')
  async createShipment(@Payload() payload: any) {
    const {
      createShipmentDto,
      user,
    }: { createShipmentDto: CreateShipmentDto; user: any } = payload;

    // Validate the order exists and is in a shippable state
    let order: any;
    try {
      order = await firstValueFrom(
        this.orderClient.send('order.get', {
          orderId: createShipmentDto.orderId,
          user,
        }),
      );
    } catch {
      throw new RpcException({ statusCode: 404, message: 'Order not found' });
    }

    if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
      throw new RpcException({
        statusCode: 409,
        message: `Cannot create shipment for an order with status ${order.status}`,
      });
    }

    const shipment = await this.shippingService.createShipment(
      createShipmentDto,
      order.userId,
    );

    // Advance order to PROCESSING now that shipment is created
    await firstValueFrom(
      this.orderClient.send('order.updateStatus', {
        orderId: order.id,
        updateOrderStatusDto: { status: 'PROCESSING' },
        user: { ...user, role: 'ADMIN' },
      }),
    ).catch((err) =>
      console.error(`Failed to advance order ${order.id} to PROCESSING:`, err),
    );

    return shipment;
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('shipping.getByOrder')
  async getShipmentByOrder(@Payload() payload: any) {
    const { orderId, user } = payload;
    return this.shippingService.getShipmentByOrder(
      orderId,
      user.sub,
      user.role === 'ADMIN',
    );
  }

  // Public tracking — no auth required
  @MessagePattern('shipping.track')
  async trackShipment(@Payload() payload: any) {
    const { trackingNumber } = payload;
    return this.shippingService.getShipmentByTracking(trackingNumber);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('shipping.myShipments')
  async getMyShipments(@Payload() payload: any) {
    const { page = 1, pageSize = 10, user } = payload;
    return this.shippingService.getMyShipments(user.sub, page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('shipping.all')
  async getAllShipments(@Payload() payload: any) {
    const { page = 1, pageSize = 10 } = payload;
    return this.shippingService.getAllShipments(page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('shipping.updateStatus')
  async updateStatus(@Payload() payload: any) {
    const {
      shipmentId,
      updateShipmentStatusDto,
      user,
    }: {
      shipmentId: string;
      updateShipmentStatusDto: UpdateShipmentStatusDto;
      user: any;
    } = payload;

    const shipment = await this.shippingService.updateStatus(
      shipmentId,
      updateShipmentStatusDto,
    );

    // Sync order status when shipment reaches SHIPPED or DELIVERED
    const orderStatus = SHIPMENT_TO_ORDER_STATUS[shipment.status];
    if (orderStatus) {
      await firstValueFrom(
        this.orderClient.send('order.updateStatus', {
          orderId: shipment.orderId,
          updateOrderStatusDto: { status: orderStatus },
          user: { ...user, role: 'ADMIN' },
        }),
      ).catch((err) =>
        console.error(
          `Failed to sync order ${shipment.orderId} status to ${orderStatus}:`,
          err,
        ),
      );
    }

    // Notify user on key milestones
    if (shipment.status === 'SHIPPED') {
      this.notify(
        shipment.userId,
        'ORDER_SHIPPED',
        'Your order is on its way!',
        `Your order #${shipment.orderId.slice(0, 8)} has been shipped via ${shipment.carrier}. Tracking: ${shipment.trackingNumber}`,
        { orderId: shipment.orderId, trackingNumber: shipment.trackingNumber },
      );
    } else if (shipment.status === 'DELIVERED') {
      this.notify(
        shipment.userId,
        'ORDER_DELIVERED',
        'Order delivered!',
        `Your order #${shipment.orderId.slice(0, 8)} has been delivered. Enjoy!`,
        { orderId: shipment.orderId },
      );
    }

    return shipment;
  }
}
