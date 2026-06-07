export type CareTimelineAudience = "patient" | "professional";

export type CareTimelineStage =
  | "APP_ACCESS"
  | "ANAMNESE"
  | "EXAME_MEDICO"
  | "EVOLUCAO"
  | "PLANO_LAUDO"
  | "CHECKIN";

export type CareTimelineStatus = "DONE" | "CURRENT" | "WAITING" | "PENDING";

export type CareTimelineAction =
  | "SEND_INVITE"
  | "FILL_ANAMNESE"
  | "WAIT_PROFESSIONAL"
  | "UPLOAD_EXAM"
  | "RECORD_EVOLUTION"
  | "PUBLISH_REPORT"
  | "DO_CHECKIN"
  | "VIEW_DOCUMENTS";

export type CareTimelineInput = {
  hasProfessionalLink: boolean;
  hasAppAccess: boolean;
  hasPendingInvite?: boolean;
  canFillAnamnese: boolean;
  hasAnamnese: boolean;
  hasExameMedico: boolean;
  hasEvolucao: boolean;
  hasPublishedDocuments: boolean;
  hasActivities: boolean;
  hasPendingCheckin?: boolean;
  latestAnamneseAt?: string | null;
  latestExameAt?: string | null;
  latestEvolucaoAt?: string | null;
  latestDocumentAt?: string | null;
  latestCheckinAt?: string | null;
};

export type CareTimelineModelItem = {
  stage: CareTimelineStage;
  status: CareTimelineStatus;
  action: CareTimelineAction | null;
  date?: string | null;
};

export type CareTimelineModel = {
  currentAction: CareTimelineAction | null;
  items: CareTimelineModelItem[];
};

function firstCurrent(items: CareTimelineModelItem[]) {
  return items.find((item) => item.status === "CURRENT") || null;
}

export function buildCareTimeline(input: CareTimelineInput): CareTimelineModel {
  const hasAccess = input.hasProfessionalLink || input.hasAppAccess;

  const appAccessStatus: CareTimelineStatus = input.hasAppAccess
    ? "DONE"
    : input.hasPendingInvite
      ? "CURRENT"
      : "CURRENT";

  const anamneseStatus: CareTimelineStatus = input.hasAnamnese
    ? "DONE"
    : !hasAccess
      ? "PENDING"
      : input.canFillAnamnese
        ? "CURRENT"
        : "WAITING";

  const exameStatus: CareTimelineStatus = input.hasExameMedico
    ? "DONE"
    : input.hasAnamnese
      ? "CURRENT"
      : "PENDING";

  const evolucaoStatus: CareTimelineStatus = input.hasEvolucao
    ? "DONE"
    : input.hasAnamnese
      ? "CURRENT"
      : "PENDING";

  const documentsStatus: CareTimelineStatus = input.hasPublishedDocuments
    ? "DONE"
    : input.hasEvolucao
      ? "CURRENT"
      : "PENDING";

  const checkinStatus: CareTimelineStatus = input.latestCheckinAt
    ? "DONE"
    : input.hasActivities || input.hasPublishedDocuments
      ? "CURRENT"
      : "PENDING";

  const items: CareTimelineModelItem[] = [
    {
      stage: "APP_ACCESS",
      status: appAccessStatus,
      action: input.hasAppAccess ? null : "SEND_INVITE",
    },
    {
      stage: "ANAMNESE",
      status: anamneseStatus,
      action:
        anamneseStatus === "CURRENT"
          ? "FILL_ANAMNESE"
          : anamneseStatus === "WAITING"
            ? "WAIT_PROFESSIONAL"
            : null,
      date: input.latestAnamneseAt,
    },
    {
      stage: "EXAME_MEDICO",
      status: exameStatus,
      action: exameStatus === "CURRENT" ? "UPLOAD_EXAM" : null,
      date: input.latestExameAt,
    },
    {
      stage: "EVOLUCAO",
      status: evolucaoStatus,
      action: evolucaoStatus === "CURRENT" ? "RECORD_EVOLUTION" : null,
      date: input.latestEvolucaoAt,
    },
    {
      stage: "PLANO_LAUDO",
      status: documentsStatus,
      action: documentsStatus === "CURRENT" ? "PUBLISH_REPORT" : null,
      date: input.latestDocumentAt,
    },
    {
      stage: "CHECKIN",
      status: checkinStatus,
      action:
        checkinStatus === "CURRENT"
          ? input.hasActivities || input.hasPendingCheckin
            ? "DO_CHECKIN"
            : "VIEW_DOCUMENTS"
          : null,
      date: input.latestCheckinAt,
    },
  ];

  return {
    currentAction: firstCurrent(items)?.action || null,
    items,
  };
}
