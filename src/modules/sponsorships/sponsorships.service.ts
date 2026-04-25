import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { CreateLetterDto } from './dto/create-letter.dto';
import { CreateChildDto } from './dto/create-child.dto';
import { Role } from '@prisma/client';

const SPONSORSHIP_SELECT = {
  id: true,
  amount: true,
  currency: true,
  isActive: true,
  startedAt: true,
  endedAt: true,
  orphanage: { select: { id: true, name: true, slug: true } },
  child: { select: { id: true, firstName: true, birthYear: true, photoUrl: true } },
  sponsor: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { letters: true } },
};

@Injectable()
export class SponsorshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChild(orphanageId: string, userId: string, userRole: string, dto: CreateChildDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    if (orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.child.create({
      data: { ...dto, orphanageId },
    });
  }

  async findChildren(orphanageId: string) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    return this.prisma.child.findMany({
      where: { orphanageId },
      select: {
        id: true,
        firstName: true,
        birthYear: true,
        gender: true,
        photoUrl: true,
        _count: { select: { sponsorships: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(sponsorId: string, dto: CreateSponsorshipDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: dto.orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    if (dto.childId) {
      const child = await this.prisma.child.findUnique({ where: { id: dto.childId } });
      if (!child) throw new NotFoundException('Enfant introuvable');
      if (child.orphanageId !== dto.orphanageId) {
        throw new BadRequestException('Cet enfant n\'appartient pas à cet orphelinat');
      }

      const existing = await this.prisma.sponsorship.findFirst({
        where: { childId: dto.childId, sponsorId, isActive: true },
      });
      if (existing) throw new BadRequestException('Vous parrainez déjà cet enfant');
    }

    return this.prisma.sponsorship.create({
      data: {
        sponsorId,
        orphanageId: dto.orphanageId,
        childId: dto.childId,
        amount: dto.amount,
        currency: dto.currency ?? 'XOF',
      },
      select: SPONSORSHIP_SELECT,
    });
  }

  async findMine(sponsorId: string) {
    return this.prisma.sponsorship.findMany({
      where: { sponsorId },
      select: SPONSORSHIP_SELECT,
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id },
      select: { ...SPONSORSHIP_SELECT, letters: { orderBy: { createdAt: 'asc' }, select: { id: true, fromSponsor: true, content: true, attachmentUrl: true, createdAt: true } } },
    });
    if (!sponsorship) throw new NotFoundException('Parrainage introuvable');

    const isOwner = sponsorship.sponsor.id === userId;
    const isAdmin = userRole === Role.SUPER_ADMIN || userRole === Role.ORPHANAGE_ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Accès refusé');

    return sponsorship;
  }

  async cancel(id: string, userId: string, userRole: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({ where: { id } });
    if (!sponsorship) throw new NotFoundException('Parrainage introuvable');
    if (sponsorship.sponsorId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }
    if (!sponsorship.isActive) throw new BadRequestException('Ce parrainage est déjà inactif');

    return this.prisma.sponsorship.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
      select: SPONSORSHIP_SELECT,
    });
  }

  async addLetter(id: string, userId: string, userRole: string, dto: CreateLetterDto) {
    const sponsorship = await this.prisma.sponsorship.findUnique({ where: { id } });
    if (!sponsorship) throw new NotFoundException('Parrainage introuvable');
    if (!sponsorship.isActive) throw new BadRequestException('Ce parrainage n\'est plus actif');

    const isOwner = sponsorship.sponsorId === userId;
    const isAdmin = userRole === Role.SUPER_ADMIN || userRole === Role.ORPHANAGE_ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Accès refusé');

    return this.prisma.sponsorshipLetter.create({
      data: { sponsorshipId: id, ...dto },
    });
  }
}
