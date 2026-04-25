import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { OrphanagesModule } from '../orphanages/orphanages.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [OrphanagesModule, ReviewsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
