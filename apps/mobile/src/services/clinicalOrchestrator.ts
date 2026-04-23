import { api } from "./api";

export type ClinicalOrchestratorSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type ClinicalOrchestratorNextActionResponse = {
  orchestrator: "CLINICAL_ORCHESTRATOR";
  mode: string;
  blocked: boolean;
  context: {
    regioesPrioritarias: string[];
    regioesRelacionadas?: string[];
    cadeiaProvavel: string | null;
  };
  blockers: Array<{
    code: string;
    severity: Exclude<ClinicalOrchestratorSeverity, "LOW">;
    message: string;
  }>;
  alerts: Array<{
    code: string;
    severity: Exclude<ClinicalOrchestratorSeverity, "CRITICAL">;
    message: string;
  }>;
  stages?: Array<{
    stage: "ANAMNESE" | "EXAME_FISICO" | "EVOLUCAO" | "LAUDO" | "PLANO" | "MONITORAMENTO";
    status: "PENDING" | "COMPLETED" | "BLOCKED";
    reason: string;
  }>;
  nextAction: {
    stage: string;
    reason: string;
    guidance: string;
  };
};

export const getClinicalOrchestratorNextAction = async (
  pacienteId: string,
): Promise<ClinicalOrchestratorNextActionResponse> => {
  const response = await api.get<ClinicalOrchestratorNextActionResponse>(
    `/clinical-orchestrator/patients/${pacienteId}/next-action`,
  );
  return response.data;
};

export type LogAiSuggestionPayload = {
  stage: string;
  suggestionType: string;
  confidence: "BAIXA" | "MODERADA" | "ALTA";
  reason: string;
  evidenceFields?: string[];
  patientId?: string;
};

export const logClinicalAiSuggestion = async (
  payload: LogAiSuggestionPayload,
): Promise<void> => {
  await api.post("/clinical-governance/ai-suggestions/log", payload);
};
