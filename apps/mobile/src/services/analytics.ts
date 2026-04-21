// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANALYTICS
// ==========================================
import { api, getCorrelationId } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnalyticsEventName =
  | "session_started"
  | "session_completed"
  | "checkin_submitted"
  | "patient_onboarding_started"
  | "patient_onboarding_step_completed"
  | "patient_onboarding_completed"
  | "patient_quick_checkin_submitted"
  | "patient_guided_checkin_started"
  | "patient_checkin_not_completed"
  | "risk_panel_viewed"
  | "patient_reminder_scheduled"
  | "weekly_dashboard_viewed"
  | "quick_message_sent"
  | "quick_message_emotional_support_sent"
  | "quick_message_functional_goal_sent"
  | "laudo_reference_opened"
  | "laudo_reference_consulted_toggled"
  | "laudo_professional_pdf_opened"
  | "laudo_validated"
  | "laudo_revalidation_required"
  | "audit_action"
  | "ops_sync_manual"
  | "ops_health_viewed"
  | "ops_degradation_alerted"
  | "patient_sync_manual"
  | "patient_sync_degradation_alerted"
  | "patient_smart_reminder_cta_clicked"
  | "patient_smart_reminder_snoozed"
  | "patient_weekly_summary_viewed"
  | "patient_home_check_click"
  | "quick_action_patient_selected"
  | "quick_action_mode_opened"
  | "quick_action_mode_cancelled"
  | "quick_action_last_patient_shortcut"
  | "quick_action_shortcut_cleared"
  | "quick_action_blocked"
  | "clinical_flow_blocked"
  | "clinical_flow_stage_opened"
  | "clinical_flow_stage_abandoned"
  | "clinical_flow_continue_clicked"
  | "clinical_flow_summary_viewed"
  | "adaptive_prescription_suggestion_applied"
  | "adaptive_prescription_suggestion_ignored"
  | "professional_activation_checklist_viewed"
  | "professional_activation_checklist_item_clicked"
  | "professional_activation_checklist_dismissed"
  | "crm_automation_dismissed"
  | "crm_automation_action_executed"
  | "crm_automation_reset"
  | "crm_account_score_summary_viewed"
  | "crm_automations_panel_viewed"
  | "crm_sensitive_visibility_changed"
  | "crm_reactivation_task_prefilled"
  | "crm_kpi_clicked"
  | "home_biopsychosocial_summary_clicked"
  | "patient_form_validation_failed"
  | "patient_form_submit_started"
  | "patient_form_submit_succeeded"
  | "patient_form_submit_failed"
  | "patient_deleted"
  | "patient_delete_failed"
  | "patient_exam_load_failed"
  | "patient_exam_uploaded"
  | "patient_exam_upload_failed"
  | "patient_exam_open_failed"
  | "patient_exam_removed"
  | "patient_exam_remove_failed"
  | "patients_list_filter_changed"
  | "clinical_form_validation_error"
  | "clinical_form_autosave_saved";

type AnalyticsPayload = Record<string, unknown>;

type AnalyticsEnvelope = AnalyticsPayload & {
  correlationId: string;
  eventVersion: 1;
};

type StoredAnalyticsEvent = {
  event: AnalyticsEventName;
  at: string;
  payload: AnalyticsEnvelope;
};

type ClinicalStage = "ANAMNESE" | "EXAME_FISICO" | "EVOLUCAO";

export type ClinicalFlowSummary = {
  windowDays: number;
  opened: number;
  completed: number;
  abandoned: number;
  blocked: number;
  abandonmentRate: number;
  avgDurationMsByStage: Record<ClinicalStage, number>;
  topBlockedReasons: Array<{ reason: string; count: number }>;
};
export type PatientCheckEngagementSummary = {
  windowDays: number;
  checkClicks: number;
  checkinsSubmitted: number;
  conversionRate: number;
};

