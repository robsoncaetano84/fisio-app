// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// M AI N
// ==========================================
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { initSentry } from './common/observability/sentry';

function parseBooleanEnv(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');
  initSentry();
  const httpsKeyPath = process.env.HTTPS_KEY_PATH;
  const httpsCertPath = process.env.HTTPS_CERT_PATH;
  const isProd = process.env.NODE_ENV === 'production';
  const trustProxy = parseBooleanEnv(process.env.TRUST_PROXY, isProd);
  const httpsOptions =
    httpsKeyPath && httpsCertPath
      ? {
          key: fs.readFileSync(httpsKeyPath),
          cert: fs.readFileSync(httpsCertPath),
        }
      : undefined;

  if (isProd && !httpsOptions && !trustProxy) {
    throw new Error(
      'HTTPS obrigatorio em producao. Configure HTTPS_KEY_PATH/HTTPS_CERT_PATH ou TRUST_PROXY=true (proxy HTTPS).',
    );
  }

  const app = httpsOptions
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);
  if (trustProxy) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }
  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowAllCors =
    !isProd && (!corsOrigins || corsOrigins.length === 0);
  if (isProd && (!corsOrigins || corsOrigins.length === 0)) {
    throw new Error('CORS_ORIGIN obrigatorio em producao');
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    const requestId =
      (req.headers['x-request-id'] as string | undefined)?.trim() ||
      randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const path = req.originalUrl || req.url;
      const message = `${req.method} ${path} -> ${res.statusCode} ${durationMs}ms (requestId=${requestId})`;

      if (res.statusCode >= 500) {
        bootstrapLogger.error(message);
        return;
      }

      if (res.statusCode >= 400) {
        bootstrapLogger.warn(message);
        return;
      }

      bootstrapLogger.log(message);
    });

    next();
  });
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : allowAllCors,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
