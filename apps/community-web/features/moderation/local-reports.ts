export type ReportTargetType = "post" | "reply" | "resource" | "profile";

export type ReportReason = "privacy" | "spam" | "ethics" | "unsafe" | "other";

export type ReportStatus = "open" | "reviewing" | "resolved";

export type LocalModerationReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetHref: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
};

export const REPORTS_STORAGE_KEY = "synap-community:moderation-reports";
export const REPORTS_UPDATED_EVENT = "synap-community:reports-updated";

export const reasonLabel: Record<ReportReason, string> = {
  privacy: "Dados sensiveis ou identificaveis",
  spam: "Spam ou autopromocao",
  ethics: "Conduta etica inadequada",
  unsafe: "Informacao clinica potencialmente insegura",
  other: "Outro motivo",
};

export const targetTypeLabel: Record<ReportTargetType, string> = {
  post: "Discussao",
  reply: "Resposta",
  resource: "Recurso",
  profile: "Perfil",
};

export function readLocalReports(): LocalModerationReport[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(REPORTS_STORAGE_KEY) || "[]",
    ) as LocalModerationReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalReports(reports: LocalModerationReport[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    REPORTS_STORAGE_KEY,
    JSON.stringify(reports.slice(0, 100)),
  );
  window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
}
