import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUsersDto, QueryPaymentsDto, QueryOrphanagesAdminDto } from './dto/query-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { OrphanageStatus, TestimonialStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalOrphanages,
      pendingOrphanages,
      donationStats,
      activeSponsorships,
      totalCampaigns,
      pendingTestimonials,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.orphanage.count({ where: { status: OrphanageStatus.VERIFIED } }),
      this.prisma.orphanage.count({ where: { status: OrphanageStatus.PENDING } }),
      this.prisma.donation.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.sponsorship.count({ where: { isActive: true } }),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.testimonial.count({ where: { status: TestimonialStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      totalOrphanages,
      pendingOrphanages,
      totalDonations: donationStats._count,
      totalRaised: donationStats._sum.amount ?? 0,
      activeSponsorships,
      totalCampaigns,
      pendingTestimonials,
    };
  }

  async findUsers(query: QueryUsersDto) {
    const { search, role, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true,
          role: true, isVerified: true, createdAt: true,
          _count: { select: { donations: true, sponsorships: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified },
      select: { id: true, email: true, isVerified: true },
    });
  }

  async findOrphanages(query: QueryOrphanagesAdminDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = { ...(status ? { status } : { status: OrphanageStatus.PENDING }) };

    const [orphanages, total] = await this.prisma.$transaction([
      this.prisma.orphanage.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, slug: true, country: true, city: true,
          status: true, verifiedAt: true, createdAt: true,
          admin: { select: { id: true, email: true, name: true } },
          _count: { select: { donations: true, campaigns: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orphanage.count({ where }),
    ]);

    return { data: orphanages, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPayments(query: QueryPaymentsDto) {
    const { status, provider, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(provider && { provider }),
    };

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, provider: true, providerPaymentId: true,
          amount: true, currency: true, status: true, createdAt: true,
          user: { select: { id: true, email: true, name: true } },
          donation: { select: { id: true, orphanageId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPendingTestimonials() {
    return this.prisma.testimonial.findMany({
      where: { status: TestimonialStatus.PENDING },
      select: {
        id: true, content: true, imageUrl: true, status: true, createdAt: true,
        user: { select: { id: true, email: true, name: true } },
        orphanage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
