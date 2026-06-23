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
import { AddProductDto } from './dto/product/add.dto';
import { UpdateProductDto } from './dto/product/update.dto';
import { extractToken } from 'src/utils/extarctToken';
import { CreateCategoryDto } from './dto/category/create.dto';
import { UpdateCategoryDto } from './dto/category/update.dto';
import { InsertCategoryDto } from './dto/category/insertCategory.dto';

@Controller('')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
  ) {}

  @Post('products')
  async createProduct(
    @Body() addProductDto: AddProductDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send('product.create', {
        token,
        addProductDto,
      }),
    );
  }

  @Patch('products/:id')
  async updateProduct(
    @Body() updateProductDto: UpdateProductDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send(`product.update`, {
        token,
        id,
        updateProductDto,
      }),
    );
  }

  @Delete('products/:id')
  @HttpCode(204)
  async deleteProduct(@Param('id') id: string, @Req() req: Request) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send(`product.delete`, {
        token,
        id,
      }),
    );
  }

  @Get('products')
  async getProductList(
    @Query() query: { pageSize: number; page: number; searchText?: string },
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    const { pageSize, page, searchText } = query;
    return await firstValueFrom(
      this.productClient.send('product.list', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
        searchText,
      }),
    );
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return await firstValueFrom(
      this.productClient.send('product.get', {
        id,
      }),
    );
  }

  @Post('categories')
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send('category.create', {
        token,
        createCategoryDto,
      }),
    );
  }

  @Patch('categories/:id')
  async updateCategory(
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send(`category.update`, {
        token,
        id,
        updateCategoryDto,
      }),
    );
  }

  @Delete('categories/:id')
  @HttpCode(204)
  async deleteCategory(@Param('id') id: string, @Req() req: Request) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send(`category.delete`, {
        token,
        id,
      }),
    );
  }

  @Get('categories')
  async getCategoryList(
    @Req() req: Request,
    @Query() query: { searchText?: string },
  ) {
    const token = extractToken(req);

    const { searchText } = query;
    return await firstValueFrom(
      this.productClient.send('category.list', {
        token,
        searchText,
      }),
    );
  }

  @Post('categories/insert/:id')
  async insertProductToCategory(
    @Param('id') categoryId: string,
    @Req() req: Request,
    @Body() insertCategoryDto: InsertCategoryDto,
  ) {
    const token = extractToken(req);

    return await firstValueFrom(
      this.productClient.send(`category.insert`, {
        token,
        categoryId,
        insertCategoryDto,
      }),
    );
  }
}
