// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// API
// ==========================================
import axios, { AxiosHeaders, AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../constants/theme";
import { recordApiMetric } from "./opsMetrics";

const defaultBaseUrl = Platform.select({
  android: "http://192.168.2.100:3000/api",
  ios: "http://localhost:3000/api",
  default: "http://localhost:3000/api",
});

const baseURL =
  (process.env.EXPO_PUBLIC_API_URL || "").trim() || defaultBaseUrl;

const isAndroidEmulator = (() => {
  if (Platform.OS !== "android") return false;
  const constants = (Platform as { constants?: Record<string, unknown> })?.constants || {};
  const fingerprint = String(constants.Fingerprint || constants.fingerprint || "");
  const model = String(constants.Model || constants.model || "");
  return (
    /generic|emulator|sdk_gphone/i.test(fingerprint) ||
    /emulator|sdk/i.test(model)
  );
})();

const normalizeBaseUrlForAndroidEmulator = (url: string) => {
  if (!isAndroidEmulator || !url) return url;

  // In Android emulator, localhost/LAN dev hosts are more reliable via 10.0.2.2.
  return url
    .replace("http://localhost:", "http://10.0.2.2:")
    .replace("https://localhost:", "https://10.0.2.2:")
    .replace("http://127.0.0.1:", "http://10.0.2.2:")
    .replace("https://127.0.0.1:", "https://10.0.2.2:")
    .replace("http://192.168.2.100:", "http://10.0.2.2:");
};

const resolvedBaseURL = normalizeBaseUrlForAndroidEmulator(baseURL);
type RequestMetaConfig = AxiosRequestConfig & {
  _startedAt?: number;
  _correlationId?: string;
};

const createCorrelationId = () =>
  `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let currentCorrelationId = createCorrelationId();
export const getCorrelationId = () => currentCorrelationId;
export const rotateCorrelationId = () => {
  currentCorrelationId = createCorrelationId();
  return currentCorrelationId;
};

export const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 15000,
});

type RefreshResponse = {
  token: string;
  refreshToken: string;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

let onSessionExpired: (() => void | Promise<void>) | null = null;
export const setOnSessionExpired = (
  handler: (() => void | Promise<void>) | null,
) => {
  onSessionExpired = handler;
};
const triggerSessionExpired = async () => {
  if (!onSessionExpired) return;
  await Promise.resolve(onSessionExpired());
};



let isLoggingOut = false;
export const setIsLoggingOut = (value: boolean) => {
  isLoggingOut = value;
};
const refreshAccessToken = async (): Promise<string | null> => {
  if (isLoggingOut) return null;
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const storedRefreshToken = await AsyncStorage.getItem(
      APP_CONFIG.storage.refreshTokenKey,
    );

    if (!storedRefreshToken) {
      return null;
    }

    const response = await refreshClient.post<RefreshResponse>("/auth/refresh", {
      refreshToken: storedRefreshToken,
    });

    const { token, refreshToken } = response.data;

    await AsyncStorage.setItem(APP_CONFIG.storage.tokenKey, token);
    await AsyncStorage.setItem(
      APP_CONFIG.storage.refreshTokenKey,
      refreshToken,
    );

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return token;
  })()
    .catch(() => null)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => {
    const startedAt = Number((response.config as RequestMetaConfig)?._startedAt || Date.now());
    const durationMs = Date.now() - startedAt;
    recordApiMetric(durationMs, true, response.status).catch(() => undefined);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const requestUrl = String(originalRequest?.url || "");
    const isLoginRequest = requestUrl.includes("/auth/login");
    const requestHeaders = originalRequest?.headers as
      | AxiosHeaders
      | Record<string, unknown>
      | undefined;
    const requestAuthHeader =
      requestHeaders instanceof AxiosHeaders
        ? requestHeaders.get("Authorization") || requestHeaders.get("authorization")
        : (requestHeaders?.Authorization as string | undefined) ||
          (requestHeaders?.authorization as string | undefined);
    const defaultAuthHeader = api.defaults.headers.common.Authorization as
      | string
      | undefined;
    const hasAuthContext = Boolean(requestAuthHeader || defaultAuthHeader);

    if (!isLoggingOut &&
      error?.response?.status === 401 &&
      originalRequest &&
      hasAuthContext &&
      !isLoginRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      }

      await triggerSessionExpired();
      if (error?.response?.data) {
        error.response.data.message =
          "Sessao expirada por inatividade. Faca login novamente.";
      }
    }

    if (
      error?.response?.status === 401 &&
      hasAuthContext &&
      !isLoginRequest
    ) {
      await triggerSessionExpired();
      if (error?.response?.data) {
        error.response.data.message =
          "Sessao expirada por inatividade. Faca login novamente.";
      }
    }

    const startedAt = Number((error?.config as RequestMetaConfig)?._startedAt || Date.now());
    const durationMs = Date.now() - startedAt;
    recordApiMetric(durationMs, false, error?.response?.status ?? null).catch(
      () => undefined,
    );

    throw error;
  },
);

api.interceptors.request.use((config) => {
  const nextConfig = config as typeof config & {
    _startedAt?: number;
    _correlationId?: string;
  };
  nextConfig._startedAt = Date.now();
  nextConfig._correlationId = nextConfig._correlationId || currentCorrelationId;
  if (nextConfig.headers instanceof AxiosHeaders) {
    nextConfig.headers.set("X-Correlation-Id", nextConfig._correlationId);
  } else {
    const headers = AxiosHeaders.from(nextConfig.headers || {});
    headers.set("X-Correlation-Id", nextConfig._correlationId);
    nextConfig.headers = headers;
  }
  return nextConfig;
});










