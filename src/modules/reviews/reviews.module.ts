import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, TestimonialsController } from './reviews.controller';

@Module({
  controllers: [ReviewsController, TestimonialsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
