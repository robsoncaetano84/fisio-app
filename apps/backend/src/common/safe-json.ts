export const parseJsonValue = (raw: string | null | undefined): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const parseJsonObject = (
  raw: string | null | undefined,
): Record<string, unknown> | null => {
  const parsed = parseJsonValue(raw);
  return isRecord(parsed) ? parsed : null;
};
