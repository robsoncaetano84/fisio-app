// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// AUDIT TRAIL
// ==========================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackEvent } from "./analytics";

const STORAGE_KEY = "audit:trail:v1";
const MAX_ITEMS = 500;
const REDACTED = "[REDACTED]";

const sensitiveKeyPattern =
  /(nome|name|email|mail|telefone|phone|whatsapp|cpf|rg|document|senha|password|token|text|mensagem|message|descricao|description|observa|content|conteudo)/i;

const idLikeKeyPattern =
  /(^id$|Id$|_id$|^usuarioId$|^pacienteId$|^profissionalId$|^atividadeId$|^laudoId$|^evolucaoId$|^anamneseId$)/i;

export type AuditActionType =
  | "CHECKIN_OFFLINE_ENQUEUED"
  | "CHECKIN_OFFLINE_SYNCED"
  | "CHECKIN_OFFLINE_SYNC_FAILED"
  | "LAUDO_VALIDATED"
  | "LAUDO_REVALIDATION_REQUIRED"
  | "LAUDO_REFERENCE_OPENED"
  | "LAUDO_REFERENCE_CONSULTED_TOGGLED"
  | "LAUDO_PROFESSIONAL_PDF_OPENED"
  | "QUICK_MESSAGE_SENT";

export type AuditEntry = {
  id: string;
  action: AuditActionType;
  at: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

const AUDIT_METADATA_ALLOWLIST: Record<AuditActionType, readonly string[]> = {
  CHECKIN_OFFLINE_ENQUEUED: ["atividadeId", "concluiu"],
  CHECKIN_OFFLINE_SYNCED: ["atividadeId", "retryCount"],
  CHECKIN_OFFLINE_SYNC_FAILED: ["atividadeId", "retryCount"],
  LAUDO_VALIDATED: [
    "laudoId",
    "pacienteId",
    "professionalValidationConfirmed",
    "consultedReferencesCount",
    "totalSuggestedReferences",
  ],
  LAUDO_REVALIDATION_REQUIRED: ["laudoId", "pacienteId"],
  LAUDO_REFERENCE_OPENED: ["laudoId", "pacienteId", "referenceId", "context"],
  LAUDO_REFERENCE_CONSULTED_TOGGLED: [
    "laudoId",
    "pacienteId",
    "referenceId",
    "checked",
  ],
  LAUDO_PROFESSIONAL_PDF_OPENED: [
    "laudoId",
    "pacienteId",
    "pdfType",
    "consultedReferencesCount",
    "totalSuggestedReferences",
    "profile",
  ],
  QUICK_MESSAGE_SENT: ["pacienteId", "templateId"],
};

const parseEntries = (raw: string | null): AuditEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistEntries = async (entries: AuditEntry[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const toAuditRef = (value: unknown): string => {
  const source = String(value ?? "");
  return source ? `audit_${hashString(source)}` : "audit_empty";
};

const looksLikeEmail = (value: string) => /@/.test(value) && /\./.test(value);
const looksLikePhone = (value: string) => /\d{10,}/.test(value.replace(/\D/g, ""));
const looksLikeCpf = (value: string) => /^\d{11}$/.test(value.replace(/\D/g, ""));

const sanitizeValue = (key: string, value: unknown, depth = 0): unknown => {
  if (depth > 4) return "[TRUNCATED]";
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      out[k] = sanitizeValue(k, v, depth + 1);
    });
    return out;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return idLikeKeyPattern.test(key) ? toAuditRef(value) : value;
  }

  if (typeof value === "string") {
    if (idLikeKeyPattern.test(key)) return toAuditRef(value);
    if (sensitiveKeyPattern.test(key)) return REDACTED;
    const trimmed = value.trim();
    if (looksLikeEmail(trimmed) || looksLikePhone(trimmed) || looksLikeCpf(trimmed)) {
      return REDACTED;
    }
    return trimmed.length > 200 ? `${trimmed.slice(0, 200)}...` : trimmed;
  }

  return REDACTED;
};

const sanitizeMetadata = (metadata: Record<string, unknown>): Record<string, unknown> => {
  const safe: Record<string, unknown> = {};
  Object.entries(metadata).forEach(([key, value]) => {
    safe[key] = sanitizeValue(key, value);
  });
  return safe;
};

const pickAllowedMetadata = (
  action: AuditActionType,
  metadata: Record<string, unknown>,
): Record<string, unknown> => {
  const allowedKeys = AUDIT_METADATA_ALLOWLIST[action] || [];
  const picked: Record<string, unknown> = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      picked[key] = metadata[key];
    }
  });
  return picked;
};

export async function recordAuditAction(
  action: AuditActionType,
  metadata: Record<string, unknown> = {},
  actorId?: string | null,
): Promise<void> {
  const current = parseEntries(await AsyncStorage.getItem(STORAGE_KEY));
  const minimalMetadata = pickAllowedMetadata(action, metadata);
  const safeMetadata = sanitizeMetadata(minimalMetadata);
  const safeActorId = actorId ? toAuditRef(actorId) : null;

  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    at: new Date().toISOString(),
    actorId: safeActorId,
    metadata: safeMetadata,
  };

  await persistEntries([entry, ...current]);

  trackEvent("audit_action", {
    action,
    actorId: safeActorId,
    ...safeMetadata,
  }).catch(() => undefined);
}

export async function getAuditEntries(limit = 50): Promise<AuditEntry[]> {
  const current = parseEntries(await AsyncStorage.getItem(STORAGE_KEY));
  return current.slice(0, Math.max(1, limit));
}

export async function getAuditSummary(hours = 24): Promise<{
  total: number;
  byAction: Record<AuditActionType, number>;
}> {
  const entries = await getAuditEntries(MAX_ITEMS);
  const now = Date.now();
  const maxAge = Math.max(1, hours) * 60 * 60 * 1000;

  const filtered = entries.filter((entry) => {
    const ts = new Date(entry.at).getTime();
    return !Number.isNaN(ts) && now - ts <= maxAge;
  });

  const byAction = filtered.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    },
    {
      CHECKIN_OFFLINE_ENQUEUED: 0,
      CHECKIN_OFFLINE_SYNCED: 0,
      CHECKIN_OFFLINE_SYNC_FAILED: 0,
      LAUDO_VALIDATED: 0,
      LAUDO_REVALIDATION_REQUIRED: 0,
      LAUDO_REFERENCE_OPENED: 0,
      LAUDO_REFERENCE_CONSULTED_TOGGLED: 0,
      LAUDO_PROFESSIONAL_PDF_OPENED: 0,
      QUICK_MESSAGE_SENT: 0,
    } as Record<AuditActionType, number>,
  );

  return {
    total: filtered.length,
    byAction,
  };
}
