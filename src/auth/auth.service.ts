import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as schema from '../drizzle/schema/users'; // Sesuaikan path ke schema baru
import { AppConfig } from '../config/app.config';
import type { JwtPayload } from './types/jwt-payload';
import { LoginInput, RegisterInput } from './auth.schema';
import { NodeMsSqlDatabase } from 'drizzle-orm/node-mssql';
import { Role } from './roles.decorator';

// Tipe data database disesuaikan untuk MSSQL
type Db = NodeMsSqlDatabase<typeof schema>;

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Db,
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
  ) {}

  private async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user;
  }

  async register(dto: RegisterInput) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = (dto.role ?? 'User') as 'Administrator' | 'User';

    // MSSQL biasanya tidak memerlukan penanganan khusus pada .insert()
    // jika schema sudah didefinisikan dengan benar di Drizzle
    await this.db.insert(schema.users).values({
      id,
      name: dto.name,
      email: dto.email,
      passwordHash,
      role,
      isActive: true,
    });

    return { id, name: dto.name, email: dto.email, role };
  }

  async login(dto: LoginInput) {
    const user = await this.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.jwt.accessSecret,
      expiresIn: this.config.jwt.accessExpiresIn,
    });
    const refreshToken = await this.signRefreshToken({ id: user.id });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(rawRefreshToken: string) {
    const jwtCfg = this.config.jwt;

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        rawRefreshToken,
        {
          secret: jwtCfg.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.db._query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const refreshToken = await this.signRefreshToken({ id: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
      },
      accessToken,
      refreshToken,
    };
  }

  private async signAccessToken(user: {
    id: string;
    email: string;
    role: Role;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private async signRefreshToken(user: { id: string }) {
    const jwtCfg = this.config.jwt;
    return this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: jwtCfg.refreshSecret,
        expiresIn: jwtCfg.refreshExpiresIn,
      },
    );
  }
}
