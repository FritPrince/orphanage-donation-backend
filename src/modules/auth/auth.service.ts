import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<Tokens> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async loginOrRegisterWithOAuth(data: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<Tokens> {
    // Cherche si ce provider OAuth existe déjà
    const authProvider = await this.prisma.authProvider.findUnique({
      where: {
        provider_providerId: {
          provider: data.provider,
          providerId: data.providerId,
        },
      },
      include: { user: true },
    });

    if (authProvider) {
      return this.generateTokens(
        authProvider.user.id,
        authProvider.user.email,
        authProvider.user.role,
      );
    }

    // Sinon : cherche un compte avec cet email ou en crée un
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          isVerified: true,
        },
      });
    }

    // Lie le provider OAuth au compte
    await this.prisma.authProvider.create({
      data: {
        provider: data.provider,
        providerId: data.providerId,
        userId: user.id,
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  private readonly ACCESS_TTL = 7 * 24 * 60 * 60; // 7 jours en secondes
  private readonly REFRESH_TTL = 30 * 24 * 60 * 60; // 30 jours en secondes

  private generateTokens(userId: string, email: string, role: string): Tokens {
    const payload = { sub: userId, email, role };

    return {
      accessToken: this.jwt.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: this.ACCESS_TTL,
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: this.REFRESH_TTL,
      }),
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }
}
