import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrphanageDto } from './dto/create-orphanage.dto';
import { UpdateOrphanageDto } from './dto/update-orphanage.dto';
import { QueryOrphanagesDto } from './dto/query-orphanages.dto';
import { OrphanageStatus, Role } from '@prisma/client';

// Champs retournés dans la liste (léger)
const LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  country: true,
  city: true,
  coverImageUrl: true,
  childrenCount: true,
  status: true,
  lat: true,
  lng: true,
  _count: { select: { donations: true, campaigns: true } },
};

// Champs retournés pour la fiche détaillée (complet)
const DETAIL_SELECT = {
  ...LIST_SELECT,
  description: true,
  address: true,
  phone: true,
  email: true,
  websiteUrl: true,
  verifiedAt: true,
  createdAt: true,
  needs: {
    where: { status: { not: 'FUNDED' as const } },
    select: { id: true, title: true, category: true, targetAmount: true, raisedAmount: true, status: true },
    take: 5,
  },
  campaigns: {
    where: { status: 'ACTIVE' as const },
    select: { id: true, title: true, targetAmount: true, raisedAmount: true, endsAt: true },
    take: 3,
  },
};

@Injectable()
export class OrphanagesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(adminUserId: string, dto: CreateOrphanageDto) {
    const baseSlug = this.slugify(dto.name);
    // Rend le slug unique si un orphelinat avec ce nom existe déjà
    const existing = await this.prisma.orphanage.count({ where: { slug: { startsWith: baseSlug } } });
    const slug = existing > 0 ? `${baseSlug}-${existing + 1}` : baseSlug;

    return this.prisma.orphanage.create({
      data: { ...dto, slug, adminUserId },
      select: LIST_SELECT,
    });
  }

  async findAll(query: QueryOrphanagesDto) {
    const { search, country, city, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(country && { country }),
      ...(city && { city }),
      status: status ?? OrphanageStatus.VERIFIED,
    };

    const [orphanages, total] = await this.prisma.$transaction([
      this.prisma.orphanage.findMany({ where, skip, take: limit, select: LIST_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.orphanage.count({ where }),
    ]);

    return {
      data: orphanages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findForMap() {
    return this.prisma.orphanage.findMany({
      where: { status: OrphanageStatus.VERIFIED, lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, slug: true, lat: true, lng: true, city: true, country: true, coverImageUrl: true },
    });
  }

  async findOne(id: string) {
    const orphanage = await this.prisma.orphanage.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    return orphanage;
  }

  async findBySlug(slug: string) {
    const orphanage = await this.prisma.orphanage.findUnique({
      where: { slug },
      select: DETAIL_SELECT,
    });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    return orphanage;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateOrphanageDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    // Seul l'admin de l'orphelinat ou un SUPER_ADMIN peut modifier
    if (orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.orphanage.update({
      where: { id },
      data: dto,
      select: DETAIL_SELECT,
    });
  }

  async verify(id: string) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    if (orphanage.status === OrphanageStatus.VERIFIED) {
      throw new ConflictException('Orphelinat déjà vérifié');
    }

    return this.prisma.orphanage.update({
      where: { id },
      data: { status: OrphanageStatus.VERIFIED, verifiedAt: new Date() },
      select: { id: true, name: true, status: true, verifiedAt: true },
    });
  }

  async getStats(id: string) {
    const [donationStats, campaignStats, sponsorships] = await this.prisma.$transaction([
      this.prisma.donation.aggregate({
        where: { orphanageId: id, status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.campaign.count({ where: { orphanageId: id } }),
      this.prisma.sponsorship.count({ where: { orphanageId: id, isActive: true } }),
    ]);

    return {
      totalRaised: donationStats._sum.amount ?? 0,
      totalDonations: donationStats._count,
      totalCampaigns: campaignStats,
      activeSponsorships: sponsorships,
    };
  }
}
