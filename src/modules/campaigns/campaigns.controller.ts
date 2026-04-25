import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@Controller('orphanages/:orphanageId/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des campagnes d\'un orphelinat' })
  findAll(@Param('orphanageId') orphanageId: string, @Query() query: QueryCampaignsDto) {
    return this.campaignsService.findAll(orphanageId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une campagne' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une campagne' })
  create(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(orphanageId, user.id, user.role, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ORPHANAGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier une campagne' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, user.id, user.role, dto);
  }
}
