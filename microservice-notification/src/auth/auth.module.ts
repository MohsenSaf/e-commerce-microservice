import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RpcJwtAuthGuard } from '../common/guards/jwtAuth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [RpcJwtAuthGuard],
  exports: [JwtModule, RpcJwtAuthGuard],
})
export class AuthModule {}
