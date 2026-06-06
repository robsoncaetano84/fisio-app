import type { CrmLeadStage } from "../../services/crm";
import type { AccountHealthStatus } from "./AdminCrmScreen.models";

export type TabKey =
  | "PROFISSIONAIS"
  | "PACIENTES"
  | "LEADS"
  | "TAREFAS"
  | "INTERACOES";

export type AdminCrmScreenProps = {
  route?: {
    params?: {
      initialTab?: TabKey;
    };
  };
};

export type TaskBucket =
  | "TODAS"
  | "ATRASADAS"
  | "HOJE"
  | "PROXIMAS"
  | "CONCLUIDAS";

export type CrmLeadStageFilter = CrmLeadStage | "TODOS";
export type ProfActiveFilter = "TODOS" | "ATIVOS";
export type ProfAccountStatusFilter = "TODOS" | AccountHealthStatus;
export type ProfEmotionalConcentrationFilter = "TODOS" | "ALTA";
export type PacLinkFilter = "TODOS" | "VINCULADOS" | "SEM_USUARIO";
export type PacStatusFilter = "TODOS" | "ATIVO" | "RISCO";
export type PacEmotionalFilter = "TODOS" | "EMOCIONAL";

export type ClinicalPipelineStatusFilter =
  | "TODOS"
  | "NOVO_PACIENTE"
  | "AGUARDANDO_VINCULO"
  | "ANAMNESE_PENDENTE"
  | "EM_TRATAMENTO"
  | "ALTA";

export type CrmAutomationItem = {
  id: string;
  title: string;
  severity: "HIGH" | "MEDIUM";
  description: string;
  ctaLabel: string;
  onPress: () => void;
};
