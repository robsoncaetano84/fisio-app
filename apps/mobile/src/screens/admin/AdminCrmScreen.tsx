// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ADMIN CRM SCREEN
// ==========================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import { useToast } from "../../components/ui";
import { useAuthStore } from "../../stores/authStore";
import { useLanguage } from "../../i18n/LanguageProvider";
import { parseApiError } from "../../utils/apiErrors";
import { trackEvent } from "../../services/analytics";
import {
  createCrmInteraction,
  createCrmLead,
  createCrmTask,
  deleteCrmInteraction,
  deleteCrmLead,
  deleteCrmTask,
  getCrmInteractions,
  getCrmAdminPatientsPaged,
  getCrmAdminAuditLogs,
  getCrmAdminPatients,
  getCrmAdminProfessionalsPaged,
  getCrmAdminProfessionals,
  getCrmClinicalDashboardSummary,
  getCrmPhysicalExamTestsSummary,
  getCrmLeads,
  getCrmPipelineSummary,
  getCrmTasks,
  getClinicalGovernanceActiveProtocol,
  getClinicalGovernanceProtocolHistory,
  activateClinicalGovernanceProtocol,
  getClinicalGovernanceMyConsents,
  getClinicalGovernanceAuditLogs,
  getClinicalGovernanceAiSuggestionsSummary,
  updateCrmAdminPatient,
  updateCrmAdminProfessional,
  updateCrmInteraction,
  updateCrmLead,
  updateCrmTask,
  type CrmInteraction,
  type CrmInteractionType,
  type CrmAdminPatient,
  type CrmAdminProfessional,
  type CrmAdminAuditLog,
  type CrmLead,
  type CrmLeadChannel,
  type CrmLeadStage,
  type CrmPipelineSummary,
  type CrmClinicalDashboardSummary,
  type CrmPhysicalExamTestsSummary,
  type CrmTask,
  type ClinicalProtocolVersion,
  type ClinicalMyConsentsResponse,
  type ClinicalAuditLog,
  type ClinicalAiSuggestionsSummaryResponse,
} from "../../services/crm";
import { UserRole } from "../../types";

type TabKey = "PROFISSIONAIS" | "PACIENTES" | "LEADS" | "TAREFAS" | "INTERACOES";
type AdminCrmScreenProps = {
  route?: {
    params?: {
      initialTab?: TabKey;
    };
  };
};
type TaskBucket = "TODAS" | "ATRASADAS" | "HOJE" | "PROXIMAS" | "CONCLUIDAS";
type ExamChartMode = "POSITIVOS" | "TAXA";
type ExamConfidenceFilter = "TODOS" | "ALTA" | "MEDIA" | "BAIXA";
type ClinicalPipelineStatusFilter =
  | "TODOS"
  | "NOVO_PACIENTE"
  | "AGUARDANDO_VINCULO"
  | "ANAMNESE_PENDENTE"
  | "EM_TRATAMENTO"
  | "ALTA";