const ANALYTICS_STORAGE_KEY = "analytics:events:v1";
const ANALYTICS_MAX_EVENTS = 500;
const REMOTE_ANALYTICS_TIMEOUT_MS = 3000;
const REMOTE_SUMMARY_RETRY_AFTER_404_MS = 5 * 60 * 1000;
let remoteSummaryDisabledUntil = 0;
let remoteCheckEngagementDisabledUntil = 0;

const REDACTED = "[REDACTED]";
const MAX_SANITIZE_DEPTH = 5;

const sensitiveKeyPattern =
  /(nome|name|email|mail|telefone|phone|whatsapp|cpf|rg|document|senha|password|token|text|mensagem|message|descricao|description|observa|content|conteudo)/i;

const idLikeKeyPattern =
  /(^id$|Id$|_id$|^usuarioId$|^pacienteId$|^profissionalId$|^atividadeId$|^laudoId$|^evolucaoId$|^anamneseId$)/i;

const looksLikeEmail = (value: string) => /@/.test(value) && /\./.test(value);
const looksLikePhone = (value: string) => /\d{10,}/.test(value.replace(/\D/g, ""));
const looksLikeCpf = (value: string) => /^\d{11}$/.test(value.replace(/\D/g, ""));

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const anonymizeId = (value: unknown): string => {
  const source = String(value ?? "");
  return source ? `anon_${hashString(source)}` : "anon_empty";
};

const sanitizePrimitive = (key: string, value: unknown): unknown => {
  if (value == null) return value;

  if (typeof value === "number" || typeof value === "boolean") {
    return idLikeKeyPattern.test(key) ? anonymizeId(value) : value;
  }

  if (typeof value !== "string") {
    return value;
  }

  if (idLikeKeyPattern.test(key)) return anonymizeId(value);

  const trimmed = value.trim();
  if (
    sensitiveKeyPattern.test(key) ||
    looksLikeEmail(trimmed) ||
    looksLikePhone(trimmed) ||
    looksLikeCpf(trimmed)
  ) {
    return REDACTED;
  }

  if (trimmed.length > 200) {
    return `${trimmed.slice(0, 200)}...`;
  }

  return trimmed;
};

const sanitizeAny = (key: string, value: unknown, depth = 0): unknown => {
  if (depth > MAX_SANITIZE_DEPTH) return "[TRUNCATED]";

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAny(key, item, depth + 1));
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      output[childKey] = sanitizeAny(childKey, childValue, depth + 1);
    });
    return output;
  }

  return sanitizePrimitive(key, value);
};

const sanitizePayload = (payload: AnalyticsPayload): AnalyticsPayload => {
  const sanitized: AnalyticsPayload = {};
  Object.entries(payload).forEach(([key, value]) => {
    sanitized[key] = sanitizeAny(key, value);
  });
  return sanitized;
};

const parseStoredEvents = (raw: string | null): StoredAnalyticsEvent[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredAnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistEvent = async (entry: StoredAnalyticsEvent): Promise<void> => {
  const current = parseStoredEvents(await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY));
  const next = [entry, ...current].slice(0, ANALYTICS_MAX_EVENTS);
  await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(next));
};

export async function trackEvent(
  event: AnalyticsEventName,
  payload: AnalyticsPayload = {},
): Promise<void> {
  try {
    const sanitizedPayload = sanitizePayload(payload);
    const envelope: AnalyticsEnvelope = {
      ...sanitizedPayload,
      correlationId: getCorrelationId(),
      eventVersion: 1,
    };

    if (__DEV__) {
      console.log("[analytics]", event, {
        correlationId: envelope.correlationId,
        eventVersion: envelope.eventVersion,
      });
    }

    await persistEvent({
      event,
      at: new Date().toISOString(),
      payload: envelope,
    });

    const remoteEvent = mapClinicalFlowEventToRemote(event, envelope);
    if (remoteEvent) {
      api
        .post("/metrics/clinical-flow", remoteEvent, {
          timeout: REMOTE_ANALYTICS_TIMEOUT_MS,
        })
        .catch(() => undefined);
    }
    if (event === "patient_home_check_click") {
      api
        .post(
          "/metrics/clinical-flow/check-click",
          {
            patientId:
              typeof envelope.pacienteId === "string"
                ? envelope.pacienteId
                : undefined,
            source:
              typeof envelope.source === "string"
                ? envelope.source
                : "unknown",
          },
          { timeout: REMOTE_ANALYTICS_TIMEOUT_MS },
        )
        .catch(() => undefined);
    }

    // Best-effort local tracking; fail silently if storage is unavailable
    return;
  } catch {
    // Do not break user flow if analytics is unavailable
  }
}

