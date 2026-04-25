import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BCRYPT_ROUNDS,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../../common/constants';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<Tokens> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
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

    await this.prisma.authProvider.create({
      data: {
        provider: data.provider,
        providerId: data.providerId,
        userId: user.id,
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  private generateTokens(userId: string, email: string, role: string): Tokens {
    const payload = { sub: userId, email, role };

    return {
      accessToken: this.jwt.sign(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    };
  }
}
