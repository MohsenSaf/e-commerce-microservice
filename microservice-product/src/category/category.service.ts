import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
import { Prisma } from '@prisma/generate/client';
import { InsertCategoryDto } from './dto/insertCategory.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: {
        ...createCategoryDto,
      },
    });
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    return await this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
      },
    });
  }

  async deleteCategory(id: string) {
    return await this.prisma.category.delete({ where: { id } });
  }

  async getCategoryList(searchText?: string) {
    const where: Prisma.CategoryWhereInput = searchText
      ? {
          OR: [
            { name: { contains: searchText, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return await this.prisma.category.findMany({ where });
  }

  async insertProductToCategory(
    categoryId: string,
    insertCategoryDto: InsertCategoryDto,
  ) {
    return await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        Product: {
          connect: insertCategoryDto.productIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        name: true,
        Product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
