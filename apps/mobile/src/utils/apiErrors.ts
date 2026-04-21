// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// API ERRORS
// ==========================================
import axios from "axios";

export type ApiFieldErrors = Record<string, string>;

type ParsedApiError = {
  message: string;
  fieldErrors: ApiFieldErrors;
};

const guessFieldFromMessage = (message: string) => {
  const normalized = (message || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("e-mail") || normalized.includes("email")) {
    return "email";
  }

  if (normalized.includes("senha")) {
    return "senha";
  }

  if (normalized.includes("nome")) {
    return "nome";
  }

  const match = message.match(/^([a-zA-Z0-9_.]+)\s/);
  if (match?.[1]) {
    return match[1];
  }
  return null;
};

const GENERIC_MESSAGE = "Nao foi possivel concluir a operacao";
const SENSITIVE_REPLACEMENT = "[dado protegido]";

const hasTechnicalPattern = (message: string) => {
  const lower = message.toLowerCase();
  return (
    lower.includes("cannot read properties of undefined") ||
    lower.includes("databaseName".toLowerCase()) ||
    lower.includes("typeerror") ||
    lower.includes("exception") ||
    lower.includes("stack") ||
    lower.includes("trace") ||
    lower.includes("syntaxerror") ||
    lower.includes("select ") ||
    lower.includes("insert ") ||
    lower.includes("update ") ||
    lower.includes("delete ") ||
    lower.includes(" at ") && lower.includes(".ts:")
  );
};

const maskSensitiveTokens = (message: string) => {
  let output = message;
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, SENSITIVE_REPLACEMENT);
  output = output.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, SENSITIVE_REPLACEMENT);
  output = output.replace(/\b(?:\+?\d{1,3})?[\s-]?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}\b/g, SENSITIVE_REPLACEMENT);
  return output;
};

const isGenericBackendMessage = (message: string) => {
  const normalized = (message || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized === "conflict" ||
    normalized === "bad request" ||
    normalized === "forbidden" ||
    normalized === "not found" ||
    normalized === "internal server error"
  );
};
const statusMessage = (status?: number): string | null => {
  if (!status) return null;
  if (status === 401) return "Sessao expirada. Faca login novamente";
  if (status === 403) return "Sem permissao para executar esta acao";
  if (status === 404) return "Recurso nao encontrado";
  if (status === 409) return "Conflito de dados. Revise os dados e tente novamente";
  if (status === 422) return "Dados invalidos. Revise os campos obrigatorios";
  if (status === 429) return "Muitas tentativas. Aguarde e tente novamente";
  if (status >= 500) return "Servico indisponivel no momento. Tente novamente";
  return null;
};

const normalizeMessage = (message: string, status?: number) => {
  const raw = (message || "").trim();
  const byStatus = statusMessage(status);
  if (byStatus && isGenericBackendMessage(raw)) return byStatus;

  if (!raw) return GENERIC_MESSAGE;

  const lower = raw.toLowerCase();
  if (lower.includes("timeout") || lower.includes("network error") || lower.includes("failed to fetch")) {
    return "Servidor demorou para responder. Tente novamente em alguns segundos";
  }

  if (lower === "forbidden resource") {
    return "Sem permissao para executar esta acao";
  }

  const masked = maskSensitiveTokens(raw);
  if (hasTechnicalPattern(masked)) {
    return GENERIC_MESSAGE;
  }

  if (masked.length > 180) {
    return GENERIC_MESSAGE;
  }

  return masked;
};

const sanitizeFieldError = (message: string) => {
  const masked = maskSensitiveTokens((message || "").trim());
  if (!masked) return "Campo invalido";
  if (hasTechnicalPattern(masked)) return "Campo invalido";
  return masked.length > 140 ? "Campo invalido" : masked;
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const fieldErrors: ApiFieldErrors = {};

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | {
          message?: string | string[];
          error?: string;
          errors?: Record<string, string | string[]>;
        }
      | string
      | undefined;

    if (data && typeof data === "object") {
      if (data.errors && typeof data.errors === "object") {
        Object.entries(data.errors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            if (value[0]) fieldErrors[key] = sanitizeFieldError(String(value[0]));
          } else if (value) {
            fieldErrors[key] = sanitizeFieldError(String(value));
          }
        });
      }

      if (Array.isArray(data.message)) {
        data.message.forEach((msg) => {
          const field = guessFieldFromMessage(msg);
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = sanitizeFieldError(msg);
          }
        });
        return {
          message: normalizeMessage(data.message[0] || GENERIC_MESSAGE, status),
          fieldErrors,
        };
      }

      if (typeof data.message === "string") {
        const field = guessFieldFromMessage(data.message);
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = sanitizeFieldError(data.message);
        }
        return {
          message: normalizeMessage(data.message, status),
          fieldErrors,
        };
      }

      if (typeof data.error === "string") {
        return {
          message: normalizeMessage(data.error, status),
          fieldErrors,
        };
      }
    }

    if (typeof data === "string") {
      return { message: normalizeMessage(data, status), fieldErrors };
    }

    return {
      message: normalizeMessage(error.message || GENERIC_MESSAGE, status),
      fieldErrors,
    };
  }

  if (error instanceof Error) {
    return { message: normalizeMessage(error.message || GENERIC_MESSAGE), fieldErrors };
  }

  return { message: GENERIC_MESSAGE, fieldErrors };
};

export const isLikelyNetworkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("socket") ||
    message.includes("failed to fetch")
  );
};



