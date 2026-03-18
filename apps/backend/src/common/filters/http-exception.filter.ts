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

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
  requestId: string | null;
};

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
    const path = request?.originalUrl || request?.url || '';
    const method = request?.method || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object'
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        error =
          (body.error as string) ??
          (status >= 500 ? 'Internal Server Error' : 'Bad Request');
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const isServerError = status >= 500;
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
