import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { CampaignStatus, Role } from '@prisma/client';

const CAMPAIGN_SELECT = {
  id: true,
  title: true,
  description: true,
  coverImageUrl: true,
  targetAmount: true,
  raisedAmount: true,
  currency: true,
  status: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  orphanage: { select: { id: true, name: true, slug: true } },
  _count: { select: { donations: true } },
};

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orphanageId: string, userId: string, userRole: string, dto: CreateCampaignDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    if (orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.campaign.create({
      data: {
        ...dto,
        orphanageId,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      select: CAMPAIGN_SELECT,
    });
  }

  async findAll(orphanageId: string, query: QueryCampaignsDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      orphanageId,
      ...(status ? { status } : { status: CampaignStatus.ACTIVE }),
    };

    const [campaigns, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({ where, skip, take: limit, select: CAMPAIGN_SELECT, orderBy: { startsAt: 'desc' } }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, select: CAMPAIGN_SELECT });
    if (!campaign) throw new NotFoundException('Campagne introuvable');
    return campaign;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { orphanage: { select: { adminUserId: true } } },
    });
    if (!campaign) throw new NotFoundException('Campagne introuvable');
    if (campaign.orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }
    if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
      throw new BadRequestException('Une campagne terminée ou annulée ne peut plus être modifiée');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      select: CAMPAIGN_SELECT,
    });
  }

  async findActive() {
    return this.prisma.campaign.findMany({
      where: { status: CampaignStatus.ACTIVE },
      select: CAMPAIGN_SELECT,
      orderBy: { endsAt: 'asc' },
      take: 20,
    });
  }
}
