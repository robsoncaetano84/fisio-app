// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// H TT P E XC EP TI ON.F IL TE R
// ==========================================
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { captureException } from '../observability/sentry';
import { isRecord } from '../safe-json';

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
  requestId: string | null;
};

function redactSensitiveUrl(value: string): string {
  return value.replace(
    /([?&](?:token|refreshToken|conviteToken|convite)=)[^&]*/gi,
    '$1[REDACTED]',
  );
}

function isServerStatus(statusCode: number): boolean {
  return statusCode >= 500;
}

function resolveExceptionMessage(
  value: unknown,
  fallback: string,
): string | string[] {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }
  return fallback;
}

function resolveExceptionError(value: unknown, statusCode: number): string {
  if (typeof value === 'string' && value.trim()) return value;
  return isServerStatus(statusCode) ? 'Internal Server Error' : 'Bad Request';
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & {
        requestId?: string;
        user?: { id?: string; email?: string; role?: string };
      }
    >();

    const requestId = request?.requestId ?? null;
    const path = redactSensitiveUrl(request?.originalUrl || request?.url || '');
    const method = request?.method || '';

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (isRecord(exceptionResponse)) {
        message = resolveExceptionMessage(
          exceptionResponse.message,
          exception.message,
        );
        error = resolveExceptionError(exceptionResponse.error, status);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const isServerError = isServerStatus(status);
    if (isServerError) {
      captureException(exception, {
        path,
        method,
        status,
        requestId,
        userId: request?.user?.id ?? null,
        userEmail: request?.user?.email ?? null,
        userRole: request?.user?.role ?? null,
      });
      this.logger.error(
        `${method} ${path} -> ${status} (requestId=${requestId ?? 'n/a'})`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${method} ${path} -> ${status} (requestId=${requestId ?? 'n/a'})`,
      );
    }

    const payload: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      path,
      method,
      timestamp: new Date().toISOString(),
      requestId,
    };

    response.status(status).json(payload);
  }
}
