import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  async register(
    @Body() dto: { username: string; email: string; password: string },
  ) {
    return firstValueFrom(this.authClient.send('register', dto));
  }

  @Post('login')
  async login(
    @Body() dto: { email?: string; username?: string; password: string },
  ) {
    return firstValueFrom(this.authClient.send('login', dto));
  }

  @Post('refresh')
  async refresh(@Body() dto: { refreshToken: string }) {
    return firstValueFrom(this.authClient.send('refresh', dto));
  }

  @Post('logout')
  async logout(@Body() dto: { refreshToken: string }) {
    return firstValueFrom(this.authClient.send('logout', dto));
  }
}
