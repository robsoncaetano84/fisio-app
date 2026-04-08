export function sanitizePartialUpdate<T extends object>(
  payload: T,
): Partial<T> {
  const entries = Object.entries(payload as Record<string, unknown>).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

