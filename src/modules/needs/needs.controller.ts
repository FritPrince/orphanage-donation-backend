import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NeedsService } from './needs.service';
import { CreateNeedDto } from './dto/create-need.dto';
import { UpdateNeedDto } from './dto/update-need.dto';
import { QueryNeedsDto } from './dto/query-needs.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Needs')
@Controller('orphanages/:orphanageId/needs')
export class NeedsController {
  constructor(private readonly needsService: NeedsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des besoins d\'un orphelinat' })
  findAll(@Param('orphanageId') orphanageId: string, @Query() query: QueryNeedsDto) {
    return this.needsService.findAll(orphanageId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un besoin' })
  findOne(@Param('id') id: string) {
    return this.needsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un besoin' })
  create(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNeedDto,
  ) {
    return this.needsService.create(orphanageId, user.id, user.role, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un besoin' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNeedDto,
  ) {
    return this.needsService.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer un besoin' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.needsService.remove(id, user.id, user.role);
  }
}
