import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEngagementDto } from './dto/create-engagement.dto';
import { EventStatus, Role } from '@prisma/client';

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  location: true,
  imageUrl: true,
  status: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  orphanage: { select: { id: true, name: true, slug: true } },
  _count: { select: { engagements: true } },
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orphanageId: string, userId: string, userRole: string, dto: CreateEventDto) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');
    if (orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.event.create({
      data: {
        ...dto,
        orphanageId,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      select: EVENT_SELECT,
    });
  }

  async findAll(orphanageId: string, status?: EventStatus) {
    const orphanage = await this.prisma.orphanage.findUnique({ where: { id: orphanageId } });
    if (!orphanage) throw new NotFoundException('Orphelinat introuvable');

    return this.prisma.event.findMany({
      where: {
        orphanageId,
        ...(status ? { status } : { status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] } }),
      },
      select: EVENT_SELECT,
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, select: EVENT_SELECT });
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { orphanage: { select: { adminUserId: true } } },
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    if (event.orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Un événement annulé ne peut plus être modifié');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      select: EVENT_SELECT,
    });
  }

  async engage(userId: string, dto: CreateEngagementDto) {
    if (dto.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Événement introuvable');
      if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
        throw new BadRequestException('Cet événement n\'accepte plus de participations');
      }
    }

    return this.prisma.engagement.create({
      data: { userId, ...dto },
      select: {
        id: true, type: true, skills: true, availability: true, message: true, createdAt: true,
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findEngagements(eventId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { orphanage: { select: { adminUserId: true } } },
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    if (event.orphanage.adminUserId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.engagement.findMany({
      where: { eventId },
      select: {
        id: true, type: true, skills: true, availability: true, message: true, createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
