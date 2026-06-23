import { Controller, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('product.create')
  async createProduct(@Payload() payload: any) {
    const { addProductDto } = payload;
    return await this.productService.createProduct(addProductDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('product.update')
  async updateProduct(@Payload() payload: any) {
    const { updateProductDto, id } = payload;
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('product.delete')
  async deleteProduct(@Payload() payload: any) {
    const { id } = payload;
    return await this.productService.deleteProduct(id);
  }

  @MessagePattern('product.get')
  async getProduct(@Payload() payload: any) {
    const { id } = payload;
    return await this.productService.getProduct(id);
  }

  @MessagePattern('product.list')
  async getProductList(@Payload() payload: any) {
    const { page, pageSize, searchText } = payload;

    return await this.productService.getProductList(page, pageSize, searchText);
  }
}
