import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventStatus, Role } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEngagementDto } from './dto/create-engagement.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Events')
@Controller('orphanages/:orphanageId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Événements d\'un orphelinat' })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  findAll(@Param('orphanageId') orphanageId: string, @Query('status') status?: EventStatus) {
    return this.eventsService.findAll(orphanageId, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un événement' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un événement' })
  create(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(orphanageId, user.id, user.role, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un événement' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, user.role, dto);
  }

  @Get(':id/engagements')
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Liste des participants / bénévoles d\'un événement (admin)' })
  findEngagements(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.findEngagements(id, user.id, user.role);
  }
}

@ApiTags('Events')
@Controller('engagements')
export class EngagementsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S\'engager (bénévolat, participation événement, partage)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEngagementDto) {
    return this.eventsService.engage(user.id, dto);
  }
}
