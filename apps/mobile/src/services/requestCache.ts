import { AxiosInstance, AxiosRequestConfig } from "axios";

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const serializeParams = (params?: AxiosRequestConfig["params"]) => {
  if (!params) return "";
  try {
    const keys = Object.keys(params).sort();
    return keys
      .map((key) => `${key}:${JSON.stringify((params as Record<string, unknown>)[key])}`)
      .join("|");
  } catch {
    return "";
  }
};

export const invalidateCachedGet = (prefix: string) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};

export async function cachedGet<T>(
  api: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
  ttlMs = 15_000,
) {
  const key = `${url}?${serializeParams(config?.params)}`;
  const now = Date.now();
  const cached = responseCache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const running = inFlight.get(key) as Promise<T> | undefined;
  if (running) {
    return running;
  }

  const request = api
    .get<T>(url, config)
    .then((response) => {
      responseCache.set(key, {
        data: response.data,
        expiresAt: Date.now() + Math.max(1_000, ttlMs),
      });
      return response.data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

