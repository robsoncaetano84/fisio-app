// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// FEATURE FLAGS
// ==========================================
const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
};

export type RuntimeFeatureFlags = {
  speechToText: boolean;
  requireAiSuggestionConfirmation: boolean;
  crmAdminWeb?: boolean;
  clinicalOrchestrator?: boolean;
};

const defaultFlags: RuntimeFeatureFlags = {
  speechToText: parseBoolean(
    process.env.EXPO_PUBLIC_ENABLE_SPEECH_TO_TEXT,
    true,
  ),
  requireAiSuggestionConfirmation: parseBoolean(
    process.env.EXPO_PUBLIC_REQUIRE_AI_SUGGESTION_CONFIRMATION,
    true,
  ),
  crmAdminWeb: true,
  clinicalOrchestrator: true,
};

export const FEATURE_FLAGS: RuntimeFeatureFlags = { ...defaultFlags };

export const applyRuntimeFeatureFlags = (
  next: Partial<RuntimeFeatureFlags> | null | undefined,
) => {
  Object.assign(FEATURE_FLAGS, defaultFlags, next || {});
};

