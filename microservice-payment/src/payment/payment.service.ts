import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  // ── Mock payment provider ──────────────────────────────────────────────
  // Simulates an external payment gateway. Returns a mock transaction ID
  // on success, or a failure reason on failure. 90% success rate.

  private async mockProvider(
    amount: number,
    method: string,
  ): Promise<{ success: boolean; providerRef?: string; failureReason?: string }> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));

    const success = Math.random() > 0.1; // 90% success

    if (success) {
      return {
        success: true,
        providerRef: `mock_${method.toLowerCase()}_${Date.now()}`,
      };
    }

    return {
      success: false,
      failureReason: 'Payment declined by mock provider',
    };
  }

  // ── Operations ──────────────────────────────────────────────────────────

  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
    orderTotal: number,
  ) {
    // Prevent duplicate payments for the same order
    const existing = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existing) {
      if (existing.status === 'COMPLETED') {
        throw new RpcException({
          statusCode: 409,
          message: 'Order is already paid',
        });
      }
      if (existing.status === 'PROCESSING') {
        throw new RpcException({
          statusCode: 409,
          message: 'Payment is already being processed',
        });
      }
      // FAILED or PENDING → allow retry by deleting and re-creating
      await this.prisma.payment.delete({ where: { orderId: dto.orderId } });
    }

    // 1. Create payment record in PENDING state
    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        userId,
        amount: orderTotal,
        method: dto.method,
        status: 'PENDING',
      },
    });

    // 2. Mark as PROCESSING
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PROCESSING' },
    });

    // 3. Call mock provider
    const result = await this.mockProvider(orderTotal, dto.method);

    // 4. Update to final status
    const finalPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        providerRef: result.providerRef,
        failureReason: result.failureReason,
      },
    });

    return finalPayment;
  }

  async getPaymentByOrder(orderId: string, userId: string, isAdmin: boolean) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new RpcException({
        statusCode: 404,
        message: 'Payment not found for this order',
      });
    }

    if (!isAdmin && payment.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return payment;
  }

  async getPaymentById(paymentId: string, userId: string, isAdmin: boolean) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new RpcException({ statusCode: 404, message: 'Payment not found' });
    }

    if (!isAdmin && payment.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return payment;
  }

  async getMyPayments(userId: string, page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return { total, page, list: payments };
  }

  async getAllPayments(page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.payment.count(),
    ]);

    return { total, page, list: payments };
  }

  async refundPayment(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new RpcException({ statusCode: 404, message: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED') {
      throw new RpcException({
        statusCode: 409,
        message: `Cannot refund a payment with status ${payment.status}`,
      });
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        failureReason: dto.reason ?? 'Refund requested',
      },
    });
  }
}
