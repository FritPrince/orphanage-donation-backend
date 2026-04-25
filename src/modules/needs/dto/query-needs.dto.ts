import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NeedCategory, NeedStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryNeedsDto {
  @ApiPropertyOptional({ enum: NeedCategory })
  @IsOptional()
  @IsEnum(NeedCategory)
  category?: NeedCategory;

  @ApiPropertyOptional({ enum: NeedStatus })
  @IsOptional()
  @IsEnum(NeedStatus)
  status?: NeedStatus;

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
