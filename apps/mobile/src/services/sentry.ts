// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// SENTRY
// ==========================================
type SentryUser = {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
} | null;

type SentryLike = {
  init: (options?: Record<string, unknown>) => void;
  wrap: <T>(component: T) => T;
  setUser: (user: SentryUser) => void;
};

// Safe no-op fallback to avoid breaking Expo/Metro dev builds.
// We can swap this back to @sentry/react-native after validating a version compatible
// with the current Expo SDK in a dedicated step.
const noopSentry: SentryLike = {
  init: () => undefined,
  wrap: <T>(component: T) => component,
  setUser: () => undefined,
};

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  // Intentionally no-op for now (dev-build-safe placeholder).
  noopSentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? "development" : "production"),
  });
  initialized = true;
}

export const Sentry = noopSentry;
