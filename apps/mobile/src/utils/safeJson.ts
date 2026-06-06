const parseJsonValue = (raw: string | null | undefined): unknown | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const isJsonRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const parseJsonObject = <T extends object>(
  raw: string | null | undefined,
): T | null => {
  const parsed = parseJsonValue(raw);
  return isJsonRecord(parsed) ? (parsed as T) : null;
};

export const parseJsonArray = <T = unknown>(
  raw: string | null | undefined,
): T[] => {
  const parsed = parseJsonValue(raw);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
};

export const parseJsonArrayOrNull = <T = unknown>(
  raw: string | null | undefined,
): T[] | null => {
  const parsed = parseJsonValue(raw);
  return Array.isArray(parsed) ? (parsed as T[]) : null;
};
