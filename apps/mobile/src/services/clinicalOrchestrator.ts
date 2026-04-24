import { api } from "./api";

export type ClinicalOrchestratorSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type ClinicalOrchestratorNextActionResponse = {
  orchestrator: "CLINICAL_ORCHESTRATOR";
  mode: string;
  protocolVersion: string | null;
  protocolName: string | null;
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

export type ExameFisicoDorSuggestionResponse = {
  orchestrator: "CLINICAL_ORCHESTRATOR";
  mode: "assistive-v1";
  requiresProfessionalApproval: true;
  patientId: string;
  stage: "EXAME_FISICO";
  suggestionType: "DOR_CLASSIFICATION";
  confidence: "BAIXA" | "MODERADA" | "ALTA";
  reason: string;
  evidenceFields: string[];
  protocolVersion: string | null;
  protocolName: string | null;
  dorPrincipal: "NOCICEPTIVA" | "NEUROPATICA" | "NOCIPLASTICA" | "INFLAMATORIA" | "VISCERAL" | null;
  dorSubtipo:
    | "MECANICA"
    | "DISCAL"
    | "NEURAL"
    | "REFERIDA"
    | "INFLAMATORIA"
    | "MIOFASCIAL"
    | "FACETARIA"
    | "NAO_MECANICA"
    | null;
};

export type EvolucaoSoapSuggestionResponse = {
  orchestrator: "CLINICAL_ORCHESTRATOR";
  mode: "assistive-v1";
  requiresProfessionalApproval: true;
  patientId: string;
  stage: "EVOLUCAO";
  suggestionType: "EVOLUCAO_SOAP";
  confidence: "BAIXA" | "MODERADA" | "ALTA";
  reason: string;
  evidenceFields: string[];
  protocolVersion: string | null;
  protocolName: string | null;
  subjetivo: string | null;
  objetivo: string | null;
  avaliacao: string | null;
  plano: string | null;
};

export const getExameFisicoDorSuggestion = async (
  pacienteId: string,
): Promise<ExameFisicoDorSuggestionResponse> => {
  const response = await api.get<ExameFisicoDorSuggestionResponse>(
    `/clinical-orchestrator/patients/${pacienteId}/suggestions/exame-fisico/dor-classification`,
  );
  return response.data;
};

export const getEvolucaoSoapSuggestion = async (
  pacienteId: string,
): Promise<EvolucaoSoapSuggestionResponse> => {
  const response = await api.get<EvolucaoSoapSuggestionResponse>(
    `/clinical-orchestrator/patients/${pacienteId}/suggestions/evolucao/soap`,
  );
  return response.data;
};

export const logClinicalAiSuggestion = async (
  payload: LogAiSuggestionPayload,
): Promise<void> => {
  await api.post("/clinical-governance/ai-suggestions/log", payload);
};
