import { IsString, IsOptional, IsEnum, IsNumber, IsPositive, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NeedCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateNeedDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: NeedCategory })
  @IsEnum(NeedCategory)
  category: NeedCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  targetAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
