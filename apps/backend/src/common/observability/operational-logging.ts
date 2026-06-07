import { Logger } from '@nestjs/common';
import { captureMessage } from './sentry';

type OperationalSeverity = 'info' | 'warning' | 'error';

type OperationalEventOptions = {
  severity?: OperationalSeverity;
  captureToSentry?: boolean;
};

const SENSITIVE_KEYS = [
  'senha',
  'password',
  'token',
  'refreshToken',
  'authorization',
  'cpf',
  'email',
  'nome',
  'nomeCompleto',
  'observacao',
  'descricao',
  'prompt',
  'inputText',
  'outputText',
  'userContent',
  'clinicalText',
];

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, unknown>
    >((acc, [key, item]) => {
      const normalizedKey = key.toLowerCase();
      acc[key] = SENSITIVE_KEYS.some((sensitiveKey) =>
        normalizedKey.includes(sensitiveKey.toLowerCase()),
      )
        ? '[REDACTED]'
        : sanitizeValue(item);
      return acc;
    }, {});
  }

  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 500)}...`;
  }

  return value;
}

export function logOperationalEvent(
  logger: Logger,
  event: string,
  payload: Record<string, unknown> = {},
  options: OperationalEventOptions = {},
) {
  const severity = options.severity || 'info';
  const sanitized = sanitizeValue(payload) as Record<string, unknown>;
  const body = {
    event,
    severity,
    timestamp: new Date().toISOString(),
    appVersion: process.env.APP_VERSION || null,
    ...sanitized,
  };
  const serialized = JSON.stringify(body);

  if (severity === 'error') {
    logger.error(serialized);
  } else if (severity === 'warning') {
    logger.warn(serialized);
  } else {
    logger.log(serialized);
  }

  if (options.captureToSentry) {
    captureMessage(`operational.${event}`, severity, body);
  }
}
