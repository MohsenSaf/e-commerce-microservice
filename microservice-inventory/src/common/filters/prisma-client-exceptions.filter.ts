import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/generate/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    let message = 'Database error';
    let statusCode = 500;

    console.log(exception);

    switch (exception.code) {
      case 'P2002': // Unique constraint failed
        message = `Unique constraint failed on field: ${exception.meta?.target}`;
        statusCode = HttpStatus.CONFLICT;
        break;
      case 'P2025': // Record not found
        message = `Record not found`;
        statusCode = HttpStatus.NOT_FOUND;
        break;
      case 'P2003': // Foreign key constraint failed
        message = `Foreign key constraint failed: ${exception.meta?.constraint}`;
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      default:
        message = `Prisma error: ${exception.message}`;
        break;
    }

    return super.catch(new RpcException({ statusCode, message }), host);
  }
}
