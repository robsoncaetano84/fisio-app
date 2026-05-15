import type { CrmLead, CrmTask } from "../../services/crm";

export type SortDir = "asc" | "desc";
export type ProfSortKey =
  | "nome"
  | "score"
  | "vulnEmocional"
  | "pacientes"
  | "ativos"
  | "ultimoAcesso";
export type PacSortKey =
  | "nome"
  | "profissionalNome"
  | "status"
  | "ultimoCheckin";
export type ExamChartMode = "POSITIVOS" | "TAXA";
export type ExamConfidenceFilter = "TODOS" | "ALTA" | "MEDIA" | "BAIXA";
export type PhysicalExamCoverageStatus = "ALTA" | "MEDIA" | "BAIXA";
export type PhysicalExamCoverage = {
  pct: number;
  status: PhysicalExamCoverageStatus;
};

export type ProfRow = {
  id: string;
  nome: string;
  cidade: string;
  pacientes: number;
  ativos: number;
  ultimoAcesso: string;
  adesao: number;
  leadIds: string[];
};

export type PacRow = {
  id: string;
  nome: string;
  profissionalId: string;
  profissionalNome: string;
  status: "ATIVO" | "RISCO";
  emocionalVulneravel: boolean;
  emocionalResumo: {
    estresse: number | null;
    energia: number | null;
    apoio: number | null;
    sonoQualidade: number | null;
    humor: string | null;
    updatedAt: string | null;
  } | null;
  ultimoCheckin: string;
  adesao: number;
  lead: CrmLead;
};

export type AccountHealthStatus = "HEALTHY" | "ATTENTION" | "RISK";

export type AccountHealthScore = {
  score: number;
  status: AccountHealthStatus;
  reasons: string[];
  nextAction: string;
};

export type EmotionalConcentration = {
  vulneraveis: number;
  total: number;
  percentual: number;
  status: "OK" | "ATTENTION" | "RISK";
};

export type CrmAutomationHistoryItem = {
  id: string;
  action: "EXECUTED" | "DISMISSED" | "RESET";
  automationId: string;
  title: string;
  occurredAt: string;
};

export type TaskBuckets = {
  atrasadas: CrmTask[];
  hoje: CrmTask[];
  proximas: CrmTask[];
  concluidas: CrmTask[];
};

export type ChartDataItem = {
  label: string;
  value: number;
  color: string;
};
