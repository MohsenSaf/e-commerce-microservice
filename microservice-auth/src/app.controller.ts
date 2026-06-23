import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { MessagePattern, RpcException } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @MessagePattern('register')
  async signup(@Body() dto: CreateUserDto) {
    const hashedPassword = await this.appService.hashPassword(dto.password);
    const user = await this.appService['prisma'].user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
      },
    });

    const tokens = await this.appService.generateTokens(user.id);
    await this.appService.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...user, password: undefined, tokens };
  }

  @MessagePattern('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.appService.validator(
      loginDto.password,
      loginDto.email,
      loginDto.username,
    );

    const tokens = await this.appService.generateTokens(user.id);

    await this.appService.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...user, password: undefined, refreshToken: undefined, tokens };
  }

  @MessagePattern('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const isValid = await this.appService.validateRefreshToken(
      dto.userId,
      dto.refreshToken,
    );
    if (!isValid)
      throw new RpcException({
        statusCode: 401,
        message: 'User is not login',
        code: 'AUTH_INVALID_CREDENTIALS',
      });

    const tokens = await this.appService.generateTokens(dto.userId);
    await this.appService.updateRefreshToken(dto.userId, tokens.refreshToken);

    return tokens;
  }

  @MessagePattern('logout')
  async logout(@Body() dto: LogoutDto) {
    await this.appService.removeRefreshToken(dto.userId);
    return { message: 'Logged out' };
  }
}
