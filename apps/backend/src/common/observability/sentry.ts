// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// S EN TR Y
// ==========================================
import * as Sentry from '@sentry/node';

let sentryInitialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || sentryInitialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || undefined,
    tracesSampleRate: 0,
  });

  sentryInitialized = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (!sentryInitialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
