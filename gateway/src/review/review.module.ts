import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'REVIEW_SERVICE', transport: Transport.TCP, options: { port: 4009 } },
    ]),
  ],
  controllers: [ReviewController],
})
export class ReviewModule {}
