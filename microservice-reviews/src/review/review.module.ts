import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      { name: 'ORDER_SERVICE', transport: Transport.TCP, options: { port: 4005 } },
    ]),
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
