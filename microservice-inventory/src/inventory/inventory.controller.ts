import { Controller, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('inventory.create')
  async createInventory(@Payload() payload: any) {
    const { createInventoryDto } = payload;
    return await this.inventoryService.createInventory(createInventoryDto);
  }

  @MessagePattern('inventory.get')
  async getInventory(@Payload() payload: any) {
    const { productId } = payload;
    return await this.inventoryService.getInventory(productId);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('inventory.list')
  async getInventoryList(@Payload() payload: any) {
    const { page, pageSize } = payload;
    return await this.inventoryService.listInventory(page, pageSize);
  }

  @MessagePattern('inventory.availability')
  async checkAvailability(@Payload() payload: any) {
    const { productId, quantity } = payload;
    return await this.inventoryService.checkAvailability(productId, quantity);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('inventory.restock')
  async restock(@Payload() payload: any) {
    const { productId, restockDto } = payload;
    return await this.inventoryService.restock(productId, restockDto);
  }

  // Internal, service-to-service call (e.g. from the Order service when an
  // order is placed). Not exposed through the gateway's public HTTP API.
  @MessagePattern('inventory.decrement')
  async decrement(@Payload() payload: any) {
    const { productId, decrementDto } = payload;
    return await this.inventoryService.decrement(productId, decrementDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('inventory.adjust')
  async adjust(@Payload() payload: any) {
    const { productId, adjustDto } = payload;
    return await this.inventoryService.adjust(productId, adjustDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('inventory.delete')
  async deleteInventory(@Payload() payload: any) {
    const { productId } = payload;
    return await this.inventoryService.deleteInventory(productId);
  }
}
