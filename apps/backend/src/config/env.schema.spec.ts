import { envValidationSchema } from './env.schema';

const baseEnv = {
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'fisio_app',
  JWT_SECRET: 'troque-por-um-segredo-forte',
  REFRESH_SECRET: 'troque-por-um-refresh-secret-forte',
};

const productionEnv = {
  ...baseEnv,
  NODE_ENV: 'production',
  DB_SSL: 'true',
  DB_MIGRATIONS_RUN: 'false',
  TRUST_PROXY: 'true',
  CORS_ORIGIN: 'https://app.example.com',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  SUPABASE_STORAGE_BUCKET: 'paciente-exames',
  CONSENT_TERMS_VERSION: 'terms-prod-test',
  CONSENT_PRIVACY_VERSION: 'privacy-prod-test',
  CONSENT_RESEARCH_VERSION: 'research-prod-test',
  CONSENT_AI_VERSION: 'ai-prod-test',
  CONSENT_PROFESSIONAL_LGPD_VERSION: 'professional-lgpd-prod-test',
  JWT_SECRET: 'jwt'.padEnd(32, 'a'),
  REFRESH_SECRET: 'refresh'.padEnd(32, 'b'),
  INVITE_SECRET: 'invite'.padEnd(32, 'c'),
};

describe('envValidationSchema', () => {
  it('permite ambiente local sem Supabase e com placeholders', () => {
    const { error } = envValidationSchema.validate(baseEnv);

    expect(error).toBeUndefined();
  });

  it('rejeita pool minimo maior que pool maximo', () => {
    const { error } = envValidationSchema.validate({
      ...baseEnv,
      DB_POOL_MIN: 6,
      DB_POOL_MAX: 5,
    });

    expect(error?.message).toContain(
      'DB_POOL_MIN nao pode ser maior que DB_POOL_MAX',
    );
  });

  it('rejeita producao sem guardrails obrigatorios', () => {
    const { error } = envValidationSchema.validate({
      ...baseEnv,
      NODE_ENV: 'production',
      DB_SSL: 'false',
      TRUST_PROXY: 'false',
      DB_MIGRATIONS_RUN: 'true',
      CORS_ORIGIN: '*',
      INVITE_SECRET: 'INVITE_SECRET_FORTE',
    });

    expect(error?.message).toContain('Configuracao de producao invalida');
    expect(error?.message).toContain('DB_SSL deve ser true em producao');
    expect(error?.message).toContain('TRUST_PROXY deve ser true em producao');
    expect(error?.message).toContain('SUPABASE_URL obrigatorio em producao');
    expect(error?.message).toContain(
      'CONSENT_TERMS_VERSION obrigatorio em producao',
    );
    expect(error?.message).toContain('CORS_ORIGIN nao pode conter wildcard');
  });

  it('aceita producao com secrets fortes, SSL, proxy e Supabase configurados', () => {
    const { error } = envValidationSchema.validate(productionEnv);

    expect(error).toBeUndefined();
  });
});
