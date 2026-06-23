import { Controller, Inject, UseGuards } from '@nestjs/common';
import {
  ClientProxy,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RpcJwtAuthGuard } from '@/common/guards/jwtAuth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('')
export class ReviewController {
  constructor(
    private reviewService: ReviewService,
    @Inject('ORDER_SERVICE') private orderClient: ClientProxy,
  ) {}

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('review.create')
  async createReview(@Payload() payload: any) {
    const {
      createReviewDto,
      user,
    }: { createReviewDto: CreateReviewDto; user: any } = payload;

    // Verify the user has a DELIVERED order containing this product
    const { hasOrdered } = await firstValueFrom(
      this.orderClient.send('order.hasOrderedProduct', {
        userId: user.sub,
        productId: createReviewDto.productId,
      }),
    ).catch(() => ({ hasOrdered: false }));

    if (!hasOrdered) {
      throw new RpcException({
        statusCode: 403,
        message: 'You can only review products from delivered orders',
      });
    }

    return this.reviewService.createReview(user.sub, createReviewDto);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('review.update')
  async updateReview(@Payload() payload: any) {
    const {
      reviewId,
      updateReviewDto,
      user,
    }: { reviewId: string; updateReviewDto: UpdateReviewDto; user: any } =
      payload;
    return this.reviewService.updateReview(reviewId, user.sub, updateReviewDto);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('review.delete')
  async deleteReview(@Payload() payload: any) {
    const { reviewId, user } = payload;
    return this.reviewService.deleteReview(
      reviewId,
      user.sub,
      user.role === 'ADMIN',
    );
  }

  // Public — no auth required
  @MessagePattern('review.getByProduct')
  async getProductReviews(@Payload() payload: any) {
    const { productId, page = 1, pageSize = 10 } = payload;
    return this.reviewService.getProductReviews(productId, page, pageSize);
  }

  // Public — aggregate rating for a product
  @MessagePattern('review.rating')
  async getProductRating(@Payload() payload: any) {
    const { productId } = payload;
    return this.reviewService.getProductRating(productId);
  }

  @UseGuards(RpcJwtAuthGuard)
  @MessagePattern('review.myReviews')
  async getMyReviews(@Payload() payload: any) {
    const { page = 1, pageSize = 10, user } = payload;
    return this.reviewService.getMyReviews(user.sub, page, pageSize);
  }

  @UseGuards(RpcJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @MessagePattern('review.all')
  async getAllReviews(@Payload() payload: any) {
    const { productId, page = 1, pageSize = 10 } = payload;
    // Admin can scope by product or get all
    return this.reviewService.getProductReviews(productId || '', page, pageSize);
  }
}
