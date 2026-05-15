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
