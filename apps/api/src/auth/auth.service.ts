import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { hashToken, randomToken } from '../common/utils/tokens';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  private accessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access-secret-change-me-32chars';
  }

  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret-change-me-32chars';
  }

  private accessExpires() {
    return this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m';
  }

  private refreshExpires(remember: boolean) {
    const def = remember ? '30d' : '7d';
    return this.config.get<string>('JWT_REFRESH_EXPIRES') || def;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const userRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) throw new BadRequestException('Roles not seeded');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName || dto.email.split('@')[0],
        roles: { create: { roleId: userRole.id } },
      },
    });

    const plain = randomToken(24);
    const tokenHash = hashToken(plain);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const apiUrl = this.config.get<string>('API_URL') || 'http://localhost:3000';
    const link = `${apiUrl}/api/auth/verify-email?token=${plain}`;
    await this.mail.send(
      user.email,
      'Verify your email',
      `<p>Click <a href="${link}">verify email</a> (expires in 24h).</p>`,
      `Verify: ${link}`,
    );

    return { message: 'Registered. Check email to verify.', userId: user.id };
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const row = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!row) throw new BadRequestException('Invalid or expired token');
    await this.prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.prisma.emailVerificationToken.deleteMany({ where: { userId: row.userId } });
    return { message: 'Email verified' };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const roles = user.roles.map((r) => r.role.name);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles },
      { secret: this.accessSecret(), expiresIn: this.accessExpires() },
    );

    const refreshPlain = randomToken(48);
    const refreshHash = hashToken(refreshPlain);
    const remember = Boolean(dto.remember);
    const refreshExp = this.refreshExpires(remember);
    const expiresAt = new Date();
    const days = remember ? 30 : 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refreshHash, expiresAt },
    });

    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshPlain, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: days * 86400 * 1000,
      path: '/api/auth',
    });

    return {
      accessToken,
      expiresIn: this.accessExpires(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles,
        emailVerified: !!user.emailVerifiedAt,
      },
    };
  }

  async refresh(req: { cookies?: Record<string, string> }, res: Response) {
    const plain = req.cookies?.refresh_token;
    if (!plain) throw new UnauthorizedException('No refresh token');
    const refreshHash = hashToken(plain);
    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: refreshHash, expiresAt: { gt: new Date() } },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (!row) throw new UnauthorizedException('Invalid refresh token');

    await this.prisma.refreshToken.delete({ where: { id: row.id } });

    const roles = row.user.roles.map((r) => r.role.name);
    const accessToken = await this.jwt.signAsync(
      { sub: row.user.id, email: row.user.email, roles },
      { secret: this.accessSecret(), expiresIn: this.accessExpires() },
    );

    const newPlain = randomToken(48);
    const newHash = hashToken(newPlain);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId: row.user.id, tokenHash: newHash, expiresAt },
    });

    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', newPlain, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 86400 * 1000,
      path: '/api/auth',
    });

    return { accessToken, user: { id: row.user.id, email: row.user.email, roles } };
  }

  async logout(userId: string, res: Response, req: { cookies?: Record<string, string> }) {
    const plain = req.cookies?.refresh_token;
    if (plain) {
      const refreshHash = hashToken(plain);
      await this.prisma.refreshToken.deleteMany({ where: { userId, tokenHash: refreshHash } });
    }
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { message: 'Logged out' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link was sent.' };
    const plain = randomToken(32);
    const tokenHash = hashToken(plain);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:5173';
    const link = `${appUrl}/reset-password?token=${plain}`;
    await this.mail.send(
      email,
      'Password reset',
      `<p>Reset password: <a href="${link}">click here</a> (1 hour).</p>`,
      link,
    );
    return { message: 'If the email exists, a reset link was sent.' };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashToken(token);
    const row = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!row) throw new BadRequestException('Invalid or expired token');
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
    await this.prisma.refreshToken.deleteMany({ where: { userId: row.userId } });
    return { message: 'Password updated' };
  }
}
