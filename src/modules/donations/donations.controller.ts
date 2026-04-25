import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { QueryDonationsDto } from './dto/query-donations.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un don (authentifié ou anonyme)' })
  create(@CurrentUser() user: JwtPayload | null, @Body() dto: CreateDonationDto) {
    return this.donationsService.create(user?.id ?? null, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes dons' })
  findMine(@CurrentUser() user: JwtPayload, @Query() query: QueryDonationsDto) {
    return this.donationsService.findMyDonations(user.id, query);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORPHANAGE_ADMIN)
  @ApiOperation({ summary: 'Liste tous les dons (admin)' })
  findAll(@Query() query: QueryDonationsDto) {
    return this.donationsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un don' })
  findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }
}
