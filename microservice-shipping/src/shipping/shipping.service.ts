import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async createShipment(dto: CreateShipmentDto, userId: string) {
    const existing = await this.prisma.shipment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'A shipment already exists for this order',
      });
    }

    return this.prisma.shipment.create({
      data: {
        orderId: dto.orderId,
        userId,
        carrier: dto.carrier,
        estimatedDelivery: dto.estimatedDelivery
          ? new Date(dto.estimatedDelivery)
          : null,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
      },
    });
  }

  async getShipmentByOrder(orderId: string, userId: string, isAdmin: boolean) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
    });

    if (!shipment) {
      throw new RpcException({
        statusCode: 404,
        message: 'Shipment not found for this order',
      });
    }

    if (!isAdmin && shipment.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return shipment;
  }

  async getShipmentByTracking(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { trackingNumber },
    });

    if (!shipment) {
      throw new RpcException({
        statusCode: 404,
        message: 'No shipment found with that tracking number',
      });
    }

    // Public — return only tracking-relevant fields
    return {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      city: shipment.city,
      country: shipment.country,
      updatedAt: shipment.updatedAt,
    };
  }

  async getMyShipments(userId: string, page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.shipment.count({ where: { userId } }),
    ]);
    return { total, page, list: shipments };
  }

  async getAllShipments(page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.shipment.count(),
    ]);
    return { total, page, list: shipments };
  }

  async updateStatus(shipmentId: string, dto: UpdateShipmentStatusDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new RpcException({ statusCode: 404, message: 'Shipment not found' });
    }

    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: dto.status },
    });
  }
}
