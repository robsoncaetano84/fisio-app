// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM
// ==========================================
import { api } from "./api";

export type CrmLeadStage = "NOVO" | "CONTATO" | "PROPOSTA" | "FECHADO";
export type CrmLeadChannel = "SITE" | "WHATSAPP" | "INDICACAO" | "INSTAGRAM" | "OUTRO";
export type CrmTaskStatus = "PENDENTE" | "CONCLUIDA";
export type CrmInteractionType =
  | "LIGACAO"
  | "WHATSAPP"
  | "PROPOSTA"
  | "DEMO"
  | "EMAIL"
  | "REUNIAO"
  | "OUTRO";

export type CrmLead = {
  id: string;
  nome: string;
  empresa: string | null;
  canal: CrmLeadChannel;
  stage: CrmLeadStage;
  responsavelNome: string | null;
  responsavelUsuarioId: string | null;
  valorPotencial: number;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmTask = {
  id: string;
  titulo: string;
  descricao: string | null;
  leadId: string | null;
  responsavelNome: string | null;
  responsavelUsuarioId: string | null;
  dueAt: string | null;
  status: CrmTaskStatus;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmInteraction = {
  id: string;
  leadId: string;
  tipo: CrmInteractionType;
  resumo: string;
  detalhes: string | null;
  responsavelNome: string | null;
  responsavelUsuarioId: string | null;
  occurredAt: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmPipelineSummary = {
  totalLeads: number;
  totalPipelineValue: number;
  byStage: Record<CrmLeadStage, { count: number; value: number }>;
};

export type CrmClinicalDashboardSummary = {
  pipeline: {
    novoPaciente: number;
    aguardandoVinculo: number;
    anamnesePendente: number;
    emTratamento: number;
    alta: number;
  };
  alertas: {
    semCheckin: number;
    semEvolucao: number;
    conviteNaoAceito: number;
    anamnesePendente: number;
  };
  metricas: {
    abandonoRate: number;
    conclusaoPlanoRate: number;
    pacientesEmAtencao: number;
    tempoMedioPorEtapaMs: {
      ANAMNESE: number;
      EXAME_FISICO: number;
      EVOLUCAO: number;
    };
    completedTotal?: number;
    blockedTotal?: number;
  };
};

export type CrmAdminProfessional = {
  id: string;
  nome: string;
  email: string;
  registroProf: string | null;
  especialidade: string | null;
  ativo: boolean;
  role: "ADMIN" | "USER" | "PACIENTE";
  createdAt: string;
  updatedAt: string;
  pacientesTotal: number;
  pacientesAtivos: number;
  lastPacienteUpdate: string | null;
};

export type CrmAdminPatient = {
  id: string;
  nomeCompleto: string;
  contatoEmail: string | null;
  contatoWhatsapp: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  profissao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  usuarioId: string;
  profissionalNome: string | null;
  profissionalEmail: string | null;
  pacienteUsuarioId: string | null;
  pacienteUsuarioEmail: string | null;
  emocional?: {
    nivelEstresse: number | null;
    energiaDiaria: number | null;
    apoioEmocional: number | null;
    qualidadeSono: number | null;
    humorPredominante: string | null;
    vulnerabilidade: boolean;
    updatedAt: string;
  } | null;
};

export type CrmPagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CrmAdminAuditLog = {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  includeSensitive: boolean;
  sensitiveReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export async function getCrmPipelineSummary(): Promise<CrmPipelineSummary> {
  const response = await api.get<CrmPipelineSummary>("/crm/pipeline/summary");
  return response.data;
}

export async function getCrmAdminAuditLogs(params?: {
  q?: string;
  action?: string;
  includeSensitive?: boolean;
  page?: number;
  limit?: number;
}): Promise<CrmPagedResponse<CrmAdminAuditLog>> {
  const response = await api.get<CrmPagedResponse<CrmAdminAuditLog>>(
    "/crm/admin/audit-logs",
    { params },
  );
  return response.data;
}

export async function getCrmClinicalDashboardSummary(params?: {
  windowDays?: number;
  semEvolucaoDias?: number;
}): Promise<CrmClinicalDashboardSummary> {
  const response = await api.get<CrmClinicalDashboardSummary>(
    "/crm/clinical/dashboard-summary",
    { params },
  );
  return response.data;
}

export async function getCrmAdminProfessionals(params?: {
  q?: string;
  ativo?: boolean;
  especialidade?: string;
  includeSensitive?: boolean;
  sensitiveReason?: string;
}): Promise<CrmAdminProfessional[]> {
  const response = await api.get<CrmAdminProfessional[]>("/crm/admin/profissionais", { params });
  return response.data;
}

export async function getCrmAdminPatients(params?: {
  q?: string;
  ativo?: boolean;
  vinculadoUsuarioPaciente?: boolean;
  cidade?: string;
  uf?: string;
  includeSensitive?: boolean;
  sensitiveReason?: string;
}): Promise<CrmAdminPatient[]> {
  const response = await api.get<CrmAdminPatient[]>("/crm/admin/pacientes", { params });
  return response.data;
}

export async function getCrmAdminProfessionalsPaged(params?: {
  q?: string;
  ativo?: boolean;
  especialidade?: string;
  includeSensitive?: boolean;
  sensitiveReason?: string;
  page?: number;
  limit?: number;
}): Promise<CrmPagedResponse<CrmAdminProfessional>> {
  const response = await api.get<CrmPagedResponse<CrmAdminProfessional>>("/crm/admin/profissionais-paged", { params });
  return response.data;
}

export async function getCrmAdminPatientsPaged(params?: {
  q?: string;
  ativo?: boolean;
  vinculadoUsuarioPaciente?: boolean;
  cidade?: string;
  uf?: string;
  includeSensitive?: boolean;
  sensitiveReason?: string;
  page?: number;
  limit?: number;
}): Promise<CrmPagedResponse<CrmAdminPatient>> {
  const response = await api.get<CrmPagedResponse<CrmAdminPatient>>("/crm/admin/pacientes-paged", { params });
  return response.data;
}

export async function getCrmLeads(params?: {
  q?: string;
  stage?: CrmLeadStage | "TODOS";
}): Promise<CrmLead[]> {
  const response = await api.get<CrmLead[]>("/crm/leads", { params });
  return response.data;
}

export async function createCrmLead(payload: {
  nome: string;
  empresa?: string;
  canal?: CrmLeadChannel;
  stage?: CrmLeadStage;
  responsavelNome?: string;
  valorPotencial?: number;
  observacoes?: string;
}): Promise<CrmLead> {
  const response = await api.post<CrmLead>("/crm/leads", payload);
  return response.data;
}

export async function updateCrmLead(
  id: string,
  payload: Partial<{
    nome: string;
    empresa: string;
    canal: CrmLeadChannel;
    stage: CrmLeadStage;
    responsavelNome: string;
    valorPotencial: number;
    observacoes: string;
  }>,
): Promise<CrmLead> {
  const response = await api.patch<CrmLead>(`/crm/leads/${id}`, payload);
  return response.data;
}

export async function deleteCrmLead(id: string): Promise<void> {
  await api.delete(`/crm/leads/${id}`);
}

export async function getCrmTasks(params?: {
  status?: CrmTaskStatus | "TODOS";
  limit?: number;
}): Promise<CrmTask[]> {
  const response = await api.get<CrmTask[]>("/crm/tasks", { params });
  return response.data;
}

export async function createCrmTask(payload: {
  titulo: string;
  descricao?: string;
  leadId?: string;
  responsavelNome?: string;
  dueAt?: string;
  status?: CrmTaskStatus;
}): Promise<CrmTask> {
  const response = await api.post<CrmTask>("/crm/tasks", payload);
  return response.data;
}

export async function updateCrmTask(
  id: string,
  payload: Partial<{
    titulo: string;
    descricao: string;
    leadId: string | null;
    responsavelNome: string;
    dueAt: string | null;
    status: CrmTaskStatus;
  }>,
): Promise<CrmTask> {
  const response = await api.patch<CrmTask>(`/crm/tasks/${id}`, payload);
  return response.data;
}

export async function deleteCrmTask(id: string): Promise<void> {
  await api.delete(`/crm/tasks/${id}`);
}

export async function getCrmInteractions(leadId: string): Promise<CrmInteraction[]> {
  const response = await api.get<CrmInteraction[]>(`/crm/leads/${leadId}/interactions`);
  return response.data;
}

export async function createCrmInteraction(payload: {
  leadId: string;
  tipo: CrmInteractionType;
  resumo: string;
  detalhes?: string;
  responsavelNome?: string;
  occurredAt?: string;
}): Promise<CrmInteraction> {
  const response = await api.post<CrmInteraction>("/crm/interactions", payload);
  return response.data;
}

export async function updateCrmInteraction(
  id: string,
  payload: Partial<{
    leadId: string;
    tipo: CrmInteractionType;
    resumo: string;
    detalhes: string;
    responsavelNome: string;
    occurredAt: string;
  }>,
): Promise<CrmInteraction> {
  const response = await api.patch<CrmInteraction>(`/crm/interactions/${id}`, payload);
  return response.data;
}

export async function deleteCrmInteraction(id: string): Promise<void> {
  await api.delete(`/crm/interactions/${id}`);
}
