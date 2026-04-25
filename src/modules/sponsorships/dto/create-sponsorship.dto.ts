import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSponsorshipDto {
  @ApiProperty()
  @IsString()
  orphanageId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  childId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string = 'XOF';
}
