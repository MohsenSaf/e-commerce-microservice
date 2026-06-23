import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RpcJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'rpc') return true; // Only for microservices

    const data = context.switchToRpc().getData();
    const token = data?.token; // Expect token in payload

    if (!token) {
      throw new RpcException({
        statusCode: 401,
        message: 'Missing token',
      });
    }

    try {
      const user = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'secret',
      });
      data.user = user;
      return true;
    } catch (err) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid token',
      });
    }
  }
}
