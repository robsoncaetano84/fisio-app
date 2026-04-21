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

export const FEATURE_FLAGS = {
  speechToText: parseBoolean(
    process.env.EXPO_PUBLIC_ENABLE_SPEECH_TO_TEXT,
    true,
  ),
};

