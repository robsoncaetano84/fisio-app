// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// SENTRY
// ==========================================
import * as SentryNative from "@sentry/react-native";

type SentryUser = {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
} | null;

type SentryFacade = {
  wrap: typeof SentryNative.wrap;
  setUser: (user: SentryUser) => void;
};

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  SentryNative.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? "development" : "production"),
  });
  initialized = true;
}

const wrap: typeof SentryNative.wrap = (component, options) =>
  initialized ? SentryNative.wrap(component, options) : component;

export const Sentry: SentryFacade = {
  wrap,
  setUser: (user) => {
    if (!initialized) return;

    if (!user) {
      SentryNative.setUser(null);
      SentryNative.setTag("role", "");
      return;
    }

    const { role, ...sentryUser } = user;
    SentryNative.setUser(sentryUser);
    SentryNative.setTag("role", role || "");
  },
};
