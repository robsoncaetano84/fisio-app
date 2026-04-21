import axios from "axios";
import { isLikelyNetworkError, parseApiError } from "./apiErrors";

export type ExamErrorAction = "load" | "upload" | "open" | "remove";
export type ExamErrorNamespace = "patient" | "patientDetails";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);

export const MAX_EXAME_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_RETRY_DELAY_MS = 500;

const getFileExtension = (fileName?: string) => {
  const value = String(fileName || "").trim().toLowerCase();
  const idx = value.lastIndexOf(".");
  return idx >= 0 ? value.slice(idx) : "";
};

export const isAllowedExamFile = (fileName?: string, mimeType?: string) => {
  const normalizedMime = String(mimeType || "").trim().toLowerCase();
  const extension = getFileExtension(fileName);
  return ALLOWED_MIME_TYPES.has(normalizedMime) || ALLOWED_EXTENSIONS.has(extension);
};

const fallbackKeyByAction: Record<ExamErrorAction, string> = {
  load: "examsLoadError",
  upload: "examUploadError",
  open: "examOpenError",
  remove: "examRemoveError",
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const shouldRetryExamRequest = (error: unknown): boolean => {
  if (isLikelyNetworkError(error)) return true;

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return true;
    const status = error.response?.status;
    if (status === 429) return true;
    if (status && status >= 500) return true;
  }

  return false;
};

export async function withExamRetry<T>(
  operation: () => Promise<T>,
  retries = 1,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetryExamRequest(error)) {
        throw error;
      }
      await sleep(retryDelayMs);
    }
  }

  throw lastError;
}

export const getExamErrorMessage = (
  error: unknown,
  t: TranslateFn,
  namespace: ExamErrorNamespace,
  action: ExamErrorAction,
) => {
  const keyPrefix = `${namespace}.`;
  const fallback = t(`${keyPrefix}${fallbackKeyByAction[action]}`);

  if (isLikelyNetworkError(error)) {
    return t(`${keyPrefix}examErrorNetwork`);
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return t(`${keyPrefix}examErrorNetwork`);
    }
    const status = error.response?.status;
    if (status === 400 || status === 422) {
      return t(`${keyPrefix}examErrorInvalidData`);
    }
    if (status === 401) {
      return t(`${keyPrefix}examErrorSessionExpired`);
    }
    if (status === 403) {
      return t(`${keyPrefix}examErrorForbidden`);
    }
    if (status === 404) {
      return t(`${keyPrefix}examErrorNotFound`);
    }
    if (status === 413) {
      return t(`${keyPrefix}examErrorTooLarge`);
    }
    if (status === 415) {
      return t(`${keyPrefix}examErrorUnsupportedType`);
    }
    if (status === 429) {
      return t(`${keyPrefix}examErrorRateLimit`);
    }
    if (status && status >= 500) {
      return t(`${keyPrefix}examErrorServer`);
    }
  }

  const parsed = parseApiError(error);
  return parsed.message || fallback;
};
