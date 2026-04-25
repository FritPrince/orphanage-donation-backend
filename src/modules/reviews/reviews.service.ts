import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { TestimonialStatus, Role } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(orphanageId: string, userId: string, dto: CreateReviewDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    const existing = await this.prisma.review.findUnique({
      where: { userId_orphanageId: { userId, orphanageId } },
    });
    if (existing) throw new ConflictException('Vous avez déjà noté cet orphelinat');

    return this.prisma.review.create({
      data: { userId, orphanageId, ...dto },
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findReviews(orphanageId: string) {
    const [reviews, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { orphanageId },
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.review.aggregate({
        where: { orphanageId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      data: reviews,
      average: aggregate._avg.rating ?? 0,
      total: aggregate._count,
    };
  }

  async deleteReview(id: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Avis introuvable');
    if (review.userId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.prisma.review.delete({ where: { id } });
    return { message: 'Avis supprimé' };
  }

  async createTestimonial(userId: string, dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: { userId, ...dto },
      select: { id: true, content: true, imageUrl: true, status: true, createdAt: true },
    });
  }

  async findTestimonials(orphanageId?: string) {
    return this.prisma.testimonial.findMany({
      where: {
        status: TestimonialStatus.APPROVED,
        ...(orphanageId && { orphanageId }),
      },
      select: {
        id: true, content: true, imageUrl: true, createdAt: true,
        user: { select: { id: true, name: true } },
        orphanage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async moderateTestimonial(id: string, status: TestimonialStatus) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundException('Témoignage introuvable');

    return this.prisma.testimonial.update({
      where: { id },
      data: { status },
      select: { id: true, content: true, status: true },
    });
  }
}
