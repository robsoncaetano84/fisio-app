import { useCallback, useEffect, useState } from "react";
import {
  getCrmAdminAuditLogs,
  getCrmAdminPatientsPaged,
  getCrmAdminProfessionalsPaged,
  getCrmAutomationActions,
  getCrmAutomationMetrics,
  getCrmCommandCenter,
  getCrmClinicalDashboardSummary,
  getCrmLeads,
  getCrmPhysicalExamTestsSummary,
  getCrmPipelineSummary,
  getCrmTasks,
  type CrmAdminAuditLog,
  type CrmAdminPatient,
  type CrmAdminProfessional,
  type CrmAutomationAction,
  type CrmAutomationMetricsResponse,
  type CrmCommandCenterActionType,
  type CrmCommandCenterSummary,
  type CrmClinicalDashboardSummary,
  type CrmLead,
  type CrmPhysicalExamTestsSummary,
  type CrmPipelineSummary,
  type CrmTask,
} from "../../services/crm";
import { parseApiError } from "../../utils/apiErrors";
import type {
  ClinicalPipelineStatusFilter,
  CrmLeadStageFilter,
  PacLinkFilter,
  ProfActiveFilter,
} from "./AdminCrmScreen.types";

type MainDataToast = {
  type: "error";
  message: string;
};

