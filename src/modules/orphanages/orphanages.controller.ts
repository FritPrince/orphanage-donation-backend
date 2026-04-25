import {
  Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrphanagesService } from './orphanages.service';
import { CreateOrphanageDto } from './dto/create-orphanage.dto';
import { UpdateOrphanageDto } from './dto/update-orphanage.dto';
import { QueryOrphanagesDto } from './dto/query-orphanages.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Orphanages')
@Controller('orphanages')
export class OrphanagesController {
  constructor(private readonly orphanagesService: OrphanagesService) {}

  // ── Routes publiques ──────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des orphelinats vérifiés (avec filtres et pagination)' })
  findAll(@Query() query: QueryOrphanagesDto) {
    return this.orphanagesService.findAll(query);
  }

  @Public()
  @Get('map')
  @ApiOperation({ summary: 'Coordonnées GPS de tous les orphelinats pour la carte' })
  getMap() {
    return this.orphanagesService.findForMap();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Fiche détaillée d\'un orphelinat' })
  findOne(@Param('id') id: string) {
    return this.orphanagesService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Fiche détaillée par slug (pour les URLs propres)' })
  findBySlug(@Param('slug') slug: string) {
    return this.orphanagesService.findBySlug(slug);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques publiques d\'un orphelinat' })
  getStats(@Param('id') id: string) {
    return this.orphanagesService.getStats(id);
  }

  // ── Routes protégées ──────────────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un orphelinat (ORPHANAGE_ADMIN ou SUPER_ADMIN)' })
  @ApiResponse({ status: 201 })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrphanageDto) {
    return this.orphanagesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un orphelinat' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrphanageDto,
  ) {
    return this.orphanagesService.update(id, user.id, user.role, dto);
  }

  @Patch(':id/verify')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Vérifier / certifier un orphelinat (SUPER_ADMIN uniquement)' })
  verify(@Param('id') id: string) {
    return this.orphanagesService.verify(id);
  }
}
