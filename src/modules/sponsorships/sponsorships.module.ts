import { Module } from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';
import { SponsorshipsController, ChildrenController } from './sponsorships.controller';

@Module({
  controllers: [SponsorshipsController, ChildrenController],
  providers: [SponsorshipsService],
  exports: [SponsorshipsService],
})
export class SponsorshipsModule {}
