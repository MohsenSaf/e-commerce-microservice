import { CreateInventoryDto } from '@/inventory/dto/create-inventory.dto';
import { RestockDto } from '@/inventory/dto/restock.dto';
import { DecrementDto } from '@/inventory/dto/decrement.dto';
import { AdjustInventoryDto } from '@/inventory/dto/adjust.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createInventory(dto: CreateInventoryDto) {
    return this.prisma.inventory.create({
      data: {
        productId: dto.productId,
        quantity: dto.quantity ?? 0,
      },
    });
  }

  async getInventory(productId: string) {
    return this.prisma.inventory.findUniqueOrThrow({
      where: { productId },
    });
  }

  async listInventory(page: number, pageSize: number) {
    if (!pageSize) {
      const allData = await this.prisma.inventory.findMany();
      return {
        total: allData.length,
        page: 1,
        list: allData,
      };
    }

    const skip = (page - 1) * pageSize;

    const [data, total] = [
      await this.prisma.inventory.findMany({
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      await this.prisma.inventory.count(),
    ];

    return {
      total,
      page,
      list: data,
    };
  }

  async checkAvailability(productId: string, quantity: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
    });

    const available = inventory ? inventory.quantity : 0;

    return {
      productId,
      requested: quantity,
      available,
      isAvailable: available >= quantity,
    };
  }

  async restock(productId: string, dto: RestockDto) {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.update({
        where: { productId },
        data: { quantity: { increment: dto.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: 'RESTOCK',
          quantity: dto.quantity,
          reason: dto.reason,
        },
      });

      return inventory;
    });
  }

  async decrement(productId: string, dto: DecrementDto) {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { productId },
      });

      if (inventory.quantity < dto.quantity) {
        throw new RpcException({
          statusCode: 409,
          message: `Insufficient stock for product ${productId}: requested ${dto.quantity}, available ${inventory.quantity}`,
        });
      }

      const updated = await tx.inventory.update({
        where: { productId },
        data: { quantity: { decrement: dto.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: 'DECREMENT',
          quantity: dto.quantity,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

  async adjust(productId: string, dto: AdjustInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { productId },
      });

      const delta = dto.quantity - inventory.quantity;

      const updated = await tx.inventory.update({
        where: { productId },
        data: { quantity: dto.quantity },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          quantity: delta,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

  async deleteInventory(productId: string) {
    return this.prisma.inventory.delete({
      where: { productId },
    });
  }
}
