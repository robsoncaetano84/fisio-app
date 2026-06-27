import * as Joi from 'joi';

type EnvConfig = Record<string, unknown>;

const PLACEHOLDER_SECRET_PATTERNS = [
  /troque/i,
  /placeholder/i,
  /jwt_secret/i,
  /refresh_secret/i,
  /invite_secret/i,
  /segredo/i,
  /secret_forte/i,
  /secret_muito_forte/i,
  /^change-me$/i,
];

const getString = (env: EnvConfig, key: string): string => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const getNumber = (env: EnvConfig, key: string): number => {
  const value = env[key];
  return typeof value === 'number' ? value : Number(value);
};

const isStrongProductionSecret = (value: string): boolean =>
  value.length >= 32 &&
  !PLACEHOLDER_SECRET_PATTERNS.some((pattern) => pattern.test(value));

const validateProductionEnvironment = (env: EnvConfig) => {
  const isProduction = getString(env, 'NODE_ENV') === 'production';
  const errors: string[] = [];
  const poolMax = getNumber(env, 'DB_POOL_MAX');
  const poolMin = getNumber(env, 'DB_POOL_MIN');

  if (
    Number.isFinite(poolMin) &&
    Number.isFinite(poolMax) &&
    poolMin > poolMax
  ) {
    errors.push('DB_POOL_MIN nao pode ser maior que DB_POOL_MAX');
  }

  if (!isProduction) {
    if (errors.length > 0) {
      throw new Error(`Configuracao invalida: ${errors.join('; ')}`);
    }

    return env;
  }

  const requireFlag = (key: string, expected: string) => {
    if (getString(env, key) !== expected) {
      errors.push(`${key} deve ser ${expected} em producao`);
    }
  };

  const requireValue = (key: string) => {
    if (!getString(env, key)) {
      errors.push(`${key} obrigatorio em producao`);
    }
  };

  const requireStrongSecret = (key: string) => {
    const value = getString(env, key);
    if (!isStrongProductionSecret(value)) {
      errors.push(
        `${key} deve ter pelo menos 32 caracteres e nao ser placeholder`,
      );
    }
  };

  requireFlag('DB_SSL', 'true');
  requireFlag('TRUST_PROXY', 'true');
  requireFlag('DB_MIGRATIONS_RUN', 'false');
  requireValue('CORS_ORIGIN');
  requireValue('SUPABASE_URL');
  requireValue('SUPABASE_SERVICE_ROLE_KEY');
  requireValue('SUPABASE_STORAGE_BUCKET');
  requireValue('CONSENT_TERMS_VERSION');
  requireValue('CONSENT_PRIVACY_VERSION');
  requireValue('CONSENT_RESEARCH_VERSION');
  requireValue('CONSENT_AI_VERSION');
  requireValue('CONSENT_PROFESSIONAL_LGPD_VERSION');
  requireStrongSecret('JWT_SECRET');
  requireStrongSecret('REFRESH_SECRET');
  requireStrongSecret('INVITE_SECRET');

  if (getString(env, 'CORS_ORIGIN').includes('*')) {
    errors.push('CORS_ORIGIN nao pode conter wildcard em producao');
  }

  if (getString(env, 'SENTRY_REQUIRED') === 'true') {
    requireValue('SENTRY_DSN');
  }

  if (errors.length > 0) {
    throw new Error(`Configuracao de producao invalida: ${errors.join('; ')}`);
  }

  return env;
};

export const envValidationSchema = Joi.object({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  REFRESH_SECRET: Joi.string().required(),
  REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().default('development'),
  CORS_ORIGIN: Joi.string().allow('').optional(),
  HTTPS_KEY_PATH: Joi.string().allow('').optional(),
  HTTPS_CERT_PATH: Joi.string().allow('').optional(),
  DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('false'),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.string()
    .valid('true', 'false')
    .default('true'),
  DB_POOL_MAX: Joi.number().integer().min(1).max(100).default(10),
  DB_POOL_MIN: Joi.number().integer().min(0).max(100).default(0),
  DB_POOL_IDLE_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  DB_POOL_CONNECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .default(10000),
  DB_STATEMENT_TIMEOUT_MS: Joi.number().integer().min(1000).default(30000),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(60),
  LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_WINDOW_MIN: Joi.number().default(15),
  LOCKOUT_DURATION_MIN: Joi.number().default(30),
  REDIS_URL: Joi.string().allow('').optional(),
  REDIS_KEY_PREFIX: Joi.string().allow('').default('fisio-app'),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  CACHE_HEAVY_TTL_SECONDS: Joi.number().integer().min(1).default(120),
  ALLOW_ADMIN_REGISTRATION: Joi.string()
    .valid('true', 'false')
    .default('false'),
  MASTER_ADMIN_EMAILS: Joi.string().allow('').optional(),
  MASTER_ADMIN_PERMISSIONS: Joi.string().allow('').optional(),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().allow('').optional(),
  OPENAI_LAUDO_MODEL: Joi.string().allow('').optional(),
  OPENAI_LAUDO_REFERENCE_MODEL: Joi.string().allow('').optional(),
  OPENAI_EXAM_MODEL: Joi.string().allow('').optional(),
  OPENAI_ATIVIDADE_MODEL: Joi.string().allow('').optional(),
  OPENAI_CHARLES_MODEL: Joi.string().allow('').optional(),
  OPENAI_EXAM_AI_ENABLED: Joi.string().valid('true', 'false').default('true'),
  OPENAI_LAUDO_WEB_REFERENCES_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true'),
  OPENAI_CHARLES_AI_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true'),
  OPENAI_LAUDO_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  OPENAI_LAUDO_REFERENCES_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .optional(),
  OPENAI_EXAM_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  OPENAI_ATIVIDADE_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  OPENAI_CHARLES_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  SUPABASE_URL: Joi.string().allow('').optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
  SUPABASE_STORAGE_BUCKET: Joi.string().allow('').optional(),
  INVITE_SECRET: Joi.string().allow('').optional(),
  PATIENT_INVITE_BASE_URL: Joi.string().allow('').optional(),
  CONSENT_TERMS_VERSION: Joi.string().allow('').optional(),
  CONSENT_PRIVACY_VERSION: Joi.string().allow('').optional(),
  CONSENT_RESEARCH_VERSION: Joi.string().allow('').optional(),
  CONSENT_AI_VERSION: Joi.string().allow('').optional(),
  CONSENT_PROFESSIONAL_LGPD_VERSION: Joi.string().allow('').optional(),
  EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
  APP_VERSION: Joi.string().allow('').optional(),
  SENTRY_REQUIRED: Joi.string().valid('true', 'false').default('false'),
  SENTRY_DSN: Joi.string().allow('').optional(),
}).custom(validateProductionEnvironment, 'production environment guardrails');
