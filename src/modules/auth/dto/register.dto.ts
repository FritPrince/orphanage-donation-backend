import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
