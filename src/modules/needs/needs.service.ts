import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNeedDto } from './dto/create-need.dto';
import { UpdateNeedDto } from './dto/update-need.dto';
import { QueryNeedsDto } from './dto/query-needs.dto';
import { NeedStatus, Role } from '@prisma/client';

const NEED_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  targetAmount: true,
  raisedAmount: true,
  currency: true,
  imageUrl: true,
  status: true,
  createdAt: true,
  orphanage: { select: { id: true, name: true, slug: true } },
};

@Injectable()
export class NeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orphanageId: string, userId: string, userRole: string, dto: CreateNeedDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    if (orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.need.create({
      data: { ...dto, orphanageId },
      select: NEED_SELECT,
    });
  }

  async findAll(orphanageId: string, query: QueryNeedsDto) {
    const { category, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      orphanageId,
      ...(category && { category }),
      ...(status && { status }),
    };

    const [needs, total] = await this.prisma.$transaction([
      this.prisma.need.findMany({ where, skip, take: limit, select: NEED_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.need.count({ where }),
    ]);

    return {
      data: needs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const need = await this.prisma.need.findUnique({ where: { id }, select: NEED_SELECT });
    if (!need) throw new NotFoundException('Besoin introuvable');
    return need;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateNeedDto) {
    const need = await this.prisma.need.findUnique({
      where: { id },
      include: { orphanage: { select: { adminUserId: true } } },
    });
    if (!need) throw new NotFoundException('Besoin introuvable');
    if (need.orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.need.update({ where: { id }, data: dto, select: NEED_SELECT });
  }

  async remove(id: string, userId: string, userRole: string) {
    const need = await this.prisma.need.findUnique({
      where: { id },
      include: { orphanage: { select: { adminUserId: true } } },
    });
    if (!need) throw new NotFoundException('Besoin introuvable');
    if (need.orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.prisma.need.delete({ where: { id } });
    return { message: 'Besoin supprimé' };
  }

  async syncStatus(id: string) {
    const need = await this.prisma.need.findUnique({ where: { id } });
    if (!need) return;

    if (!need.targetAmount) return;

    const raised = Number(need.raisedAmount);
    const target = Number(need.targetAmount);
    let status: NeedStatus;

    if (raised >= target) status = NeedStatus.FUNDED;
    else if (raised > 0) status = NeedStatus.PARTIALLY_FUNDED;
    else status = NeedStatus.OPEN;

    if (status !== need.status) {
      await this.prisma.need.update({ where: { id }, data: { status } });
    }
  }
}
