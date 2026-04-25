import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        locale: true,
        currency: true,
        isAnonymousDonor: true,
        isVerified: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        locale: true,
        currency: true,
        isAnonymousDonor: true,
        isVerified: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async deleteAccount(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Compte supprimé avec succès' };
  }

  async getDonationHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [donations, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where: { donorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          isAnonymous: true,
          note: true,
          createdAt: true,
          orphanage: { select: { id: true, name: true, coverImageUrl: true } },
          campaign: { select: { id: true, title: true } },
          need: { select: { id: true, title: true, category: true } },
        },
      }),
      this.prisma.donation.count({ where: { donorId: userId } }),
    ]);

    return {
      data: donations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTaxReceipts(userId: string) {
    return this.prisma.taxReceipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        year: true,
        amount: true,
        currency: true,
        pdfUrl: true,
        createdAt: true,
        donation: { select: { id: true, createdAt: true } },
      },
    });
  }
}
