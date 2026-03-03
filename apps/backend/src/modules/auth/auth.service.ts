import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          phone: dto.phone,
          role: dto.role as any,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        },
      });

      if (dto.role === 'PARTNER' && dto.partner) {
        const partner = await tx.partner.create({
          data: {
            type: dto.partner.type as any,
            legalName: dto.partner.legalName,
            taxId: dto.partner.taxId,
            phone: dto.partner.phone,
            email: dto.partner.email,
            address: dto.partner.address,
            city: dto.partner.city,
            website: dto.partner.website,
            description: dto.partner.description,
          },
        });
        await tx.partnerUser.create({
          data: {
            partnerId: partner.id,
            userId: created.id,
            role: 'OWNER',
          },
        });
      }

      return created;
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Cuenta suspendida o bloqueada');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'therian-refresh-secret',
      }) as { sub: string; role: string };

      const blacklisted = await this.redis.get(`blacklist:${refreshToken}`);
      if (blacklisted) throw new UnauthorizedException('Token revocado');

      await this.redis.setex(`blacklist:${refreshToken}`, 60 * 60 * 24 * 7, '1');

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException();

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(refreshToken: string) {
    await this.redis.setex(`blacklist:${refreshToken}`, 60 * 60 * 24 * 7, '1');
  }

  private generateTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'therian-access-secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'therian-refresh-secret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
