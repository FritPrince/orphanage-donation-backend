import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { OrphanageStatus } from '@prisma/client';

export class QueryOrphanagesDto {
  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Togo' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Lomé' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: OrphanageStatus })
  @IsOptional()
  @IsEnum(OrphanageStatus)
  status?: OrphanageStatus;

  @ApiPropertyOptional({ description: 'Latitude du centre de recherche (pour carte)' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude du centre de recherche (pour carte)' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  lng?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}
