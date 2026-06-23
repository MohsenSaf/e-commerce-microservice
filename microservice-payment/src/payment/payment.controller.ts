import { Controller, Inject, UseGuards } from '@nestjs/common';
import {
  ClientProxy,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    @Inject('ORDER_SERVICE') private orderClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
  ) {}

  private notify(userId: string, type: string, title: string, message: string, metadata?: any) {
    this.notificationClient
      .send('notification.send', { sendNotificationDto: { userId, type, title, message, metadata } })
      .subscribe({ error: (e) => console.error('[notify] payment error:', e) });
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('payment.initiate')
  async initiatePayment(@Payload() payload: any) {
    const {
      initiatePaymentDto,
      user,
    }: { initiatePaymentDto: InitiatePaymentDto; user: any } = payload;

    // 1. Fetch the order — validates it exists and belongs to this user
    let order: any;
    try {
      order = await firstValueFrom(
        this.orderClient.send('order.get', {
          orderId: initiatePaymentDto.orderId,
          user,
        }),
      );
    } catch {
      throw new RpcException({
        statusCode: 404,
        message: 'Order not found',
      });
    }

    // 2. Only PENDING or CONFIRMED orders can be paid
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new RpcException({
        statusCode: 409,
        message: `Cannot pay for an order with status ${order.status}`,
      });
    }

    // 3. Process payment
    const payment = await this.paymentService.initiatePayment(
      user.sub,
      initiatePaymentDto,
      Number(order.total),
    );

    // 4. On success → advance order to CONFIRMED; on failure → leave as PENDING
    if (payment.status === 'COMPLETED') {
      await firstValueFrom(
        this.orderClient.send('order.updateStatus', {
          orderId: order.id,
          updateOrderStatusDto: { status: 'CONFIRMED' },
          user: { ...user, role: 'ADMIN' },
        }),
      ).catch((err) => {
        console.error(
          `Payment ${payment.id} completed but failed to update order ${order.id} status:`,
          err,
        );
      });

      this.notify(
        user.sub,
        'PAYMENT_COMPLETED',
        'Payment successful!',
        `Your payment of $${payment.amount} for order #${order.id.slice(0, 8)} was successful.`,
        { orderId: order.id, paymentId: payment.id },
      );
    } else {
      this.notify(
        user.sub,
        'PAYMENT_FAILED',
        'Payment failed',
        `Your payment for order #${order.id.slice(0, 8)} could not be processed. Please try again.`,
        { orderId: order.id, paymentId: payment.id, reason: payment.failureReason },
      );
    }

    return payment;
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('payment.getByOrder')
  async getPaymentByOrder(@Payload() payload: any) {
    const { orderId, user } = payload;
    return this.paymentService.getPaymentByOrder(
      orderId,
      user.sub,
      user.role === 'ADMIN',
    );
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('payment.getById')
  async getPaymentById(@Payload() payload: any) {
    const { paymentId, user } = payload;
    return this.paymentService.getPaymentById(
      paymentId,
      user.sub,
      user.role === 'ADMIN',
    );
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('payment.myPayments')
  async getMyPayments(@Payload() payload: any) {
    const { page = 1, pageSize = 10, user } = payload;
    return this.paymentService.getMyPayments(user.sub, page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('payment.all')
  async getAllPayments(@Payload() payload: any) {
    const { page = 1, pageSize = 10 } = payload;
    return this.paymentService.getAllPayments(page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('payment.refund')
  async refundPayment(@Payload() payload: any) {
    const {
      paymentId,
      refundPaymentDto,
    }: { paymentId: string; refundPaymentDto: RefundPaymentDto } = payload;
    return this.paymentService.refundPayment(paymentId, refundPaymentDto);
  }
}
