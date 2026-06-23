import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Inject,
  HttpCode,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { extractToken } from 'src/utils/extarctToken';

@Controller('reviews')
export class ReviewController {
  constructor(
    @Inject('REVIEW_SERVICE') private readonly reviewClient: ClientProxy,
  ) {}

  // Create a review (must have a delivered order for the product)
  @Post()
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.reviewClient.send('review.create', { token, createReviewDto }),
    );
  }

  // Public: all reviews for a product
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    return firstValueFrom(
      this.reviewClient.send('review.getByProduct', {
        productId,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // Public: average rating for a product
  @Get('product/:productId/rating')
  async getProductRating(@Param('productId') productId: string) {
    return firstValueFrom(
      this.reviewClient.send('review.rating', { productId }),
    );
  }

  // User: their own reviews
  @Get('my')
  async getMyReviews(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.reviewClient.send('review.myReviews', {
        token,
        page: Number(page),
        pageSize: Number(pageSize),
      }),
    );
  }

  // Update own review
  @Patch(':id')
  async updateReview(
    @Param('id') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: Request,
  ) {
    const token = extractToken(req);
    return firstValueFrom(
      this.reviewClient.send('review.update', {
        token,
        reviewId,
        updateReviewDto,
      }),
    );
  }

  // Delete review (own or admin)
  @Delete(':id')
  @HttpCode(200)
  async deleteReview(@Param('id') reviewId: string, @Req() req: Request) {
    const token = extractToken(req);
    return firstValueFrom(
      this.reviewClient.send('review.delete', { token, reviewId }),
    );
  }
}
