// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ADMIN CRM SCREEN
// ==========================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";
import { useToast } from "../../components/ui";
import { useAuthStore } from "../../stores/authStore";
import { useLanguage } from "../../i18n/LanguageProvider";
import { parseApiError } from "../../utils/apiErrors";
import type {
  CrmAutomationAction,
  CrmCommandCenterActionType,
  CrmCommandCenterItem,
  CrmInteractionType,
  CrmLeadStage,
} from "../../services/crm";
import { updateCrmAutomationAction } from "../../services/crm";
import { UserRole } from "../../types";
import {
  buildTaskBuckets,
  filterTasksByBucket,
  type CrmAutomationHistoryItem,
  type ExamChartMode,
  type ExamConfidenceFilter,
  type PacSortKey,
  type ProfSortKey,
  type SortDir,
} from "./AdminCrmScreen.utils";
import { Blocked } from "./AdminCrmScreen.components";
import {
  createEmptyInteractionForm,
  createEmptyLeadForm,
  createEmptyPatientEditForm,
  createEmptyProfessionalEditForm,
  createEmptyTaskForm,
  createPatientEditForm,
  createProfessionalEditForm,
} from "./AdminCrmScreen.constants";
import { useAdminCrmAccountHealth } from "./AdminCrmScreen.account-health-state";
import { useAdminCrmAutomationItems } from "./AdminCrmScreen.automation-items";
import { AdminCrmAutomationPanel } from "./AdminCrmScreen.automation-panel";
import { ClinicalDashboardPanels } from "./AdminCrmScreen.clinical";
import { ClinicalCrmChartsPanel } from "./AdminCrmScreen.charts";
import { CommandCenterPanel } from "./AdminCrmScreen.command-center";
import { AdminCrmDashboardControls } from "./AdminCrmScreen.dashboard-controls";
import { useAdminCrmDashboardData } from "./AdminCrmScreen.dashboard-data";
import { useAdminCrmEntityActions } from "./AdminCrmScreen.admin-entity-actions";
import { useAdminCrmAccountHealthActions } from "./AdminCrmScreen.account-health-actions";
import { useAdminCrmCsvActions } from "./AdminCrmScreen.csv-actions";
import { CrmFiltersCard } from "./AdminCrmScreen.filters";
import { useAdminCrmFormActions } from "./AdminCrmScreen.form-actions";
import { useAdminCrmGovernanceState } from "./AdminCrmScreen.governance-state";
import { GovernancePanel } from "./AdminCrmScreen.governance";
import { InteractionsTab } from "./AdminCrmScreen.interactions";
import { useAdminCrmInteractionsState } from "./AdminCrmScreen.interactions-state";
import { LeadsTab } from "./AdminCrmScreen.leads";
import { useAdminCrmListState } from "./AdminCrmScreen.list-state";
import { useAdminCrmMainData } from "./AdminCrmScreen.main-data";
import {
  PatientsListPane,
  ProfessionalsListPane,
} from "./AdminCrmScreen.lists";
import {
  AccountHealthOverviewPanel,
  AdminAuditPanel,
} from "./AdminCrmScreen.overview";
import { useAdminCrmPaginationEffects } from "./AdminCrmScreen.pagination-effects";
import { PatientDetailPanel } from "./AdminCrmScreen.patient-detail";
import { usePhysicalExamSummaryActions } from "./AdminCrmScreen.physical-exam-actions";
import { usePhysicalExamNavigationActions } from "./AdminCrmScreen.physical-exam-navigation";
import { PhysicalExamSummaryPanel } from "./AdminCrmScreen.physical-exam";
import { ProfessionalDetailPanel } from "./AdminCrmScreen.professional-detail";
import { useAdminCrmProfessionalActions } from "./AdminCrmScreen.professional-actions";
import { useAdminCrmRecordActions } from "./AdminCrmScreen.record-actions";
import { buildPatientRows, buildProfessionalRows } from "./AdminCrmScreen.rows";
import { useAdminCrmSelectionEffects } from "./AdminCrmScreen.selection-effects";
import { useSensitiveDataToggle } from "./AdminCrmScreen.sensitive-toggle";
import {
  useAutomationStorage,
  useCrmPrefsStorage,
} from "./AdminCrmScreen.storage";
import { TasksTab } from "./AdminCrmScreen.tasks";
import { useAdminCrmAnalytics } from "./AdminCrmScreen.analytics";
import type {
  AdminCrmScreenProps,
  ClinicalPipelineStatusFilter,
  CrmLeadStageFilter,
  PacEmotionalFilter,
  PacLinkFilter,
  PacStatusFilter,
  ProfAccountStatusFilter,
  ProfActiveFilter,
  ProfEmotionalConcentrationFilter,
  TabKey,
  TaskBucket,
} from "./AdminCrmScreen.types";
import { styles } from "./AdminCrmScreen.styles";

