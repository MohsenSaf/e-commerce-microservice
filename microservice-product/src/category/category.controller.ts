import { Roles } from '@/common/decorators/roles.decorator';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Controller, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('category.create')
  async createCategory(@Payload() payload: any) {
    const { createCategoryDto } = payload;
    return await this.categoryService.createCategory(createCategoryDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('category.update')
  async updateCategory(@Payload() payload: any) {
    const { updateCategoryDto, id } = payload;
    return await this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('category.delete')
  async deleteCategory(@Payload() payload: any) {
    const { id } = payload;
    return await this.categoryService.deleteCategory(id);
  }

  @MessagePattern('category.list')
  async getCategoryList(@Payload() payload: any) {
    const { searchText } = payload;
    return await this.categoryService.getCategoryList(searchText);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('category.insert')
  async insertProductToCategory(@Payload() payload: any) {
    const { insertCategoryDto, categoryId } = payload;
    return await this.categoryService.insertProductToCategory(
      categoryId,
      insertCategoryDto,
    );
  }
}
