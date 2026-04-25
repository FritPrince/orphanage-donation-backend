import { Module } from '@nestjs/common';
import { OrphanagesService } from './orphanages.service';
import { OrphanagesController } from './orphanages.controller';

@Module({
  controllers: [OrphanagesController],
  providers: [OrphanagesService],
  exports: [OrphanagesService],
})
export class OrphanagesModule {}
