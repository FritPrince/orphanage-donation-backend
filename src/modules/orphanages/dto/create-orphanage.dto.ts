import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsInt, IsOptional, IsEmail, IsUrl,
  MinLength, MaxLength, Min, IsLatitude, IsLongitude,
} from 'class-validator';

export class CreateOrphanageDto {
  @ApiProperty({ example: 'Orphelinat Espoir' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Un orphelinat dédié aux enfants de la rue...' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 'Togo' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Lomé' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: '12 rue des Enfants, Lomé' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(1)
  childrenCount: number;

  @ApiPropertyOptional({ example: 6.1319 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 1.2228 })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ example: '+22890000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@orphelinat-espoir.tg' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://orphelinat-espoir.tg' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}