type MainDataParams = {
  isMaster: boolean;
  isWeb: boolean;
  query: string;
  stageFilter: CrmLeadStageFilter;
  profPage: number;
  pacPage: number;
  profActiveFilter: ProfActiveFilter;
  pacLinkFilter: PacLinkFilter;
  profEspecialidadeFilter: string;
  pacCidadeFilter: string;
  pacUfFilter: string;
  automationTypeFilter: CrmCommandCenterActionType | "TODAS";
  includeSensitiveData: boolean;
  sensitiveReason: string;
  windowDays: number;
  examWindowDays: number;
  semEvolucaoDias: number;
  clinicalPipelineStatusFilter: ClinicalPipelineStatusFilter;
  selectedProfId: string;
  selectedPacId: string;
  showToast: (toast: MainDataToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmMainData({
  isMaster,
  isWeb,
  query,
  stageFilter,
  profPage,
  pacPage,
  profActiveFilter,
  pacLinkFilter,
  profEspecialidadeFilter,
  pacCidadeFilter,
  pacUfFilter,
  automationTypeFilter,
  includeSensitiveData,
  sensitiveReason,
  windowDays,
  examWindowDays,
  semEvolucaoDias,
  clinicalPipelineStatusFilter,
  selectedProfId,
  selectedPacId,
  showToast,
  t,
}: MainDataParams) {
  const [pipeline, setPipeline] = useState<CrmPipelineSummary | null>(null);
  const [commandCenter, setCommandCenter] =
    useState<CrmCommandCenterSummary | null>(null);
  const [automationActions, setAutomationActions] = useState<
    CrmAutomationAction[]
  >([]);
  const [automationMetrics, setAutomationMetrics] =
    useState<CrmAutomationMetricsResponse | null>(null);
  const [clinicalSummary, setClinicalSummary] =
    useState<CrmClinicalDashboardSummary | null>(null);
  const [physicalExamSummary, setPhysicalExamSummary] =
    useState<CrmPhysicalExamTestsSummary | null>(null);
  const [crmProfessionals, setCrmProfessionals] = useState<
    CrmAdminProfessional[]
  >([]);
  const [crmPatients, setCrmPatients] = useState<CrmAdminPatient[]>([]);
  const [crmAuditLogs, setCrmAuditLogs] = useState<CrmAdminAuditLog[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [profPagesMeta, setProfPagesMeta] = useState(1);
  const [pacPagesMeta, setPacPagesMeta] = useState(1);

  const loadMain = useCallback(async () => {
    if (!isWeb || !isMaster) return;
    setLoading(true);
    try {
      const [
        pipelineSummary,
        clinical,
        physicalExam,
        commandCenterSummary,
        automationPaged,
        automationMetricsSummary,
        auditPaged,
        professionalsPaged,
        patientsPaged,
        leadRows,
        taskRows,
      ] = await Promise.all([
        getCrmPipelineSummary(),
        getCrmClinicalDashboardSummary({
          windowDays,
          semEvolucaoDias,
          professionalId: selectedProfId || undefined,
          patientId: selectedPacId || undefined,
          status:
            clinicalPipelineStatusFilter === "TODOS"
              ? undefined
              : clinicalPipelineStatusFilter,
        }),
        getCrmPhysicalExamTestsSummary({
          windowDays: examWindowDays,
          professionalId: selectedProfId || undefined,
          patientId: selectedPacId || undefined,
          status:
            clinicalPipelineStatusFilter === "TODOS"
              ? undefined
              : clinicalPipelineStatusFilter,
        }).catch(() => null),
        getCrmCommandCenter({
          windowDays,
          semEvolucaoDias,
          limit: 8,
          professionalId: selectedProfId || undefined,
          patientId: selectedPacId || undefined,
        }),
        getCrmAutomationActions({
          refresh: true,
          windowDays,
          semEvolucaoDias,
          professionalId: selectedProfId || undefined,
          patientId: selectedPacId || undefined,
          status: "ABERTAS",
          type:
            automationTypeFilter === "TODAS" ? undefined : automationTypeFilter,
          page: 1,
          limit: automationTypeFilter === "TODAS" ? 20 : 100,
        }),
        getCrmAutomationMetrics({
          windowDays: Math.max(30, windowDays),
        }),
        getCrmAdminAuditLogs({
          includeSensitive: includeSensitiveData ? true : undefined,
          page: 1,
          limit: 5,
        }),
        getCrmAdminProfessionalsPaged({
          q: query || undefined,
          ativo: profActiveFilter === "ATIVOS" ? true : undefined,
          especialidade: profEspecialidadeFilter.trim() || undefined,
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
          page: profPage,
          limit: 10,
        }),
        getCrmAdminPatientsPaged({
          q: query || undefined,
          vinculadoUsuarioPaciente:
            pacLinkFilter === "VINCULADOS"
              ? true
              : pacLinkFilter === "SEM_USUARIO"
                ? false
                : undefined,
          cidade: pacCidadeFilter.trim() || undefined,
          uf: pacUfFilter.trim() || undefined,
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
          page: pacPage,
          limit: 10,
        }),
        getCrmLeads({
          q: query || undefined,
          stage: stageFilter,
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
        }),
        getCrmTasks({
          status: "TODOS",
          limit: 200,
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
        }),
      ]);
      setPipeline(pipelineSummary);
      setCommandCenter(commandCenterSummary);
      setAutomationActions(automationPaged.items || []);
      setAutomationMetrics(automationMetricsSummary);
      setClinicalSummary(clinical);
      setPhysicalExamSummary(physicalExam);
      setCrmAuditLogs(auditPaged.items || []);
      setCrmProfessionals(professionalsPaged.items);
      setCrmPatients(patientsPaged.items);
      setProfPagesMeta(professionalsPaged.totalPages || 1);
      setPacPagesMeta(patientsPaged.totalPages || 1);
      setLeads(leadRows);
      setTasks(taskRows);
    } catch (error) {
      const parsed = parseApiError(error);
      const message =
        parsed.message?.toLowerCase().includes("network") ||
        parsed.message?.toLowerCase().includes("conectar")
          ? t("crm.messages.apiOffline")
          : `${t("crm.messages.loadFailed")}: ${parsed.message}`;
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [
    automationTypeFilter,
    clinicalPipelineStatusFilter,
    examWindowDays,
    includeSensitiveData,
    isMaster,
    isWeb,
    pacCidadeFilter,
    pacLinkFilter,
    pacPage,
    pacUfFilter,
    profActiveFilter,
    profEspecialidadeFilter,
    profPage,
    query,
    selectedPacId,
    selectedProfId,
    semEvolucaoDias,
    sensitiveReason,
    showToast,
    stageFilter,
    t,
    windowDays,
  ]);

  useEffect(() => {
    loadMain().catch(() => undefined);
  }, [loadMain]);

  return {
    pipeline,
    commandCenter,
    automationActions,
    automationMetrics,
    clinicalSummary,
    physicalExamSummary,
    crmProfessionals,
    crmPatients,
    crmAuditLogs,
    leads,
    tasks,
    loading,
    profPagesMeta,
    pacPagesMeta,
    loadMain,
  };
}
