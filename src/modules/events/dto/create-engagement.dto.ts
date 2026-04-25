import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEngagementDto {
  @ApiProperty({ enum: ['VOLUNTEER', 'EVENT_PARTICIPATION', 'SOCIAL_SHARE'] })
  @IsString()
  @IsIn(['VOLUNTEER', 'EVENT_PARTICIPATION', 'SOCIAL_SHARE'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Compétences (bénévolat)' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Disponibilités (bénévolat)' })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
