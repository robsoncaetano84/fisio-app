import * as Joi from 'joi';

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
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(60),
  LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_WINDOW_MIN: Joi.number().default(15),
  LOCKOUT_DURATION_MIN: Joi.number().default(30),
  REDIS_URL: Joi.string().allow('').optional(),
  COMMUNITY_WEB_URL: Joi.string().allow('').optional(),
  COMMUNITY_COOKIE_DOMAIN: Joi.string().allow('').optional(),
  COMMUNITY_SESSION_COOKIE_MAX_AGE_MS: Joi.number()
    .integer()
    .min(60000)
    .optional(),
  COMMUNITY_S3_BUCKET: Joi.string().allow('').optional(),
  COMMUNITY_S3_REGION: Joi.string().allow('').optional(),
  COMMUNITY_S3_ENDPOINT: Joi.string().allow('').optional(),
  COMMUNITY_S3_PUBLIC_BASE_URL: Joi.string().allow('').optional(),
  COMMUNITY_S3_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  COMMUNITY_S3_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  COMMUNITY_AI_MODEL: Joi.string().allow('').optional(),
  COMMUNITY_AI_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
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
  EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
  APP_VERSION: Joi.string().allow('').optional(),
  SENTRY_DSN: Joi.string().allow('').optional(),
});
