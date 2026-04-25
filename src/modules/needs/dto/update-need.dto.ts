import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { NeedStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateNeedDto } from './create-need.dto';

export class UpdateNeedDto extends PartialType(CreateNeedDto) {
  @ApiPropertyOptional({ enum: NeedStatus })
  @IsOptional()
  @IsEnum(NeedStatus)
  status?: NeedStatus;
}
