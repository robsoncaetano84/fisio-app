import {
  buildAuthFeatureFlags,
  parseBooleanConfig,
  parseFeatureFlagsByEmailConfig,
} from './auth-feature-flags.util';
import { UserRole } from '../usuarios/entities/usuario.entity';

describe('auth feature flags util', () => {
  it('parses boolean config with defaults', () => {
    expect(parseBooleanConfig(undefined, true)).toBe(true);
    expect(parseBooleanConfig('', false)).toBe(false);
    expect(parseBooleanConfig('true', false)).toBe(true);
    expect(parseBooleanConfig('1', false)).toBe(true);
    expect(parseBooleanConfig('off', true)).toBe(false);
  });

  it('parses feature flag overrides safely', () => {
    expect(
      parseFeatureFlagsByEmailConfig(
        JSON.stringify({ 'admin@teste.com': { speechToText: false } }),
      ),
    ).toEqual({ 'admin@teste.com': { speechToText: false } });

    expect(parseFeatureFlagsByEmailConfig('invalid-json')).toEqual({});
  });

  it('builds flags from env defaults and email overrides', () => {
    const config: Record<string, string | undefined> = {
      ENABLE_SPEECH_TO_TEXT: 'false',
      REQUIRE_AI_SUGGESTION_CONFIRMATION: 'true',
      ENABLE_CRM_ADMIN_WEB: 'true',
      ENABLE_CLINICAL_ORCHESTRATOR: 'false',
      FEATURE_FLAGS_BY_EMAIL: JSON.stringify({
        'admin@teste.com': {
          speechToText: true,
          clinicalOrchestrator: true,
        },
      }),
    };

    expect(
      buildAuthFeatureFlags({
        email: 'ADMIN@teste.com',
        role: UserRole.ADMIN,
        getConfig: (key) => config[key],
        generatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({
      speechToText: true,
      requireAiSuggestionConfirmation: true,
      crmAdminWeb: true,
      clinicalOrchestrator: true,
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('forces crm admin web off for non-admin users', () => {
    expect(
      buildAuthFeatureFlags({
        email: 'user@teste.com',
        role: UserRole.USER,
        getConfig: () => 'true',
        generatedAt: '2026-01-01T00:00:00.000Z',
      }).crmAdminWeb,
    ).toBe(false);
  });
});
