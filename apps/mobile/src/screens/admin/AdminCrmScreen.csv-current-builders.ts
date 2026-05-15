import type {
  CrmInteraction,
  CrmInteractionType,
  CrmLead,
  CrmLeadStage,
  CrmTask,
} from "../../services/crm";
import {
  accountHealthStatusLabel,
  dt,
  type AccountHealthScore,
  type EmotionalConcentration,
  type PacRow,
  type ProfRow,
} from "./AdminCrmScreen.utils";

const emotionalPortfolioStatus = (emotional?: EmotionalConcentration) => {
  if (!emotional) return "";
  if (emotional.total < 5) return "BASE_PEQUENA";
  if (emotional.status === "RISK") return "RISCO";
  if (emotional.status === "ATTENTION") return "ATENCAO";
  return "OK";
};

export function buildCurrentProfessionalRows({
  pagedProfs,
  profAccountScores,
  profEmotionalConcentrationMap,
}: {
  pagedProfs: ProfRow[];
  profAccountScores: Map<string, AccountHealthScore>;
  profEmotionalConcentrationMap: Map<string, EmotionalConcentration>;
}) {
  return pagedProfs.map((professional) => {
    const emotional = profEmotionalConcentrationMap.get(professional.id);
    return {
      nome: professional.nome,
      score_conta: profAccountScores.get(professional.id)?.score ?? "",
      status_conta: accountHealthStatusLabel(
        profAccountScores.get(professional.id)?.status,
      ),
      vulnerabilidade_emocional_absoluta: emotional
        ? `${emotional.vulneraveis}/${emotional.total}`
        : "",
      vulnerabilidade_emocional_percentual: emotional?.percentual ?? "",
      status_carteira_emocional: emotionalPortfolioStatus(emotional),
      pacientes: professional.pacientes,
      ativos: professional.ativos,
      ultimo_acesso: professional.ultimoAcesso,
      adesao_percentual: professional.adesao,
    };
  });
}

export function buildCurrentPatientRows({
  pagedPacs,
  stageLabel,
}: {
  pagedPacs: PacRow[];
  stageLabel: Record<CrmLeadStage, string>;
}) {
  return pagedPacs.map((patient) => ({
    nome: patient.nome,
    profissional: patient.profissionalNome,
    status: patient.status,
    ultimo_checkin: patient.ultimoCheckin,
    adesao_percentual: patient.adesao,
    canal: patient.lead.canal,
    etapa_crm: stageLabel[patient.lead.stage],
  }));
}

export function buildLeadRows({
  leads,
  allStages,
  stageFilter,
  stageLabel,
}: {
  leads: CrmLead[];
  allStages: boolean;
  stageFilter: CrmLeadStage | "TODOS";
  stageLabel: Record<CrmLeadStage, string>;
}) {
  return leads
    .filter((lead) =>
      allStages
        ? true
        : stageFilter === "TODOS"
          ? true
          : lead.stage === stageFilter,
    )
    .map((lead) => ({
      nome: lead.nome,
      empresa: lead.empresa || "",
      canal: lead.canal,
      etapa: stageLabel[lead.stage],
      valor_potencial: lead.valorPotencial,
      responsavel: lead.responsavelNome || "",
      atualizado_em: dt(lead.updatedAt),
    }));
}

export function buildTaskRows({
  tasks,
  taskLeadMap,
}: {
  tasks: CrmTask[];
  taskLeadMap: Map<string, CrmLead>;
}) {
  return tasks.map((task) => ({
    titulo: task.titulo,
    status: task.status,
    prazo: task.dueAt ? dt(task.dueAt) : "",
    lead: task.leadId
      ? taskLeadMap.get(task.leadId)?.nome || "Lead removido"
      : "",
    responsavel: task.responsavelNome || "",
    atualizado_em: dt(task.updatedAt),
  }));
}

export function buildInteractionRows({
  interactions,
  selectedLeadId,
  selectedLead,
  interactionLabel,
}: {
  interactions: CrmInteraction[];
  selectedLeadId: string;
  selectedLead: CrmLead | null;
  interactionLabel: Record<CrmInteractionType, string>;
}) {
  return interactions.map((interaction) => ({
    lead: selectedLead?.nome || selectedLeadId,
    tipo: interactionLabel[interaction.tipo],
    resumo: interaction.resumo,
    responsavel: interaction.responsavelNome || "",
    ocorrido_em: dt(interaction.occurredAt),
  }));
}
