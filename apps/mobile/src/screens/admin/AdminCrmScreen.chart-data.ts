import type {
  ClinicalAiSuggestionsSummaryResponse,
  CrmClinicalDashboardSummary,
  CrmPipelineSummary,
} from "../../services/crm";
import type { ChartDataItem } from "./AdminCrmScreen.models";

export const buildClinicalPipelineChartData = (
  summary: CrmClinicalDashboardSummary | null,
  labels: {
    newPatient: string;
    link: string;
    anamnesis: string;
    treatment: string;
    discharge: string;
  },
): ChartDataItem[] => [
  {
    label: labels.newPatient,
    value: summary?.pipeline.novoPaciente || 0,
    color: "#6B7280",
  },
  {
    label: labels.link,
    value: summary?.pipeline.aguardandoVinculo || 0,
    color: "#0EA5E9",
  },
  {
    label: labels.anamnesis,
    value: summary?.pipeline.anamnesePendente || 0,
    color: "#F59E0B",
  },
  {
    label: labels.treatment,
    value: summary?.pipeline.emTratamento || 0,
    color: "#10B981",
  },
  {
    label: labels.discharge,
    value: summary?.pipeline.alta || 0,
    color: "#22C55E",
  },
];

export const buildClinicalAlertsChartData = (
  summary: CrmClinicalDashboardSummary | null,
  labels: {
    noCheckin: string;
    noProgress: string;
    pendingAnamnesis: string;
    pendingInvite: string;
  },
): ChartDataItem[] => [
  {
    label: labels.noCheckin,
    value: summary?.alertas.semCheckin || 0,
    color: "#F97316",
  },
  {
    label: labels.noProgress,
    value: summary?.alertas.semEvolucao || 0,
    color: "#EF4444",
  },
  {
    label: labels.pendingAnamnesis,
    value: summary?.alertas.anamnesePendente || 0,
    color: "#F59E0B",
  },
  {
    label: labels.pendingInvite,
    value: summary?.alertas.conviteNaoAceito || 0,
    color: "#EAB308",
  },
];

export const buildClinicalDurationChartData = (
  summary: CrmClinicalDashboardSummary | null,
): ChartDataItem[] => [
  {
    label: "Anamnese",
    value: Math.round(
      (summary?.metricas.tempoMedioPorEtapaMs.ANAMNESE || 0) / 60000,
    ),
    color: "#14B8A6",
  },
  {
    label: "Exame físico",
    value: Math.round(
      (summary?.metricas.tempoMedioPorEtapaMs.EXAME_FISICO || 0) / 60000,
    ),
    color: "#0EA5E9",
  },
  {
    label: "Evolução",
    value: Math.round(
      (summary?.metricas.tempoMedioPorEtapaMs.EVOLUCAO || 0) / 60000,
    ),
    color: "#8B5CF6",
  },
];

export const buildClinicalOperationalEventsChartData = (
  summary: CrmClinicalDashboardSummary | null,
  labels: {
    abandonedStages: string;
    blockedStages: string;
    autosaves: string;
  },
): ChartDataItem[] => [
  {
    label: labels.abandonedStages,
    value: summary?.metricas.abandonedTotal || 0,
    color: "#EF4444",
  },
  {
    label: labels.blockedStages,
    value: summary?.metricas.blockedTotal || 0,
    color: "#F97316",
  },
  {
    label: labels.autosaves,
    value: summary?.metricas.autosaveTotal || 0,
    color: "#0EA5E9",
  },
];

export const buildGovernanceAiAppliedByStageChartData = (
  summary: ClinicalAiSuggestionsSummaryResponse | null,
  labels: {
    physicalExam: string;
    evolution: string;
    report: string;
    plan: string;
  },
): ChartDataItem[] => [
  {
    label: labels.physicalExam,
    value: summary?.byStage.EXAME_FISICO.applied || 0,
    color: "#0EA5E9",
  },
  {
    label: labels.evolution,
    value: summary?.byStage.EVOLUCAO.applied || 0,
    color: "#8B5CF6",
  },
  {
    label: labels.report,
    value: summary?.byStage.LAUDO.applied || 0,
    color: "#14B8A6",
  },
  {
    label: labels.plan,
    value: summary?.byStage.PLANO.applied || 0,
    color: "#22C55E",
  },
];

export const buildGovernanceAiLifecycleChartData = (
  summary: ClinicalAiSuggestionsSummaryResponse | null,
  labels: {
    reads: string;
    applied: string;
    confirmed: string;
  },
): ChartDataItem[] => [
  {
    label: labels.reads,
    value: summary?.totals.reads || 0,
    color: "#94A3B8",
  },
  {
    label: labels.applied,
    value: summary?.totals.applied || 0,
    color: "#0EA5E9",
  },
  {
    label: labels.confirmed,
    value: summary?.totals.confirmed || 0,
    color: "#22C55E",
  },
];

export const buildGovernanceAiAppliedTimelineChartData = (
  summary: ClinicalAiSuggestionsSummaryResponse | null,
): ChartDataItem[] => {
  const points = summary?.timeline || [];
  if (!points.length) {
    return [{ label: "-", value: 0, color: "#CBD5E1" }];
  }
  return points.slice(-7).map((point) => ({
    label: point.date.slice(5),
    value: point.applied,
    color: "#0EA5E9",
  }));
};

export const buildFunnelStageChartData = (
  pipeline: CrmPipelineSummary | null,
): ChartDataItem[] => [
  {
    label: "Novo",
    value: pipeline?.byStage.NOVO.count || 0,
    color: "#6B7280",
  },
  {
    label: "Contato",
    value: pipeline?.byStage.CONTATO.count || 0,
    color: "#0EA5E9",
  },
  {
    label: "Proposta",
    value: pipeline?.byStage.PROPOSTA.count || 0,
    color: "#F59E0B",
  },
  {
    label: "Fechado",
    value: pipeline?.byStage.FECHADO.count || 0,
    color: "#22C55E",
  },
];
