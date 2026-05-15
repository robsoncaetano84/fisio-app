import { PacientesListQuickAction } from "../types";

export type ClinicalFlowAction =
  | PacientesListQuickAction
  | "LAUDO"
  | "PLANO";

export type ClinicalFlowNextStep =
  | ClinicalFlowAction
  | "VINCULO"
  | "MONITORAMENTO";

export type ClinicalFlowBlockReason =
  | "MISSING_LINK"
  | "MISSING_ANAMNESE"
  | "MISSING_EXAME_FISICO";

export type ClinicalFlowReadinessState = {
  hasVinculoAtivo: boolean;
  hasAnamnese: boolean;
  hasExameFisico?: boolean;
  hasEvolucao?: boolean;
  hasLaudoPlano?: boolean;
};

export type ClinicalFlowGuard = {
  action: ClinicalFlowAction;
  reason: ClinicalFlowBlockReason;
  analyticsReason: "MISSING_LINK" | "MISSING_ANAMNESE" | "MISSING_EXAME_FISICO";
  redirectStep: ClinicalFlowNextStep;
};

export type ClinicalFlowStageStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "DONE"
  | "BLOCKED";

export const clinicalFlowReadinessCopyKeys: Record<
  ClinicalFlowNextStep,
  { title: string; description: string; action: string }
> = {
  VINCULO: {
    title: "patientDetails.readinessLinkTitle",
    description: "patientDetails.readinessLinkDescription",
    action: "patientDetails.readinessLinkAction",
  },
  ANAMNESE: {
    title: "patientDetails.readinessAnamnesisTitle",
    description: "patientDetails.readinessAnamnesisDescription",
    action: "patientDetails.readinessAnamnesisAction",
  },
  EXAME_FISICO: {
    title: "patientDetails.readinessPhysicalExamTitle",
    description: "patientDetails.readinessPhysicalExamDescription",
    action: "patientDetails.readinessPhysicalExamAction",
  },
  EVOLUCAO: {
    title: "patientDetails.readinessEvolutionTitle",
    description: "patientDetails.readinessEvolutionDescription",
    action: "patientDetails.readinessEvolutionAction",
  },
  LAUDO: {
    title: "patientDetails.readinessReportPlanTitle",
    description: "patientDetails.readinessReportPlanDescription",
    action: "patientDetails.readinessReportPlanAction",
  },
  PLANO: {
    title: "patientDetails.readinessReportPlanTitle",
    description: "patientDetails.readinessReportPlanDescription",
    action: "patientDetails.readinessPlanAction",
  },
  MONITORAMENTO: {
    title: "patientDetails.readinessMonitoringTitle",
    description: "patientDetails.readinessMonitoringDescription",
    action: "patientDetails.readinessMonitoringAction",
  },
};

export function getClinicalFlowGuard(
  action: ClinicalFlowAction,
  state: ClinicalFlowReadinessState,
  options?: { requirePhysicalExamForEvolution?: boolean },
): ClinicalFlowGuard | null {
  if (!state.hasVinculoAtivo) {
    return {
      action,
      reason: "MISSING_LINK",
      analyticsReason: "MISSING_LINK",
      redirectStep: "VINCULO",
    };
  }

  if (action !== "ANAMNESE" && !state.hasAnamnese) {
    return {
      action,
      reason: "MISSING_ANAMNESE",
      analyticsReason: "MISSING_ANAMNESE",
      redirectStep: "ANAMNESE",
    };
  }

  if (
    action === "EVOLUCAO" &&
    options?.requirePhysicalExamForEvolution &&
    !state.hasExameFisico
  ) {
    return {
      action,
      reason: "MISSING_EXAME_FISICO",
      analyticsReason: "MISSING_EXAME_FISICO",
      redirectStep: "EXAME_FISICO",
    };
  }

  return null;
}

export function getClinicalFlowNextStep(
  state: ClinicalFlowReadinessState,
): ClinicalFlowNextStep {
  if (!state.hasVinculoAtivo) return "VINCULO";
  if (!state.hasAnamnese) return "ANAMNESE";
  if (state.hasExameFisico === false) return "EXAME_FISICO";
  if (state.hasEvolucao === false) return "EVOLUCAO";
  if (state.hasLaudoPlano === false) return "LAUDO";
  return "MONITORAMENTO";
}

export function getClinicalFlowStageStatus(
  action: ClinicalFlowAction,
  state: ClinicalFlowReadinessState,
  options?: { requirePhysicalExamForEvolution?: boolean },
): ClinicalFlowStageStatus {
  const doneByAction: Record<ClinicalFlowAction, boolean | undefined> = {
    ANAMNESE: state.hasAnamnese,
    EXAME_FISICO: state.hasExameFisico,
    EVOLUCAO: state.hasEvolucao,
    LAUDO: state.hasLaudoPlano,
    PLANO: state.hasLaudoPlano,
  };

  if (doneByAction[action]) return "DONE";
  if (getClinicalFlowGuard(action, state, options)) return "BLOCKED";
  if (getClinicalFlowNextStep(state) === action) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function isClinicalFlowActionReady(
  action: ClinicalFlowAction,
  state: ClinicalFlowReadinessState,
  options?: { requirePhysicalExamForEvolution?: boolean },
): boolean {
  return !getClinicalFlowGuard(action, state, options);
}
