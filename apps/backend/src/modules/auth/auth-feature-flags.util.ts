import { UserRole } from '../usuarios/entities/usuario.entity';

export interface AuthFeatureFlagsResponse {
  speechToText: boolean;
  requireAiSuggestionConfirmation: boolean;
  crmAdminWeb: boolean;
  clinicalOrchestrator: boolean;
  generatedAt: string;
}

type BuildAuthFeatureFlagsParams = {
  email?: string | null;
  role: UserRole;
  getConfig: (key: string) => string | undefined;
  generatedAt?: string;
};

export function parseBooleanConfig(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value == null || value.trim() === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

export function parseFeatureFlagsByEmailConfig(
  raw?: string | null,
): Record<string, Partial<AuthFeatureFlagsResponse>> {
  const normalized = (raw || '').trim();
  if (!normalized) return {};
  try {
    const parsed = JSON.parse(normalized) as Record<
      string,
      Partial<AuthFeatureFlagsResponse>
    >;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function buildAuthFeatureFlags(
  params: BuildAuthFeatureFlagsParams,
): AuthFeatureFlagsResponse {
  const generatedAt = params.generatedAt || new Date().toISOString();
  const defaults: AuthFeatureFlagsResponse = {
    speechToText: parseBooleanConfig(
      params.getConfig('ENABLE_SPEECH_TO_TEXT'),
      true,
    ),
    requireAiSuggestionConfirmation: parseBooleanConfig(
      params.getConfig('REQUIRE_AI_SUGGESTION_CONFIRMATION'),
      true,
    ),
    crmAdminWeb: parseBooleanConfig(
      params.getConfig('ENABLE_CRM_ADMIN_WEB'),
      true,
    ),
    clinicalOrchestrator: parseBooleanConfig(
      params.getConfig('ENABLE_CLINICAL_ORCHESTRATOR'),
      true,
    ),
    generatedAt,
  };

  const overrides = parseFeatureFlagsByEmailConfig(
    params.getConfig('FEATURE_FLAGS_BY_EMAIL'),
  );
  const emailKey = (params.email || '').trim().toLowerCase();
  const userOverride = overrides[emailKey] || overrides['*'] || {};

  const merged: AuthFeatureFlagsResponse = {
    ...defaults,
    ...userOverride,
    generatedAt,
  };

  if (params.role !== UserRole.ADMIN) {
    merged.crmAdminWeb = false;
  }

  return merged;
}
