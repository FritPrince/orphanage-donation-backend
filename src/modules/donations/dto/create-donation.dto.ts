import { IsString, IsOptional, IsBoolean, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateDonationDto {
  @ApiProperty()
  @IsString()
  orphanageId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  needId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string = 'XOF';

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ description: 'ID de paiement retourné par le prestataire' })
  @IsString()
  providerPaymentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
