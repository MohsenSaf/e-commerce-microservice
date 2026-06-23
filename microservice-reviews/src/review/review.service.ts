import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'You have already reviewed this product',
      });
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async updateReview(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new RpcException({ statusCode: 404, message: 'Review not found' });
    }

    if (review.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
    });
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new RpcException({ statusCode: 404, message: 'Review not found' });
    }

    if (!isAdmin && review.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: 'Forbidden' });
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted' };
  }

  async getProductReviews(productId: string, page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);

    return { total, page, list: reviews };
  }

  async getProductRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      productId,
      averageRating: result._avg.rating
        ? Math.round(result._avg.rating * 10) / 10
        : null,
      totalReviews: result._count.rating,
    };
  }

  async getMyReviews(userId: string, page: number, pageSize: number) {
    const skip = pageSize ? (page - 1) * pageSize : 0;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize || undefined,
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    return { total, page, list: reviews };
  }
}
