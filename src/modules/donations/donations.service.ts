import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { QueryDonationsDto } from './dto/query-donations.dto';
import { DonationStatus } from '@prisma/client';
import { NeedsService } from '../needs/needs.service';

const DONATION_SELECT = {
  id: true,
  amount: true,
  currency: true,
  isAnonymous: true,
  note: true,
  status: true,
  createdAt: true,
  orphanage: { select: { id: true, name: true, slug: true } },
  need: { select: { id: true, title: true, category: true } },
  campaign: { select: { id: true, title: true } },
  donor: { select: { id: true, firstName: true, lastName: true } },
  payment: { select: { id: true, provider: true, providerPaymentId: true } },
};

@Injectable()
export class DonationsService {
  constructor(
    private prisma: PrismaService,
    private needsService: NeedsService,
  ) {}

  async create(donorId: string | null, dto: CreateDonationDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: dto.orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    if (dto.needId) {
      const need = await this.prisma.need.findUnique({ where: { id: dto.needId } });
      if (!need) throw new NotFoundException('Besoin introuvable');
      if (need.status === 'FUNDED') throw new BadRequestException('Ce besoin est déjà financé');
    }

    const existing = await this.prisma.payment.findUnique({ where: { providerPaymentId: dto.providerPaymentId } });
    if (existing) throw new BadRequestException('Ce paiement existe déjà');

    const donation = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: donorId,
          provider: dto.provider,
          providerPaymentId: dto.providerPaymentId,
          amount: dto.amount,
          currency: dto.currency ?? 'XOF',
          status: DonationStatus.CONFIRMED,
        },
      });

      return tx.donation.create({
        data: {
          donorId,
          orphanageId: dto.orphanageId,
          needId: dto.needId,
          campaignId: dto.campaignId,
          paymentId: payment.id,
          amount: dto.amount,
          currency: dto.currency ?? 'XOF',
          isAnonymous: dto.isAnonymous ?? false,
          note: dto.note,
          status: DonationStatus.CONFIRMED,
        },
        select: DONATION_SELECT,
      });
    });

    if (dto.needId) {
      await this.prisma.need.update({
        where: { id: dto.needId },
        data: { raisedAmount: { increment: dto.amount } },
      });
      await this.needsService.syncStatus(dto.needId);
    }

    if (dto.campaignId) {
      await this.prisma.campaign.update({
        where: { id: dto.campaignId },
        data: { raisedAmount: { increment: dto.amount } },
      });
    }

    return donation;
  }

  async findAll(query: QueryDonationsDto) {
    const { status, orphanageId, needId, campaignId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(orphanageId && { orphanageId }),
      ...(needId && { needId }),
      ...(campaignId && { campaignId }),
    };

    const [donations, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({ where, skip, take: limit, select: DONATION_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.donation.count({ where }),
    ]);

    return {
      data: donations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const donation = await this.prisma.donation.findUnique({ where: { id }, select: DONATION_SELECT });
    if (!donation) throw new NotFoundException('Don introuvable');
    return donation;
  }

  async findMyDonations(userId: string, query: QueryDonationsDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      donorId: userId,
      ...(status && { status }),
    };

    const [donations, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({ where, skip, take: limit, select: DONATION_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.donation.count({ where }),
    ]);

    return {
      data: donations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
