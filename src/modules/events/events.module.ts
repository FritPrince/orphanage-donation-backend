import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController, EngagementsController } from './events.controller';

@Module({
  controllers: [EventsController, EngagementsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
