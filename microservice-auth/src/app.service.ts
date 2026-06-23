import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async validator(password: string, email?: string, username?: string) {
    if (!password) {
      throw new RpcException({
        statusCode: 401,
        message: 'Password is required.',
        code: 'AUTH_MISSING_PASSWORD',
      });
    }
    if (!email && !username) {
      throw new RpcException({
        statusCode: 401,
        message: 'Email or username is required.',
        code: 'AUTH_MISSING_IDENTIFIER',
      });
    }

    let user;
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } else if (username) {
      user = await this.prisma.user.findUnique({
        where: { username },
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new RpcException({
        statusCode: 401,
        message: 'The email/username or password you entered is incorrect.',
        code: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    return user;
  }

  async generateTokens(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const payload = {
      sub: userId,
      email: user?.email,
      username: user?.username,
      role: user?.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '8h',
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async removeRefreshToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) return false;

    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}
