import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLetterDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsBoolean()
  fromSponsor: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
