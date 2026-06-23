import { AddProductDto } from '@/product/dto/add.dto';
import { UpdateProductDto } from '@/product/dto/update.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generate/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(addProductDto: AddProductDto) {
    return await this.prisma.product.create({
      data: {
        ...addProductDto,
      },
    });
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    return await this.prisma.product.update({
      where: { id: id },
      data: {
        ...updateProductDto,
      },
    });
  }

  async deleteProduct(id: string) {
    return await this.prisma.product.delete({
      where: { id },
    });
  }

  async getProduct(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
    });
  }

  async getProductList(page: number, pageSize: number, searchText?: string) {
    const where: Prisma.ProductWhereInput = searchText
      ? {
          OR: [
            { name: { contains: searchText, mode: 'insensitive' as const } },
            {
              category: {
                is: {
                  name: { contains: searchText, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {};

    if (!pageSize) {
      const allData = await this.prisma.product.findMany({
        where,
      });

      return {
        total: allData.length,
        page: 1,
        list: allData,
      };
    }

    const skip = (page - 1) * pageSize;

    const [data, total] = [
      await this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      await this.prisma.product.count({
        where,
      }),
    ];

    return {
      total,
      page,
      list: data,
    };
  }
}