export function AdminCrmScreen({ route }: AdminCrmScreenProps = {}) {
  const { usuario } = useAuthStore();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const isWeb = Platform.OS === "web";
  const isMaster = usuario?.role === UserRole.ADMIN;

  const [tab, setTab] = useState<TabKey>("PROFISSIONAIS");
  useEffect(() => {
    const initialTab = route?.params?.initialTab;
    if (!initialTab) return;
    setTab(initialTab);
  }, [route?.params?.initialTab]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<CrmLeadStageFilter>("TODOS");
  const [includeSensitiveData, setIncludeSensitiveData] = useState(false);
  const [sensitiveReason, setSensitiveReason] = useState("");
  const tabs = useMemo<Array<{ key: TabKey; label: string }>>(
    () => [
      { key: "PROFISSIONAIS", label: t("crm.sections.professionals") },
      { key: "PACIENTES", label: t("crm.sections.patients") },
      {
        key: "LEADS",
        label: `${t("crm.sections.leads")} / ${t("crm.sections.funnel")}`,
      },
      { key: "TAREFAS", label: t("crm.sections.tasks") },
      { key: "INTERACOES", label: t("crm.sections.interactions") },
    ],
    [t],
  );
  const stageLabel = useMemo<Record<CrmLeadStage, string>>(
    () => ({
      NOVO: t("crm.stage.new"),
      CONTATO: t("crm.stage.contact"),
      PROPOSTA: t("crm.stage.proposal"),
      FECHADO: t("crm.stage.closed"),
    }),
    [t],
  );
  const interactionLabel = useMemo<Record<CrmInteractionType, string>>(
    () => ({
      LIGACAO: t("crm.interaction.call"),
      WHATSAPP: t("crm.interaction.whatsapp"),
      PROPOSTA: t("crm.interaction.proposal"),
      DEMO: t("crm.interaction.demo"),
      EMAIL: t("crm.interaction.email"),
      REUNIAO: t("crm.interaction.meeting"),
      OUTRO: t("crm.interaction.other"),
    }),
    [t],
  );

  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedProfId, setSelectedProfId] = useState("");
  const [selectedPacId, setSelectedPacId] = useState("");
  const [profPage, setProfPage] = useState(1);
  const [pacPage, setPacPage] = useState(1);
  const [profSort, setProfSort] = useState<{ key: ProfSortKey; dir: SortDir }>({
    key: "nome",
    dir: "asc",
  });
  const [pacSort, setPacSort] = useState<{ key: PacSortKey; dir: SortDir }>({
    key: "nome",
    dir: "asc",
  });
  const [profActiveFilter, setProfActiveFilter] =
    useState<ProfActiveFilter>("ATIVOS");
  const [profAccountStatusFilter, setProfAccountStatusFilter] =
    useState<ProfAccountStatusFilter>("TODOS");
  const [
    profEmotionalConcentrationFilter,
    setProfEmotionalConcentrationFilter,
  ] = useState<ProfEmotionalConcentrationFilter>("TODOS");
  const [pacLinkFilter, setPacLinkFilter] = useState<PacLinkFilter>("TODOS");
  const [pacStatusFilter, setPacStatusFilter] =
    useState<PacStatusFilter>("TODOS");
  const [pacEmotionalFilter, setPacEmotionalFilter] =
    useState<PacEmotionalFilter>("TODOS");
  const [profEspecialidadeFilter, setProfEspecialidadeFilter] = useState("");
  const [pacCidadeFilter, setPacCidadeFilter] = useState("");
  const [pacUfFilter, setPacUfFilter] = useState("");
  const [windowDays, setWindowDays] = useState(7);
  const [examWindowDays, setExamWindowDays] = useState(30);
  const [semEvolucaoDias, setSemEvolucaoDias] = useState(10);
  const [clinicalPipelineStatusFilter, setClinicalPipelineStatusFilter] =
    useState<ClinicalPipelineStatusFilter>("TODOS");
  const [examChartMode, setExamChartMode] =
    useState<ExamChartMode>("POSITIVOS");
  const [examMinSample, setExamMinSample] = useState(3);
  const [examConfidenceFilter, setExamConfidenceFilter] =
    useState<ExamConfidenceFilter>("TODOS");
  const [taskBucketFilter, setTaskBucketFilter] = useState<TaskBucket>("TODAS");
  const [automationTypeFilter, setAutomationTypeFilter] = useState<
    CrmCommandCenterActionType | "TODAS"
  >("TODAS");
  const [profDetailTab, setProfDetailTab] = useState<"RESUMO" | "PACIENTES">(
    "RESUMO",
  );
  const [pacDetailTab, setPacDetailTab] = useState<
    "RESUMO" | "CONTATO" | "VINCULO"
  >("RESUMO");
  const [dismissedAutomationIds, setDismissedAutomationIds] = useState<
    string[]
  >([]);
  const [automationHistory, setAutomationHistory] = useState<
    CrmAutomationHistoryItem[]
  >([]);
  const {
    govActiveProtocol,
    govProtocolHistory,
    govAuditLogs,
    govAiSummary,
    govMyConsents,
    govLoading,
    govProtocolName,
    setGovProtocolName,
    govProtocolVersion,
    setGovProtocolVersion,
    govActivating,
    loadGovernance,
    handleActivateProtocol,
  } = useAdminCrmGovernanceState({
    isWeb,
    isMaster,
    windowDays,
    selectedProfId,
    selectedPacId,
    showToast,
    t,
  });

  useCrmPrefsStorage({
    tab,
    query,
    stageFilter,
    profSort,
    pacSort,
    profActiveFilter,
    profAccountStatusFilter,
    profEmotionalConcentrationFilter,
    pacLinkFilter,
    pacStatusFilter,
    pacEmotionalFilter,
    profEspecialidadeFilter,
    pacCidadeFilter,
    pacUfFilter,
    windowDays,
    examWindowDays,
    semEvolucaoDias,
    clinicalPipelineStatusFilter,
    examChartMode,
    examMinSample,
    examConfidenceFilter,
    taskBucketFilter,
    setTab,
    setQuery,
    setStageFilter,
    setProfSort,
    setPacSort,
    setProfActiveFilter,
    setProfAccountStatusFilter,
    setProfEmotionalConcentrationFilter,
    setPacLinkFilter,
    setPacStatusFilter,
    setPacEmotionalFilter,
    setProfEspecialidadeFilter,
    setPacCidadeFilter,
    setPacUfFilter,
    setWindowDays,
    setExamWindowDays,
    setSemEvolucaoDias,
    setClinicalPipelineStatusFilter,
    setExamChartMode,
    setExamMinSample,
    setExamConfidenceFilter,
    setTaskBucketFilter,
  });

  useAutomationStorage({
    userId: usuario?.id,
    dismissedAutomationIds,
    automationHistory,
    setDismissedAutomationIds,
    setAutomationHistory,
  });

  const {
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
  } = useAdminCrmMainData({
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
  });

  const { interactions, loadingInteractions, loadInteractions } =
    useAdminCrmInteractionsState({
      selectedLeadId,
      includeSensitiveData,
      sensitiveReason,
      showToast,
      t,
    });

  const [leadForm, setLeadForm] = useState(createEmptyLeadForm);
  const [taskForm, setTaskForm] = useState(() => createEmptyTaskForm());
  const [interactionForm, setInteractionForm] = useState(
    createEmptyInteractionForm,
  );
  const [editProfOpen, setEditProfOpen] = useState(false);
  const [editPacOpen, setEditPacOpen] = useState(false);
  const [profEditForm, setProfEditForm] = useState(
    createEmptyProfessionalEditForm,
  );
  const [pacEditForm, setPacEditForm] = useState(createEmptyPatientEditForm);

  const profs = useMemo(
    () => buildProfessionalRows(crmProfessionals, leads),
    [crmProfessionals, leads],
  );
  const noLinkLabel = t("crm.labels.noLink");
  const pacs = useMemo(
    () =>
      buildPatientRows({
        crmPatients,
        leads,
        profs,
        noLinkLabel,
      }),
    [crmPatients, leads, noLinkLabel, profs],
  );

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || null,
    [leads, selectedLeadId],
  );
  const selectedProf = useMemo(
    () => profs.find((p) => p.id === selectedProfId) || null,
    [profs, selectedProfId],
  );
  const selectedPac = useMemo(
    () => pacs.find((p) => p.id === selectedPacId) || null,
    [pacs, selectedPacId],
  );
  const taskLeadMap = useMemo(
    () => new Map(leads.map((l) => [l.id, l])),
    [leads],
  );
  const taskBuckets = useMemo(() => buildTaskBuckets(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => filterTasksByBucket(tasks, taskBuckets, taskBucketFilter),
    [taskBucketFilter, taskBuckets, tasks],
  );
  const {
    clinicalPipelineChartData,
    clinicalAlertsChartData,
    clinicalDurationChartData,
    clinicalOperationalEventsChartData,
    clinicalTopBlockedReasons,
    physicalExamFilterStats,
    physicalExamRegionChartData,
    physicalExamTopTestsChartData,
    physicalExamProfilesChartData,
    physicalExamTopRegionsList,
    physicalExamTopTestsList,
    physicalExamTopInsights,
    hasPhysicalExamData,
    physicalExamCoverage,
    governanceAiAppliedByStageChartData,
    governanceAiLifecycleChartData,
    governanceAiAppliedTimelineChartData,
    funnelStageChartData,
    taskStatusChartData,
  } = useAdminCrmDashboardData({
    clinicalSummary,
    physicalExamSummary,
    govAiSummary,
    pipeline,
    taskBuckets,
    examChartMode,
    examMinSample,
    examConfidenceFilter,
    t,
  });
  const { exportPhysicalExamSummaryCsv, copyPhysicalExamExecutiveSummary } =
    usePhysicalExamSummaryActions({
      physicalExamSummary,
      physicalExamTopInsights,
      physicalExamTopRegionsList,
      physicalExamTopTestsList,
      examChartMode,
      examMinSample,
      examConfidenceFilter,
      showToast,
      t,
    });
  const {
    openPatientsInAttention,
    openPatientQueue,
    openTopRegion,
    openTopTest,
  } = usePhysicalExamNavigationActions({
    chartMode: examChartMode,
    coverage: physicalExamCoverage,
    topInsights: physicalExamTopInsights,
    setTab,
    setPacStatusFilter,
    setPacEmotionalFilter,
  });
  const {
    profAccountScores,
    profEmotionalConcentrationMap,
    accountHealthOverview,
    selectedProfAccountScore,
    selectedProfEmotionalConcentration,
  } = useAdminCrmAccountHealth({ profs, pacs, selectedProf });
  const { openAccountStatus, openSensitiveCaseloads } =
    useAdminCrmAccountHealthActions({
      setTab,
      setProfAccountStatusFilter,
      setProfEmotionalConcentrationFilter,
    });
  const { createReactivationTask } = useAdminCrmProfessionalActions({
    selectedProf,
    selectedProfAccountScore,
    setTaskForm,
    setSelectedLeadId,
    setTab,
    t,
  });
  const { crmAutomationItems, pushAutomationHistory } =
    useAdminCrmAutomationItems({
      tasks,
      leads,
      profs,
      profAccountScores,
      dismissedAutomationIds,
      clinicalSummary,
      stageLabel,
      setTab,
      setPacStatusFilter,
      setPacLinkFilter,
      setSelectedLeadId,
      setSelectedProfId,
      setTaskForm,
      setAutomationHistory,
    });

  const handleCommandCenterAction = useCallback(
    (item: Pick<CrmCommandCenterItem, "type" | "targetId">) => {
      if (item.type === "TASK_OVERDUE") {
        setAutomationTypeFilter("TASK_OVERDUE");
        setTaskBucketFilter("ATRASADAS");
        setTab("TAREFAS");
        return;
      }
      if (item.type === "LEAD_STALE") {
        setAutomationTypeFilter("LEAD_STALE");
        setSelectedLeadId(item.targetId);
        setTab("LEADS");
        return;
      }
      if (item.type === "PENDING_INVITE") {
        setAutomationTypeFilter("PENDING_INVITE");
        setSelectedPacId(item.targetId);
        setPacLinkFilter("SEM_USUARIO");
        setPacDetailTab("VINCULO");
        setTab("PACIENTES");
        return;
      }
      if (
        item.type === "PATIENT_NO_EVOLUTION" ||
        item.type === "PATIENT_NO_CHECKIN" ||
        item.type === "PENDING_ANAMNESIS"
      ) {
        setAutomationTypeFilter(item.type);
        setSelectedPacId(item.targetId);
        setPacStatusFilter("RISCO");
        setTab("PACIENTES");
        return;
      }
      if (item.type === "LOW_ACTIVATION_ACCOUNT") {
        setSelectedProfId(item.targetId);
        setProfAccountStatusFilter("RISK");
        setTab("PROFISSIONAIS");
      }
    },
    [],
  );

  const handleAutomationStatusChange = useCallback(
    async (
      item: CrmAutomationAction,
      status: "DONE" | "DISMISSED" | "SNOOZED",
      options?: { slaDueAt?: string; note?: string },
    ) => {
      try {
        await updateCrmAutomationAction(item.id, {
          status,
          slaDueAt: options?.slaDueAt,
          note:
            options?.note ||
            (status === "DONE"
              ? "Concluida pelo dashboard CRM"
              : status === "SNOOZED"
                ? "Adiada pelo dashboard CRM"
                : "Dispensada pelo dashboard CRM"),
        });
        showToast({
          type: "success",
          message:
            status === "DONE"
              ? "Automação concluída."
              : status === "SNOOZED"
                ? "Automação adiada."
                : "Automação dispensada.",
        });
        await loadMain();
      } catch (error) {
        const parsed = parseApiError(error);
        showToast({
          type: "error",
          message: `Falha ao atualizar automação: ${parsed.message}`,
        });
      }
    },
    [loadMain, showToast],
  );

  const handleAutomationSnooze = useCallback(
    async (item: CrmAutomationAction, hours: number) => {
      const nextSla = new Date(Date.now() + hours * 60 * 60 * 1000);
      await handleAutomationStatusChange(item, "SNOOZED", {
        slaDueAt: nextSla.toISOString(),
        note: `Adiada por ${hours}h pelo dashboard CRM`,
      });
    },
    [handleAutomationStatusChange],
  );

  const handleAutomationAssignToMe = useCallback(
    async (item: CrmAutomationAction) => {
      if (!usuario?.id) return;
      try {
        await updateCrmAutomationAction(item.id, {
          responsavelUsuarioId: usuario.id,
          note: "Responsabilidade assumida no dashboard CRM",
        });
        showToast({
          type: "success",
          message: "Responsável atualizado.",
        });
        await loadMain();
      } catch (error) {
        const parsed = parseApiError(error);
        showToast({
          type: "error",
          message: `Falha ao assumir automação: ${parsed.message}`,
        });
      }
    },
    [loadMain, showToast, usuario?.id],
  );

  useAdminCrmAnalytics({
    isWeb,
    isMaster,
    loading,
    profs,
    profAccountScores,
    crmAutomationItems,
    includeSensitiveData,
    setIncludeSensitiveData,
    setSensitiveReason,
    showToast,
  });

  useAdminCrmSelectionEffects({
    leads,
    profs,
    pacs,
    selectedLeadId,
    selectedProfId,
    selectedPacId,
    setSelectedLeadId,
    setSelectedProfId,
    setSelectedPacId,
    crmProfessionals,
    crmPatients,
    setProfEditForm,
    setPacEditForm,
  });

  const { profTotalPages, pacTotalPages, pagedProfs, pagedPacs } =
    useAdminCrmListState({
      profs,
      pacs,
      query,
      profAccountStatusFilter,
      profEmotionalConcentrationFilter,
      pacStatusFilter,
      pacEmotionalFilter,
      automationActions,
      automationTypeFilter,
      profSort,
      pacSort,
      profPagesMeta,
      pacPagesMeta,
      profAccountScores,
      profEmotionalConcentrationMap,
    });

  useAdminCrmPaginationEffects({
    query,
    profActiveFilter,
    profAccountStatusFilter,
    profEmotionalConcentrationFilter,
    profEspecialidadeFilter,
    profSort,
    pacLinkFilter,
    pacStatusFilter,
    pacEmotionalFilter,
    pacCidadeFilter,
    pacUfFilter,
    pacSort,
    profPage,
    pacPage,
    profTotalPages,
    pacTotalPages,
    setProfPage,
    setPacPage,
  });

  const {
    resetLeadForm,
    resetTaskForm,
    resetInteractionForm,
    saveLead,
    saveTask,
    saveInteraction,
  } = useAdminCrmFormActions({
    leadForm,
    taskForm,
    interactionForm,
    setLeadForm,
    setTaskForm,
    setInteractionForm,
    selectedLeadId,
    setSelectedLeadId,
    loadMain,
    loadInteractions,
    showToast,
    t,
  });
  const {
    advanceLead,
    confirmDeleteLead,
    toggleTaskStatus,
    deleteTask,
    deleteInteraction,
  } = useAdminCrmRecordActions({
    selectedLeadId,
    loadMain,
    loadInteractions,
    showToast,
    t,
  });
  const resetProfEditForm = () => {
    const profRaw = crmProfessionals.find((p) => p.id === selectedProfId);
    if (!profRaw) return;
    setProfEditForm(createProfessionalEditForm(profRaw));
  };
  const resetPacEditForm = () => {
    const pacRaw = crmPatients.find((p) => p.id === selectedPacId);
    if (!pacRaw) return;
    setPacEditForm(createPatientEditForm(pacRaw));
  };

  const { savingAdminEntity, saveAdminProfessional, saveAdminPatient } =
    useAdminCrmEntityActions({
      selectedProfId,
      selectedPacId,
      profEditForm,
      pacEditForm,
      includeSensitiveData,
      sensitiveReason,
      setEditProfOpen,
      setEditPacOpen,
      loadMain,
      showToast,
      t,
    });

  const {
    exportCurrentTableCsv,
    exportAllFilteredCsv,
    exportLeadsCsv,
    exportTasksCsv,
    exportInteractionsCsv,
  } = useAdminCrmCsvActions({
    pagedProfs,
    pagedPacs,
    profEmotionalConcentrationMap,
    profAccountScores,
    query,
    profActiveFilter,
    profEspecialidadeFilter,
    profEmotionalConcentrationFilter,
    pacLinkFilter,
    pacCidadeFilter,
    pacUfFilter,
    profSort,
    pacSort,
    leads,
    stageFilter,
    stageLabel,
    tasks,
    taskLeadMap,
    interactions,
    selectedLeadId,
    selectedLead,
    interactionLabel,
    showToast,
    t,
  });

  const handleToggleSensitiveData = useSensitiveDataToggle({
    includeSensitiveData,
    setIncludeSensitiveData,
    setSensitiveReason,
    showToast,
    t,
  });

  if (!isWeb)
    return (
      <Blocked
        icon="desktop-outline"
        title={t("crm.access.webOnlyTitle")}
        subtitle={t("crm.access.webOnlySubtitle")}
      />
    );
  if (!isMaster)
    return (
      <Blocked
        icon="lock-closed-outline"
        title={t("crm.access.restrictedTitle")}
        subtitle={t("crm.access.restrictedSubtitle")}
      />
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <AdminCrmDashboardControls
            query={query}
            includeSensitiveData={includeSensitiveData}
            profs={profs}
            pacs={pacs}
            pipeline={pipeline}
            clinicalSummary={clinicalSummary}
            windowDays={windowDays}
            semEvolucaoDias={semEvolucaoDias}
            clinicalPipelineStatusFilter={clinicalPipelineStatusFilter}
            onQueryChange={setQuery}
            onToggleSensitiveData={handleToggleSensitiveData}
            loadMain={loadMain}
            loadGovernance={loadGovernance}
            setTab={setTab}
            setProfActiveFilter={setProfActiveFilter}
            setProfAccountStatusFilter={setProfAccountStatusFilter}
            setProfEmotionalConcentrationFilter={
              setProfEmotionalConcentrationFilter
            }
            setPacLinkFilter={setPacLinkFilter}
            setPacStatusFilter={setPacStatusFilter}
            setPacEmotionalFilter={setPacEmotionalFilter}
            setWindowDays={setWindowDays}
            setSemEvolucaoDias={setSemEvolucaoDias}
            setClinicalPipelineStatusFilter={setClinicalPipelineStatusFilter}
            t={t}
          />

          <CommandCenterPanel
            summary={commandCenter}
            onActionPress={handleCommandCenterAction}
            automationActions={automationActions}
            automationMetrics={automationMetrics}
            automationTypeFilter={automationTypeFilter}
            onAutomationTypeFilterChange={setAutomationTypeFilter}
            onAutomationPress={handleCommandCenterAction}
            onAutomationStatusChange={handleAutomationStatusChange}
            onAutomationSnooze={handleAutomationSnooze}
            onAutomationAssignToMe={handleAutomationAssignToMe}
            currentUserId={usuario?.id || null}
            professionals={profs.map((prof) => ({
              id: prof.id,
              nome: prof.nome,
            }))}
          />

          <GovernancePanel
            activeProtocol={govActiveProtocol}
            loading={govLoading}
            aiSummary={govAiSummary}
            protocolHistory={govProtocolHistory}
            auditLogs={govAuditLogs}
            myConsents={govMyConsents}
            lifecycleChartData={governanceAiLifecycleChartData}
            appliedByStageChartData={governanceAiAppliedByStageChartData}
            appliedTimelineChartData={governanceAiAppliedTimelineChartData}
            protocolName={govProtocolName}
            protocolVersion={govProtocolVersion}
            activating={govActivating}
            onProtocolNameChange={setGovProtocolName}
            onProtocolVersionChange={setGovProtocolVersion}
            onActivateProtocol={handleActivateProtocol}
          />

          <ClinicalDashboardPanels
            summary={clinicalSummary}
            topBlockedReasons={clinicalTopBlockedReasons}
            onStatusSelect={(status) => setClinicalPipelineStatusFilter(status)}
            onPendingAnamnesisPress={() => {
              setClinicalPipelineStatusFilter("ANAMNESE_PENDENTE");
              setTab("PACIENTES");
              setPacStatusFilter("RISCO");
            }}
          />

          <PhysicalExamSummaryPanel
            summary={physicalExamSummary}
            coverage={physicalExamCoverage}
            hasData={hasPhysicalExamData}
            chartMode={examChartMode}
            windowDays={examWindowDays}
            topInsights={physicalExamTopInsights}
            onWindowDaysChange={setExamWindowDays}
            onExportCsv={exportPhysicalExamSummaryCsv}
            onCopySummary={() => {
              copyPhysicalExamExecutiveSummary().catch(() => undefined);
            }}
            onOpenPatientsInAttention={openPatientsInAttention}
            onOpenPatientQueue={openPatientQueue}
            onTopRegionPress={openTopRegion}
            onTopTestPress={openTopTest}
          />
          <ClinicalCrmChartsPanel
            chartMode={examChartMode}
            minSample={examMinSample}
            confidenceFilter={examConfidenceFilter}
            filterStats={physicalExamFilterStats}
            clinicalPipelineChartData={clinicalPipelineChartData}
            clinicalAlertsChartData={clinicalAlertsChartData}
            clinicalDurationChartData={clinicalDurationChartData}
            clinicalOperationalEventsChartData={
              clinicalOperationalEventsChartData
            }
            funnelStageChartData={funnelStageChartData}
            physicalExamRegionChartData={physicalExamRegionChartData}
            physicalExamTopTestsChartData={physicalExamTopTestsChartData}
            physicalExamProfilesChartData={physicalExamProfilesChartData}
            physicalExamTopRegionsList={physicalExamTopRegionsList}
            physicalExamTopTestsList={physicalExamTopTestsList}
            onChartModeChange={setExamChartMode}
            onMinSampleChange={setExamMinSample}
            onConfidenceFilterChange={setExamConfidenceFilter}
          />

          <AdminAuditPanel logs={crmAuditLogs} />

          <AccountHealthOverviewPanel
            overview={accountHealthOverview}
            onAccountStatusPress={openAccountStatus}
            onSensitiveCaseloadsPress={openSensitiveCaseloads}
          />
        </View>

        <CrmFiltersCard
          tabs={tabs}
          tab={tab}
          stageLabel={stageLabel}
          stageFilter={stageFilter}
          profActiveFilter={profActiveFilter}
          profAccountStatusFilter={profAccountStatusFilter}
          profEmotionalConcentrationFilter={profEmotionalConcentrationFilter}
          profEspecialidadeFilter={profEspecialidadeFilter}
          pacStatusFilter={pacStatusFilter}
          pacEmotionalFilter={pacEmotionalFilter}
          pacLinkFilter={pacLinkFilter}
          pacCidadeFilter={pacCidadeFilter}
          pacUfFilter={pacUfFilter}
          onTabChange={setTab}
          onStageFilterChange={setStageFilter}
          onProfActiveFilterChange={setProfActiveFilter}
          onProfAccountStatusFilterChange={setProfAccountStatusFilter}
          onProfEmotionalConcentrationFilterChange={
            setProfEmotionalConcentrationFilter
          }
          onProfEspecialidadeFilterChange={setProfEspecialidadeFilter}
          onPacStatusFilterChange={setPacStatusFilter}
          onPacEmotionalFilterChange={setPacEmotionalFilter}
          onPacLinkFilterChange={setPacLinkFilter}
          onPacCidadeFilterChange={setPacCidadeFilter}
          onPacUfFilterChange={setPacUfFilter}
        />

        <AdminCrmAutomationPanel
          loading={loading}
          items={crmAutomationItems}
          dismissedAutomationIds={dismissedAutomationIds}
          history={automationHistory}
          setDismissedAutomationIds={setDismissedAutomationIds}
          pushAutomationHistory={pushAutomationHistory}
          t={t}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null}

        {!loading && tab === "PROFISSIONAIS" ? (
          <View style={styles.split}>
            <ProfessionalsListPane
              rows={pagedProfs}
              selectedId={selectedProfId}
              accountScores={profAccountScores}
              emotionalConcentration={profEmotionalConcentrationMap}
              sort={profSort}
              page={profPage}
              totalPages={profTotalPages}
              onSortChange={(key) =>
                setProfSort((prev) => ({
                  key,
                  dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
                }))
              }
              onSelect={setSelectedProfId}
              onPageChange={setProfPage}
              onExportCurrent={() => exportCurrentTableCsv("PROFISSIONAIS")}
              onExportAll={() => exportAllFilteredCsv("PROFISSIONAIS")}
            />
            <ProfessionalDetailPanel
              professional={selectedProf}
              editOpen={editProfOpen}
              editForm={profEditForm}
              saving={savingAdminEntity}
              detailTab={profDetailTab}
              accountScore={selectedProfAccountScore}
              emotionalConcentration={selectedProfEmotionalConcentration}
              linkedPatients={
                selectedProf
                  ? pacs.filter(
                      (item) => item.profissionalId === selectedProf.id,
                    )
                  : []
              }
              onToggleEdit={() => {
                if (!editProfOpen) resetProfEditForm();
                setEditProfOpen((prev) => !prev);
              }}
              onEditFormChange={(patch) =>
                setProfEditForm((prev) => ({ ...prev, ...patch }))
              }
              onSave={saveAdminProfessional}
              onCancel={() => {
                resetProfEditForm();
                setEditProfOpen(false);
              }}
              onDetailTabChange={setProfDetailTab}
              onCreateReactivationTask={createReactivationTask}
              onSelectPatient={(patient) => {
                setSelectedPacId(patient.id);
                setSelectedLeadId(patient.lead.id);
                setTab("PACIENTES");
              }}
            />
          </View>
        ) : null}

        {!loading && tab === "PACIENTES" ? (
          <View style={styles.split}>
            <PatientsListPane
              rows={pagedPacs}
              selectedId={selectedPacId}
              sort={pacSort}
              page={pacPage}
              totalPages={pacTotalPages}
              onSortChange={(key) =>
                setPacSort((prev) => ({
                  key,
                  dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
                }))
              }
              onSelect={(row) => {
                setSelectedPacId(row.id);
                setSelectedLeadId(row.lead.id);
              }}
              onPageChange={setPacPage}
              onExportCurrent={() => exportCurrentTableCsv("PACIENTES")}
              onExportAll={() => exportAllFilteredCsv("PACIENTES")}
            />
            <PatientDetailPanel
              patient={selectedPac}
              editOpen={editPacOpen}
              editForm={pacEditForm}
              saving={savingAdminEntity}
              detailTab={pacDetailTab}
              stageLabel={stageLabel}
              onToggleEdit={() => {
                if (!editPacOpen) resetPacEditForm();
                setEditPacOpen((prev) => !prev);
              }}
              onEditFormChange={(patch) =>
                setPacEditForm((prev) => ({ ...prev, ...patch }))
              }
              onSave={saveAdminPatient}
              onCancel={() => {
                resetPacEditForm();
                setEditPacOpen(false);
              }}
              onDetailTabChange={setPacDetailTab}
              onOpenInFunnel={() => {
                if (!selectedPac) return;
                setSelectedLeadId(selectedPac.lead.id);
                setTab("LEADS");
              }}
              onRegisterInteraction={() => {
                if (!selectedPac) return;
                setSelectedLeadId(selectedPac.lead.id);
                setTab("INTERACOES");
              }}
            />
          </View>
        ) : null}

        {!loading && tab === "LEADS" ? (
          <LeadsTab
            leads={leads}
            selectedLeadId={selectedLeadId}
            selectedLead={selectedLead}
            form={leadForm}
            stageLabel={stageLabel}
            interactionLabel={interactionLabel}
            interactions={interactions}
            loadingInteractions={loadingInteractions}
            onExportCurrent={() => exportLeadsCsv(false)}
            onExportAll={() => exportLeadsCsv(true)}
            onSelectLead={setSelectedLeadId}
            onEditLead={setLeadForm}
            onAdvanceLead={advanceLead}
            onDeleteLead={confirmDeleteLead}
            onFormChange={(patch) =>
              setLeadForm((prev) => ({ ...prev, ...patch }))
            }
            onSave={saveLead}
            onReset={resetLeadForm}
          />
        ) : null}

        {!loading && tab === "TAREFAS" ? (
          <TasksTab
            form={taskForm}
            tasks={tasks}
            filteredTasks={filteredTasks}
            taskBuckets={taskBuckets}
            bucketFilter={taskBucketFilter}
            taskStatusChartData={taskStatusChartData}
            taskLeadMap={taskLeadMap}
            onTitleChange={(titulo) =>
              setTaskForm((prev) => ({ ...prev, titulo }))
            }
            onLeadIdChange={(leadId) =>
              setTaskForm((prev) => ({ ...prev, leadId }))
            }
            onDueAtChange={(dueAt) =>
              setTaskForm((prev) => ({ ...prev, dueAt }))
            }
            onSave={saveTask}
            onReset={resetTaskForm}
            onExport={exportTasksCsv}
            onBucketFilterChange={setTaskBucketFilter}
            onEdit={setTaskForm}
            onToggleStatus={toggleTaskStatus}
            onDelete={deleteTask}
          />
        ) : null}

        {!loading && tab === "INTERACOES" ? (
          <InteractionsTab
            selectedLead={selectedLead}
            interactionLabel={interactionLabel}
            form={interactionForm}
            interactions={interactions}
            loadingInteractions={loadingInteractions}
            onTypeChange={(tipo) =>
              setInteractionForm((prev) => ({ ...prev, tipo }))
            }
            onSummaryChange={(resumo) =>
              setInteractionForm((prev) => ({ ...prev, resumo }))
            }
            onSave={saveInteraction}
            onReset={resetInteractionForm}
            onExport={exportInteractionsCsv}
            onEdit={(interaction) =>
              setInteractionForm({
                id: interaction.id,
                tipo: interaction.tipo,
                resumo: interaction.resumo,
              })
            }
            onDelete={deleteInteraction}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