const KNOWN_STAGES: ClinicalStage[] = ["ANAMNESE", "EXAME_FISICO", "EVOLUCAO"];

const isKnownStage = (value: unknown): value is ClinicalStage =>
  typeof value === "string" &&
  KNOWN_STAGES.includes(value as ClinicalStage);

type RemoteClinicalFlowEvent = {
  stage: ClinicalStage;
  eventType: "STAGE_OPENED" | "STAGE_COMPLETED" | "STAGE_ABANDONED" | "STAGE_BLOCKED";
  durationMs?: number;
  blockedReason?: string;
};

const mapClinicalFlowEventToRemote = (
  event: AnalyticsEventName,
  payload: AnalyticsEnvelope,
): RemoteClinicalFlowEvent | null => {
  const stage = payload.stage;
  if (!isKnownStage(stage)) return null;

  if (event === "clinical_flow_stage_opened") {
    return { stage, eventType: "STAGE_OPENED" };
  }

  if (event === "clinical_flow_stage_abandoned") {
    return { stage, eventType: "STAGE_ABANDONED" };
  }

  if (event === "clinical_flow_blocked") {
    const reason =
      typeof payload.reason === "string" && payload.reason.trim().length > 0
        ? payload.reason.trim().slice(0, 80)
        : "UNKNOWN";
    return { stage, eventType: "STAGE_BLOCKED", blockedReason: reason };
  }

  if (event === "session_completed") {
    const durationMs =
      typeof payload.durationMs === "number" && payload.durationMs >= 0
        ? Math.round(payload.durationMs)
        : undefined;
    return { stage, eventType: "STAGE_COMPLETED", durationMs };
  }

  return null;
};

export async function getClinicalFlowSummary(
  windowDays = 7,
): Promise<ClinicalFlowSummary> {
  const days = Math.max(1, Math.floor(windowDays));
  const localSummary = await getLocalClinicalFlowSummary(days);

  if (Date.now() < remoteSummaryDisabledUntil) {
    return localSummary;
  }

  try {
    const response = await api.get<ClinicalFlowSummary>(
      "/metrics/clinical-flow/summary",
      {
        params: { windowDays: days },
        timeout: 5000,
      },
    );
    if (response?.data && typeof response.data === "object") {
      return {
        ...response.data,
        windowDays: days,
      };
    }
  } catch (error) {
    const maybeStatus = (error as { response?: { status?: number } })?.response
      ?.status;
    if (maybeStatus === 404) {
      remoteSummaryDisabledUntil =
        Date.now() + REMOTE_SUMMARY_RETRY_AFTER_404_MS;
    }
    // fallback para resumo local
  }

  return localSummary;
}

export async function getPatientCheckEngagementSummary(
  windowDays = 7,
): Promise<PatientCheckEngagementSummary> {
  const days = Math.max(1, Math.floor(windowDays));
  const localSummary = await getLocalPatientCheckEngagementSummary(days);

  if (Date.now() < remoteCheckEngagementDisabledUntil) {
    return localSummary;
  }

  try {
    const response = await api.get<PatientCheckEngagementSummary>(
      "/metrics/clinical-flow/check-engagement-summary",
      {
        params: { windowDays: days },
        timeout: 5000,
      },
    );
    if (response?.data && typeof response.data === "object") {
      return {
        ...response.data,
        windowDays: days,
      };
    }
  } catch (error) {
    const maybeStatus = (error as { response?: { status?: number } })?.response
      ?.status;
    if (maybeStatus === 404) {
      remoteCheckEngagementDisabledUntil =
        Date.now() + REMOTE_SUMMARY_RETRY_AFTER_404_MS;
    }
  }

  return localSummary;
}

