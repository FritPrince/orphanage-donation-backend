import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Google OAuth uniquement si les credentials sont configurés dans .env
const conditionalProviders = process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : [];

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...conditionalProviders],
  exports: [AuthService],
})
export class AuthModule {}