type SortDir = "asc" | "desc";
type ProfSortKey = "nome" | "score" | "vulnEmocional" | "pacientes" | "ativos" | "ultimoAcesso";
type PacSortKey = "nome" | "profissionalNome" | "status" | "ultimoCheckin";
type ProfRow = {
  id: string;
  nome: string;
  cidade: string;
  pacientes: number;
  ativos: number;
  ultimoAcesso: string;
  adesao: number;
  leadIds: string[];
};
type PacRow = {
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
type AccountHealthStatus = "HEALTHY" | "ATTENTION" | "RISK";
type AccountHealthScore = {
  score: number;
  status: AccountHealthStatus;
  reasons: string[];
  nextAction: string;
};
type EmotionalConcentration = {
  vulneraveis: number;
  total: number;
  percentual: number;
  status: "OK" | "ATTENTION" | "RISK";
};
type CrmAutomationItem = {
  id: string;
  title: string;
  severity: "HIGH" | "MEDIUM";
  description: string;
  ctaLabel: string;
  onPress: () => void;
};
type CrmAutomationHistoryItem = {
  id: string;
  action: "EXECUTED" | "DISMISSED" | "RESET";
  automationId: string;
  title: string;
  occurredAt: string;
};

const STAGES: CrmLeadStage[] = ["NOVO", "CONTATO", "PROPOSTA", "FECHADO"];
const CHANNELS: CrmLeadChannel[] = ["SITE", "WHATSAPP", "INDICACAO", "INSTAGRAM", "OUTRO"];
const INTERACTION_TYPES: CrmInteractionType[] = ["LIGACAO", "WHATSAPP", "PROPOSTA", "DEMO", "EMAIL", "REUNIAO", "OUTRO"];
const CRM_PREFS_KEY = "crm:web:prefs:v1";
const CRM_AUTOMATIONS_DISMISSED_KEY_PREFIX = "crm:web:automations:dismissed:v1";
const CRM_AUTOMATIONS_HISTORY_KEY_PREFIX = "crm:web:automations:history:v1";
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const [stageFilter, setStageFilter] = useState<CrmLeadStage | "TODOS">("TODOS");
  const [pipeline, setPipeline] = useState<CrmPipelineSummary | null>(null);
  const [clinicalSummary, setClinicalSummary] = useState<CrmClinicalDashboardSummary | null>(null);
  const [physicalExamSummary, setPhysicalExamSummary] = useState<CrmPhysicalExamTestsSummary | null>(null);
  const [crmProfessionals, setCrmProfessionals] = useState<CrmAdminProfessional[]>([]);
  const [crmPatients, setCrmPatients] = useState<CrmAdminPatient[]>([]);
  const [crmAuditLogs, setCrmAuditLogs] = useState<CrmAdminAuditLog[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [govActiveProtocol, setGovActiveProtocol] = useState<ClinicalProtocolVersion | null>(null);
  const [govProtocolHistory, setGovProtocolHistory] = useState<ClinicalProtocolVersion[]>([]);
  const [govAuditLogs, setGovAuditLogs] = useState<ClinicalAuditLog[]>([]);
  const [govAiSummary, setGovAiSummary] =
    useState<ClinicalAiSuggestionsSummaryResponse | null>(null);
  const [govMyConsents, setGovMyConsents] = useState<ClinicalMyConsentsResponse | null>(null);
  const [govLoading, setGovLoading] = useState(false);
  const [govProtocolName, setGovProtocolName] = useState("Protocolo Clinico Base");
  const [govProtocolVersion, setGovProtocolVersion] = useState("");
  const [govActivating, setGovActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [includeSensitiveData, setIncludeSensitiveData] = useState(false);
  const [sensitiveReason, setSensitiveReason] = useState("");
  const sensitiveDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabs = useMemo<Array<{ key: TabKey; label: string }>>(
    () => [
      { key: "PROFISSIONAIS", label: t("crm.sections.professionals") },
      { key: "PACIENTES", label: t("crm.sections.patients") },
      { key: "LEADS", label: `${t("crm.sections.leads")} / ${t("crm.sections.funnel")}` },
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
  const [profPagesMeta, setProfPagesMeta] = useState(1);
  const [pacPagesMeta, setPacPagesMeta] = useState(1);
  const [profSort, setProfSort] = useState<{ key: ProfSortKey; dir: SortDir }>({ key: "nome", dir: "asc" });
  const [pacSort, setPacSort] = useState<{ key: PacSortKey; dir: SortDir }>({ key: "nome", dir: "asc" });
  const [profActiveFilter, setProfActiveFilter] = useState<"TODOS" | "ATIVOS">("ATIVOS");
  const [profAccountStatusFilter, setProfAccountStatusFilter] = useState<
    "TODOS" | "HEALTHY" | "ATTENTION" | "RISK"
  >("TODOS");
  const [profEmotionalConcentrationFilter, setProfEmotionalConcentrationFilter] = useState<
    "TODOS" | "ALTA"
  >("TODOS");
  const [pacLinkFilter, setPacLinkFilter] = useState<"TODOS" | "VINCULADOS" | "SEM_USUARIO">("TODOS");
  const [pacStatusFilter, setPacStatusFilter] = useState<"TODOS" | "ATIVO" | "RISCO">("TODOS");
  const [pacEmotionalFilter, setPacEmotionalFilter] = useState<"TODOS" | "EMOCIONAL">("TODOS");
  const [profEspecialidadeFilter, setProfEspecialidadeFilter] = useState("");
  const [pacCidadeFilter, setPacCidadeFilter] = useState("");
  const [pacUfFilter, setPacUfFilter] = useState("");
  const [windowDays, setWindowDays] = useState(7);
  const [examWindowDays, setExamWindowDays] = useState(30);
  const [semEvolucaoDias, setSemEvolucaoDias] = useState(10);
  const [clinicalPipelineStatusFilter, setClinicalPipelineStatusFilter] =
    useState<ClinicalPipelineStatusFilter>("TODOS");
  const [examChartMode, setExamChartMode] = useState<ExamChartMode>("POSITIVOS");
  const [examMinSample, setExamMinSample] = useState(3);
  const [examConfidenceFilter, setExamConfidenceFilter] =
    useState<ExamConfidenceFilter>("TODOS");
  const [taskBucketFilter, setTaskBucketFilter] = useState<TaskBucket>("TODAS");
  const [profDetailTab, setProfDetailTab] = useState<"RESUMO" | "PACIENTES">("RESUMO");
  const [pacDetailTab, setPacDetailTab] = useState<"RESUMO" | "CONTATO" | "VINCULO">("RESUMO");
  const [dismissedAutomationIds, setDismissedAutomationIds] = useState<string[]>([]);
  const [automationHistory, setAutomationHistory] = useState<CrmAutomationHistoryItem[]>([]);
  const automationDismissedStorageKey = `${CRM_AUTOMATIONS_DISMISSED_KEY_PREFIX}:${usuario?.id || "anon"}`;
  const automationHistoryStorageKey = `${CRM_AUTOMATIONS_HISTORY_KEY_PREFIX}:${usuario?.id || "anon"}`;
  const lastScoreSummaryHashRef = useRef<string | null>(null);
  const lastAutomationPanelHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CRM_PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as Partial<{
        tab: TabKey;
        query: string;
        stageFilter: CrmLeadStage | "TODOS";
        profSort: { key: ProfSortKey; dir: SortDir };
        pacSort: { key: PacSortKey; dir: SortDir };
        profActiveFilter: "TODOS" | "ATIVOS";
        profAccountStatusFilter: "TODOS" | "HEALTHY" | "ATTENTION" | "RISK";
        profEmotionalConcentrationFilter: "TODOS" | "ALTA";
        pacLinkFilter: "TODOS" | "VINCULADOS" | "SEM_USUARIO";
        pacStatusFilter: "TODOS" | "ATIVO" | "RISCO";
        pacEmotionalFilter: "TODOS" | "EMOCIONAL";
        profEspecialidadeFilter: string;
        pacCidadeFilter: string;
        pacUfFilter: string;
        windowDays: number;
        examWindowDays: number;
        semEvolucaoDias: number;
        clinicalPipelineStatusFilter: ClinicalPipelineStatusFilter;
        examChartMode: ExamChartMode;
        examMinSample: number;
        examConfidenceFilter: ExamConfidenceFilter;
        taskBucketFilter: TaskBucket;
      }>;
      if (prefs.tab) setTab(prefs.tab);
      if (typeof prefs.query === "string") setQuery(prefs.query);
      if (prefs.stageFilter) setStageFilter(prefs.stageFilter);
      if (prefs.profSort) setProfSort(prefs.profSort);
      if (prefs.pacSort) setPacSort(prefs.pacSort);
      if (prefs.profActiveFilter) setProfActiveFilter(prefs.profActiveFilter);
      if (prefs.profAccountStatusFilter) setProfAccountStatusFilter(prefs.profAccountStatusFilter);
      if (prefs.profEmotionalConcentrationFilter) setProfEmotionalConcentrationFilter(prefs.profEmotionalConcentrationFilter);
      if (prefs.pacLinkFilter) setPacLinkFilter(prefs.pacLinkFilter);
      if (prefs.pacStatusFilter) setPacStatusFilter(prefs.pacStatusFilter);
      if (prefs.pacEmotionalFilter) setPacEmotionalFilter(prefs.pacEmotionalFilter);
      if (typeof prefs.profEspecialidadeFilter === "string") setProfEspecialidadeFilter(prefs.profEspecialidadeFilter);
      if (typeof prefs.pacCidadeFilter === "string") setPacCidadeFilter(prefs.pacCidadeFilter);
      if (typeof prefs.pacUfFilter === "string") setPacUfFilter(prefs.pacUfFilter);
      if (typeof prefs.windowDays === "number" && prefs.windowDays > 0) {
        setWindowDays(Math.min(90, Math.max(3, Math.round(prefs.windowDays))));
      }
      if (typeof prefs.examWindowDays === "number" && prefs.examWindowDays > 0) {
        setExamWindowDays(Math.min(90, Math.max(3, Math.round(prefs.examWindowDays))));
      }
      if (typeof prefs.semEvolucaoDias === "number" && prefs.semEvolucaoDias > 0) {
        setSemEvolucaoDias(Math.min(60, Math.max(3, Math.round(prefs.semEvolucaoDias))));
      }
      if (prefs.clinicalPipelineStatusFilter) {
        setClinicalPipelineStatusFilter(prefs.clinicalPipelineStatusFilter);
      }
      if (prefs.examChartMode) setExamChartMode(prefs.examChartMode);
      if (typeof prefs.examMinSample === "number" && prefs.examMinSample > 0) {
        setExamMinSample(Math.min(20, Math.max(1, Math.round(prefs.examMinSample))));
      }
      if (prefs.examConfidenceFilter) {
        setExamConfidenceFilter(prefs.examConfidenceFilter);
      }
      if (prefs.taskBucketFilter) setTaskBucketFilter(prefs.taskBucketFilter);
    } catch {
      // ignore corrupted localStorage prefs
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CRM_PREFS_KEY,
        JSON.stringify({
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
        }),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [tab, query, stageFilter, profSort, pacSort, profActiveFilter, profAccountStatusFilter, profEmotionalConcentrationFilter, pacLinkFilter, pacStatusFilter, pacEmotionalFilter, profEspecialidadeFilter, pacCidadeFilter, pacUfFilter, windowDays, examWindowDays, semEvolucaoDias, clinicalPipelineStatusFilter, examChartMode, examMinSample, examConfidenceFilter, taskBucketFilter]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(automationDismissedStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setDismissedAutomationIds(parsed.filter((x) => typeof x === "string"));
      }
    } catch {
      // ignore localStorage errors
    }
  }, [automationDismissedStorageKey]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        automationDismissedStorageKey,
        JSON.stringify(dismissedAutomationIds),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [dismissedAutomationIds, automationDismissedStorageKey]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(automationHistoryStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAutomationHistory(
          parsed.filter((x) => x && typeof x === "object").slice(0, 5) as CrmAutomationHistoryItem[],
        );
      }
    } catch {
      // ignore localStorage errors
    }
  }, [automationHistoryStorageKey]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        automationHistoryStorageKey,
        JSON.stringify(automationHistory.slice(0, 5)),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [automationHistory, automationHistoryStorageKey]);

  const [leadForm, setLeadForm] = useState({ id: "", nome: "", empresa: "", canal: "SITE" as CrmLeadChannel, stage: "NOVO" as CrmLeadStage, valor: "" });
  const [taskForm, setTaskForm] = useState({ id: "", titulo: "", dueAt: "", leadId: "" });
  const [interactionForm, setInteractionForm] = useState({ id: "", tipo: "LIGACAO" as CrmInteractionType, resumo: "" });
  const [editProfOpen, setEditProfOpen] = useState(false);
  const [editPacOpen, setEditPacOpen] = useState(false);
  const [savingAdminEntity, setSavingAdminEntity] = useState(false);
  const [profEditForm, setProfEditForm] = useState({
    nome: "",
    email: "",
    especialidade: "",
    registroProf: "",
    ativo: true,
  });
  const [pacEditForm, setPacEditForm] = useState({
    nomeCompleto: "",
    cpf: "",
    dataNascimento: "",
    sexo: "OUTRO",
    estadoCivil: "SOLTEIRO",
    profissao: "",
    contatoWhatsapp: "",
    contatoTelefone: "",
    contatoEmail: "",
    enderecoCidade: "",
    enderecoUf: "",
    ativo: true,
  });

  const loadMain = useCallback(async () => {
    if (!isWeb || !isMaster) return;
    setLoading(true);
    try {
      const [p, clinical, physicalExam, auditPaged, profsPaged, pacsPaged, ls, ts] = await Promise.all([
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
            pacLinkFilter === "VINCULADOS" ? true : pacLinkFilter === "SEM_USUARIO" ? false : undefined,
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
      setPipeline(p);
      setClinicalSummary(clinical);
      setPhysicalExamSummary(physicalExam);
      setCrmAuditLogs(auditPaged.items || []);
      setCrmProfessionals(profsPaged.items);
      setCrmPatients(pacsPaged.items);
      setProfPagesMeta(profsPaged.totalPages || 1);
      setPacPagesMeta(pacsPaged.totalPages || 1);
      setLeads(ls);
      setTasks(ts);
    } catch (error) {
      const parsed = parseApiError(error);
      const msg =
        parsed.message?.toLowerCase().includes("network") ||
        parsed.message?.toLowerCase().includes("conectar")
          ? t("crm.messages.apiOffline")
          : `${t("crm.messages.loadFailed")}: ${parsed.message}`;
      showToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, [isMaster, isWeb, query, stageFilter, profPage, pacPage, profActiveFilter, pacLinkFilter, profEspecialidadeFilter, pacCidadeFilter, pacUfFilter, includeSensitiveData, sensitiveReason, windowDays, examWindowDays, semEvolucaoDias, clinicalPipelineStatusFilter, selectedProfId, selectedPacId, showToast]);

  const loadInteractions = useCallback(async (leadId: string) => {
    if (!leadId) { setInteractions([]); return; }
    setLoadingInteractions(true);
    try {
      setInteractions(
        await getCrmInteractions(leadId, {
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
        }),
      );
    }
    catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: `${t("crm.messages.interactionsLoadFailed")}: ${parsed.message}` });
    }
    finally { setLoadingInteractions(false); }
  }, [includeSensitiveData, sensitiveReason, showToast]);

  const loadGovernance = useCallback(async () => {
    if (!isWeb || !isMaster) return;
    setGovLoading(true);
    try {
      const [activeProtocol, protocolHistory, myConsents, auditLogs, aiSummary] = await Promise.all([
        getClinicalGovernanceActiveProtocol().catch(() => null),
        getClinicalGovernanceProtocolHistory({ limit: 6 }).catch(() => []),
        getClinicalGovernanceMyConsents().catch(() => null),
        getClinicalGovernanceAuditLogs({ limit: 8 }).catch(() => ({ items: [], count: 0 })),
        getClinicalGovernanceAiSuggestionsSummary({ windowDays }).catch(() => null),
      ]);

      setGovActiveProtocol(activeProtocol);
      setGovProtocolHistory(protocolHistory);
      setGovMyConsents(myConsents);
      setGovAuditLogs(auditLogs.items || []);
      setGovAiSummary(aiSummary);
      if (activeProtocol?.name) {
        setGovProtocolName(activeProtocol.name);
      }
      if (!govProtocolVersion && activeProtocol?.version) {
        setGovProtocolVersion(activeProtocol.version);
      }
    } catch {
      // keep CRM usable even if governance block fails
    } finally {
      setGovLoading(false);
    }
  }, [isMaster, isWeb, govProtocolVersion, windowDays]);

  const handleActivateProtocol = useCallback(async () => {
    if (!govProtocolName.trim() || !govProtocolVersion.trim()) {
      showToast({
        type: "error",
        message: t("crm.governance.fillNameVersion"),
      });
      return;
    }
    setGovActivating(true);
    try {
      await activateClinicalGovernanceProtocol({
        name: govProtocolName.trim(),
        version: govProtocolVersion.trim(),
      });
      showToast({ type: "success", message: t("crm.governance.activateSuccess") });
      await loadGovernance();
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({
        type: "error",
        message: parsed.message || t("crm.governance.activateError"),
      });
    } finally {
      setGovActivating(false);
    }
  }, [govProtocolName, govProtocolVersion, loadGovernance, showToast, t]);

  useEffect(() => { loadMain().catch(() => undefined); }, [loadMain]);
  useEffect(() => { loadInteractions(selectedLeadId).catch(() => undefined); }, [loadInteractions, selectedLeadId]);
  useEffect(() => { loadGovernance().catch(() => undefined); }, [loadGovernance]);

  const profs = useMemo<ProfRow[]>(() => {
    if (crmProfessionals.length) {
      return crmProfessionals.map((p, i) => ({
        id: p.id,
        nome: p.nome,
        cidade: p.especialidade || ["São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Curitiba/PR"][i % 4],
        pacientes: p.pacientesTotal,
        ativos: p.pacientesAtivos,
        ultimoAcesso: dt(p.lastPacienteUpdate || p.updatedAt || p.createdAt),
        adesao: p.pacientesTotal > 0 ? Math.max(40, Math.min(98, Math.round((p.pacientesAtivos / p.pacientesTotal) * 100))) : 0,
        leadIds: [],
      }));
    }
    const groups = new Map<string, CrmLead[]>();
    leads.forEach((l) => { const k = (l.empresa || "Atendimento individual").trim(); groups.set(k, [...(groups.get(k) || []), l]); });
    return Array.from(groups.entries()).map(([nome, arr], i) => ({
      id: `prof-${i}`,
      nome,
      cidade: ["São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Curitiba/PR"][i % 4],
      pacientes: arr.length,
      ativos: arr.filter((l) => l.stage !== "FECHADO").length,
      ultimoAcesso: dt(arr[0]?.updatedAt || arr[0]?.createdAt || new Date().toISOString()),
      adesao: Math.max(40, Math.min(96, 60 + arr.filter((l) => l.stage !== "NOVO").length * 8 - arr.filter((l) => l.stage === "NOVO").length * 3)),
      leadIds: arr.map((l) => l.id),
    }));
  }, [crmProfessionals, leads]);

  const pacs = useMemo<PacRow[]>(() => {
    if (crmPatients.length) {
      return crmPatients.map((p) => {
        const linkedLead =
          leads.find((l) => (p.contatoEmail && l.nome.toLowerCase() === p.nomeCompleto.toLowerCase())) ||
          leads.find((l) => l.nome.toLowerCase() === p.nomeCompleto.toLowerCase()) ||
          leads[0];
        const risco = Date.now() - new Date(p.updatedAt || p.createdAt).getTime() > 1000 * 60 * 60 * 24 * 10;
        return {
          id: p.id,
          nome: p.nomeCompleto,
          profissionalId: p.usuarioId,
          profissionalNome: p.profissionalNome || t("crm.labels.noLink"),
          status: risco ? "RISCO" : "ATIVO",
          emocionalVulneravel: Boolean(p.emocional?.vulnerabilidade),
          emocionalResumo: p.emocional
            ? {
                estresse: p.emocional.nivelEstresse ?? null,
                energia: p.emocional.energiaDiaria ?? null,
                apoio: p.emocional.apoioEmocional ?? null,
                sonoQualidade: p.emocional.qualidadeSono ?? null,
                humor: p.emocional.humorPredominante ?? null,
                updatedAt: p.emocional.updatedAt ?? null,
              }
            : null,
          ultimoCheckin: dt(p.updatedAt || p.createdAt),
          adesao: risco ? 48 : 80,
          lead: linkedLead || ({
            id: "",
            nome: p.nomeCompleto,
            empresa: p.profissionalNome,
            canal: "OUTRO",
            stage: "NOVO",
            responsavelNome: p.profissionalNome,
            responsavelUsuarioId: p.usuarioId,
            valorPotencial: 0,
            observacoes: null,
            ativo: true,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          } as CrmLead),
        };
      });
    }
    return leads.map((l, i) => {
      const p = profs.find((x) => x.leadIds.includes(l.id));
      const risco = l.stage === "NOVO";
      return {
        id: `pac-${l.id}`,
        nome: l.nome,
        profissionalId: p?.id || "",
        profissionalNome: p?.nome || t("crm.labels.noLink"),
        status: risco ? "RISCO" : "ATIVO",
        emocionalVulneravel: false,
        emocionalResumo: null,
        ultimoCheckin: dt(l.updatedAt || l.createdAt),
        adesao: risco ? 48 + (i % 10) : 72 + (i % 20),
        lead: l,
      };
    });
  }, [crmPatients, leads, profs]);

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) || null, [leads, selectedLeadId]);
  const selectedProf = useMemo(() => profs.find((p) => p.id === selectedProfId) || null, [profs, selectedProfId]);
  const selectedPac = useMemo(() => pacs.find((p) => p.id === selectedPacId) || null, [pacs, selectedPacId]);
  const taskLeadMap = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const taskBuckets = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday.getTime() + DAY_MS);
    const endNext7Days = new Date(endToday.getTime() + 7 * DAY_MS);

    const atrasadas = tasks.filter((task) => {
      if (task.status === "CONCLUIDA" || !task.dueAt) return false;
      const dueMs = new Date(task.dueAt).getTime();
      return !Number.isNaN(dueMs) && dueMs < startToday.getTime();
    });
    const hoje = tasks.filter((task) => {
      if (task.status === "CONCLUIDA" || !task.dueAt) return false;
      const dueMs = new Date(task.dueAt).getTime();
      return !Number.isNaN(dueMs) && dueMs >= startToday.getTime() && dueMs < endToday.getTime();
    });
    const proximas = tasks.filter((task) => {
      if (task.status === "CONCLUIDA" || !task.dueAt) return false;
      const dueMs = new Date(task.dueAt).getTime();
      return !Number.isNaN(dueMs) && dueMs >= endToday.getTime() && dueMs <= endNext7Days.getTime();
    });
    const concluidas = tasks.filter((task) => task.status === "CONCLUIDA");
    return { atrasadas, hoje, proximas, concluidas };
  }, [tasks]);
  const filteredTasks = useMemo(() => {
    if (taskBucketFilter === "ATRASADAS") return taskBuckets.atrasadas;
    if (taskBucketFilter === "HOJE") return taskBuckets.hoje;
    if (taskBucketFilter === "PROXIMAS") return taskBuckets.proximas;
    if (taskBucketFilter === "CONCLUIDAS") return taskBuckets.concluidas;
    return tasks;
  }, [taskBucketFilter, taskBuckets, tasks]);
  const clinicalPipelineChartData = useMemo(
    () => [
      { label: t("crm.pipeline.new"), value: clinicalSummary?.pipeline.novoPaciente || 0, color: "#6B7280" },
      { label: t("crm.pipeline.link"), value: clinicalSummary?.pipeline.aguardandoVinculo || 0, color: "#0EA5E9" },
      { label: t("crm.pipeline.anamnesis"), value: clinicalSummary?.pipeline.anamnesePendente || 0, color: "#F59E0B" },
      { label: t("crm.pipeline.treatment"), value: clinicalSummary?.pipeline.emTratamento || 0, color: "#10B981" },
      { label: t("crm.pipeline.discharge"), value: clinicalSummary?.pipeline.alta || 0, color: "#22C55E" },
    ],
    [clinicalSummary],
  );
  const clinicalAlertsChartData = useMemo(
    () => [
      { label: t("crm.alerts.noCheckin"), value: clinicalSummary?.alertas.semCheckin || 0, color: "#F97316" },
      { label: t("crm.alerts.noProgress"), value: clinicalSummary?.alertas.semEvolucao || 0, color: "#EF4444" },
      { label: t("crm.alerts.pendingAnamnesis"), value: clinicalSummary?.alertas.anamnesePendente || 0, color: "#F59E0B" },
      { label: t("crm.alerts.pendingInvite"), value: clinicalSummary?.alertas.conviteNaoAceito || 0, color: "#EAB308" },
    ],
    [clinicalSummary],
  );
  const clinicalDurationChartData = useMemo(
    () => [
      { label: "Anamnese", value: Math.round((clinicalSummary?.metricas.tempoMedioPorEtapaMs.ANAMNESE || 0) / 60000), color: "#14B8A6" },
      { label: "Exame físico", value: Math.round((clinicalSummary?.metricas.tempoMedioPorEtapaMs.EXAME_FISICO || 0) / 60000), color: "#0EA5E9" },
      { label: "Evolução", value: Math.round((clinicalSummary?.metricas.tempoMedioPorEtapaMs.EVOLUCAO || 0) / 60000), color: "#8B5CF6" },
    ],
    [clinicalSummary],
  );
  const filteredPhysicalExamRegions = useMemo(() => {
    let rows = [...(physicalExamSummary?.porRegiao || [])];
    if (examChartMode === "TAXA") {
      rows = rows.filter((item) => item.avaliados >= examMinSample);
      if (examConfidenceFilter !== "TODOS") {
        rows = rows.filter(
          (item) => getSampleConfidence(item.avaliados) === examConfidenceFilter,
        );
      }
    }
    return rows;
  }, [physicalExamSummary, examChartMode, examMinSample, examConfidenceFilter]);
  const filteredPhysicalExamTests = useMemo(() => {
    let rows = [...(physicalExamSummary?.topTestesPositivos || [])];
    if (examChartMode === "TAXA") {
      rows = rows.filter((item) => item.avaliados >= examMinSample);
      if (examConfidenceFilter !== "TODOS") {
        rows = rows.filter(
          (item) => getSampleConfidence(item.avaliados) === examConfidenceFilter,
        );
      }
    }
    return rows;
  }, [physicalExamSummary, examChartMode, examMinSample, examConfidenceFilter]);
  const physicalExamFilterStats = useMemo(() => {
    const totalRegions = physicalExamSummary?.porRegiao?.length || 0;
    const totalTests = physicalExamSummary?.topTestesPositivos?.length || 0;
    const consideredRegions = filteredPhysicalExamRegions.length;
    const consideredTests = filteredPhysicalExamTests.length;
    return {
      totalRegions,
      totalTests,
      consideredRegions,
      consideredTests,
      excludedRegions: Math.max(0, totalRegions - consideredRegions),
      excludedTests: Math.max(0, totalTests - consideredTests),
    };
  }, [physicalExamSummary, filteredPhysicalExamRegions, filteredPhysicalExamTests]);
  const physicalExamRegionChartData = useMemo(() => {
    if (!filteredPhysicalExamRegions.length) {
      return [
        { label: t("crm.common.noData"), value: 0, color: "#CBD5E1" },
      ];
    }
    const ordered = [...filteredPhysicalExamRegions].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    );
    return ordered.slice(0, 8).map((item, index) => ({
      label: item.regiao,
      value:
        examChartMode === "TAXA"
          ? Math.round(item.taxaPositividade)
          : item.positivos,
      color: ["#0EA5E9", "#14B8A6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#6366F1", "#84CC16"][index % 8],
    }));
  }, [filteredPhysicalExamRegions, examChartMode]);
  const physicalExamTopTestsChartData = useMemo(() => {
    if (!filteredPhysicalExamTests.length) {
      return [
        { label: t("crm.common.noData"), value: 0, color: "#CBD5E1" },
      ];
    }
    const ordered = [...filteredPhysicalExamTests].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    );
    return ordered.slice(0, 8).map((item, index) => ({
      label: item.teste,
      value:
        examChartMode === "TAXA"
          ? Math.round(item.taxaPositividade)
          : item.positivos,
      color: ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#22C55E", "#14B8A6", "#0EA5E9", "#6366F1"][index % 8],
    }));
  }, [filteredPhysicalExamTests, examChartMode]);
  const physicalExamProfilesChartData = useMemo(() => {
    if (!physicalExamSummary?.perfisScoring?.length) {
      return [
        { label: t("crm.common.noData"), value: 0, color: "#CBD5E1" },
      ];
    }
    return physicalExamSummary.perfisScoring.slice(0, 8).map((item, index) => ({
      label: item.perfil,
      value: item.count,
      color: ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"][index % 8],
    }));
  }, [physicalExamSummary]);
  const physicalExamTopRegionsList = useMemo(() => {
    const rows = [...filteredPhysicalExamRegions].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    );
    return rows.slice(0, 5).map((item) => ({
      label: item.regiao,
      value:
        examChartMode === "TAXA"
          ? `${Math.round(item.taxaPositividade)}%`
          : String(item.positivos),
      detail:
        examChartMode === "TAXA"
          ? `${item.positivos}/${item.avaliados}`
          : "",
      sample: item.avaliados,
    }));
  }, [filteredPhysicalExamRegions, examChartMode]);
  const physicalExamTopTestsList = useMemo(() => {
    const rows = [...filteredPhysicalExamTests].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    );
    return rows.slice(0, 5).map((item) => ({
      label: item.teste,
      value:
        examChartMode === "TAXA"
          ? `${Math.round(item.taxaPositividade)}%`
          : String(item.positivos),
      detail:
        examChartMode === "TAXA"
          ? `${item.positivos}/${item.avaliados}`
          : "",
      sample: item.avaliados,
    }));
  }, [filteredPhysicalExamTests, examChartMode]);
  const physicalExamTopInsights = useMemo(() => {
    const empty = {
      topRegionLabel: "-",
      topRegionValue: "-",
      topRegionDetail: "",
      topRegionSample: 0,
      topTestLabel: "-",
      topTestValue: "-",
      topTestDetail: "",
      topTestSample: 0,
    };
    if (!physicalExamSummary) return empty;

    const topRegion = [...filteredPhysicalExamRegions].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    )[0];
    const topTest = [...filteredPhysicalExamTests].sort((a, b) =>
      examChartMode === "TAXA"
        ? b.taxaPositividade - a.taxaPositividade
        : b.positivos - a.positivos,
    )[0];

    return {
      topRegionLabel: topRegion?.regiao || "-",
      topRegionValue: topRegion
        ? examChartMode === "TAXA"
          ? `${Math.round(topRegion.taxaPositividade)}%`
          : String(topRegion.positivos)
        : "-",
      topRegionDetail:
        topRegion && examChartMode === "TAXA"
          ? `${topRegion.positivos}/${topRegion.avaliados}`
          : "",
      topRegionSample: topRegion?.avaliados || 0,
      topTestLabel: topTest?.teste || "-",
      topTestValue: topTest
        ? examChartMode === "TAXA"
          ? `${Math.round(topTest.taxaPositividade)}%`
          : String(topTest.positivos)
        : "-",
      topTestDetail:
        topTest && examChartMode === "TAXA"
          ? `${topTest.positivos}/${topTest.avaliados}`
          : "",
      topTestSample: topTest?.avaliados || 0,
    };
  }, [physicalExamSummary, examChartMode, filteredPhysicalExamRegions, filteredPhysicalExamTests]);
  const hasPhysicalExamData = useMemo(
    () => (physicalExamSummary?.laudosComExameEstruturado || 0) > 0,
    [physicalExamSummary],
  );
  const physicalExamCoverage = useMemo(() => {
    const analyzed = physicalExamSummary?.laudosAnalisados || 0;
    const structured = physicalExamSummary?.laudosComExameEstruturado || 0;
    const pct = analyzed > 0 ? Math.round((structured / analyzed) * 100) : 0;
    const status = pct >= 70 ? "ALTA" : pct >= 40 ? "MEDIA" : "BAIXA";
    return { pct, status };
  }, [physicalExamSummary]);
  const exportPhysicalExamSummaryCsv = useCallback(() => {
    if (!physicalExamSummary) {
      showToast({ type: "info", message: t("crm.messages.noPhysicalExamDataToExport") });
      return;
    }
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const rows: Array<Record<string, unknown>> = [];

    rows.push({
      tipo: "resumo",
      modo_ordenacao: examChartMode,
      base_minima_avaliados: examChartMode === "TAXA" ? examMinSample : "",
      filtro_confianca_amostral: examChartMode === "TAXA" ? examConfidenceFilter : "",
      gerado_em: new Date().toISOString(),
      janela_dias: physicalExamSummary.windowDays,
      laudos_analisados: physicalExamSummary.laudosAnalisados,
      laudos_com_exame_estruturado: physicalExamSummary.laudosComExameEstruturado,
      total_avaliados: physicalExamSummary.totalAvaliados,
      total_positivos: physicalExamSummary.totalPositivos,
      taxa_positividade_geral: `${Math.round(physicalExamSummary.taxaPositividadeGeral)}%`,
      nome: "",
      positivos: "",
      avaliados: "",
      taxa_positividade: "",
    });

    physicalExamSummary.porRegiao.forEach((item) => {
      rows.push({
        tipo: "regiao",
        modo_ordenacao: examChartMode,
        base_minima_avaliados: examChartMode === "TAXA" ? examMinSample : "",
        filtro_confianca_amostral: examChartMode === "TAXA" ? examConfidenceFilter : "",
        gerado_em: "",
        janela_dias: physicalExamSummary.windowDays,
        laudos_analisados: "",
        laudos_com_exame_estruturado: "",
        total_avaliados: "",
        total_positivos: "",
        taxa_positividade_geral: "",
        nome: item.regiao,
        positivos: item.positivos,
        avaliados: item.avaliados,
        taxa_positividade: `${Math.round(item.taxaPositividade)}%`,
      });
    });

    physicalExamSummary.topTestesPositivos.forEach((item) => {
      rows.push({
        tipo: "teste",
        modo_ordenacao: examChartMode,
        base_minima_avaliados: examChartMode === "TAXA" ? examMinSample : "",
        filtro_confianca_amostral: examChartMode === "TAXA" ? examConfidenceFilter : "",
        gerado_em: "",
        janela_dias: physicalExamSummary.windowDays,
        laudos_analisados: "",
        laudos_com_exame_estruturado: "",
        total_avaliados: "",
        total_positivos: "",
        taxa_positividade_geral: "",
        nome: item.teste,
        positivos: item.positivos,
        avaliados: item.avaliados,
        taxa_positividade: `${Math.round(item.taxaPositividade)}%`,
      });
    });
    physicalExamSummary.perfisScoring.forEach((item) => {
      rows.push({
        tipo: "perfil_scoring",
        modo_ordenacao: examChartMode,
        base_minima_avaliados: examChartMode === "TAXA" ? examMinSample : "",
        filtro_confianca_amostral: examChartMode === "TAXA" ? examConfidenceFilter : "",
        gerado_em: "",
        janela_dias: physicalExamSummary.windowDays,
        laudos_analisados: "",
        laudos_com_exame_estruturado: "",
        total_avaliados: "",
        total_positivos: "",
        taxa_positividade_geral: "",
        nome: item.perfil,
        positivos: item.count,
        avaliados: "",
        taxa_positividade: "",
      });
    });

    downloadCsv(
      `crm-exame-fisico-resumo-${now}.csv`,
      [
        "tipo",
        "modo_ordenacao",
        "base_minima_avaliados",
        "filtro_confianca_amostral",
        "gerado_em",
        "janela_dias",
        "laudos_analisados",
        "laudos_com_exame_estruturado",
        "total_avaliados",
        "total_positivos",
        "taxa_positividade_geral",
        "nome",
        "positivos",
        "avaliados",
        "taxa_positividade",
      ],
      rows,
    );

    trackEvent("crm_kpi_clicked", {
      kpi: "physical_exam_csv_exported",
      windowDays: physicalExamSummary.windowDays,
      mode: examChartMode,
      minSample: examChartMode === "TAXA" ? examMinSample : null,
      confidenceFilter: examChartMode === "TAXA" ? examConfidenceFilter : null,
      rows: rows.length,
    }).catch(() => undefined);
      showToast({ type: "success", message: t("crm.messages.physicalExamSummaryExported") });
  }, [physicalExamSummary, showToast, examChartMode, examMinSample, examConfidenceFilter]);
  const copyPhysicalExamExecutiveSummary = useCallback(async () => {
    if (!physicalExamSummary) {
      showToast({ type: "info", message: t("crm.messages.noPhysicalExamDataToCopy") });
      return;
    }

    const topRegionsText = physicalExamTopRegionsList
      .slice(0, 3)
      .map((item, index) => `${index + 1}. ${item.label} (${item.value})`)
      .join(" | ");
    const topTestsText = physicalExamTopTestsList
      .slice(0, 3)
      .map((item, index) => `${index + 1}. ${item.label} (${item.value})`)
      .join(" | ");

    const summary = [
      `${t("crm.summary.executivePhysicalExamTitle")} (${physicalExamSummary.windowDays} ${t("crm.summary.days")})`,
      `Laudos analisados: ${physicalExamSummary.laudosAnalisados}`,
      `Com exame estruturado: ${physicalExamSummary.laudosComExameEstruturado}`,
      `Testes avaliados: ${physicalExamSummary.totalAvaliados}`,
      `Testes positivos: ${physicalExamSummary.totalPositivos}`,
      `Taxa de positividade geral: ${Math.round(physicalExamSummary.taxaPositividadeGeral)}%`,
      `Base mínima para ranking: ${examChartMode === "TAXA" ? `${examMinSample} avaliados` : "não aplicada"}`,
      `Filtro de confiança amostral: ${examChartMode === "TAXA" ? examConfidenceFilter : "não aplicado"}`,
      `${examChartMode === "TAXA" ? t("crm.summary.topRegionRate") : t("crm.summary.topRegionPositives")}: ${physicalExamTopInsights.topRegionLabel} (${physicalExamTopInsights.topRegionValue})`,
      `${examChartMode === "TAXA" ? t("crm.summary.topTestRate") : t("crm.summary.topTestPositives")}: ${physicalExamTopInsights.topTestLabel} (${physicalExamTopInsights.topTestValue})`,
      `Top regiões: ${topRegionsText || "-"}`,
      `Top testes: ${topTestsText || "-"}`,
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(summary);
        trackEvent("crm_kpi_clicked", {
          kpi: "physical_exam_summary_copied",
          windowDays: physicalExamSummary.windowDays,
          mode: examChartMode,
          minSample: examChartMode === "TAXA" ? examMinSample : null,
          confidenceFilter: examChartMode === "TAXA" ? examConfidenceFilter : null,
        }).catch(() => undefined);
      showToast({ type: "success", message: t("crm.messages.summaryCopied") });
        return;
      } catch {
        // fallback below
      }
    }

    showToast({ type: "info", message: t("crm.messages.copyWebOnly") });
  }, [
    physicalExamSummary,
    physicalExamTopInsights.topRegionLabel,
    physicalExamTopInsights.topRegionValue,
    physicalExamTopInsights.topTestLabel,
    physicalExamTopInsights.topTestValue,
    physicalExamTopRegionsList,
    physicalExamTopTestsList,
    examChartMode,
    examMinSample,
    examConfidenceFilter,
    showToast,
  ]);
  const funnelStageChartData = useMemo(
    () => [
      { label: "Novo", value: pipeline?.byStage.NOVO.count || 0, color: "#6B7280" },
      { label: "Contato", value: pipeline?.byStage.CONTATO.count || 0, color: "#0EA5E9" },
      { label: "Proposta", value: pipeline?.byStage.PROPOSTA.count || 0, color: "#F59E0B" },
      { label: "Fechado", value: pipeline?.byStage.FECHADO.count || 0, color: "#22C55E" },
    ],
    [pipeline],
  );
  const taskStatusChartData = useMemo(
    () => [
      { label: "Atrasadas", value: taskBuckets.atrasadas.length, color: "#EF4444" },
      { label: "Hoje", value: taskBuckets.hoje.length, color: "#F59E0B" },
      { label: "Próximas 7d", value: taskBuckets.proximas.length, color: "#0EA5E9" },
      { label: "Concluídas", value: taskBuckets.concluidas.length, color: "#22C55E" },
    ],
    [taskBuckets],
  );
  const profAccountScores = useMemo(() => {
    const map = new Map<string, AccountHealthScore>();
    profs.forEach((prof) => {
      const profPatients = pacs.filter((p) => p.profissionalId === prof.id);
      map.set(prof.id, computeAccountHealthScore(prof, profPatients));
    });
    return map;
  }, [profs, pacs]);
  const profEmotionalConcentrationMap = useMemo(() => {
    const map = new Map<string, EmotionalConcentration>();
    profs.forEach((prof) => {
      const profPatients = pacs.filter((p) => p.profissionalId === prof.id);
      const total = profPatients.length;
      const vulneraveis = profPatients.filter((p) => p.emocionalVulneravel).length;
      const percentual = total > 0 ? Math.round((vulneraveis / total) * 100) : 0;
      const status: EmotionalConcentration["status"] =
        total >= 5 && percentual >= 40
          ? "RISK"
          : total >= 5 && percentual >= 25
            ? "ATTENTION"
            : "OK";
      map.set(prof.id, { vulneraveis, total, percentual, status });
    });
    return map;
  }, [profs, pacs]);
  const selectedProfAccountScore = selectedProf
    ? profAccountScores.get(selectedProf.id) || null
    : null;
  const selectedProfEmotionalConcentration = selectedProf
    ? profEmotionalConcentrationMap.get(selectedProf.id) || null
    : null;
  const crmAutomationItems = useMemo<CrmAutomationItem[]>(() => {
    const now = Date.now();
    const pendingTasks = tasks.filter((t) => t.status !== "CONCLUIDA");
    const overdueTasks = pendingTasks
      .filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now)
      .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());

    const staleLeads = leads
      .filter((l) => l.stage === "CONTATO" || l.stage === "PROPOSTA")
      .filter((l) => {
        const updatedMs = new Date(l.updatedAt || l.createdAt).getTime();
        const daysWithoutUpdate = Number.isNaN(updatedMs)
          ? 999
          : (now - updatedMs) / (1000 * 60 * 60 * 24);
        if (daysWithoutUpdate < 3) return false;
        const hasRecentPendingTask = pendingTasks.some((t) => {
          if (t.leadId !== l.id) return false;
          if (!t.dueAt) return true;
          const dueMs = new Date(t.dueAt).getTime();
          return !Number.isNaN(dueMs) && dueMs >= now - 1000 * 60 * 60 * 24;
        });
        return !hasRecentPendingTask;
      })
      .sort(
        (a, b) =>
          new Date(a.updatedAt || a.createdAt).getTime() -
          new Date(b.updatedAt || b.createdAt).getTime(),
      );

    const lowActivationAccounts = profs
      .map((p) => ({ prof: p, score: profAccountScores.get(p.id) }))
      .filter((x): x is { prof: ProfRow; score: AccountHealthScore } => Boolean(x.score))
      .filter(
        (x) =>
          x.score.status !== "HEALTHY" ||
          x.score.reasons.some((r) => r.includes("ativação")),
      )
      .sort((a, b) => a.score.score - b.score.score);

    const items: CrmAutomationItem[] = [];

    if ((clinicalSummary?.alertas.semEvolucao || 0) > 0) {
      items.push({
        id: "clinical_no_evolution",
        title: "Pacientes sem evolução recente",
        severity: (clinicalSummary?.alertas.semEvolucao || 0) >= 5 ? "HIGH" : "MEDIUM",
        description: `${clinicalSummary?.alertas.semEvolucao || 0} paciente(s) sem evolução no período esperado.`,
        ctaLabel: "Abrir pacientes em atenção",
        onPress: () => {
          setTab("PACIENTES");
          setPacStatusFilter("RISCO");
        },
      });
    }

    if ((clinicalSummary?.alertas.anamnesePendente || 0) > 0) {
      items.push({
        id: "clinical_pending_anamnesis",
        title: "Anamnese pendente",
        severity: (clinicalSummary?.alertas.anamnesePendente || 0) >= 5 ? "HIGH" : "MEDIUM",
        description: `${clinicalSummary?.alertas.anamnesePendente || 0} paciente(s) ainda sem anamnese concluída.`,
        ctaLabel: "Abrir fila clínica",
        onPress: () => {
          setTab("PACIENTES");
          setPacStatusFilter("RISCO");
        },
      });
    }

    if ((clinicalSummary?.alertas.conviteNaoAceito || 0) > 0) {
      items.push({
        id: "clinical_invite_not_accepted",
        title: "Convites não aceitos",
        severity: "MEDIUM",
        description: `${clinicalSummary?.alertas.conviteNaoAceito || 0} convite(s) pendente(s) de aceite.`,
        ctaLabel: "Abrir sem usuário",
        onPress: () => {
          setTab("PACIENTES");
          setPacLinkFilter("SEM_USUARIO");
        },
      });
    }

    if (overdueTasks.length > 0) {
      const first = overdueTasks[0];
      items.push({
        id: "overdue_followups",
        title: "Follow-up vencido",
        severity: "HIGH",
        description: `${overdueTasks.length} tarefa(s) pendente(s) com prazo vencido. Próxima: ${first.titulo}.`,
        ctaLabel: "Abrir tarefas",
        onPress: () => {
          setTab("TAREFAS");
        },
      });
    }

    if (staleLeads.length > 0) {
      const lead = staleLeads[0];
      items.push({
        id: "lead_without_followup",
        title: "Lead sem follow-up recente",
        severity: "MEDIUM",
        description: `${lead.nome} (${stageLabel[lead.stage]}) está sem acompanhamento recente.`,
        ctaLabel: "Gerar tarefa",
        onPress: () => {
          setSelectedLeadId(lead.id);
          setTaskForm({
            id: "",
            titulo: `Follow-up: ${lead.nome}`,
            dueAt: toLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
            leadId: lead.id,
          });
          setTab("TAREFAS");
        },
      });
    }

    if (lowActivationAccounts.length > 0) {
      const target = lowActivationAccounts[0];
      items.push({
        id: "low_activation_accounts",
        title: "Baixa ativação de conta",
        severity: target.score.status === "RISK" ? "HIGH" : "MEDIUM",
        description: `${lowActivationAccounts.length} conta(s) em atenção/risco. Priorizar ${target.prof.nome} (score ${target.score.score}).`,
        ctaLabel: "Abrir profissional",
        onPress: () => {
          setSelectedProfId(target.prof.id);
          setTab("PROFISSIONAIS");
        },
      });
    }

    return items.filter((item) => !dismissedAutomationIds.includes(item.id)).slice(0, 3);
  }, [tasks, leads, profs, profAccountScores, dismissedAutomationIds, clinicalSummary]);
  const pushAutomationHistory = useCallback(
    (entry: Omit<CrmAutomationHistoryItem, "id" | "occurredAt">) => {
      setAutomationHistory((prev) =>
        [
          {
            ...entry,
            id: `${entry.action}:${entry.automationId}:${Date.now()}`,
            occurredAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5),
      );
    },
    [],
  );

  useEffect(() => {
    if (!isWeb || !isMaster || loading) return;
    const payload = {
      totalProfessionals: profs.length,
      healthy: 0,
      attention: 0,
      risk: 0,
    };
    profs.forEach((p) => {
      const status = profAccountScores.get(p.id)?.status;
      if (status === "HEALTHY") payload.healthy += 1;
      else if (status === "ATTENTION") payload.attention += 1;
      else if (status === "RISK") payload.risk += 1;
    });
    const hash = JSON.stringify(payload);
    if (lastScoreSummaryHashRef.current === hash) return;
    lastScoreSummaryHashRef.current = hash;
    trackEvent("crm_account_score_summary_viewed", payload).catch(() => undefined);
  }, [isWeb, isMaster, loading, profs, profAccountScores]);

  useEffect(() => {
    if (!isWeb || !isMaster || loading || crmAutomationItems.length === 0) return;
    const payload = {
      visibleCount: crmAutomationItems.length,
      ids: crmAutomationItems.map((item) => item.id),
      severities: crmAutomationItems.map((item) => item.severity),
    };
    const hash = JSON.stringify(payload);
    if (lastAutomationPanelHashRef.current === hash) return;
    lastAutomationPanelHashRef.current = hash;
    trackEvent("crm_automations_panel_viewed", payload).catch(() => undefined);
  }, [isWeb, isMaster, loading, crmAutomationItems]);

  useEffect(() => {
    if (!isWeb || !isMaster) return;
    trackEvent("crm_sensitive_visibility_changed", {
      enabled: includeSensitiveData,
    }).catch(() => undefined);
  }, [includeSensitiveData, isMaster, isWeb]);

  useEffect(() => {
    if (sensitiveDataTimerRef.current) {
      clearTimeout(sensitiveDataTimerRef.current);
      sensitiveDataTimerRef.current = null;
    }
    if (!includeSensitiveData) return;
    sensitiveDataTimerRef.current = setTimeout(() => {
      setIncludeSensitiveData(false);
      setSensitiveReason("");
      showToast({
        type: "info",
        message: "Visualização de dados sensíveis desativada automaticamente.",
      });
    }, 5 * 60 * 1000);
    return () => {
      if (sensitiveDataTimerRef.current) {
        clearTimeout(sensitiveDataTimerRef.current);
        sensitiveDataTimerRef.current = null;
      }
    };
  }, [includeSensitiveData, showToast]);

  useEffect(() => { if (!selectedLeadId && leads[0]) setSelectedLeadId(leads[0].id); }, [leads, selectedLeadId]);
  useEffect(() => { if (!selectedProfId && profs[0]) setSelectedProfId(profs[0].id); }, [profs, selectedProfId]);
  useEffect(() => { if (!selectedPacId && pacs[0]) setSelectedPacId(pacs[0].id); }, [pacs, selectedPacId]);
  useEffect(() => {
    const profRaw = crmProfessionals.find((p) => p.id === selectedProfId);
    if (!profRaw) return;
    setProfEditForm({
      nome: profRaw.nome || "",
      email: profRaw.email || "",
      especialidade: profRaw.especialidade || "",
      registroProf: profRaw.registroProf || "",
      ativo: !!profRaw.ativo,
    });
  }, [crmProfessionals, selectedProfId]);
  useEffect(() => {
    const pacRaw = crmPatients.find((p) => p.id === selectedPacId);
    if (!pacRaw) return;
    const cpfRaw = String(pacRaw.cpf || "").replace(/\D/g, "");
    const nascimentoRaw = pacRaw.dataNascimento
      ? String(pacRaw.dataNascimento).slice(0, 10)
      : "";
    setPacEditForm({
      nomeCompleto: pacRaw.nomeCompleto || "",
      cpf: cpfRaw,
      dataNascimento: nascimentoRaw,
      sexo: ["MASCULINO", "FEMININO", "OUTRO"].includes(String(pacRaw.sexo))
        ? String(pacRaw.sexo)
        : "OUTRO",
      estadoCivil: [
        "SOLTEIRO",
        "CASADO",
        "VIUVO",
        "DIVORCIADO",
        "UNIAO_ESTAVEL",
      ].includes(String(pacRaw.estadoCivil))
        ? String(pacRaw.estadoCivil)
        : "SOLTEIRO",
      profissao: pacRaw.profissao || "",
      contatoWhatsapp: String(pacRaw.contatoWhatsapp || "").replace(/\D/g, ""),
      contatoTelefone: "",
      contatoEmail: pacRaw.contatoEmail || "",
      enderecoCidade: pacRaw.enderecoCidade || "",
      enderecoUf: (pacRaw.enderecoUf || "").toUpperCase(),
      ativo: !!pacRaw.ativo,
    });
  }, [crmPatients, selectedPacId]);

  const q = query.trim().toLowerCase();
  const filteredProfs = (q
    ? profs.filter((p) => p.nome.toLowerCase().includes(q) || p.cidade.toLowerCase().includes(q))
    : profs).filter((p) => {
    if (profAccountStatusFilter === "TODOS") return true;
    return profAccountScores.get(p.id)?.status === profAccountStatusFilter;
  }).filter((p) => {
    if (profEmotionalConcentrationFilter === "TODOS") return true;
    const emotional = profEmotionalConcentrationMap.get(p.id);
    return Boolean(emotional && emotional.total >= 5 && emotional.percentual >= 25);
  });
  const filteredPacs = (q ? pacs.filter((p) => p.nome.toLowerCase().includes(q) || p.profissionalNome.toLowerCase().includes(q)) : pacs)
    .filter((p) => (pacStatusFilter === "TODOS" ? true : p.status === pacStatusFilter))
    .filter((p) => (pacEmotionalFilter === "TODOS" ? true : p.emocionalVulneravel));
  const sortedProfs = [...filteredProfs].sort((a, b) => {
    if (profSort.key === "score") {
      const mult = profSort.dir === "asc" ? 1 : -1;
      const sa = profAccountScores.get(a.id)?.score ?? 0;
      const sb = profAccountScores.get(b.id)?.score ?? 0;
      return (sa - sb) * mult;
    }
    if (profSort.key === "vulnEmocional") {
      const mult = profSort.dir === "asc" ? 1 : -1;
      const ea = profEmotionalConcentrationMap.get(a.id);
      const eb = profEmotionalConcentrationMap.get(b.id);
      const va = ea ? ea.percentual : 0;
      const vb = eb ? eb.percentual : 0;
      return (va - vb) * mult;
    }
    return compareProf(a, b, profSort);
  });
  const sortedPacs = [...filteredPacs].sort((a, b) => comparePac(a, b, pacSort));
  const pageSize = 10;
  const profTotalPages = Math.max(1, profPagesMeta);
  const pacTotalPages = Math.max(1, pacPagesMeta);
  const pagedProfs = sortedProfs;
  const pagedPacs = sortedPacs;

  useEffect(() => {
    setProfPage(1);
    setPacPage(1);
  }, [query]);
  useEffect(() => { setProfPage(1); }, [profActiveFilter]);
  useEffect(() => { setProfPage(1); }, [profAccountStatusFilter]);
  useEffect(() => { setProfPage(1); }, [profEmotionalConcentrationFilter]);
  useEffect(() => { setPacPage(1); }, [pacLinkFilter]);
  useEffect(() => { setPacPage(1); }, [pacStatusFilter]);
  useEffect(() => { setPacPage(1); }, [pacEmotionalFilter]);
  useEffect(() => { setProfPage(1); }, [profEspecialidadeFilter]);
  useEffect(() => { setPacPage(1); }, [pacCidadeFilter, pacUfFilter]);
  useEffect(() => { setProfPage(1); }, [profSort]);
  useEffect(() => { setPacPage(1); }, [pacSort]);
  useEffect(() => {
    if (profPage > profTotalPages) setProfPage(profTotalPages);
  }, [profPage, profTotalPages]);
  useEffect(() => {
    if (pacPage > pacTotalPages) setPacPage(pacTotalPages);
  }, [pacPage, pacTotalPages]);

  const resetLeadForm = () => setLeadForm({ id: "", nome: "", empresa: "", canal: "SITE", stage: "NOVO", valor: "" });
  const resetTaskForm = () => setTaskForm({ id: "", titulo: "", dueAt: "", leadId: selectedLeadId || "" });
  const resetInteractionForm = () => setInteractionForm({ id: "", tipo: "LIGACAO", resumo: "" });
  const resetProfEditForm = () => {
    const profRaw = crmProfessionals.find((p) => p.id === selectedProfId);
    if (!profRaw) return;
    setProfEditForm({
      nome: profRaw.nome || "",
      email: profRaw.email || "",
      especialidade: profRaw.especialidade || "",
      registroProf: profRaw.registroProf || "",
      ativo: !!profRaw.ativo,
    });
  };
  const resetPacEditForm = () => {
    const pacRaw = crmPatients.find((p) => p.id === selectedPacId);
    if (!pacRaw) return;
    setPacEditForm({
      nomeCompleto: pacRaw.nomeCompleto || "",
      cpf: String(pacRaw.cpf || "").replace(/\D/g, ""),
      dataNascimento: pacRaw.dataNascimento ? String(pacRaw.dataNascimento).slice(0, 10) : "",
      sexo: ["MASCULINO", "FEMININO", "OUTRO"].includes(String(pacRaw.sexo))
        ? String(pacRaw.sexo)
        : "OUTRO",
      estadoCivil: [
        "SOLTEIRO",
        "CASADO",
        "VIUVO",
        "DIVORCIADO",
        "UNIAO_ESTAVEL",
      ].includes(String(pacRaw.estadoCivil))
        ? String(pacRaw.estadoCivil)
        : "SOLTEIRO",
      profissao: pacRaw.profissao || "",
      contatoWhatsapp: String(pacRaw.contatoWhatsapp || "").replace(/\D/g, ""),
      contatoTelefone: "",
      contatoEmail: pacRaw.contatoEmail || "",
      enderecoCidade: pacRaw.enderecoCidade || "",
      enderecoUf: (pacRaw.enderecoUf || "").toUpperCase(),
      ativo: !!pacRaw.ativo,
    });
  };

  const saveLead = async () => {
    if (!leadForm.nome.trim()) return showToast({ type: "error", message: t("crm.messages.enterLeadName") });
    const payload = { nome: leadForm.nome.trim(), empresa: leadForm.empresa.trim() || undefined, canal: leadForm.canal, stage: leadForm.stage, valorPotencial: Number((leadForm.valor || "0").replace(",", ".")) || 0 };
    try {
      if (leadForm.id) await updateCrmLead(leadForm.id, payload);
      else { const created = await createCrmLead(payload); setSelectedLeadId(created.id); }
      resetLeadForm(); await loadMain(); showToast({ type: "success", message: t("crm.messages.leadSaved") });
    } catch { showToast({ type: "error", message: t("errors.saveFailed") }); }
  };

  const saveTask = async () => {
    if (!taskForm.titulo.trim()) return showToast({ type: "error", message: t("crm.messages.enterTaskTitle") });
    try {
      if (taskForm.id) await updateCrmTask(taskForm.id, { titulo: taskForm.titulo.trim(), leadId: taskForm.leadId.trim() || null, dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null });
      else await createCrmTask({ titulo: taskForm.titulo.trim(), leadId: taskForm.leadId.trim() || undefined, dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined });
      resetTaskForm(); await loadMain(); showToast({ type: "success", message: t("crm.messages.taskSaved") });
    } catch { showToast({ type: "error", message: t("errors.saveFailed") }); }
  };

  const saveInteraction = async () => {
    if (!selectedLeadId) return showToast({ type: "error", message: t("crm.messages.selectLead") });
    if (!interactionForm.resumo.trim()) return showToast({ type: "error", message: t("crm.messages.enterInteractionSummary") });
    try {
      if (interactionForm.id) await updateCrmInteraction(interactionForm.id, { tipo: interactionForm.tipo, resumo: interactionForm.resumo.trim() });
      else await createCrmInteraction({ leadId: selectedLeadId, tipo: interactionForm.tipo, resumo: interactionForm.resumo.trim() });
      resetInteractionForm(); await loadInteractions(selectedLeadId); showToast({ type: "success", message: t("crm.messages.interactionSaved") });
    } catch { showToast({ type: "error", message: t("errors.saveFailed") }); }
  };

  const exportCurrentTableCsv = (kind: "PROFISSIONAIS" | "PACIENTES") => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      showToast({ type: "info", message: t("crm.messages.exportCsvWebOnly") });
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    if (kind === "PROFISSIONAIS") {
      downloadCsv(
        `crm-profissionais-${now}.csv`,
        ["nome", "score_conta", "status_conta", "vulnerabilidade_emocional_absoluta", "vulnerabilidade_emocional_percentual", "status_carteira_emocional", "pacientes", "ativos", "ultimo_acesso", "adesao_percentual"],
        pagedProfs.map((p) => ({
          emocional: profEmotionalConcentrationMap.get(p.id),
          nome: p.nome,
          score_conta: profAccountScores.get(p.id)?.score ?? "",
          status_conta: accountHealthStatusLabel(profAccountScores.get(p.id)?.status),
          vulnerabilidade_emocional_absoluta: (() => {
            const em = profEmotionalConcentrationMap.get(p.id);
            return em ? `${em.vulneraveis}/${em.total}` : "";
          })(),
          vulnerabilidade_emocional_percentual: profEmotionalConcentrationMap.get(p.id)?.percentual ?? "",
          status_carteira_emocional: (() => {
            const em = profEmotionalConcentrationMap.get(p.id);
            if (!em) return "";
            if (em.total < 5) return "BASE_PEQUENA";
            return em.status === "RISK" ? "RISCO" : em.status === "ATTENTION" ? "ATENCAO" : "OK";
          })(),
          pacientes: p.pacientes,
          ativos: p.ativos,
          ultimo_acesso: p.ultimoAcesso,
          adesao_percentual: p.adesao,
        })),
      );
      showToast({ type: "success", message: t("crm.messages.csvProfessionalsExported") });
      return;
    }

    downloadCsv(
      `crm-pacientes-${now}.csv`,
      ["nome", "profissional", "status", "ultimo_checkin", "adesao_percentual", "canal", "etapa_crm"],
      pagedPacs.map((p) => ({
        nome: p.nome,
        profissional: p.profissionalNome,
        status: p.status,
        ultimo_checkin: p.ultimoCheckin,
        adesao_percentual: p.adesao,
        canal: p.lead.canal,
        etapa_crm: stageLabel[p.lead.stage],
      })),
    );
    showToast({ type: "success", message: t("crm.messages.csvPatientsExported") });
  };
  const exportAllFilteredCsv = async (kind: "PROFISSIONAIS" | "PACIENTES") => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      showToast({ type: "info", message: t("crm.messages.exportCsvWebOnly") });
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    try {
      if (kind === "PROFISSIONAIS") {
        const allPatientsForEmotional = await getCrmAdminPatients();
        const emotionalAgg = new Map<string, { vulneraveis: number; total: number }>();
        allPatientsForEmotional.forEach((p) => {
          const current = emotionalAgg.get(p.usuarioId) || { vulneraveis: 0, total: 0 };
          current.total += 1;
          if (p.emocional?.vulnerabilidade) current.vulneraveis += 1;
          emotionalAgg.set(p.usuarioId, current);
        });
        const all = await getCrmAdminProfessionals({
          q: query || undefined,
          ativo: profActiveFilter === "ATIVOS" ? true : undefined,
          especialidade: profEspecialidadeFilter.trim() || undefined,
        } as any);
        const rows = all
          .map((p, i) => {
            const profRow: ProfRow = {
              id: p.id,
              nome: p.nome,
              cidade:
                p.especialidade ||
                ["São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Curitiba/PR"][i % 4],
              pacientes: p.pacientesTotal,
              ativos: p.pacientesAtivos,
              ultimoAcesso: dt(p.lastPacienteUpdate || p.updatedAt || p.createdAt),
              adesao:
                p.pacientesTotal > 0
                  ? Math.max(40, Math.min(98, Math.round((p.pacientesAtivos / p.pacientesTotal) * 100)))
                  : 0,
              leadIds: [],
            };
            const score = computeAccountHealthScore(profRow, []);
            const emotional = emotionalAgg.get(p.id) || { vulneraveis: 0, total: 0 };
            const emocionalPercentual =
              emotional.total > 0 ? Math.round((emotional.vulneraveis / emotional.total) * 100) : 0;
            const emocionalStatus =
              emotional.total < 5
                ? "BASE_PEQUENA"
                : emocionalPercentual >= 40
                  ? "RISCO"
                  : emocionalPercentual >= 25
                    ? "ATENCAO"
                    : "OK";
            return {
              id: p.id,
              nome: p.nome,
              cidade: profRow.cidade,
              score_conta: score.score,
              status_conta: accountHealthStatusLabel(score.status),
              vulnerabilidade_emocional_absoluta: `${emotional.vulneraveis}/${emotional.total}`,
              vulnerabilidade_emocional_percentual: emocionalPercentual,
              status_carteira_emocional: emocionalStatus,
              pacientes: p.pacientesTotal,
              ativos: p.pacientesAtivos,
              ultimo_acesso: profRow.ultimoAcesso,
              adesao_percentual: profRow.adesao,
              email: p.email,
              especialidade: p.especialidade || "",
            };
          })
          .filter((row) => {
            if (profEmotionalConcentrationFilter === "TODOS") return true;
            return row.status_carteira_emocional === "ATENCAO" || row.status_carteira_emocional === "RISCO";
          })
          .sort((a, b) =>
            compareProf(
              {
                id: a.id,
                nome: a.nome,
                cidade: a.cidade,
                pacientes: Number(a.pacientes),
                ativos: Number(a.ativos),
                ultimoAcesso: a.ultimo_acesso,
                adesao: Number(a.adesao_percentual),
                leadIds: [],
              },
              {
                id: b.id,
                nome: b.nome,
                cidade: b.cidade,
                pacientes: Number(b.pacientes),
                ativos: Number(b.ativos),
                ultimoAcesso: b.ultimo_acesso,
                adesao: Number(b.adesao_percentual),
                leadIds: [],
              },
              profSort,
            ),
          );
        downloadCsv(
          `crm-profissionais-filtrados-${now}.csv`,
          ["nome", "email", "especialidade", "score_conta", "status_conta", "vulnerabilidade_emocional_absoluta", "vulnerabilidade_emocional_percentual", "status_carteira_emocional", "pacientes", "ativos", "ultimo_acesso", "adesao_percentual"],
          rows,
        );
        showToast({ type: "success", message: t("crm.messages.csvProfessionalsFullExported") });
        return;
      }

      const all = await getCrmAdminPatients({
        q: query || undefined,
        vinculadoUsuarioPaciente:
          pacLinkFilter === "VINCULADOS" ? true : pacLinkFilter === "SEM_USUARIO" ? false : undefined,
        cidade: pacCidadeFilter.trim() || undefined,
        uf: pacUfFilter.trim() || undefined,
      } as any);
      const rows = all
        .map((p) => {
          const linkedLead =
            leads.find((l) => l.nome.toLowerCase() === p.nomeCompleto.toLowerCase()) || null;
          const ultimo = dt(p.updatedAt || p.createdAt);
          const risco = Date.now() - new Date(p.updatedAt || p.createdAt).getTime() > 1000 * 60 * 60 * 24 * 10;
          return {
            nome: p.nomeCompleto,
            profissional: p.profissionalNome || t("crm.labels.noLink"),
            status: risco ? "RISCO" : "ATIVO",
            emocional_vulnerabilidade: p.emocional?.vulnerabilidade ? "SIM" : "NAO",
            ultimo_checkin: ultimo,
            adesao_percentual: risco ? 48 : 80,
            canal: linkedLead?.canal || "OUTRO",
            etapa_crm: linkedLead ? stageLabel[linkedLead.stage] : "Novo",
            contato_email: p.contatoEmail || "",
            cidade_uf: [p.enderecoCidade, p.enderecoUf].filter(Boolean).join("/"),
            vinculado_usuario: p.pacienteUsuarioId ? "SIM" : "NAO",
          };
        })
        .sort((a, b) =>
          comparePac(
            {
              id: a.nome,
              nome: a.nome,
              profissionalId: "",
              profissionalNome: a.profissional,
              status: a.status as "ATIVO" | "RISCO",
              emocionalVulneravel: a.emocional_vulnerabilidade === "SIM",
              emocionalResumo: null,
              ultimoCheckin: a.ultimo_checkin,
              adesao: Number(a.adesao_percentual),
              lead:
                (leads.find((l) => l.nome.toLowerCase() === a.nome.toLowerCase()) ||
                  ({
                    id: "",
                    nome: a.nome,
                    empresa: a.profissional,
                    canal: "OUTRO",
                    stage: "NOVO",
                    responsavelNome: null,
                    responsavelUsuarioId: null,
                    valorPotencial: 0,
                    observacoes: null,
                    ativo: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  } as CrmLead)),
            },
            {
              id: b.nome,
              nome: b.nome,
              profissionalId: "",
              profissionalNome: b.profissional,
              status: b.status as "ATIVO" | "RISCO",
              emocionalVulneravel: b.emocional_vulnerabilidade === "SIM",
              emocionalResumo: null,
              ultimoCheckin: b.ultimo_checkin,
              adesao: Number(b.adesao_percentual),
              lead:
                (leads.find((l) => l.nome.toLowerCase() === b.nome.toLowerCase()) ||
                  ({
                    id: "",
                    nome: b.nome,
                    empresa: b.profissional,
                    canal: "OUTRO",
                    stage: "NOVO",
                    responsavelNome: null,
                    responsavelUsuarioId: null,
                    valorPotencial: 0,
                    observacoes: null,
                    ativo: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  } as CrmLead)),
            },
            pacSort,
          ),
        );
      downloadCsv(
        `crm-pacientes-filtrados-${now}.csv`,
        ["nome", "profissional", "status", "emocional_vulnerabilidade", "ultimo_checkin", "adesao_percentual", "canal", "etapa_crm", "contato_email", "cidade_uf", "vinculado_usuario"],
        rows,
      );
      showToast({ type: "success", message: t("crm.messages.csvPatientsFullExported") });
    } catch {
      showToast({ type: "error", message: t("errors.unexpected") });
    }
  };
  const exportLeadsCsv = (allStages = false) => {
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const rows = leads
      .filter((l) => (allStages ? true : stageFilter === "TODOS" ? true : l.stage === stageFilter))
      .map((l) => ({
        nome: l.nome,
        empresa: l.empresa || "",
        canal: l.canal,
        etapa: stageLabel[l.stage],
        valor_potencial: l.valorPotencial,
        responsavel: l.responsavelNome || "",
        atualizado_em: dt(l.updatedAt),
      }));
    downloadCsv(
      `crm-leads-${allStages ? "todos" : "visao"}-${now}.csv`,
      ["nome", "empresa", "canal", "etapa", "valor_potencial", "responsavel", "atualizado_em"],
      rows,
    );
    showToast({ type: "success", message: t("crm.messages.csvLeadsExported") });
  };
  const exportTasksCsv = () => {
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(
      `crm-tarefas-${now}.csv`,
      ["titulo", "status", "prazo", "lead", "responsavel", "atualizado_em"],
      tasks.map((t) => ({
        titulo: t.titulo,
        status: t.status,
        prazo: t.dueAt ? dt(t.dueAt) : "",
        lead: t.leadId ? taskLeadMap.get(t.leadId)?.nome || "Lead removido" : "",
        responsavel: t.responsavelNome || "",
        atualizado_em: dt(t.updatedAt),
      })),
    );
    showToast({ type: "success", message: t("crm.messages.csvTasksExported") });
  };
  const exportInteractionsCsv = () => {
    if (!selectedLeadId) {
      showToast({ type: "info", message: t("crm.messages.selectLeadForInteractionsExport") });
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(
      `crm-interacoes-${selectedLeadId}-${now}.csv`,
      ["lead", "tipo", "resumo", "responsavel", "ocorrido_em"],
      interactions.map((i) => ({
        lead: selectedLead?.nome || selectedLeadId,
        tipo: interactionLabel[i.tipo],
        resumo: i.resumo,
        responsavel: i.responsavelNome || "",
        ocorrido_em: dt(i.occurredAt),
      })),
    );
    showToast({ type: "success", message: t("crm.messages.csvInteractionsExported") });
  };

  if (!isWeb) return <Blocked icon="desktop-outline" title={t("crm.access.webOnlyTitle")} subtitle={t("crm.access.webOnlySubtitle")} />;
  if (!isMaster) return <Blocked icon="lock-closed-outline" title={t("crm.access.restrictedTitle")} subtitle={t("crm.access.restrictedSubtitle")} />;

  const handleToggleSensitiveData = () => {
    if (includeSensitiveData) {
      setIncludeSensitiveData(false);
      setSensitiveReason("");
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const typedReason = window.prompt(
        t("crm.messages.sensitiveDataPrompt"),
        "",
      );
      if (!typedReason) return;
      const normalizedReason = typedReason.trim();
      if (normalizedReason.length < 8) {
        showToast({
          type: "error",
          message: t("crm.messages.sensitiveReasonMinLength"),
        });
        return;
      }
      setSensitiveReason(normalizedReason);
      setIncludeSensitiveData(true);
      return;
    }
    Alert.alert(
      t("crm.messages.showSensitiveDataTitle"),
      t("crm.messages.showSensitiveDataDescription"),
      [
        { text: t("crm.actions.cancel"), style: "cancel" },
        { text: t("crm.actions.show"), onPress: () => setIncludeSensitiveData(true) },
      ],
    );
  };

  const saveAdminProfessional = async () => {
    if (!selectedProfId) return;
    if (!profEditForm.nome.trim()) {
      showToast({ type: "error", message: t("crm.messages.enterProfessionalName") });
      return;
    }
    if (!profEditForm.email.trim()) {
      showToast({ type: "error", message: t("crm.messages.enterProfessionalEmail") });
      return;
    }
    setSavingAdminEntity(true);
    try {
      await updateCrmAdminProfessional(
        selectedProfId,
        {
          nome: profEditForm.nome.trim(),
          email: profEditForm.email.trim().toLowerCase(),
          especialidade: profEditForm.especialidade.trim(),
          registroProf: profEditForm.registroProf.trim(),
          ativo: profEditForm.ativo,
        },
        {
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
        },
      );
      setEditProfOpen(false);
      await loadMain();
      showToast({ type: "success", message: t("crm.messages.professionalUpdatedSuccess") });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || t("crm.messages.professionalUpdateFailed") });
    } finally {
      setSavingAdminEntity(false);
    }
  };

  const saveAdminPatient = async () => {
    if (!selectedPacId) return;
    if (!pacEditForm.nomeCompleto.trim()) {
      showToast({ type: "error", message: t("crm.messages.enterPatientName") });
      return;
    }
    setSavingAdminEntity(true);
    try {
      await updateCrmAdminPatient(
        selectedPacId,
        {
          nomeCompleto: pacEditForm.nomeCompleto.trim(),
          cpf: pacEditForm.cpf.replace(/\D/g, "") || undefined,
          dataNascimento: pacEditForm.dataNascimento || undefined,
          sexo: pacEditForm.sexo as "MASCULINO" | "FEMININO" | "OUTRO",
          estadoCivil: pacEditForm.estadoCivil as
            | "SOLTEIRO"
            | "CASADO"
            | "VIUVO"
            | "DIVORCIADO"
            | "UNIAO_ESTAVEL",
          profissao: pacEditForm.profissao.trim(),
          contatoWhatsapp: pacEditForm.contatoWhatsapp.replace(/\D/g, "") || undefined,
          contatoTelefone: pacEditForm.contatoTelefone.replace(/\D/g, "") || undefined,
          contatoEmail: pacEditForm.contatoEmail.trim() || undefined,
          enderecoCidade: pacEditForm.enderecoCidade.trim() || undefined,
          enderecoUf: pacEditForm.enderecoUf.trim().toUpperCase() || undefined,
          ativo: pacEditForm.ativo,
        },
        {
          includeSensitive: includeSensitiveData,
          sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
        },
      );
      setEditPacOpen(false);
      await loadMain();
      showToast({ type: "success", message: t("crm.messages.patientUpdatedSuccess") });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || t("crm.messages.patientUpdateFailed") });
    } finally {
      setSavingAdminEntity(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("crm.master.title")}</Text>
              <Text style={styles.sub}>{t("crm.master.subtitle")}</Text>
            </View>
            <TextInput style={styles.search} placeholder={t("crm.filters.globalSearch")} value={query} onChangeText={setQuery} onSubmitEditing={() => loadMain().catch(() => undefined)} />
          </View>
          <View style={styles.wrapRow}>
              <Chip
              label={includeSensitiveData ? t("crm.messages.sensitiveVisible") : t("crm.messages.sensitiveHidden")}
              active={includeSensitiveData}
              onPress={handleToggleSensitiveData}
            />
            <Text style={styles.muted}>
              {includeSensitiveData
                ? t("crm.messages.sensitiveDetailedEnabled")
                : t("crm.messages.sensitiveMaskedDefault")}
            </Text>
            {includeSensitiveData ? (
              <Text style={styles.muted}>
                {t("crm.messages.sensitiveSessionActive")}
              </Text>
            ) : null}
          </View>
          <View style={styles.wrapRow}>
              <Metric
                label={t("crm.sections.professionals")}
                value={String(profs.length)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "professionals",
                  targetTab: "PROFISSIONAIS",
                  profActiveFilter: "TODOS",
                  profAccountStatusFilter: "TODOS",
                }).catch(() => undefined);
                setTab("PROFISSIONAIS");
                setProfActiveFilter("TODOS");
                setProfAccountStatusFilter("TODOS");
                setProfEmotionalConcentrationFilter("TODOS");
              }}
            />
              <Metric
                label={t("crm.sections.patients")}
                value={String(pacs.length)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "patients",
                  targetTab: "PACIENTES",
                  pacLinkFilter: "TODOS",
                }).catch(() => undefined);
                setTab("PACIENTES");
                setPacLinkFilter("TODOS");
                setPacEmotionalFilter("TODOS");
              }}
            />
            <Metric
              label={t("crm.labels.active")}
              value={String(pacs.filter((p) => p.status === "ATIVO").length)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "patients_active",
                  targetTab: "PACIENTES",
                  pacStatusFilter: "ATIVO",
                  pacLinkFilter: "VINCULADOS",
                }).catch(() => undefined);
                setTab("PACIENTES");
                setPacStatusFilter("ATIVO");
                setPacLinkFilter("VINCULADOS");
                setPacEmotionalFilter("TODOS");
              }}
            />
              <Metric
                label={t("crm.status.risk")}
                value={String(pacs.filter((p) => p.status === "RISCO").length)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "patients_risk",
                  targetTab: "PACIENTES",
                  pacStatusFilter: "RISCO",
                }).catch(() => undefined);
                setTab("PACIENTES");
                setPacStatusFilter("RISCO");
                setPacEmotionalFilter("TODOS");
              }}
            />
              <Metric
                label={t("crm.labels.emotional")}
                value={String(pacs.filter((p) => p.emocionalVulneravel).length)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "patients_emotional_vulnerability",
                  targetTab: "PACIENTES",
                  pacEmotionalFilter: "EMOCIONAL",
                }).catch(() => undefined);
                setTab("PACIENTES");
                setPacEmotionalFilter("EMOCIONAL");
              }}
            />
            <Metric label={t("crm.sections.funnel")} value={money(pipeline?.totalPipelineValue || 0)} />
            <Metric
              label={t("crm.sections.leads")}
              value={String(pipeline?.totalLeads || 0)}
              onPress={() => {
                trackEvent("crm_kpi_clicked", {
                  kpi: "leads",
                  targetTab: "LEADS",
                }).catch(() => undefined);
                setTab("LEADS");
              }}
            />
          </View>
          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.operationalClinical")}</Text>
              <Text style={styles.muted}>{t("crm.messages.careExecutionWindow", { days: windowDays })}</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label={t("crm.status.attention")}
                value={String(clinicalSummary?.metricas.pacientesEmAtencao || 0)}
                onPress={() => {
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                }}
              />
              <Metric
                label={t("crm.alerts.noCheckin")}
                value={String(clinicalSummary?.alertas.semCheckin || 0)}
              />
              <Metric
                label={t("crm.messages.noProgressDays", { days: semEvolucaoDias })}
                value={String(clinicalSummary?.alertas.semEvolucao || 0)}
              />
              <Metric
                label={t("crm.alerts.pendingAnamnesis")}
                value={String(clinicalSummary?.alertas.anamnesePendente || 0)}
              />
              <Metric
                label={t("crm.alerts.pendingInvite")}
                value={String(clinicalSummary?.alertas.conviteNaoAceito || 0)}
              />
              <Metric
                label={t("crm.metrics.dropout")}
                value={`${clinicalSummary?.metricas.abandonoRate ?? 0}%`}
              />
              <Metric
                label={t("crm.metrics.planCompletion")}
                value={`${clinicalSummary?.metricas.conclusaoPlanoRate ?? 0}%`}
              />
            </View>
          </View>
          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.globalFilters")}</Text>
              <Action
                title={t("crm.actions.refresh")}
                secondary
                onPress={() => {
                  loadMain().catch(() => undefined);
                  loadGovernance().catch(() => undefined);
                }}
              />
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.muted}>{t("crm.filters.clinicalWindow")}:</Text>
              {[7, 30, 90].map((days) => (
                <Chip
                  key={`window-${days}`}
                  label={t("crm.messages.daysLabel", { days })}
                  active={windowDays === days}
                  onPress={() => setWindowDays(days)}
                />
              ))}
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.muted}>{t("crm.filters.noProgress")}:</Text>
              {[7, 10, 14].map((days) => (
                <Chip
                  key={`sem-evo-${days}`}
                  label={`>${days}d`}
                  active={semEvolucaoDias === days}
                  onPress={() => setSemEvolucaoDias(days)}
                />
              ))}
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.muted}>Status clínico:</Text>
              <Chip
                label={t("crm.filters.all")}
                active={clinicalPipelineStatusFilter === "TODOS"}
                onPress={() => setClinicalPipelineStatusFilter("TODOS")}
              />
              <Chip
                label={t("crm.pipeline.newPatient")}
                active={clinicalPipelineStatusFilter === "NOVO_PACIENTE"}
                onPress={() => setClinicalPipelineStatusFilter("NOVO_PACIENTE")}
              />
              <Chip
                label={t("crm.pipeline.waitingLink")}
                active={clinicalPipelineStatusFilter === "AGUARDANDO_VINCULO"}
                onPress={() => setClinicalPipelineStatusFilter("AGUARDANDO_VINCULO")}
              />
              <Chip
                label={t("crm.alerts.pendingAnamnesis")}
                active={clinicalPipelineStatusFilter === "ANAMNESE_PENDENTE"}
                onPress={() => setClinicalPipelineStatusFilter("ANAMNESE_PENDENTE")}
              />
              <Chip
                label={t("crm.pipeline.treatment")}
                active={clinicalPipelineStatusFilter === "EM_TRATAMENTO"}
                onPress={() => setClinicalPipelineStatusFilter("EM_TRATAMENTO")}
              />
              <Chip
                label={t("crm.pipeline.discharge")}
                active={clinicalPipelineStatusFilter === "ALTA"}
                onPress={() => setClinicalPipelineStatusFilter("ALTA")}
              />
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.governance.title")}</Text>
              <Text style={styles.muted}>
                {govActiveProtocol
                  ? t("crm.governance.activeProtocol", {
                      name: govActiveProtocol.name,
                      version: govActiveProtocol.version,
                    })
                  : t("crm.governance.noActiveProtocol")}
              </Text>
            </View>
            {govLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : (
              <>
                <View style={styles.wrapRow}>
                  <Metric
                    label={t("crm.governance.protocolHistoryCount")}
                    value={String(govProtocolHistory.length)}
                  />
                  <Metric
                    label={t("crm.governance.auditCount")}
                    value={String(govAuditLogs.length)}
                  />
                  <Metric
                    label={t("crm.governance.userConsentCount")}
                    value={String(govMyConsents?.history?.length || 0)}
                  />
                </View>
                <View style={styles.wrapRow}>
                  <Metric
                    label={t("crm.governance.aiReads")}
                    value={String(govAiSummary?.totals.reads || 0)}
                  />
                  <Metric
                    label={t("crm.governance.aiApplied")}
                    value={String(govAiSummary?.totals.applied || 0)}
                  />
                  <Metric
                    label={t("crm.governance.aiAdoptionRate")}
                    value={`${Math.round((govAiSummary?.totals.adoptionRate || 0) * 100)}%`}
                  />
                  <Metric
                    label={t("crm.governance.aiConfirmationRate")}
                    value={`${Math.round((govAiSummary?.totals.confirmationRate || 0) * 100)}%`}
                  />
                </View>
                <View style={styles.wrapRow}>
                  <Metric
                    label={t("crm.governance.aiPhysicalExam")}
                    value={String(govAiSummary?.byStage.EXAME_FISICO.applied || 0)}
                  />
                  <Metric
                    label={t("crm.governance.aiEvolution")}
                    value={String(govAiSummary?.byStage.EVOLUCAO.applied || 0)}
                  />
                  <Metric
                    label={t("crm.governance.aiReport")}
                    value={String(govAiSummary?.byStage.LAUDO.applied || 0)}
                  />
                  <Metric
                    label={t("crm.governance.aiPlan")}
                    value={String(govAiSummary?.byStage.PLANO.applied || 0)}
                  />
                </View>
                <View style={styles.wrapRow}>
                  <TextInput
                    style={[styles.filterInput, { minWidth: 220 }]}
                    placeholder={t("crm.governance.protocolNamePlaceholder")}
                    value={govProtocolName}
                    onChangeText={setGovProtocolName}
                  />
                  <TextInput
                    style={[styles.filterInput, { minWidth: 160 }]}
                    placeholder={t("crm.governance.protocolVersionPlaceholder")}
                    value={govProtocolVersion}
                    onChangeText={setGovProtocolVersion}
                  />
                  <Action
                    title={
                      govActivating
                        ? t("crm.governance.activating")
                        : t("crm.governance.activateVersion")
                    }
                    onPress={() => handleActivateProtocol().catch(() => undefined)}
                    secondary={false}
                  />
                </View>
                <Text style={styles.disclaimerText}>
                  {t("crm.governance.sprint1Summary")}
                </Text>
                {govProtocolHistory.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.line}>
                    <Text style={styles.lineTitle}>
                      {item.name} v{item.version}{" "}
                      {item.isActive ? `(${t("crm.governance.activeTag")})` : ""}
                    </Text>
                    <Text style={styles.lineSub}>
                      {t("crm.governance.createdAt", { date: dt(item.createdAt) })}{" "}
                      {item.activatedAt
                        ? `| ${t("crm.governance.activatedAt", {
                            date: dt(item.activatedAt),
                          })}`
                        : ""}
                    </Text>
                  </View>
                ))}
                {govAuditLogs.slice(0, 4).map((item) => (
                  <View key={item.id} style={styles.line}>
                    <Text style={styles.lineTitle}>
                      [{item.actionType}] {item.action}
                    </Text>
                    <Text style={styles.lineSub}>
                      {t("crm.governance.actor")}: {item.actorRole || "-"} |{" "}
                      {t("crm.governance.patient")}: {item.patientId || "-"} |{" "}
                      {dt(item.createdAt)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.carePipeline")}</Text>
              <Text style={styles.muted}>{t("crm.messages.assistanceStages")}</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label={t("crm.pipeline.newPatient")}
                value={String(clinicalSummary?.pipeline.novoPaciente || 0)}
                onPress={() => setClinicalPipelineStatusFilter("NOVO_PACIENTE")}
              />
              <Metric
                label={t("crm.pipeline.waitingLink")}
                value={String(clinicalSummary?.pipeline.aguardandoVinculo || 0)}
                onPress={() => setClinicalPipelineStatusFilter("AGUARDANDO_VINCULO")}
              />
              <Metric
                label={t("crm.alerts.pendingAnamnesis")}
                value={String(clinicalSummary?.pipeline.anamnesePendente || 0)}
                onPress={() => {
                  setClinicalPipelineStatusFilter("ANAMNESE_PENDENTE");
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                }}
              />
              <Metric
                label={t("crm.pipeline.treatment")}
                value={String(clinicalSummary?.pipeline.emTratamento || 0)}
                onPress={() => setClinicalPipelineStatusFilter("EM_TRATAMENTO")}
              />
              <Metric
                label={t("crm.pipeline.discharge")}
                value={String(clinicalSummary?.pipeline.alta || 0)}
                onPress={() => setClinicalPipelineStatusFilter("ALTA")}
              />
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.executionMetrics")}</Text>
              <Text style={styles.muted}>{t("crm.messages.timeCompletionAndBlocks")}</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label={t("crm.metrics.avgTimeAnamnesis")}
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.ANAMNESE || 0)}
              />
              <Metric
                label={t("crm.metrics.avgTimePhysicalExam")}
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.EXAME_FISICO || 0)}
              />
              <Metric
                label={t("crm.metrics.avgTimeEvolution")}
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.EVOLUCAO || 0)}
              />
              <Metric
                label={t("crm.metrics.completedStages")}
                value={String(clinicalSummary?.metricas.completedTotal || 0)}
              />
              <Metric
                label={t("crm.metrics.blockedStages")}
                value={String(clinicalSummary?.metricas.blockedTotal || 0)}
              />
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.physicalExamStructuredMetrics")}</Text>
              <View style={styles.wrapRow}>
                <Action
                  title={t("crm.actions.exportCsv")}
                  secondary
                  onPress={exportPhysicalExamSummaryCsv}
                />
                <Action
                  title={t("crm.actions.copySummary")}
                  secondary
                  onPress={() => {
                    copyPhysicalExamExecutiveSummary().catch(() => undefined);
                  }}
                />
                {[7, 30, 90].map((days) => (
                  <Chip
                    key={`exam-window-${days}`}
                    label={`${days}d`}
                    active={examWindowDays === days}
                    onPress={() => setExamWindowDays(days)}
                  />
                ))}
                <Text style={styles.muted}>{t("crm.metrics.examWindow")}</Text>
              </View>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label={t("crm.metrics.reportsAnalyzed")}
                value={String(physicalExamSummary?.laudosAnalisados || 0)}
              />
              <Metric
                label={t("crm.metrics.withStructuredExam")}
                value={String(physicalExamSummary?.laudosComExameEstruturado || 0)}
              />
              <Metric
                label={t("crm.metrics.testsEvaluated")}
                value={String(physicalExamSummary?.totalAvaliados || 0)}
              />
              <Metric
                label={t("crm.metrics.positiveTests")}
                value={String(physicalExamSummary?.totalPositivos || 0)}
              />
              <Metric
                label={t("crm.metrics.positivityRate")}
                value={`${Math.round(physicalExamSummary?.taxaPositividadeGeral || 0)}%`}
              />
              <Metric
                label={t("crm.metrics.structuredCoverage")}
                value={`${physicalExamCoverage.pct}%`}
              />
            </View>
            <View style={styles.coverageRow}>
              <Text style={styles.muted}>
                {t("crm.metrics.structuredCoverageReports")}
              </Text>
              <View
                style={[
                  styles.coverageBadge,
                  physicalExamCoverage.status === "ALTA"
                    ? styles.coverageHigh
                    : physicalExamCoverage.status === "MEDIA"
                      ? styles.coverageMedium
                      : styles.coverageLow,
                ]}
              >
                <Text
                  style={[
                    styles.coverageBadgeText,
                    physicalExamCoverage.status === "ALTA"
                      ? styles.coverageHighText
                      : physicalExamCoverage.status === "MEDIA"
                        ? styles.coverageMediumText
                        : styles.coverageLowText,
                  ]}
                >
                  {physicalExamCoverage.status === "ALTA"
                    ? "Alta"
                    : physicalExamCoverage.status === "MEDIA"
                      ? "Média"
                      : "Baixa"}
                </Text>
              </View>
            </View>
            <View style={styles.coverageActionRow}>
              <Text style={styles.muted}>
                {physicalExamCoverage.status === "ALTA"
                  ? "Cobertura adequada. Mantenha o padrão de registro estruturado."
                  : physicalExamCoverage.status === "MEDIA"
                    ? "Cobertura intermediária. Priorize registros estruturados em novos laudos."
                    : "Cobertura baixa. Ative rotina de exame físico estruturado para aumentar confiabilidade."}
              </Text>
              {physicalExamCoverage.status !== "ALTA" ? (
                <View style={[styles.wrapRow, { marginTop: 8 }]}>
                  <Action
                    title={t("crm.actions.openPatientsInAttention")}
                    secondary
                    onPress={() => {
                      setTab("PACIENTES");
                      setPacStatusFilter("RISCO");
                      setPacEmotionalFilter("TODOS");
                      trackEvent("crm_kpi_clicked", {
                        kpi: "physical_exam_coverage_action_clicked",
                        coverageStatus: physicalExamCoverage.status,
                        coveragePct: physicalExamCoverage.pct,
                      }).catch(() => undefined);
                    }}
                  />
                </View>
              ) : null}
            </View>
            {!hasPhysicalExamData ? (
              <View style={styles.emptyPhysicalExamCallout}>
                <Text style={styles.muted}>
                  Ainda não há exame físico estruturado nessa janela. Amplie para 30/90 dias ou avance pacientes com anamnese para exame físico.
                </Text>
                <View style={[styles.wrapRow, { marginTop: 8 }]}>
                  <Action
                    title={t("crm.actions.openPatientQueue")}
                    secondary
                    onPress={() => {
                      setTab("PACIENTES");
                      setPacStatusFilter("RISCO");
                      setPacEmotionalFilter("TODOS");
                    }}
                  />
                </View>
              </View>
            ) : null}
            <View style={styles.insightsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.insightCard,
                  pressed ? styles.insightCardPressed : null,
                ]}
                onPress={() => {
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                  setPacEmotionalFilter("TODOS");
                  trackEvent("crm_kpi_clicked", {
                    kpi: "physical_exam_top_region",
                    targetTab: "PACIENTES",
                    pacStatusFilter: "RISCO",
                    mode: examChartMode,
                    region: physicalExamTopInsights.topRegionLabel,
                  }).catch(() => undefined);
                }}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="body-outline"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.insightLabel}>
                    {examChartMode === "TAXA"
                      ? t("crm.dashboard.topRegionRate")
                      : t("crm.dashboard.topRegionPositives")}
                  </Text>
                </View>
                <Text style={styles.insightTitle}>
                  {physicalExamTopInsights.topRegionLabel}
                </Text>
                <Text style={styles.insightValue}>
                  {physicalExamTopInsights.topRegionValue}
                </Text>
                {physicalExamTopInsights.topRegionDetail ? (
                  <View style={styles.insightMetaRow}>
                    <Text style={styles.insightSubValue}>
                      Base: {physicalExamTopInsights.topRegionDetail}
                    </Text>
                    <SampleConfidenceBadge
                      sample={physicalExamTopInsights.topRegionSample}
                    />
                  </View>
                ) : null}
                <View style={styles.insightHintRow}>
                  <Text style={styles.insightHint}>
                    {t("crm.dashboard.clickToSeePatientsInAttention")}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={COLORS.textSecondary}
                  />
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.insightCard,
                  pressed ? styles.insightCardPressed : null,
                ]}
                onPress={() => {
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                  setPacEmotionalFilter("TODOS");
                  trackEvent("crm_kpi_clicked", {
                    kpi: "physical_exam_top_test",
                    targetTab: "PACIENTES",
                    pacStatusFilter: "RISCO",
                    mode: examChartMode,
                    test: physicalExamTopInsights.topTestLabel,
                  }).catch(() => undefined);
                }}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="pulse-outline"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.insightLabel}>
                    {examChartMode === "TAXA"
                      ? t("crm.dashboard.topTestRate")
                      : t("crm.dashboard.topTestPositives")}
                  </Text>
                </View>
                <Text style={styles.insightTitle}>
                  {physicalExamTopInsights.topTestLabel}
                </Text>
                <Text style={styles.insightValue}>
                  {physicalExamTopInsights.topTestValue}
                </Text>
                {physicalExamTopInsights.topTestDetail ? (
                  <View style={styles.insightMetaRow}>
                    <Text style={styles.insightSubValue}>
                      Base: {physicalExamTopInsights.topTestDetail}
                    </Text>
                    <SampleConfidenceBadge
                      sample={physicalExamTopInsights.topTestSample}
                    />
                  </View>
                ) : null}
                <View style={styles.insightHintRow}>
                  <Text style={styles.insightHint}>
                    {t("crm.dashboard.clickToSeePatientsInAttention")}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={COLORS.textSecondary}
                  />
                </View>
              </Pressable>
            </View>
          </View>
          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.clinicalAndCrmCharts")}</Text>
              <View style={styles.wrapRow}>
                <Chip
                  label={t("crm.dashboard.sortByPositives")}
                  active={examChartMode === "POSITIVOS"}
                  onPress={() => setExamChartMode("POSITIVOS")}
                />
                <Chip
                  label={t("crm.dashboard.sortByRate")}
                  active={examChartMode === "TAXA"}
                  onPress={() => setExamChartMode("TAXA")}
                />
                {examChartMode === "TAXA"
                  ? [1, 3, 5].map((sample) => (
                      <Chip
                        key={`exam-min-sample-${sample}`}
                        label={`${t("crm.dashboard.baseMin")} ${sample}`}
                        active={examMinSample === sample}
                        onPress={() => setExamMinSample(sample)}
                      />
                    ))
                  : null}
                {examChartMode === "TAXA"
                  ? ([
                      { key: "TODOS", label: t("crm.dashboard.confidenceAll") },
                      { key: "ALTA", label: t("crm.dashboard.confidenceHigh") },
                      { key: "MEDIA", label: t("crm.dashboard.confidenceMedium") },
                      { key: "BAIXA", label: t("crm.dashboard.confidenceLow") },
                    ] as const).map((option) => (
                      <Chip
                        key={`exam-confidence-${option.key}`}
                        label={option.label}
                        active={examConfidenceFilter === option.key}
                        onPress={() => setExamConfidenceFilter(option.key)}
                      />
                    ))
                  : null}
              </View>
            </View>
            {examChartMode === "TAXA" ? (
              <View style={styles.sampleInfoBox}>
                <Text style={styles.muted}>
                  Ranking por taxa considera apenas itens com pelo menos {examMinSample} avaliados.
                </Text>
                <Text style={styles.sampleInfoText}>
                  {t("crm.messages.confidenceFilter")}: {examConfidenceFilter === "TODOS" ? t("crm.messages.allSamples") : examConfidenceFilter.toLowerCase()}
                </Text>
                <Text style={styles.sampleInfoText}>
                  Regiões consideradas: {physicalExamFilterStats.consideredRegions}/{physicalExamFilterStats.totalRegions}
                  {" • "}
                  Testes considerados: {physicalExamFilterStats.consideredTests}/{physicalExamFilterStats.totalTests}
                </Text>
                {(physicalExamFilterStats.excludedRegions > 0 ||
                  physicalExamFilterStats.excludedTests > 0) ? (
                  <Text style={styles.sampleInfoMuted}>
                    Excluídos pela base mínima: {physicalExamFilterStats.excludedRegions} região(ões) e {physicalExamFilterStats.excludedTests} teste(s).
                  </Text>
                ) : null}
              </View>
            ) : null}
            <View style={styles.split}>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>{t("crm.dashboard.clinicalPipelineChart")}</Text>
                <BarChart items={clinicalPipelineChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>{t("crm.dashboard.clinicalAlertsChart")}</Text>
                <BarChart items={clinicalAlertsChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>{t("crm.dashboard.avgTimeByStageChart")}</Text>
                <BarChart items={clinicalDurationChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Funil comercial (leads)</Text>
                <BarChart items={funnelStageChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>
                  Exame físico por região ({examChartMode === "TAXA" ? "taxa %" : "positivos"})
                </Text>
                <BarChart
                  items={physicalExamRegionChartData}
                  formatValue={examChartMode === "TAXA" ? (value) => `${value}%` : undefined}
                  maxValue={examChartMode === "TAXA" ? 100 : undefined}
                />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>
                  Top testes ({examChartMode === "TAXA" ? "taxa %" : "positivos"})
                </Text>
                <BarChart
                  items={physicalExamTopTestsChartData}
                  formatValue={examChartMode === "TAXA" ? (value) => `${value}%` : undefined}
                  maxValue={examChartMode === "TAXA" ? 100 : undefined}
                />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Perfis de scoring</Text>
                <BarChart items={physicalExamProfilesChartData} />
              </View>
            </View>
            <View style={[styles.split, { marginTop: SPACING.sm }]}>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>
                  Top 5 regiões ({examChartMode === "TAXA" ? "taxa %" : "positivos"})
                </Text>
                {physicalExamTopRegionsList.length === 0 ? (
                  <Text style={styles.muted}>{t("crm.common.noDataDot")}</Text>
                ) : (
                  physicalExamTopRegionsList.map((item) => (
                    <View key={`region-top-${item.label}`} style={styles.topListRow}>
                      <View style={styles.topListLabelWrap}>
                        <Text style={styles.topListLabel}>{item.label}</Text>
                        {item.detail ? (
                          <View style={styles.topListDetailRow}>
                            <Text style={styles.topListDetail}>Base: {item.detail}</Text>
                            <SampleConfidenceBadge sample={item.sample} />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.topListValue}>{item.value}</Text>
                    </View>
                  ))
                )}
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>
                  Top 5 testes ({examChartMode === "TAXA" ? "taxa %" : "positivos"})
                </Text>
                {physicalExamTopTestsList.length === 0 ? (
                  <Text style={styles.muted}>{t("crm.common.noDataDot")}</Text>
                ) : (
                  physicalExamTopTestsList.map((item) => (
                    <View key={`test-top-${item.label}`} style={styles.topListRow}>
                      <View style={styles.topListLabelWrap}>
                        <Text style={styles.topListLabel}>{item.label}</Text>
                        {item.detail ? (
                          <View style={styles.topListDetailRow}>
                            <Text style={styles.topListDetail}>Base: {item.detail}</Text>
                            <SampleConfidenceBadge sample={item.sample} />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.topListValue}>{item.value}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.dashboard.adminAudit")}</Text>
              <Text style={styles.muted}>Últimos acessos do admin</Text>
            </View>
            {crmAuditLogs.length === 0 ? (
              <Text style={styles.muted}>Nenhum log de auditoria encontrado.</Text>
            ) : (
              crmAuditLogs.map((entry) => (
                <View key={entry.id} style={styles.auditLogItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>
                      {entry.action} {entry.includeSensitive ? "• sensível" : ""}
                    </Text>
                    <Text style={styles.lineSub}>
                      {entry.actorEmail} • {dt(entry.createdAt)}
                    </Text>
                    {entry.sensitiveReason ? (
                      <Text style={styles.lineSub}>Motivo: {entry.sensitiveReason}</Text>
                    ) : null}
                  </View>
                  <StatusBadge
                    status={entry.includeSensitive ? "ATTENTION" : "HEALTHY"}
                    labels={{
                      healthy: "Padrão",
                      attention: "Sensível",
                      risk: "Risco",
                    }}
                  />
                </View>
              ))
            )}
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.labels.accountHealth")}</Text>
              <Text style={styles.muted}>{t("crm.metrics.accountsByScore")}</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label={t("crm.metrics.accountsAtRisk")}
                value={String(
                  profs.filter((p) => profAccountScores.get(p.id)?.status === "RISK").length,
                )}
                onPress={() => {
                  trackEvent("crm_kpi_clicked", {
                    kpi: "accounts_risk",
                    targetTab: "PROFISSIONAIS",
                    profAccountStatusFilter: "RISK",
                  }).catch(() => undefined);
                  setTab("PROFISSIONAIS");
                  setProfAccountStatusFilter("RISK");
                }}
              />
              <Metric
                label={t("crm.metrics.accountsInAttention")}
                value={String(
                  profs.filter(
                    (p) => profAccountScores.get(p.id)?.status === "ATTENTION",
                  ).length,
                )}
                onPress={() => {
                  trackEvent("crm_kpi_clicked", {
                    kpi: "accounts_attention",
                    targetTab: "PROFISSIONAIS",
                    profAccountStatusFilter: "ATTENTION",
                  }).catch(() => undefined);
                  setTab("PROFISSIONAIS");
                  setProfAccountStatusFilter("ATTENTION");
                }}
              />
              <Metric
                label={t("crm.metrics.accountsHealthy")}
                value={String(
                  profs.filter((p) => profAccountScores.get(p.id)?.status === "HEALTHY").length,
                )}
                onPress={() => {
                  trackEvent("crm_kpi_clicked", {
                    kpi: "accounts_healthy",
                    targetTab: "PROFISSIONAIS",
                    profAccountStatusFilter: "HEALTHY",
                  }).catch(() => undefined);
                  setTab("PROFISSIONAIS");
                  setProfAccountStatusFilter("HEALTHY");
                }}
              />
              <Metric
                label={t("crm.labels.sensitiveCaseloads")}
                value={String(
                  profs.filter((p) => {
                    const em = profEmotionalConcentrationMap.get(p.id);
                    return Boolean(em && em.total >= 5 && em.percentual >= 25);
                  }).length,
                )}
                onPress={() => {
                  trackEvent("crm_kpi_clicked", {
                    kpi: "sensitive_caseloads",
                    targetTab: "PROFISSIONAIS",
                    profEmotionalConcentrationFilter: "ALTA",
                  }).catch(() => undefined);
                  setTab("PROFISSIONAIS");
                  setProfEmotionalConcentrationFilter("ALTA");
                }}
              />
            </View>
            <Text style={styles.disclaimerText}>
              {t("crm.messages.emotionalConcentrationDisclaimer")}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.wrapRow}>{tabs.map((tabItem) => <Tab key={tabItem.key} label={tabItem.label} active={tab === tabItem.key} onPress={() => setTab(tabItem.key)} />)}</View>
            <View style={styles.wrapRow}>
              {tab === "PROFISSIONAIS" ? (
                <>
                  <Chip label={t("crm.filters.allProfessionals")} active={profActiveFilter === "TODOS"} onPress={() => setProfActiveFilter("TODOS")} />
                  <Chip label={t("crm.filters.onlyActive")} active={profActiveFilter === "ATIVOS"} onPress={() => setProfActiveFilter("ATIVOS")} />
                  <Chip label={t("crm.filters.allAccounts")} active={profAccountStatusFilter === "TODOS"} onPress={() => setProfAccountStatusFilter("TODOS")} />
                  <Chip label={t("crm.status.healthy")} active={profAccountStatusFilter === "HEALTHY"} onPress={() => setProfAccountStatusFilter("HEALTHY")} />
                  <Chip label={t("crm.status.attention")} active={profAccountStatusFilter === "ATTENTION"} onPress={() => setProfAccountStatusFilter("ATTENTION")} />
                  <Chip label={t("crm.status.risk")} active={profAccountStatusFilter === "RISK"} onPress={() => setProfAccountStatusFilter("RISK")} />
                  <Chip label={t("crm.filters.profEmotionalAll")} active={profEmotionalConcentrationFilter === "TODOS"} onPress={() => setProfEmotionalConcentrationFilter("TODOS")} />
                  <Chip label={t("crm.filters.profEmotionalHighConcentration")} active={profEmotionalConcentrationFilter === "ALTA"} onPress={() => setProfEmotionalConcentrationFilter("ALTA")} />
                  <TextInput style={styles.filterInput} placeholder={t("crm.placeholders.specialty")} value={profEspecialidadeFilter} onChangeText={setProfEspecialidadeFilter} />
                </>
              ) : null}
              {tab === "PACIENTES" ? (
                <>
                  <Chip label={t("crm.filters.statusAll")} active={pacStatusFilter === "TODOS"} onPress={() => setPacStatusFilter("TODOS")} />
                  <Chip label={t("crm.labels.active")} active={pacStatusFilter === "ATIVO"} onPress={() => setPacStatusFilter("ATIVO")} />
                  <Chip label={t("crm.status.risk")} active={pacStatusFilter === "RISCO"} onPress={() => setPacStatusFilter("RISCO")} />
                  <Chip label={t("crm.filters.pacEmotionalAll")} active={pacEmotionalFilter === "TODOS"} onPress={() => setPacEmotionalFilter("TODOS")} />
                  <Chip label={t("crm.filters.pacEmotionalWithVulnerability")} active={pacEmotionalFilter === "EMOCIONAL"} onPress={() => setPacEmotionalFilter("EMOCIONAL")} />
                  <Chip label={t("crm.filters.allPatients")} active={pacLinkFilter === "TODOS"} onPress={() => setPacLinkFilter("TODOS")} />
                  <Chip label={t("crm.filters.linked")} active={pacLinkFilter === "VINCULADOS"} onPress={() => setPacLinkFilter("VINCULADOS")} />
                  <Chip label={t("crm.filters.withoutUser")} active={pacLinkFilter === "SEM_USUARIO"} onPress={() => setPacLinkFilter("SEM_USUARIO")} />
                  <TextInput style={styles.filterInput} placeholder={t("crm.placeholders.city")} value={pacCidadeFilter} onChangeText={setPacCidadeFilter} />
                  <TextInput style={[styles.filterInput, { width: 70 }]} placeholder={t("crm.placeholders.uf")} maxLength={2} autoCapitalize="characters" value={pacUfFilter} onChangeText={setPacUfFilter} />
                </>
              ) : null}
              <Chip label={t("crm.filters.all")} active={stageFilter === "TODOS"} onPress={() => setStageFilter("TODOS")} />
              {STAGES.map((s) => <Chip key={s} label={stageLabel[s]} active={stageFilter === s} onPress={() => setStageFilter(s)} />)}
            </View>
          </View>
        </View>

        {!loading && crmAutomationItems.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.section}>{t("crm.sections.suggestedAutomations")}</Text>
              <View style={styles.wrapRow}>
                <Text style={styles.muted}>{t("crm.labels.mvpRules")}</Text>
                {dismissedAutomationIds.length > 0 ? (
                  <SmallBtn
                    title={t("crm.actions.resetAutomations")}
                    onPress={() => {
                      setDismissedAutomationIds([]);
                      pushAutomationHistory({
                        action: "RESET",
                        automationId: "ALL",
                        title: t("crm.actions.resetDismissedAutomations"),
                      });
                      trackEvent("crm_automation_reset", {
                        count: dismissedAutomationIds.length,
                      }).catch(() => undefined);
                    }}
                  />
                ) : null}
              </View>
            </View>
            {crmAutomationItems.map((item) => (
              <View key={item.id} style={styles.automationItem}>
                <View style={{ flex: 1 }}>
                  <View style={styles.wrapRow}>
                    <SeverityBadge
                      level={item.severity}
                      labels={{ high: t("crm.severity.high"), medium: t("crm.severity.medium") }}
                    />
                    <Text style={styles.lineTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.lineSub}>{item.description}</Text>
                </View>
                <View style={styles.wrapRow}>
                  <Action
                    title={item.ctaLabel}
                    onPress={() => {
                      pushAutomationHistory({
                        action: "EXECUTED",
                        automationId: item.id,
                        title: item.title,
                      });
                      trackEvent("crm_automation_action_executed", {
                        automationId: item.id,
                        severity: item.severity,
                        ctaLabel: item.ctaLabel,
                      }).catch(() => undefined);
                      item.onPress();
                    }}
                    secondary
                  />
                  <SmallBtn
                    title={t("crm.actions.dismiss")}
                    onPress={() => {
                      pushAutomationHistory({
                        action: "DISMISSED",
                        automationId: item.id,
                        title: item.title,
                      });
                      trackEvent("crm_automation_dismissed", {
                        automationId: item.id,
                        severity: item.severity,
                      }).catch(() => undefined);
                      setDismissedAutomationIds((prev) =>
                        prev.includes(item.id) ? prev : [...prev, item.id],
                      );
                    }}
                  />
                </View>
              </View>
            ))}
            {automationHistory.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.section}>{t("crm.sections.lastActions")}</Text>
                {automationHistory.map((h) => (
                  <View key={h.id} style={styles.automationHistoryItem}>
                    <Text style={styles.lineTitle}>
                      {automationHistoryActionLabel(h.action)} • {h.title}
                    </Text>
                    <Text style={styles.lineSub}>{dt(h.occurredAt)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {loading ? <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /></View> : null}

        {!loading && tab === "PROFISSIONAIS" ? (
          <View style={styles.split}>
            <View style={styles.pane}>
              <Text style={styles.section}>Profissionais</Text>
              <View style={styles.wrapRow}>
                <Action title={t("crm.actions.exportCsv")} secondary onPress={() => exportCurrentTableCsv("PROFISSIONAIS")} />
                <Action title={t("crm.actions.exportAllFiltered")} secondary onPress={() => exportAllFilteredCsv("PROFISSIONAIS")} />
              </View>
              <HeadSortable
                cols={[
                  { key: "nome", label: "Nome" },
                  { key: "score", label: "Score" },
                  { key: "vulnEmocional", label: t("crm.labels.emotionalVulnerabilityShort") },
                  { key: "pacientes", label: "Pacientes" },
                  { key: "ativos", label: t("crm.labels.active") },
                  { key: "ultimoAcesso", label: "Último acesso" },
                ]}
                sort={profSort}
                onSortChange={(key) => setProfSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }))}
              />
              {pagedProfs.map((p) => (
                <Row
                  key={p.id}
                  selected={selectedProfId === p.id}
                  onPress={() => setSelectedProfId(p.id)}
                  cols={[
                    p.nome,
                    String(profAccountScores.get(p.id)?.score ?? "-"),
                    (() => {
                      const em = profEmotionalConcentrationMap.get(p.id);
                      if (!em || em.total === 0) return "-";
                      return `${em.vulneraveis}/${em.total} (${em.percentual}%)`;
                    })(),
                    String(p.pacientes),
                    String(p.ativos),
                    p.ultimoAcesso,
                  ]}
                />
              ))}
              <Pagination
                page={profPage}
                totalPages={profTotalPages}
                onChange={setProfPage}
                previousLabel={t("crm.pagination.previous")}
                nextLabel={t("crm.pagination.next")}
                pageOfLabel={t("crm.pagination.pageOf", {
                  page: String(profPage),
                  total: String(profTotalPages),
                })}
              />
            </View>
            <View style={[styles.pane, styles.detailPane]}>
              <Text style={styles.section}>{t("crm.sections.professionalPanel")}</Text>
              {selectedProf ? (
                <>
                  <View style={styles.entityHeader}>
                    <View style={styles.entityHeaderText}>
                      <Text style={styles.entityName}>{selectedProf.nome}</Text>
                      <Text style={styles.entityMeta}>{selectedProf.cidade || t("crm.messages.cityNotProvided")}</Text>
                    </View>
                    <Action
                      title={editProfOpen ? t("crm.actions.closeEdit") : t("crm.actions.editProfessional")}
                      secondary
                      style={styles.entityHeaderAction}
                      onPress={() => {
                        if (!editProfOpen) resetProfEditForm();
                        setEditProfOpen((prev) => !prev);
                      }}
                    />
                  </View>
                  {editProfOpen ? (
                    <View style={styles.line}>
                      <Text style={styles.panelFormTitle}>{t("crm.forms.editProfessionalData")}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.name")}
                        value={profEditForm.nome}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, nome: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.email")}
                        value={profEditForm.email}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, email: v }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.specialty")}
                        value={profEditForm.especialidade}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, especialidade: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.professionalRegistry")}
                        value={profEditForm.registroProf}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, registroProf: v }))}
                      />
                      <View style={styles.wrapRow}>
                        <Chip
                          label={t("crm.labels.active")}
                          active={profEditForm.ativo}
                          onPress={() => setProfEditForm((p) => ({ ...p, ativo: true }))}
                        />
                        <Chip
                          label={t("crm.labels.inactive")}
                          active={!profEditForm.ativo}
                          onPress={() => setProfEditForm((p) => ({ ...p, ativo: false }))}
                        />
                      </View>
                      <View style={[styles.wrapRow, styles.panelActionsRow]}>
                        <Action
                          title={savingAdminEntity ? t("crm.actions.saving") : t("crm.actions.saveChanges")}
                          onPress={saveAdminProfessional}
                          style={styles.panelActionBtn}
                        />
                        <Action
                          title={t("crm.actions.cancel")}
                          secondary
                          style={styles.panelActionBtn}
                          onPress={() => {
                            resetProfEditForm();
                            setEditProfOpen(false);
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.panelTabsRow}>
                    <MiniTab label={t("crm.labels.summary")} active={profDetailTab === "RESUMO"} onPress={() => setProfDetailTab("RESUMO")} />
                    <MiniTab label={t("crm.sections.patients")} active={profDetailTab === "PACIENTES"} onPress={() => setProfDetailTab("PACIENTES")} />
                  </View>
                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{selectedProf.pacientes}</Text>
                      <Text style={styles.kpiLabel}>{t("crm.sections.patients")}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{selectedProf.ativos}</Text>
                      <Text style={styles.kpiLabel}>{t("crm.labels.active")}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>{selectedProf.adesao}%</Text>
                      <Text style={styles.kpiLabel}>{t("crm.labels.adherence")}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiValue}>
                        {selectedProfAccountScore ? selectedProfAccountScore.score : "-"}
                      </Text>
                      <Text style={styles.kpiLabel}>{t("crm.labels.accountScore")}</Text>
                    </View>
                  </View>
                  {selectedProfAccountScore ? (
                    <View style={styles.line}>
                      <View style={[styles.wrapRow, { justifyContent: "space-between" }]}>
                        <StatusBadge
                          status={selectedProfAccountScore.status}
                          labels={{
                            healthy: t("crm.badges.accountHealthy"),
                            attention: t("crm.status.attention"),
                            risk: t("crm.status.risk"),
                          }}
                        />
                        {(selectedProfAccountScore.status === "RISK" ||
                          selectedProfAccountScore.status === "ATTENTION") ? (
                          <Action
                            title={t("crm.actions.createReactivationTask")}
                            secondary
                            onPress={() => {
                              const leadId = selectedProf.leadIds[0] || "";
                              trackEvent("crm_reactivation_task_prefilled", {
                                profissionalId: selectedProf.id,
                                profissionalNome: selectedProf.nome,
                                score: selectedProfAccountScore.score,
                                status: selectedProfAccountScore.status,
                                leadId: leadId || null,
                              }).catch(() => undefined);
                              setTaskForm({
                                id: "",
                                titulo: `${t("crm.forms.reactivationTaskTitlePrefix")}: ${selectedProf.nome}`,
                                dueAt: toLocal(
                                  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                                ),
                                leadId,
                              });
                              if (leadId) setSelectedLeadId(leadId);
                              setTab("TAREFAS");
                            }}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.lineTitle}>{t("crm.labels.priorityNow")}</Text>
                      <Text style={styles.lineSub}>{selectedProfAccountScore.nextAction}</Text>
                      {selectedProfEmotionalConcentration && selectedProfEmotionalConcentration.total > 0 ? (
                        <Text style={styles.lineSub}>
                          {t("crm.labels.emotionalVulnerability")}: {selectedProfEmotionalConcentration.vulneraveis}/{selectedProfEmotionalConcentration.total} ({selectedProfEmotionalConcentration.percentual}%).
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {profDetailTab === "RESUMO" ? (
                    <>
                      <Text style={[styles.section, { marginTop: 12 }]}>{t("crm.labels.summary")}</Text>
                      <View style={styles.line}>
                        <Text style={styles.lineTitle}>{t("crm.labels.operationalStatus")}</Text>
                        <Text style={styles.lineSub}>
                          {selectedProf.ativos > 0 ? t("crm.messages.professionalActive") : t("crm.messages.professionalNoActivePatients")} • {t("crm.labels.lastAccess")} {selectedProf.ultimoAcesso}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.section, { marginTop: 12 }]}>{t("crm.labels.linkedPatients")}</Text>
                      {pacs.filter((x) => x.profissionalId === selectedProf.id).slice(0, 8).map((x) => (
                        <Pressable key={x.id} style={styles.line} onPress={() => { setSelectedPacId(x.id); setSelectedLeadId(x.lead.id); setTab("PACIENTES"); }}>
                          <Text style={styles.lineTitle}>{x.nome}</Text>
                          <Text style={styles.lineSub}>{x.status} • {t("crm.labels.adherence").toLowerCase()} {x.adesao}% • {x.ultimoCheckin}</Text>
                        </Pressable>
                      ))}
                    </>
                  )}
                </>
              ) : <Text style={styles.muted}>{t("crm.messages.selectProfessional")}</Text>}
            </View>
          </View>
        ) : null}

        {!loading && tab === "PACIENTES" ? (
          <View style={styles.split}>
            <View style={styles.pane}>
              <Text style={styles.section}>{t("crm.sections.patients")}</Text>
              <View style={styles.wrapRow}>
                <Action title={t("crm.actions.exportCsv")} secondary onPress={() => exportCurrentTableCsv("PACIENTES")} />
                <Action title={t("crm.actions.exportAllFiltered")} secondary onPress={() => exportAllFilteredCsv("PACIENTES")} />
              </View>
              <HeadSortable
                cols={[
                  { key: "nome", label: t("crm.labels.patient") },
                  { key: "profissionalNome", label: t("crm.labels.professional") },
                  { key: "status", label: t("crm.labels.status") },
                  { key: "ultimoCheckin", label: t("crm.labels.latestCheckin") },
                ]}
                sort={pacSort}
                onSortChange={(key) => setPacSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }))}
              />
              {pagedPacs.map((p) => (
                <Row
                  key={p.id}
                  selected={selectedPacId === p.id}
                  onPress={() => { setSelectedPacId(p.id); setSelectedLeadId(p.lead.id); }}
                  cols={[
                    p.nome,
                    p.profissionalNome,
                    p.emocionalVulneravel ? `${p.status} • Emocional` : p.status,
                    p.ultimoCheckin,
                  ]}
                />
              ))}
              <Pagination
                page={pacPage}
                totalPages={pacTotalPages}
                onChange={setPacPage}
                previousLabel={t("crm.pagination.previous")}
                nextLabel={t("crm.pagination.next")}
                pageOfLabel={t("crm.pagination.pageOf", {
                  page: String(pacPage),
                  total: String(pacTotalPages),
                })}
              />
            </View>
            <View style={[styles.pane, styles.detailPane]}>
              <Text style={styles.section}>{t("crm.sections.patientPanel")}</Text>
              {selectedPac ? (
                <>
                  <View style={styles.entityHeader}>
                    <View style={styles.entityHeaderText}>
                      <Text style={styles.entityName}>{selectedPac.nome}</Text>
                      <Text style={styles.entityMeta}>{t("crm.labels.professional")}: {selectedPac.profissionalNome}</Text>
                    </View>
                    <Action
                      title={editPacOpen ? t("crm.actions.closeEdit") : t("crm.actions.editPatient")}
                      secondary
                      style={styles.entityHeaderAction}
                      onPress={() => {
                        if (!editPacOpen) resetPacEditForm();
                        setEditPacOpen((prev) => !prev);
                      }}
                    />
                  </View>
                  {editPacOpen ? (
                    <View style={styles.line}>
                      <Text style={styles.panelFormTitle}>{t("crm.forms.editPatientData")}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.fullName")}
                        value={pacEditForm.nomeCompleto}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, nomeCompleto: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.cpf11")}
                        value={pacEditForm.cpf}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, cpf: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.birthDateIso")}
                        value={pacEditForm.dataNascimento}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, dataNascimento: v }))}
                      />
                      <View style={styles.wrapRow}>
                        {["MASCULINO", "FEMININO", "OUTRO"].map((sexo) => (
                          <Chip
                            key={sexo}
                            label={sexo}
                            active={pacEditForm.sexo === sexo}
                            onPress={() => setPacEditForm((p) => ({ ...p, sexo }))}
                          />
                        ))}
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.profession")}
                        value={pacEditForm.profissao}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, profissao: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.whatsapp")}
                        value={pacEditForm.contatoWhatsapp}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoWhatsapp: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.phone")}
                        value={pacEditForm.contatoTelefone}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoTelefone: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.email")}
                        value={pacEditForm.contatoEmail}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoEmail: v }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.city")}
                        value={pacEditForm.enderecoCidade}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, enderecoCidade: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder={t("crm.placeholders.uf")}
                        value={pacEditForm.enderecoUf}
                        onChangeText={(v) =>
                          setPacEditForm((p) => ({ ...p, enderecoUf: v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) }))
                        }
                      />
                      <View style={styles.wrapRow}>
                        <Chip
                          label={t("crm.labels.active")}
                          active={pacEditForm.ativo}
                          onPress={() => setPacEditForm((p) => ({ ...p, ativo: true }))}
                        />
                        <Chip
                          label={t("crm.labels.inactive")}
                          active={!pacEditForm.ativo}
                          onPress={() => setPacEditForm((p) => ({ ...p, ativo: false }))}
                        />
                      </View>
                      <View style={[styles.wrapRow, styles.panelActionsRow]}>
                        <Action
                          title={savingAdminEntity ? t("crm.actions.saving") : t("crm.actions.saveChanges")}
                          onPress={saveAdminPatient}
                          style={styles.panelActionBtn}
                        />
                        <Action
                          title={t("crm.actions.cancel")}
                          secondary
                          style={styles.panelActionBtn}
                          onPress={() => {
                            resetPacEditForm();
                            setEditPacOpen(false);
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.panelTabsRow}>
                    <MiniTab label={t("crm.labels.summary")} active={pacDetailTab === "RESUMO"} onPress={() => setPacDetailTab("RESUMO")} />
                    <MiniTab label={t("crm.labels.contact")} active={pacDetailTab === "CONTATO"} onPress={() => setPacDetailTab("CONTATO")} />
                    <MiniTab label={t("crm.labels.link")} active={pacDetailTab === "VINCULO"} onPress={() => setPacDetailTab("VINCULO")} />
                  </View>
                  <View style={styles.panelMetricsRow}>
                    <MetricMini label={t("crm.labels.status")} value={selectedPac.status} />
                    <MetricMini label={t("crm.labels.adherence")} value={`${selectedPac.adesao}%`} />
                    <MetricMini label={t("crm.labels.channel")} value={selectedPac.lead.canal} />
                    <MetricMini label={t("crm.labels.stage")} value={stageLabel[selectedPac.lead.stage]} />
                    {selectedPac.emocionalVulneravel ? <MetricMini label={t("crm.labels.emotional")} value={t("crm.badges.emotionalAttention")} /> : null}
                  </View>
                  {selectedPac.emocionalVulneravel && selectedPac.emocionalResumo ? (
                    <View style={styles.line}>
                      <Text style={styles.lineTitle}>{t("crm.labels.emotionalVulnerability")}</Text>
                      <Text style={styles.lineSub}>
                        {[
                          typeof selectedPac.emocionalResumo.estresse === "number" ? `Estresse ${selectedPac.emocionalResumo.estresse}/10` : null,
                          typeof selectedPac.emocionalResumo.energia === "number" ? `Energia ${selectedPac.emocionalResumo.energia}/10` : null,
                          typeof selectedPac.emocionalResumo.apoio === "number" ? `Apoio ${selectedPac.emocionalResumo.apoio}/10` : null,
                          typeof selectedPac.emocionalResumo.sonoQualidade === "number" ? `Sono ${selectedPac.emocionalResumo.sonoQualidade}/10` : null,
                          selectedPac.emocionalResumo.humor ? `Humor ${selectedPac.emocionalResumo.humor}` : null,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Sinais de vulnerabilidade na última anamnese"}
                      </Text>
                    </View>
                  ) : null}
                  {pacDetailTab === "RESUMO" ? (
                    <View style={styles.panelPrimaryActions}>
                      <Action title={t("crm.actions.openInFunnel")} onPress={() => { setSelectedLeadId(selectedPac.lead.id); setTab("LEADS"); }} />
                      <Action title={t("crm.actions.registerInteraction")} secondary onPress={() => { setSelectedLeadId(selectedPac.lead.id); setTab("INTERACOES"); }} />
                    </View>
                  ) : null}
                  {pacDetailTab === "CONTATO" ? (
                    <>
                      <View style={styles.line}><Text style={styles.lineTitle}>{t("crm.labels.crmChannel")}</Text><Text style={styles.lineSub}>{selectedPac.lead.canal}</Text></View>
                      <View style={styles.line}><Text style={styles.lineTitle}>{t("crm.labels.latestCheckin")}</Text><Text style={styles.lineSub}>{selectedPac.ultimoCheckin}</Text></View>
                    </>
                  ) : null}
                  {pacDetailTab === "VINCULO" ? (
                    <>
                      <View style={styles.line}><Text style={styles.lineTitle}>{t("crm.labels.professional")}</Text><Text style={styles.lineSub}>{selectedPac.profissionalNome}</Text></View>
                      <View style={styles.line}><Text style={styles.lineTitle}>{t("crm.labels.crmLead")}</Text><Text style={styles.lineSub}>{selectedPac.lead.id ? selectedPac.lead.id : t("crm.labels.noLinkedLead")}</Text></View>
                    </>
                  ) : null}
                </>
              ) : <Text style={styles.muted}>{t("crm.messages.selectPatient")}</Text>}
            </View>
          </View>
        ) : null}

        {!loading && tab === "LEADS" ? (
          <>
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.section}>{t("crm.sections.leadFunnel")}</Text>
                <View style={styles.wrapRow}>
                  <Action title={t("crm.actions.exportCsv")} secondary onPress={() => exportLeadsCsv(false)} />
                  <Action title={t("crm.actions.exportAllLeads")} secondary onPress={() => exportLeadsCsv(true)} />
                </View>
              </View>
              <View style={styles.kanbanWrap}>
                {STAGES.map((s) => (
                  <View key={s} style={styles.kanbanCol}>
                    <Text style={styles.lineTitle}>{stageLabel[s]}</Text>
                    <Text style={styles.lineSub}>{leads.filter((l) => l.stage === s).length} leads</Text>
                    {leads.filter((l) => l.stage === s).map((l) => (
                      <Pressable key={l.id} style={[styles.kanbanCard, selectedLeadId === l.id && styles.selected]} onPress={() => setSelectedLeadId(l.id)}>
                        <Text style={styles.lineTitle}>{l.nome}</Text>
                        <Text style={styles.lineSub}>{l.empresa || t("crm.messages.individualPerson")} • {money(l.valorPotencial)}</Text>
                        <View style={styles.wrapRow}>
                          <SmallBtn title={t("crm.actions.edit")} onPress={() => setLeadForm({ id: l.id, nome: l.nome, empresa: l.empresa || "", canal: l.canal, stage: l.stage, valor: String(l.valorPotencial || "") })} />
                          <SmallBtn title={t("crm.actions.advanceStage")} onPress={() => updateCrmLead(l.id, { stage: STAGES[(STAGES.indexOf(l.stage) + 1) % STAGES.length] }).then(() => loadMain()).catch(() => showToast({ type: "error", message: t("crm.messages.leadStageChangeFailed") }))} />
                          <SmallBtn danger title={t("crm.actions.delete")} onPress={() => Alert.alert(t("crm.confirm.deleteLeadTitle"), l.nome, [{ text: t("crm.actions.cancel"), style: "cancel" }, { text: t("crm.actions.delete"), style: "destructive", onPress: () => deleteCrmLead(l.id).then(() => loadMain()).catch(() => showToast({ type: "error", message: t("crm.messages.leadDeleteFailed") })) }])} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.split}>
              <View style={styles.pane}>
                <Text style={styles.section}>{leadForm.id ? t("crm.forms.editLeadTitle") : t("crm.forms.createLeadTitle")}</Text>
                <TextInput style={styles.input} placeholder={t("crm.placeholders.name")} value={leadForm.nome} onChangeText={(v) => setLeadForm((p) => ({ ...p, nome: v }))} />
                <TextInput style={styles.input} placeholder={t("crm.placeholders.company")} value={leadForm.empresa} onChangeText={(v) => setLeadForm((p) => ({ ...p, empresa: v }))} />
                <View style={styles.wrapRow}>{CHANNELS.map((c) => <Chip key={c} label={c} active={leadForm.canal === c} onPress={() => setLeadForm((p) => ({ ...p, canal: c }))} />)}</View>
                <View style={styles.wrapRow}>{STAGES.map((s) => <Chip key={s} label={stageLabel[s]} active={leadForm.stage === s} onPress={() => setLeadForm((p) => ({ ...p, stage: s }))} />)}</View>
                <TextInput style={styles.input} placeholder={t("crm.labels.potentialValue")} value={leadForm.valor} onChangeText={(v) => setLeadForm((p) => ({ ...p, valor: v }))} />
                <View style={styles.wrapRow}><Action title={leadForm.id ? t("crm.forms.saveLead") : t("crm.forms.createLead")} onPress={saveLead} /><Action title={t("crm.actions.clear")} secondary onPress={resetLeadForm} /></View>
              </View>
              <View style={styles.pane}>
                <Text style={styles.section}>{t("crm.sections.leadPanel")}</Text>
                {selectedLead ? (
                  <>
                    <Text style={styles.big}>{selectedLead.nome}</Text>
                    <Text style={styles.sub}>{selectedLead.empresa || t("crm.messages.individualPerson")} • {stageLabel[selectedLead.stage]}</Text>
                    <View style={styles.wrapRow}><MetricMini label={t("crm.labels.channel")} value={selectedLead.canal} /><MetricMini label={t("crm.labels.value")} value={money(selectedLead.valorPotencial)} /></View>
                    <Text style={[styles.section, { marginTop: 12 }]}>{t("crm.labels.recentInteractions")}</Text>
                    {loadingInteractions ? <ActivityIndicator color={COLORS.primary} /> : interactions.slice(0, 6).map((i) => (
                      <View key={i.id} style={styles.line}><Text style={styles.lineTitle}>{interactionLabel[i.tipo]}</Text><Text style={styles.lineSub}>{i.resumo} • {dt(i.occurredAt)}</Text></View>
                    ))}
                  </>
                ) : <Text style={styles.muted}>{t("crm.messages.selectLead")}</Text>}
              </View>
            </View>
          </>
        ) : null}

        {!loading && tab === "TAREFAS" ? (
          <View style={styles.split}>
            <View style={styles.pane}>
              <Text style={styles.section}>{taskForm.id ? t("crm.forms.editTaskTitle") : t("crm.forms.createTaskTitle")}</Text>
              <TextInput style={styles.input} placeholder={t("crm.placeholders.title")} value={taskForm.titulo} onChangeText={(v) => setTaskForm((p) => ({ ...p, titulo: v }))} />
              <TextInput style={styles.input} placeholder={t("crm.placeholders.leadIdOptional")} value={taskForm.leadId} onChangeText={(v) => setTaskForm((p) => ({ ...p, leadId: v }))} />
              <TextInput style={styles.input} placeholder={t("crm.placeholders.dueAtIso")} value={taskForm.dueAt} onChangeText={(v) => setTaskForm((p) => ({ ...p, dueAt: v }))} />
              <View style={styles.wrapRow}><Action title={taskForm.id ? t("crm.forms.saveTask") : t("crm.forms.createTask")} onPress={saveTask} /><Action title={t("crm.actions.clear")} secondary onPress={resetTaskForm} /></View>
            </View>
            <View style={styles.pane}>
              <View style={styles.topRow}>
                <Text style={styles.section}>{t("crm.sections.taskList")}</Text>
                <Action title={t("crm.actions.exportCsv")} secondary onPress={exportTasksCsv} />
              </View>
              <View style={styles.wrapRow}>
                <MetricMini label={t("crm.tasks.all")} value={String(tasks.length)} />
                <MetricMini label={t("crm.tasks.late")} value={String(taskBuckets.atrasadas.length)} />
                <MetricMini label={t("crm.tasks.today")} value={String(taskBuckets.hoje.length)} />
                <MetricMini label={t("crm.tasks.next7d")} value={String(taskBuckets.proximas.length)} />
                <MetricMini label={t("crm.tasks.completed")} value={String(taskBuckets.concluidas.length)} />
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.chartTitle}>{t("crm.tasks.chartTitle")}</Text>
                <BarChart items={taskStatusChartData} />
              </View>
              <View style={styles.wrapRow}>
                <Chip label={t("crm.tasks.all")} active={taskBucketFilter === "TODAS"} onPress={() => setTaskBucketFilter("TODAS")} />
                <Chip label={t("crm.tasks.late")} active={taskBucketFilter === "ATRASADAS"} onPress={() => setTaskBucketFilter("ATRASADAS")} />
                <Chip label={t("crm.tasks.today")} active={taskBucketFilter === "HOJE"} onPress={() => setTaskBucketFilter("HOJE")} />
                <Chip label={t("crm.tasks.next7d")} active={taskBucketFilter === "PROXIMAS"} onPress={() => setTaskBucketFilter("PROXIMAS")} />
                <Chip label={t("crm.tasks.completed")} active={taskBucketFilter === "CONCLUIDAS"} onPress={() => setTaskBucketFilter("CONCLUIDAS")} />
              </View>
              {filteredTasks.map((taskItem) => (
                <View key={taskItem.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>{taskItem.titulo}</Text>
                    <Text style={styles.lineSub}>{taskItem.status} • {taskItem.dueAt ? dt(taskItem.dueAt) : t("crm.labels.noDueDate")} • {taskItem.leadId ? taskLeadMap.get(taskItem.leadId)?.nome || t("crm.labels.leadRemoved") : t("crm.labels.noLead")}</Text>
                  </View>
                  <SmallBtn title={t("crm.actions.edit")} onPress={() => setTaskForm({ id: taskItem.id, titulo: taskItem.titulo, dueAt: taskItem.dueAt ? toLocal(taskItem.dueAt) : "", leadId: taskItem.leadId || "" })} />
                  <SmallBtn title={taskItem.status === "CONCLUIDA" ? t("crm.actions.reopenTask") : t("crm.actions.finishTask")} onPress={() => updateCrmTask(taskItem.id, { status: taskItem.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA" }).then(() => loadMain()).catch(() => showToast({ type: "error", message: t("crm.messages.taskUpdateFailed") }))} />
                  <SmallBtn danger title={t("crm.actions.delete")} onPress={() => deleteCrmTask(taskItem.id).then(() => loadMain()).catch(() => showToast({ type: "error", message: t("crm.messages.taskDeleteFailed") }))} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!loading && tab === "INTERACOES" ? (
          <View style={styles.split}>
            <View style={styles.pane}>
              <Text style={styles.section}>{t("crm.actions.registerInteraction")}</Text>
              <Text style={styles.muted}>{selectedLead ? `Lead: ${selectedLead.nome}` : t("crm.messages.selectLeadInFunnel")}</Text>
              <View style={styles.wrapRow}>{INTERACTION_TYPES.map((t) => <Chip key={t} label={interactionLabel[t]} active={interactionForm.tipo === t} onPress={() => setInteractionForm((p) => ({ ...p, tipo: t }))} />)}</View>
              <TextInput style={styles.input} placeholder={t("crm.forms.summaryPlaceholder")} value={interactionForm.resumo} onChangeText={(v) => setInteractionForm((p) => ({ ...p, resumo: v }))} />
              <View style={styles.wrapRow}><Action title={interactionForm.id ? t("crm.actions.saveInteraction") : t("crm.actions.registerInteraction")} onPress={saveInteraction} /><Action title={t("crm.actions.clear")} secondary onPress={resetInteractionForm} /></View>
            </View>
            <View style={styles.pane}>
              <View style={styles.topRow}>
                <Text style={styles.section}>{t("crm.sections.interactionHistory")}</Text>
                <Action title={t("crm.actions.exportCsv")} secondary onPress={exportInteractionsCsv} />
              </View>
              {loadingInteractions ? <ActivityIndicator color={COLORS.primary} /> : interactions.map((i) => (
                <View key={i.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>{interactionLabel[i.tipo]}</Text>
                    <Text style={styles.lineSub}>{i.resumo} • {dt(i.occurredAt)}</Text>
                  </View>
                  <SmallBtn title={t("crm.actions.edit")} onPress={() => setInteractionForm({ id: i.id, tipo: i.tipo, resumo: i.resumo })} />
                  <SmallBtn danger title={t("crm.actions.delete")} onPress={() => selectedLeadId && deleteCrmInteraction(i.id).then(() => loadInteractions(selectedLeadId)).catch(() => showToast({ type: "error", message: t("crm.messages.interactionDeleteFailed") }))} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Blocked({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return <SafeAreaView style={styles.container}><View style={styles.blocked}><Ionicons name={icon} size={28} color={COLORS.primary} /><Text style={styles.title}>{title}</Text><Text style={styles.sub}>{subtitle}</Text></View></SafeAreaView>;
}
function Metric({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const content = (
    <View style={[styles.metric, onPress && styles.metricInteractive]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      hitSlop={6}
      style={(state: any) => [state.focused && styles.focusRing]}
    >
      {content}
    </Pressable>
  );
}
function MetricMini({ label, value }: { label: string; value: string }) { return <View style={styles.metricMini}><Text style={styles.metricMiniValue}>{value}</Text><Text style={styles.metricMiniLabel}>{label}</Text></View>; }
function SampleConfidenceBadge({ sample }: { sample: number }) {
  const confidence = getSampleConfidence(sample);
  return (
    <View
      style={[
        styles.sampleBadge,
        confidence === "ALTA"
          ? styles.sampleBadgeHigh
          : confidence === "MEDIA"
            ? styles.sampleBadgeMedium
            : styles.sampleBadgeLow,
      ]}
    >
      <Text
        style={[
          styles.sampleBadgeText,
          confidence === "ALTA"
            ? styles.sampleBadgeHighText
            : confidence === "MEDIA"
              ? styles.sampleBadgeMediumText
              : styles.sampleBadgeLowText,
        ]}
      >
        {confidence}
      </Text>
    </View>
  );
}
function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} hitSlop={6} style={(state: any) => [styles.tab, active && styles.tabActive, state.focused && styles.focusRing]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>; }
function MiniTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} hitSlop={6} style={(state: any) => [styles.miniTab, active && styles.miniTabActive, state.focused && styles.focusRing]}><Text style={[styles.miniTabText, active && styles.miniTabTextActive]}>{label}</Text></Pressable>; }
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} hitSlop={6} style={(state: any) => [styles.chip, active && styles.chipActive, state.focused && styles.focusRing]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function Action({
  title,
  onPress,
  secondary,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={6}
      style={(state: any) => [styles.action, secondary && styles.actionSecondary, style, state.focused && styles.focusRing]}
    >
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{title}</Text>
    </Pressable>
  );
}
function SmallBtn({ title, onPress, danger }: { title: string; onPress: () => void; danger?: boolean }) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} hitSlop={6} style={(state: any) => [styles.small, danger && styles.smallDanger, state.focused && styles.focusRing]}><Text style={[styles.smallText, danger && styles.smallTextDanger]}>{title}</Text></Pressable>; }
function StatusBadge({
  status,
  labels,
}: {
  status: AccountHealthStatus;
  labels?: { healthy: string; attention: string; risk: string };
}) {
  const tone =
    status === "HEALTHY"
      ? { bg: "#EAF8F1", border: "#BFEAD0", text: "#187A46", label: labels?.healthy || "Conta saudável" }
      : status === "ATTENTION"
        ? { bg: "#FFF7E8", border: "#F4D39A", text: "#9A6700", label: labels?.attention || "Atenção" }
        : { bg: "#FFF0F0", border: "#F0B4B4", text: "#B52828", label: labels?.risk || "Risco" };
  return (
    <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.statusBadgeText, { color: tone.text }]}>{tone.label}</Text>
    </View>
  );
}
function ReasonTag({ label }: { label: string }) {
  return (
    <View style={styles.reasonTag}>
      <Text style={styles.reasonTagText}>{label}</Text>
    </View>
  );
}
function SeverityBadge({
  level,
  labels,
}: {
  level: "HIGH" | "MEDIUM";
  labels?: { high: string; medium: string };
}) {
  const tone =
    level === "HIGH"
      ? { bg: "#FFF0F0", border: "#F0B4B4", text: "#B52828", label: labels?.high || "Alta" }
      : { bg: "#FFF7E8", border: "#F4D39A", text: "#9A6700", label: labels?.medium || "Média" };
  return (
    <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.statusBadgeText, { color: tone.text }]}>{tone.label}</Text>
    </View>
  );
}
function Head({ cols }: { cols: string[] }) { return <View style={styles.head}>{cols.map((c) => <Text key={c} style={styles.headText}>{c}</Text>)}</View>; }
function Row({ cols, onPress, selected }: { cols: string[]; onPress: () => void; selected?: boolean }) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }} accessibilityLabel={cols.join(" - ")} hitSlop={6} style={(state: any) => [styles.row, selected && styles.selected, state.focused && styles.focusRing]}>{cols.map((c, i) => <Text key={`${i}-${c}`} style={[styles.rowCell, i===0 && styles.rowCellPrimary]}>{c}</Text>)}</Pressable>; }
function HeadSortable<T extends string>({
  cols,
  sort,
  onSortChange,
}: {
  cols: Array<{ key: T; label: string }>;
  sort: { key: T; dir: SortDir };
  onSortChange: (key: T) => void;
}) {
  return (
    <View style={[styles.head, Platform.OS === "web" ? webStickyHeaderStyle : null]}>
      {cols.map((c) => {
        const active = sort.key === c.key;
        const arrow = active ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
        return (
          <Pressable key={c.key} onPress={() => onSortChange(c.key)} accessibilityRole="button" accessibilityLabel={`${c.label}${active ? `, ordenado ${sort.dir === "asc" ? "crescente" : "decrescente"}` : ""}`} hitSlop={6} style={(state: any) => [styles.headBtn, state.focused && styles.focusRing]}>
            <Text style={[styles.headText, active && styles.headTextActive]}>{c.label}{arrow}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function Pagination({
  page,
  totalPages,
  onChange,
  previousLabel,
  nextLabel,
  pageOfLabel,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <SmallBtn title={previousLabel} onPress={() => onChange(Math.max(1, page - 1))} />
      <Text style={styles.paginationText}>{pageOfLabel}</Text>
      <SmallBtn title={nextLabel} onPress={() => onChange(Math.min(totalPages, page + 1))} />
    </View>
  );
}
function BarChart({
  items,
  formatValue,
  maxValue,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
  formatValue?: (value: number) => string;
  maxValue?: number;
}) {
  const max = Math.max(1, maxValue ?? Math.max(1, ...items.map((i) => i.value || 0)));
  return (
    <View style={styles.chartWrap}>
      {items.map((item) => {
        const pct = Math.max(0, Math.min(100, Math.round(((item.value || 0) / max) * 100)));
        return (
          <View key={item.label} style={styles.chartRow}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={styles.chartValue}>
                {formatValue ? formatValue(item.value) : item.value}
              </Text>
            </View>
            <View style={styles.chartTrack}>
              <View
                style={[
                  styles.chartFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: item.color || COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
const dt = (v: string) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("pt-BR"); };
const toLocal = (v: string) => { const d = new Date(v); if (Number.isNaN(d.getTime())) return ""; const o = d.getTimezoneOffset()*60000; return new Date(d.getTime()-o).toISOString().slice(0,16); };
const compareStr = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });
const compareDateStr = (a: string, b: string) => {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return compareStr(a, b);
  return ta - tb;
};
const formatDurationMs = (value: number) => {
  if (!value || value <= 0) return "-";
  const minutes = value / 60000;
  if (minutes < 1) return `${Math.round(value / 1000)}s`;
  return `${minutes.toFixed(1)}min`;
};
const getSampleConfidence = (sample: number): "ALTA" | "MEDIA" | "BAIXA" => {
  if (sample >= 10) return "ALTA";
  if (sample >= 5) return "MEDIA";
  return "BAIXA";
};
const csvEscape = (value: unknown) => {
  const str = String(value ?? "");
  if (/[\";\n,]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};
const downloadCsv = (filename: string, headers: string[], rows: Array<Record<string, unknown>>) => {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const csv = [headers.join(";"), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
const webStickyHeaderStyle =
  Platform.OS === "web"
    ? ({ top: 0, zIndex: 5, position: "sticky", boxShadow: "0 1px 0 rgba(0,0,0,0.03)" } as any)
    : null;
const compareProf = (a: ProfRow, b: ProfRow, sort: { key: ProfSortKey; dir: SortDir }) => {
  const mult = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome": return compareStr(a.nome, b.nome) * mult;
    case "pacientes": return (a.pacientes - b.pacientes) * mult;
    case "ativos": return (a.ativos - b.ativos) * mult;
    case "ultimoAcesso": return compareDateStr(a.ultimoAcesso, b.ultimoAcesso) * mult;
    default: return 0;
  }
};
const comparePac = (a: PacRow, b: PacRow, sort: { key: PacSortKey; dir: SortDir }) => {
  const mult = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome": return compareStr(a.nome, b.nome) * mult;
    case "profissionalNome": return compareStr(a.profissionalNome, b.profissionalNome) * mult;
    case "status": return compareStr(a.status, b.status) * mult;
    case "ultimoCheckin": return compareDateStr(a.ultimoCheckin, b.ultimoCheckin) * mult;
    default: return 0;
  }
};
const computeAccountHealthScore = (prof: ProfRow, patients: PacRow[]): AccountHealthScore => {
  let score = 100;
  const reasons: string[] = [];
  const total = Math.max(0, prof.pacientes);
  const active = Math.max(0, prof.ativos);
  const activeRatio = total > 0 ? active / total : 0;
  const riskCount = patients.filter((p) => p.status === "RISCO").length;
  const riskRatio = patients.length > 0 ? riskCount / patients.length : 0;

  if (total === 0) {
    score -= 35;
    reasons.push("sem pacientes");
  }
  if (activeRatio < 0.5) {
    score -= 20;
    reasons.push("baixa ativação");
  } else if (activeRatio < 0.75) {
    score -= 10;
    reasons.push("ativação parcial");
  }
  if (prof.adesao < 50) {
    score -= 20;
    reasons.push("adesão média baixa");
  } else if (prof.adesao < 70) {
    score -= 10;
    reasons.push("adesão moderada");
  }
  if (riskRatio >= 0.4 && riskCount > 0) {
    score -= 20;
    reasons.push("muitos pacientes em risco");
  } else if (riskRatio >= 0.2 && riskCount > 0) {
    score -= 10;
    reasons.push("pacientes em atenção");
  }
  if (active === 0 && total > 0) {
    score -= 15;
    reasons.push("sem pacientes ativos");
  }

  score = Math.max(0, Math.min(100, score));
  const status: AccountHealthStatus =
    score >= 75 ? "HEALTHY" : score >= 50 ? "ATTENTION" : "RISK";

  let nextAction = "Acompanhar carteira";
  if (status === "RISK") nextAction = "Fazer contato e plano de reativação";
  else if (reasons.some((r) => r.includes("adesão"))) nextAction = "Reforçar adesão dos pacientes";
  else if (reasons.some((r) => r.includes("ativação"))) nextAction = "Ativar pacientes e revisar rotina";
  else if (reasons.some((r) => r.includes("risco") || r.includes("atenção"))) nextAction = "Priorizar pacientes em risco";

  return {
    score,
    status,
    reasons: reasons.length ? reasons.slice(0, 3) : ["conta estável"],
    nextAction,
  };
};
const accountHealthStatusLabel = (status?: AccountHealthStatus) => {
  if (status === "HEALTHY") return "Conta saudável";
  if (status === "ATTENTION") return "Atenção";
  if (status === "RISK") return "Risco";
  return "";
};
const automationHistoryActionLabel = (action: CrmAutomationHistoryItem["action"]) => {
  if (action === "EXECUTED") return "Executada";
  if (action === "DISMISSED") return "Dispensada";
  return "Reset";
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  content: {
    padding: Platform.OS === "web" ? SPACING.lg : SPACING.base,
    gap: Platform.OS === "web" ? SPACING.lg : SPACING.base,
    paddingBottom: SPACING.xl,
  },
  focusRing: {
    borderColor: COLORS.primary + "88",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: Platform.OS === "web" ? SPACING.lg : SPACING.base,
  },
  healthKpiBlock: {
    marginTop: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.primary + "14",
    borderRadius: 12,
    backgroundColor: COLORS.primary + "05",
    paddingVertical: Platform.OS === "web" ? SPACING.base : SPACING.sm,
    paddingHorizontal: Platform.OS === "web" ? SPACING.base : SPACING.sm,
  },
  loading: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, padding: 16, alignItems: "center" },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  split: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Platform.OS === "web" ? SPACING.lg : SPACING.sm,
    alignItems: "flex-start",
  },
  pane: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 360 : 280,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.base,
  },
  chartPane: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 320 : 260,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.sm,
  },
  chartTitle: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 12,
  },
  chartWrap: { gap: 8 },
  chartRow: { gap: 4 },
  chartHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartLabel: { color: "#5F6368", fontSize: 11, fontWeight: "700" },
  chartValue: { color: COLORS.textPrimary, fontSize: 11, fontWeight: "800" },
  chartTrack: { height: 8, borderRadius: 999, backgroundColor: COLORS.gray100, overflow: "hidden" },
  chartFill: { height: 8, borderRadius: 999 },
  detailPane: { flexGrow: 0, flexBasis: Platform.OS === "web" ? 420 : 360 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.textPrimary },
  big: { fontSize: FONTS.sizes.base, fontWeight: "800", color: COLORS.textPrimary },
  sub: { color: "#5F6368", marginTop: 6, fontSize: 13, lineHeight: 18 },
  muted: { color: "#5F6368", fontSize: 12, lineHeight: 17 },
  section: {
    fontSize: FONTS.sizes.base,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  search: {
    minWidth: Platform.OS === "web" ? 340 : 280,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    backgroundColor: "#FBFCFE",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  filterInput: {
    minWidth: 128,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  panelActionsRow: {
    marginTop: SPACING.sm,
  },
  entityHeader: {
    marginTop: 2,
    marginBottom: SPACING.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  entityHeaderText: {
    flex: 1,
    minWidth: 180,
  },
  entityName: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: FONTS.sizes.lg,
    lineHeight: 30,
  },
  entityMeta: {
    color: "#5F6368",
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
  },
  entityHeaderAction: {
    minWidth: 170,
  },
  panelFormTitle: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  panelTabsRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  panelMetricsRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  panelPrimaryActions: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  panelActionBtn: {
    minWidth: 150,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  metric: {
    minWidth: 126,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    backgroundColor: "#FBFCFE",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  metricInteractive: { borderColor: COLORS.primary + "33" },
  metricValue: {
    fontWeight: "800",
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 20,
  },
  metricLabel: {
    fontSize: 11,
    color: "#5F6368",
    marginTop: 3,
    lineHeight: 14,
  },
  metricMini: {
    minWidth: 112,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    backgroundColor: "#FBFCFE",
    paddingVertical: 10,
    paddingHorizontal: 11,
  },
  metricMiniValue: {
    fontWeight: "800",
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 17,
  },
  metricMiniLabel: {
    fontSize: 10,
    color: "#5F6368",
    marginTop: 3,
    lineHeight: 13,
  },
  kpiGrid: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  kpiCard: {
    minWidth: Platform.OS === "web" ? 128 : 112,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#FBFCFE",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  kpiValue: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 18,
  },
  kpiLabel: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  auditLogItem: { marginTop: 10, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#FBFCFE", padding: 12, flexDirection: "row", gap: 10, alignItems: "center" },
  automationItem: { marginTop: 10, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#FBFCFE", padding: 12, flexDirection: "row", gap: 10, alignItems: "center" },
  automationHistoryItem: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: COLORS.white, padding: 12 },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  subtleActionText: { color: "#5F6368", fontSize: 12, fontWeight: "600" },
  disclaimerText: { color: "#5F6368", fontSize: 11, lineHeight: 16, marginTop: 8 },
  reasonTag: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5 },
  reasonTagText: { color: "#5F6368", fontSize: 11, fontWeight: "700" },
  insightsRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  insightCard: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 240 : 220,
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: Platform.OS === "web" ? SPACING.sm : SPACING.xs,
  },
  insightCardPressed: {
    opacity: 0.9,
    borderColor: COLORS.primary + "55",
  },
  insightLabel: {
    color: "#5F6368",
    fontSize: 11,
    fontWeight: "700",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insightTitle: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  insightValue: {
    marginTop: 2,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  insightSubValue: {
    marginTop: 2,
    color: "#5F6368",
    fontSize: 11,
    fontWeight: "600",
  },
  insightMetaRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  insightHint: {
    color: "#5F6368",
    fontSize: 11,
    fontWeight: "600",
  },
  insightHintRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  emptyPhysicalExamCallout: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    backgroundColor: COLORS.warning + "12",
    borderRadius: 12,
    padding: SPACING.sm,
  },
  coverageRow: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  coverageActionRow: {
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.xs,
  },
  coverageBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coverageBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  coverageHigh: {
    borderColor: COLORS.success + "55",
    backgroundColor: COLORS.success + "12",
  },
  coverageHighText: {
    color: COLORS.success,
  },
  coverageMedium: {
    borderColor: COLORS.warning + "55",
    backgroundColor: COLORS.warning + "12",
  },
  coverageMediumText: {
    color: COLORS.warning,
  },
  coverageLow: {
    borderColor: COLORS.error + "55",
    backgroundColor: COLORS.error + "12",
  },
  coverageLowText: {
    color: COLORS.error,
  },
  topListRow: {
    marginTop: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topListLabelWrap: {
    flex: 1,
    gap: 2,
  },
  topListLabel: {
    color: "#5F6368",
    fontSize: 12,
    fontWeight: "600",
  },
  topListDetail: {
    color: "#5F6368",
    fontSize: 10,
    fontWeight: "600",
  },
  topListDetailRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sampleBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sampleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  sampleBadgeHigh: {
    borderColor: COLORS.success + "55",
    backgroundColor: COLORS.success + "12",
  },
  sampleBadgeHighText: {
    color: COLORS.success,
  },
  sampleBadgeMedium: {
    borderColor: COLORS.warning + "55",
    backgroundColor: COLORS.warning + "12",
  },
  sampleBadgeMediumText: {
    color: COLORS.warning,
  },
  sampleBadgeLow: {
    borderColor: COLORS.error + "55",
    backgroundColor: COLORS.error + "12",
  },
  sampleBadgeLowText: {
    color: COLORS.error,
  },
  topListValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  sampleInfoBox: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  sampleInfoText: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  sampleInfoMuted: {
    marginTop: 4,
    color: "#5F6368",
    fontSize: 11,
  },
  tab: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    backgroundColor: COLORS.white,
  },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" }, tabText: { color: "#5F6368", fontWeight: "700", fontSize: 12 }, tabTextActive: { color: COLORS.primary },
  miniTab: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 36,
    backgroundColor: COLORS.white,
  },
  miniTabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  miniTabText: { color: "#5F6368", fontWeight: "700", fontSize: 11 },
  miniTabTextActive: { color: COLORS.primary },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    backgroundColor: COLORS.white,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" }, chipText: { color: "#5F6368", fontWeight: "700", fontSize: 11 }, chipTextActive: { color: COLORS.primary },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    backgroundColor: "#FBFCFE",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  action: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: "center",
  },
  actionSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 17,
  },
  actionTextSecondary: {
    color: "#5F6368",
  },
  small: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, minHeight: 36, backgroundColor: COLORS.white }, smallDanger: { borderColor: "#efb0b0", backgroundColor: "#fff5f5" }, smallText: { fontSize: 11, color: "#5F6368", fontWeight: "700" }, smallTextDanger: { color: "#b52828" },
  head: { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#F7F9FC", paddingHorizontal: 12, paddingVertical: 9, minHeight: 42 }, headText: { flex: 1, fontSize: 11, fontWeight: "700", color: "#5F6368" },
  headBtn: { flex: 1 },
  headTextActive: { color: COLORS.primary },
  row: { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#FBFCFE", paddingHorizontal: 12, paddingVertical: 11, marginTop: 8, minHeight: 46 },
  rowCell: { flex: 1, fontSize: 11, color: "#5F6368" }, rowCellPrimary: { color: COLORS.textPrimary, fontWeight: "700" }, selected: { borderColor: COLORS.primary + "55", backgroundColor: COLORS.primary + "08" },
  pagination: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12 },
  paginationText: { color: "#5F6368", fontSize: 11, fontWeight: "700" },
  item: { marginTop: 10, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#FBFCFE", padding: 12, flexDirection: "row", gap: 8, alignItems: "center" },
  line: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    backgroundColor: "#FBFCFE",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lineTitle: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },
  lineSub: {
    color: "#5F6368",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  kanbanWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, kanbanCol: { flex: 1, minWidth: 240, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: "#F8FAFD", padding: 12 }, kanbanCard: { marginTop: 10, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, backgroundColor: COLORS.white, padding: 12 },
  blocked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
});
