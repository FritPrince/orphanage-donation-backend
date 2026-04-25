import { Controller, Get, Post, Delete, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TestimonialStatus, Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('orphanages/:orphanageId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Avis d\'un orphelinat avec note moyenne' })
  findAll(@Param('orphanageId') orphanageId: string) {
    return this.reviewsService.findReviews(orphanageId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Laisser un avis (1 par utilisateur par orphelinat)' })
  create(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(orphanageId, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un avis (auteur ou SUPER_ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reviewsService.deleteReview(id, user.id, user.role);
  }
}

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Témoignages approuvés' })
  @ApiQuery({ name: 'orphanageId', required: false })
  findAll(@Query('orphanageId') orphanageId?: string) {
    return this.reviewsService.findTestimonials(orphanageId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soumettre un témoignage' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTestimonialDto) {
    return this.reviewsService.createTestimonial(user.id, dto);
  }

  @Patch(':id/moderate')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modérer un témoignage (SUPER_ADMIN)' })
  moderate(@Param('id') id: string, @Query('status') status: TestimonialStatus) {
    return this.reviewsService.moderateTestimonial(id, status);
  }
}
