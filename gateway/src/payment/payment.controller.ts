import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('payments')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  // Initiate payment for an order
  @Post()
  async initiatePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.initiate', {
        token,
        initiatePaymentDto,
      }),
    );
  }

  // Get payment for a specific order
  @Get('order/:orderId')
  async getPaymentByOrder(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.getByOrder', { token, orderId }),
    );
  }

  // Get your own payment history
  @Get('my')
  async getMyPayments(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.myPayments', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // ADMIN: get all payments
  @Get()
  async getAllPayments(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.all', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // Get specific payment by ID
  @Get(':id')
  async getPaymentById(@Param('id') paymentId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.getById', { token, paymentId }),
    );
  }

  // ADMIN: refund a completed payment
  @Post(':id/refund')
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.paymentClient.send('payment.refund', {
        token,
        paymentId,
        refundPaymentDto,
      }),
    );
  }
}
