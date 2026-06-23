import {
  Controller,
  Post,
  Body,
  Inject,
  Req,
  Patch,
  Param,
  Delete,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { RestockDto } from './dto/restock.dto';
import { AdjustInventoryDto } from './dto/adjust.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
  ) {}

  @Post()
  async createInventory(
    @Body() createInventoryDto: CreateInventoryDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.inventoryClient.send('inventory.create', {
        token,
        createInventoryDto,
      }),
    );
  }

  @Get()
  async getInventoryList(
    @Query() query: { page: number; pageSize: number },
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    const { page, pageSize } = query;

    return await firstValueFrom(
      this.inventoryClient.send('inventory.list', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  @Get(':productId')
  async getInventory(@Param('productId') productId: string) {
    return await firstValueFrom(
      this.inventoryClient.send('inventory.get', { productId }),
    );
  }

  @Get(':productId/availability')
  async checkAvailability(
    @Param('productId') productId: string,
    @Query() query: { quantity: number },
  ) {
    return await firstValueFrom(
      this.inventoryClient.send('inventory.availability', {
        productId,
        quantity: Number(query.quantity ?? 1),
      }),
    );
  }

  @Post(':productId/restock')
  async restock(
    @Param('productId') productId: string,
    @Body() restockDto: RestockDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.inventoryClient.send('inventory.restock', {
        token,
        productId,
        restockDto,
      }),
    );
  }

  @Patch(':productId/adjust')
  async adjust(
    @Param('productId') productId: string,
    @Body() adjustDto: AdjustInventoryDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.inventoryClient.send('inventory.adjust', {
        token,
        productId,
        adjustDto,
      }),
    );
  }

  @Delete(':productId')
  @HttpCode(204)
  async deleteInventory(
    @Param('productId') productId: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.inventoryClient.send('inventory.delete', {
        token,
        productId,
      }),
    );
  }
}