async function getLocalPatientCheckEngagementSummary(
  days: number,
): Promise<PatientCheckEngagementSummary> {
  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const entries = parseStoredEvents(
    await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY),
  ).filter((entry) => {
    const ts = new Date(entry.at).getTime();
    return !Number.isNaN(ts) && now - ts <= maxAgeMs;
  });

  let checkClicks = 0;
  let checkinsSubmitted = 0;

  entries.forEach((entry) => {
    if (entry.event === "patient_home_check_click") {
      checkClicks += 1;
    }
    if (
      entry.event === "checkin_submitted" ||
      entry.event === "patient_quick_checkin_submitted"
    ) {
      checkinsSubmitted += 1;
    }
  });

  const conversionRate =
    checkClicks > 0
      ? Math.round((checkinsSubmitted / checkClicks) * 100)
      : 0;

  return {
    windowDays: days,
    checkClicks,
    checkinsSubmitted,
    conversionRate,
  };
}

async function getLocalClinicalFlowSummary(
  days: number,
): Promise<ClinicalFlowSummary> {
  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const entries = parseStoredEvents(
    await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY),
  ).filter((entry) => {
    const ts = new Date(entry.at).getTime();
    return !Number.isNaN(ts) && now - ts <= maxAgeMs;
  });

  let opened = 0;
  let completed = 0;
  let abandoned = 0;
  let blocked = 0;

  const stageDurationSums: Record<ClinicalStage, number> = {
    ANAMNESE: 0,
    EXAME_FISICO: 0,
    EVOLUCAO: 0,
  };
  const stageDurationCounts: Record<ClinicalStage, number> = {
    ANAMNESE: 0,
    EXAME_FISICO: 0,
    EVOLUCAO: 0,
  };
  const blockedReasons = new Map<string, number>();

  entries.forEach((entry) => {
    const payload = entry.payload || {};
    const stage = payload.stage;

    if (entry.event === "clinical_flow_stage_opened") {
      opened += 1;
    }

    if (entry.event === "session_completed" && isKnownStage(stage)) {
      completed += 1;
      const durationMs =
        typeof payload.durationMs === "number" && payload.durationMs >= 0
          ? Math.round(payload.durationMs)
          : null;
      if (durationMs !== null) {
        stageDurationSums[stage] += durationMs;
        stageDurationCounts[stage] += 1;
      }
    }

    if (entry.event === "clinical_flow_stage_abandoned") {
      abandoned += 1;
    }

    if (entry.event === "clinical_flow_blocked") {
      blocked += 1;
      const reason =
        typeof payload.reason === "string" && payload.reason.trim().length > 0
          ? payload.reason.trim()
          : "UNKNOWN";
      blockedReasons.set(reason, (blockedReasons.get(reason) || 0) + 1);
    }
  });

  const avgDurationMsByStage: Record<ClinicalStage, number> = {
    ANAMNESE:
      stageDurationCounts.ANAMNESE > 0
        ? Math.round(
            stageDurationSums.ANAMNESE / stageDurationCounts.ANAMNESE,
          )
        : 0,
    EXAME_FISICO:
      stageDurationCounts.EXAME_FISICO > 0
        ? Math.round(
            stageDurationSums.EXAME_FISICO / stageDurationCounts.EXAME_FISICO,
          )
        : 0,
    EVOLUCAO:
      stageDurationCounts.EVOLUCAO > 0
        ? Math.round(stageDurationSums.EVOLUCAO / stageDurationCounts.EVOLUCAO)
        : 0,
  };

  const topBlockedReasons = Array.from(blockedReasons.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const abandonmentRate = opened > 0 ? Math.round((abandoned / opened) * 100) : 0;

  return {
    windowDays: days,
    opened,
    completed,
    abandoned,
    blocked,
    abandonmentRate,
    avgDurationMsByStage,
    topBlockedReasons,
  };
}




