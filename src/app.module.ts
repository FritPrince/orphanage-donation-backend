import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Validation automatique de tous les DTOs sur toutes les routes
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
    // JWT vérifié sur toutes les routes par défaut (sauf @Public())
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Rôles vérifiés après JWT
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
