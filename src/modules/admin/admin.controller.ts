import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { QueryUsersDto, QueryPaymentsDto, QueryOrphanagesAdminDto } from './dto/query-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrphanagesService } from '../orphanages/orphanages.service';
import { ReviewsService } from '../reviews/reviews.service';
import { TestimonialStatus } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly orphanagesService: OrphanagesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de la plateforme' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  findUsers(@Query() query: QueryUsersDto) {
    return this.adminService.findUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Changer le rôle d\'un utilisateur' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Activer / désactiver un compte utilisateur' })
  toggleActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Get('orphanages')
  @ApiOperation({ summary: 'Liste des orphelinats (avec filtre statut, défaut: PENDING)' })
  findOrphanages(@Query() query: QueryOrphanagesAdminDto) {
    return this.adminService.findOrphanages(query);
  }

  @Patch('orphanages/:id/verify')
  @ApiOperation({ summary: 'Vérifier / certifier un orphelinat' })
  verifyOrphanage(@Param('id') id: string) {
    return this.orphanagesService.verify(id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Liste des paiements' })
  findPayments(@Query() query: QueryPaymentsDto) {
    return this.adminService.findPayments(query);
  }

  @Get('testimonials/pending')
  @ApiOperation({ summary: 'Témoignages en attente de modération' })
  findPendingTestimonials() {
    return this.adminService.findPendingTestimonials();
  }

  @Patch('testimonials/:id/approve')
  @ApiOperation({ summary: 'Approuver un témoignage' })
  approveTestimonial(@Param('id') id: string) {
    return this.reviewsService.moderateTestimonial(id, TestimonialStatus.APPROVED);
  }

  @Patch('testimonials/:id/reject')
  @ApiOperation({ summary: 'Rejeter un témoignage' })
  rejectTestimonial(@Param('id') id: string) {
    return this.reviewsService.moderateTestimonial(id, TestimonialStatus.REJECTED);
  }
}
