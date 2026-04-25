import { Controller, Get, Post, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SponsorshipsService } from './sponsorships.service';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { CreateLetterDto } from './dto/create-letter.dto';
import { CreateChildDto } from './dto/create-child.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Sponsorships')
@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un parrainage' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSponsorshipDto) {
    return this.sponsorshipsService.create(user.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes parrainages' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.sponsorshipsService.findMine(user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d\'un parrainage (parrain ou admin)' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sponsorshipsService.findOne(id, user.id, user.role);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un parrainage' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sponsorshipsService.cancel(id, user.id, user.role);
  }

  @Post(':id/letters')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer une lettre dans un parrainage' })
  addLetter(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLetterDto,
  ) {
    return this.sponsorshipsService.addLetter(id, user.id, user.role, dto);
  }
}

@ApiTags('Sponsorships')
@Controller('orphanages/:orphanageId/children')
export class ChildrenController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des enfants d\'un orphelinat (publique)' })
  findAll(@Param('orphanageId') orphanageId: string) {
    return this.sponsorshipsService.findChildren(orphanageId);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ajouter un enfant à un orphelinat' })
  create(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChildDto,
  ) {
    return this.sponsorshipsService.createChild(orphanageId, user.id, user.role, dto);
  }
}
