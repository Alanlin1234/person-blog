import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** Table/column missing — schema not applied (`prisma db push` / migrate). */
const SCHEMA_DRIFT_CODES = new Set(['P2021', 'P2022']);

/**
 * Turns common Prisma connection/schema errors into 503 + JSON hints; other errors
 * are delegated to Nest's default HTTP exception handling.
 */
@Catch()
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      this.replyDbUnavailable(host, exception);
      return;
    }
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      SCHEMA_DRIFT_CODES.has(exception.code)
    ) {
      this.replyDbUnavailable(host, exception);
      return;
    }
    super.catch(exception, host);
  }

  private replyDbUnavailable(
    host: ArgumentsHost,
    exception:
      | Prisma.PrismaClientInitializationError
      | Prisma.PrismaClientUnknownRequestError
      | Prisma.PrismaClientKnownRequestError,
  ): void {
    this.logger.error(exception.message);
    const res = host.switchToHttp().getResponse<Response>();
    const errorCode =
      exception instanceof Prisma.PrismaClientInitializationError
        ? exception.errorCode
        : exception instanceof Prisma.PrismaClientKnownRequestError
          ? exception.code
          : null;

    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        'Database is unavailable or schema is out of sync. For SQLite, set DATABASE_URL=file:./dev.db and run `npx prisma db push` in apps/api. For MySQL, verify DATABASE_URL and that the server is running.',
      errorCode,
    });
  }
}
