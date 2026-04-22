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
  getCrmLeads,
  getCrmPipelineSummary,
  getCrmTasks,
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
  type CrmTask,
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
  const [crmProfessionals, setCrmProfessionals] = useState<CrmAdminProfessional[]>([]);
  const [crmPatients, setCrmPatients] = useState<CrmAdminPatient[]>([]);
  const [crmAuditLogs, setCrmAuditLogs] = useState<CrmAdminAuditLog[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
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
  const [semEvolucaoDias, setSemEvolucaoDias] = useState(10);
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
        semEvolucaoDias: number;
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
        setWindowDays(Math.min(30, Math.max(3, Math.round(prefs.windowDays))));
      }
      if (typeof prefs.semEvolucaoDias === "number" && prefs.semEvolucaoDias > 0) {
        setSemEvolucaoDias(Math.min(60, Math.max(3, Math.round(prefs.semEvolucaoDias))));
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
          semEvolucaoDias,
          taskBucketFilter,
        }),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [tab, query, stageFilter, profSort, pacSort, profActiveFilter, profAccountStatusFilter, profEmotionalConcentrationFilter, pacLinkFilter, pacStatusFilter, pacEmotionalFilter, profEspecialidadeFilter, pacCidadeFilter, pacUfFilter, windowDays, semEvolucaoDias, taskBucketFilter]);

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
      const [p, clinical, auditPaged, profsPaged, pacsPaged, ls, ts] = await Promise.all([
        getCrmPipelineSummary(),
        getCrmClinicalDashboardSummary({ windowDays, semEvolucaoDias }),
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
          ? "API offline ou indisponível (backend)."
          : `Falha ao carregar CRM: ${parsed.message}`;
      showToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, [isMaster, isWeb, query, stageFilter, profPage, pacPage, profActiveFilter, pacLinkFilter, profEspecialidadeFilter, pacCidadeFilter, pacUfFilter, includeSensitiveData, sensitiveReason, windowDays, semEvolucaoDias, showToast]);

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
      showToast({ type: "error", message: `Falha ao carregar interações: ${parsed.message}` });
    }
    finally { setLoadingInteractions(false); }
  }, [includeSensitiveData, sensitiveReason, showToast]);

  useEffect(() => { loadMain().catch(() => undefined); }, [loadMain]);
  useEffect(() => { loadInteractions(selectedLeadId).catch(() => undefined); }, [loadInteractions, selectedLeadId]);

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
          profissionalNome: p.profissionalNome || "Sem vínculo",
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
        profissionalNome: p?.nome || "Sem vínculo",
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
      { label: "Novo", value: clinicalSummary?.pipeline.novoPaciente || 0, color: "#6B7280" },
      { label: "Vínculo", value: clinicalSummary?.pipeline.aguardandoVinculo || 0, color: "#0EA5E9" },
      { label: "Anamnese", value: clinicalSummary?.pipeline.anamnesePendente || 0, color: "#F59E0B" },
      { label: "Tratamento", value: clinicalSummary?.pipeline.emTratamento || 0, color: "#10B981" },
      { label: "Alta", value: clinicalSummary?.pipeline.alta || 0, color: "#22C55E" },
    ],
    [clinicalSummary],
  );
  const clinicalAlertsChartData = useMemo(
    () => [
      { label: "Sem check-in", value: clinicalSummary?.alertas.semCheckin || 0, color: "#F97316" },
      { label: "Sem evolução", value: clinicalSummary?.alertas.semEvolucao || 0, color: "#EF4444" },
      { label: "Anamnese pendente", value: clinicalSummary?.alertas.anamnesePendente || 0, color: "#F59E0B" },
      { label: "Convite pendente", value: clinicalSummary?.alertas.conviteNaoAceito || 0, color: "#EAB308" },
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
    if (!leadForm.nome.trim()) return showToast({ type: "error", message: "Informe o nome do lead." });
    const payload = { nome: leadForm.nome.trim(), empresa: leadForm.empresa.trim() || undefined, canal: leadForm.canal, stage: leadForm.stage, valorPotencial: Number((leadForm.valor || "0").replace(",", ".")) || 0 };
    try {
      if (leadForm.id) await updateCrmLead(leadForm.id, payload);
      else { const created = await createCrmLead(payload); setSelectedLeadId(created.id); }
      resetLeadForm(); await loadMain(); showToast({ type: "success", message: t("crm.messages.leadSaved") });
    } catch { showToast({ type: "error", message: t("errors.saveFailed") }); }
  };

  const saveTask = async () => {
    if (!taskForm.titulo.trim()) return showToast({ type: "error", message: "Informe o título da tarefa." });
    try {
      if (taskForm.id) await updateCrmTask(taskForm.id, { titulo: taskForm.titulo.trim(), leadId: taskForm.leadId.trim() || null, dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null });
      else await createCrmTask({ titulo: taskForm.titulo.trim(), leadId: taskForm.leadId.trim() || undefined, dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined });
      resetTaskForm(); await loadMain(); showToast({ type: "success", message: t("crm.messages.taskSaved") });
    } catch { showToast({ type: "error", message: t("errors.saveFailed") }); }
  };

  const saveInteraction = async () => {
    if (!selectedLeadId) return showToast({ type: "error", message: t("crm.messages.selectLead") });
    if (!interactionForm.resumo.trim()) return showToast({ type: "error", message: "Informe o resumo." });
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
            profissional: p.profissionalNome || "Sem vínculo",
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

  if (!isWeb) return <Blocked icon="desktop-outline" title="CRM somente web" subtitle="Use no navegador." />;
  if (!isMaster) return <Blocked icon="lock-closed-outline" title="Acesso restrito" subtitle="Somente ADM master." />;

  const handleToggleSensitiveData = () => {
    if (includeSensitiveData) {
      setIncludeSensitiveData(false);
      setSensitiveReason("");
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const typedReason = window.prompt(
        "Informe o motivo para visualizar dados sensíveis (mínimo 8 caracteres):",
        "",
      );
      if (!typedReason) return;
      const normalizedReason = typedReason.trim();
      if (normalizedReason.length < 8) {
        showToast({
          type: "error",
          message: "Informe um motivo com pelo menos 8 caracteres.",
        });
        return;
      }
      setSensitiveReason(normalizedReason);
      setIncludeSensitiveData(true);
      return;
    }
    Alert.alert(
      "Exibir dados sensíveis",
      "Esta ação exibirá dados pessoais detalhados. Continue apenas se necessário para análise administrativa.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Exibir", onPress: () => setIncludeSensitiveData(true) },
      ],
    );
  };

  const saveAdminProfessional = async () => {
    if (!selectedProfId) return;
    if (!profEditForm.nome.trim()) {
      showToast({ type: "error", message: "Informe o nome do profissional." });
      return;
    }
    if (!profEditForm.email.trim()) {
      showToast({ type: "error", message: "Informe o e-mail do profissional." });
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
      showToast({ type: "success", message: "Profissional atualizado com sucesso." });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || "Falha ao atualizar profissional." });
    } finally {
      setSavingAdminEntity(false);
    }
  };

  const saveAdminPatient = async () => {
    if (!selectedPacId) return;
    if (!pacEditForm.nomeCompleto.trim()) {
      showToast({ type: "error", message: "Informe o nome do paciente." });
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
      showToast({ type: "success", message: "Paciente atualizado com sucesso." });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || "Falha ao atualizar paciente." });
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
              <Text style={styles.title}>CRM Administrador Master</Text>
              <Text style={styles.sub}>Clientes, pacientes, funil, tarefas e interações (somente web).</Text>
            </View>
            <TextInput style={styles.search} placeholder="Busca global" value={query} onChangeText={setQuery} onSubmitEditing={() => loadMain().catch(() => undefined)} />
          </View>
          <View style={styles.wrapRow}>
            <Chip
              label={includeSensitiveData ? "Dados sensíveis: visíveis" : "Dados sensíveis: ocultos"}
              active={includeSensitiveData}
              onPress={handleToggleSensitiveData}
            />
            <Text style={styles.muted}>
              {includeSensitiveData
                ? "Exibição detalhada habilitada para análise pontual."
                : "Dados mascarados por padrão (LGPD)."}
            </Text>
            {includeSensitiveData ? (
              <Text style={styles.muted}>
                Sessão sensível ativa por até 5 minutos.
              </Text>
            ) : null}
          </View>
          <View style={styles.wrapRow}>
            <Metric
              label="Profissionais"
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
              label="Pacientes"
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
              label="Ativos"
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
              label="Risco"
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
              label="Emocional"
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
              <Text style={styles.section}>Dashboard operacional clínico</Text>
              <Text style={styles.muted}>Execução do cuidado ({windowDays} dias)</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label="Em atenção"
                value={String(clinicalSummary?.metricas.pacientesEmAtencao || 0)}
                onPress={() => {
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                }}
              />
              <Metric
                label="Sem check-in"
                value={String(clinicalSummary?.alertas.semCheckin || 0)}
              />
              <Metric
                label={`Sem evolução > ${semEvolucaoDias}d`}
                value={String(clinicalSummary?.alertas.semEvolucao || 0)}
              />
              <Metric
                label="Anamnese pendente"
                value={String(clinicalSummary?.alertas.anamnesePendente || 0)}
              />
              <Metric
                label="Convite não aceito"
                value={String(clinicalSummary?.alertas.conviteNaoAceito || 0)}
              />
              <Metric
                label="Abandono"
                value={`${clinicalSummary?.metricas.abandonoRate ?? 0}%`}
              />
              <Metric
                label="Conclusão de plano"
                value={`${clinicalSummary?.metricas.conclusaoPlanoRate ?? 0}%`}
              />
            </View>
          </View>
          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>Filtros globais do dashboard</Text>
              <Action title="Atualizar" secondary onPress={() => loadMain().catch(() => undefined)} />
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.muted}>Janela clínica:</Text>
              {[7, 14, 30].map((days) => (
                <Chip
                  key={`window-${days}`}
                  label={`${days} dias`}
                  active={windowDays === days}
                  onPress={() => setWindowDays(days)}
                />
              ))}
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.muted}>Sem evolução:</Text>
              {[7, 10, 14].map((days) => (
                <Chip
                  key={`sem-evo-${days}`}
                  label={`>${days}d`}
                  active={semEvolucaoDias === days}
                  onPress={() => setSemEvolucaoDias(days)}
                />
              ))}
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>Pipeline clínico (cuidado)</Text>
              <Text style={styles.muted}>Etapas assistenciais</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label="Novo paciente"
                value={String(clinicalSummary?.pipeline.novoPaciente || 0)}
              />
              <Metric
                label="Aguardando vínculo"
                value={String(clinicalSummary?.pipeline.aguardandoVinculo || 0)}
              />
              <Metric
                label="Anamnese pendente"
                value={String(clinicalSummary?.pipeline.anamnesePendente || 0)}
                onPress={() => {
                  setTab("PACIENTES");
                  setPacStatusFilter("RISCO");
                }}
              />
              <Metric
                label="Em tratamento"
                value={String(clinicalSummary?.pipeline.emTratamento || 0)}
              />
              <Metric
                label="Alta"
                value={String(clinicalSummary?.pipeline.alta || 0)}
              />
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>Métricas clínicas (execução)</Text>
              <Text style={styles.muted}>Tempo, conclusão e bloqueios</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label="Tempo médio anamnese"
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.ANAMNESE || 0)}
              />
              <Metric
                label="Tempo médio exame físico"
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.EXAME_FISICO || 0)}
              />
              <Metric
                label="Tempo médio evolução"
                value={formatDurationMs(clinicalSummary?.metricas.tempoMedioPorEtapaMs.EVOLUCAO || 0)}
              />
              <Metric
                label="Etapas concluídas"
                value={String(clinicalSummary?.metricas.completedTotal || 0)}
              />
              <Metric
                label="Etapas bloqueadas"
                value={String(clinicalSummary?.metricas.blockedTotal || 0)}
              />
            </View>
          </View>
          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>Gráficos clínicos e CRM</Text>
              <Text style={styles.muted}>Visualização executiva dos dados</Text>
            </View>
            <View style={styles.split}>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Pipeline clínico</Text>
                <BarChart items={clinicalPipelineChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Alertas clínicos</Text>
                <BarChart items={clinicalAlertsChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Tempo médio por etapa (min)</Text>
                <BarChart items={clinicalDurationChartData} />
              </View>
              <View style={styles.chartPane}>
                <Text style={styles.chartTitle}>Funil comercial (leads)</Text>
                <BarChart items={funnelStageChartData} />
              </View>
            </View>
          </View>

          <View style={styles.healthKpiBlock}>
            <View style={styles.topRow}>
              <Text style={styles.section}>Auditoria administrativa</Text>
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
              <Text style={styles.muted}>Contas por score</Text>
            </View>
            <View style={styles.wrapRow}>
              <Metric
                label="Contas em risco"
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
                label="Contas em atenção"
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
                label="Contas saudáveis"
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
                  <Chip label="Todos profissionais" active={profActiveFilter === "TODOS"} onPress={() => setProfActiveFilter("TODOS")} />
                  <Chip label="Somente ativos" active={profActiveFilter === "ATIVOS"} onPress={() => setProfActiveFilter("ATIVOS")} />
                  <Chip label="Conta: todas" active={profAccountStatusFilter === "TODOS"} onPress={() => setProfAccountStatusFilter("TODOS")} />
                  <Chip label="Saudável" active={profAccountStatusFilter === "HEALTHY"} onPress={() => setProfAccountStatusFilter("HEALTHY")} />
                  <Chip label="Atenção" active={profAccountStatusFilter === "ATTENTION"} onPress={() => setProfAccountStatusFilter("ATTENTION")} />
                  <Chip label="Risco" active={profAccountStatusFilter === "RISK"} onPress={() => setProfAccountStatusFilter("RISK")} />
                  <Chip label={t("crm.filters.profEmotionalAll")} active={profEmotionalConcentrationFilter === "TODOS"} onPress={() => setProfEmotionalConcentrationFilter("TODOS")} />
                  <Chip label={t("crm.filters.profEmotionalHighConcentration")} active={profEmotionalConcentrationFilter === "ALTA"} onPress={() => setProfEmotionalConcentrationFilter("ALTA")} />
                  <TextInput style={styles.filterInput} placeholder="Especialidade" value={profEspecialidadeFilter} onChangeText={setProfEspecialidadeFilter} />
                </>
              ) : null}
              {tab === "PACIENTES" ? (
                <>
                  <Chip label="Status: todos" active={pacStatusFilter === "TODOS"} onPress={() => setPacStatusFilter("TODOS")} />
                  <Chip label="Ativo" active={pacStatusFilter === "ATIVO"} onPress={() => setPacStatusFilter("ATIVO")} />
                  <Chip label="Risco" active={pacStatusFilter === "RISCO"} onPress={() => setPacStatusFilter("RISCO")} />
                  <Chip label={t("crm.filters.pacEmotionalAll")} active={pacEmotionalFilter === "TODOS"} onPress={() => setPacEmotionalFilter("TODOS")} />
                  <Chip label={t("crm.filters.pacEmotionalWithVulnerability")} active={pacEmotionalFilter === "EMOCIONAL"} onPress={() => setPacEmotionalFilter("EMOCIONAL")} />
                  <Chip label="Todos pacientes" active={pacLinkFilter === "TODOS"} onPress={() => setPacLinkFilter("TODOS")} />
                  <Chip label="Vinculados" active={pacLinkFilter === "VINCULADOS"} onPress={() => setPacLinkFilter("VINCULADOS")} />
                  <Chip label="Sem usuário" active={pacLinkFilter === "SEM_USUARIO"} onPress={() => setPacLinkFilter("SEM_USUARIO")} />
                  <TextInput style={styles.filterInput} placeholder="Cidade" value={pacCidadeFilter} onChangeText={setPacCidadeFilter} />
                  <TextInput style={[styles.filterInput, { width: 70 }]} placeholder="UF" maxLength={2} autoCapitalize="characters" value={pacUfFilter} onChangeText={setPacUfFilter} />
                </>
              ) : null}
              <Chip label="Todos" active={stageFilter === "TODOS"} onPress={() => setStageFilter("TODOS")} />
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
                <Action title="Exportar CSV" secondary onPress={() => exportCurrentTableCsv("PROFISSIONAIS")} />
                <Action title="Exportar tudo (filtro)" secondary onPress={() => exportAllFilteredCsv("PROFISSIONAIS")} />
              </View>
              <HeadSortable
                cols={[
                  { key: "nome", label: "Nome" },
                  { key: "score", label: "Score" },
                  { key: "vulnEmocional", label: t("crm.labels.emotionalVulnerabilityShort") },
                  { key: "pacientes", label: "Pacientes" },
                  { key: "ativos", label: "Ativos" },
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
              <Pagination page={profPage} totalPages={profTotalPages} onChange={setProfPage} />
            </View>
            <View style={[styles.pane, styles.detailPane]}>
              <Text style={styles.section}>{t("crm.sections.professionalPanel")}</Text>
              {selectedProf ? (
                <>
                  <Text style={styles.big}>{selectedProf.nome}</Text>
                  <Text style={styles.sub}>{selectedProf.cidade}</Text>
                  <View style={styles.wrapRow}>
                    <Action
                      title={editProfOpen ? "Fechar edição" : "Editar dados"}
                      secondary
                      onPress={() => {
                        if (!editProfOpen) resetProfEditForm();
                        setEditProfOpen((prev) => !prev);
                      }}
                    />
                  </View>
                  {editProfOpen ? (
                    <View style={styles.line}>
                      <Text style={styles.lineTitle}>Editar dados do profissional</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        value={profEditForm.nome}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, nome: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        value={profEditForm.email}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, email: v }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Especialidade"
                        value={profEditForm.especialidade}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, especialidade: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Registro profissional"
                        value={profEditForm.registroProf}
                        onChangeText={(v) => setProfEditForm((p) => ({ ...p, registroProf: v }))}
                      />
                      <View style={styles.wrapRow}>
                        <Chip
                          label="Ativo"
                          active={profEditForm.ativo}
                          onPress={() => setProfEditForm((p) => ({ ...p, ativo: true }))}
                        />
                        <Chip
                          label="Inativo"
                          active={!profEditForm.ativo}
                          onPress={() => setProfEditForm((p) => ({ ...p, ativo: false }))}
                        />
                      </View>
                      <View style={styles.wrapRow}>
                        <Action
                          title={savingAdminEntity ? "Salvando..." : "Salvar alterações"}
                          onPress={saveAdminProfessional}
                        />
                        <Action
                          title="Cancelar"
                          secondary
                          onPress={() => {
                            resetProfEditForm();
                            setEditProfOpen(false);
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.wrapRow}>
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
                      <Text style={styles.lineTitle}>Prioridade agora</Text>
                      <Text style={styles.lineSub}>{selectedProfAccountScore.nextAction}</Text>
                      {selectedProfEmotionalConcentration && selectedProfEmotionalConcentration.total > 0 ? (
                        <Text style={styles.lineSub}>
                          Vulnerabilidade emocional: {selectedProfEmotionalConcentration.vulneraveis}/{selectedProfEmotionalConcentration.total} ({selectedProfEmotionalConcentration.percentual}%).
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
                <Action title="Exportar CSV" secondary onPress={() => exportCurrentTableCsv("PACIENTES")} />
                <Action title="Exportar tudo (filtro)" secondary onPress={() => exportAllFilteredCsv("PACIENTES")} />
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
              <Pagination page={pacPage} totalPages={pacTotalPages} onChange={setPacPage} />
            </View>
            <View style={[styles.pane, styles.detailPane]}>
              <Text style={styles.section}>{t("crm.sections.patientPanel")}</Text>
              {selectedPac ? (
                <>
                  <Text style={styles.big}>{selectedPac.nome}</Text>
                  <Text style={styles.sub}>{t("crm.labels.professional")}: {selectedPac.profissionalNome}</Text>
                  <View style={styles.wrapRow}>
                    <Action
                      title={editPacOpen ? "Fechar edição" : "Editar dados"}
                      secondary
                      onPress={() => {
                        if (!editPacOpen) resetPacEditForm();
                        setEditPacOpen((prev) => !prev);
                      }}
                    />
                  </View>
                  {editPacOpen ? (
                    <View style={styles.line}>
                      <Text style={styles.lineTitle}>Editar dados do paciente</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nome completo"
                        value={pacEditForm.nomeCompleto}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, nomeCompleto: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="CPF (11 dígitos)"
                        value={pacEditForm.cpf}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, cpf: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Data de nascimento (YYYY-MM-DD)"
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
                        placeholder="Profissão"
                        value={pacEditForm.profissao}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, profissao: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="WhatsApp"
                        value={pacEditForm.contatoWhatsapp}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoWhatsapp: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Telefone"
                        value={pacEditForm.contatoTelefone}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoTelefone: v.replace(/\D/g, "").slice(0, 11) }))}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        value={pacEditForm.contatoEmail}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, contatoEmail: v }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Cidade"
                        value={pacEditForm.enderecoCidade}
                        onChangeText={(v) => setPacEditForm((p) => ({ ...p, enderecoCidade: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="UF"
                        value={pacEditForm.enderecoUf}
                        onChangeText={(v) =>
                          setPacEditForm((p) => ({ ...p, enderecoUf: v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) }))
                        }
                      />
                      <View style={styles.wrapRow}>
                        <Chip
                          label="Ativo"
                          active={pacEditForm.ativo}
                          onPress={() => setPacEditForm((p) => ({ ...p, ativo: true }))}
                        />
                        <Chip
                          label="Inativo"
                          active={!pacEditForm.ativo}
                          onPress={() => setPacEditForm((p) => ({ ...p, ativo: false }))}
                        />
                      </View>
                      <View style={styles.wrapRow}>
                        <Action
                          title={savingAdminEntity ? "Salvando..." : "Salvar alterações"}
                          onPress={saveAdminPatient}
                        />
                        <Action
                          title="Cancelar"
                          secondary
                          onPress={() => {
                            resetPacEditForm();
                            setEditPacOpen(false);
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.wrapRow}>
                    <MiniTab label={t("crm.labels.summary")} active={pacDetailTab === "RESUMO"} onPress={() => setPacDetailTab("RESUMO")} />
                    <MiniTab label={t("crm.labels.contact")} active={pacDetailTab === "CONTATO"} onPress={() => setPacDetailTab("CONTATO")} />
                    <MiniTab label={t("crm.labels.link")} active={pacDetailTab === "VINCULO"} onPress={() => setPacDetailTab("VINCULO")} />
                  </View>
                  <View style={styles.wrapRow}>
                    <MetricMini label={t("crm.labels.status")} value={selectedPac.status} />
                    <MetricMini label={t("crm.labels.adherence")} value={`${selectedPac.adesao}%`} />
                    <MetricMini label={t("crm.labels.channel")} value={selectedPac.lead.canal} />
                    <MetricMini label={t("crm.labels.stage")} value={stageLabel[selectedPac.lead.stage]} />
                    {selectedPac.emocionalVulneravel ? <MetricMini label={t("crm.labels.emotional")} value={t("crm.badges.emotionalAttention")} /> : null}
                  </View>
                  {selectedPac.emocionalVulneravel && selectedPac.emocionalResumo ? (
                    <View style={styles.line}>
                      <Text style={styles.lineTitle}>Vulnerabilidade emocional</Text>
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
                    <View style={styles.wrapRow}>
                      <Action title="Abrir no funil" onPress={() => { setSelectedLeadId(selectedPac.lead.id); setTab("LEADS"); }} />
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
                  <Action title="Exportar CSV" secondary onPress={() => exportLeadsCsv(false)} />
                  <Action title="Exportar todos os leads" secondary onPress={() => exportLeadsCsv(true)} />
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
                <TextInput style={styles.input} placeholder="Nome" value={leadForm.nome} onChangeText={(v) => setLeadForm((p) => ({ ...p, nome: v }))} />
                <TextInput style={styles.input} placeholder="Empresa" value={leadForm.empresa} onChangeText={(v) => setLeadForm((p) => ({ ...p, empresa: v }))} />
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
              <TextInput style={styles.input} placeholder="Título" value={taskForm.titulo} onChangeText={(v) => setTaskForm((p) => ({ ...p, titulo: v }))} />
              <TextInput style={styles.input} placeholder="ID do lead (opcional)" value={taskForm.leadId} onChangeText={(v) => setTaskForm((p) => ({ ...p, leadId: v }))} />
              <TextInput style={styles.input} placeholder="Prazo (2026-02-22T15:30)" value={taskForm.dueAt} onChangeText={(v) => setTaskForm((p) => ({ ...p, dueAt: v }))} />
              <View style={styles.wrapRow}><Action title={taskForm.id ? t("crm.forms.saveTask") : t("crm.forms.createTask")} onPress={saveTask} /><Action title={t("crm.actions.clear")} secondary onPress={resetTaskForm} /></View>
            </View>
            <View style={styles.pane}>
              <View style={styles.topRow}>
                <Text style={styles.section}>{t("crm.sections.taskList")}</Text>
                <Action title="Exportar CSV" secondary onPress={exportTasksCsv} />
              </View>
              <View style={styles.wrapRow}>
                <MetricMini label="Todas" value={String(tasks.length)} />
                <MetricMini label="Atrasadas" value={String(taskBuckets.atrasadas.length)} />
                <MetricMini label="Hoje" value={String(taskBuckets.hoje.length)} />
                <MetricMini label="Próximas 7d" value={String(taskBuckets.proximas.length)} />
                <MetricMini label="Concluídas" value={String(taskBuckets.concluidas.length)} />
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.chartTitle}>Demonstrativo de tarefas</Text>
                <BarChart items={taskStatusChartData} />
              </View>
              <View style={styles.wrapRow}>
                <Chip label="Todas" active={taskBucketFilter === "TODAS"} onPress={() => setTaskBucketFilter("TODAS")} />
                <Chip label="Atrasadas" active={taskBucketFilter === "ATRASADAS"} onPress={() => setTaskBucketFilter("ATRASADAS")} />
                <Chip label="Hoje" active={taskBucketFilter === "HOJE"} onPress={() => setTaskBucketFilter("HOJE")} />
                <Chip label="Próximas 7d" active={taskBucketFilter === "PROXIMAS"} onPress={() => setTaskBucketFilter("PROXIMAS")} />
                <Chip label="Concluídas" active={taskBucketFilter === "CONCLUIDAS"} onPress={() => setTaskBucketFilter("CONCLUIDAS")} />
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
                <Action title="Exportar CSV" secondary onPress={exportInteractionsCsv} />
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
  return <Pressable onPress={onPress}>{content}</Pressable>;
}
function MetricMini({ label, value }: { label: string; value: string }) { return <View style={styles.metricMini}><Text style={styles.metricMiniValue}>{value}</Text><Text style={styles.metricMiniLabel}>{label}</Text></View>; }
function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>; }
function MiniTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.miniTab, active && styles.miniTabActive]}><Text style={[styles.miniTabText, active && styles.miniTabTextActive]}>{label}</Text></Pressable>; }
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function Action({ title, onPress, secondary }: { title: string; onPress: () => void; secondary?: boolean }) { return <Pressable onPress={onPress} style={[styles.action, secondary && styles.actionSecondary]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{title}</Text></Pressable>; }
function SmallBtn({ title, onPress, danger }: { title: string; onPress: () => void; danger?: boolean }) { return <Pressable onPress={onPress} style={[styles.small, danger && styles.smallDanger]}><Text style={[styles.smallText, danger && styles.smallTextDanger]}>{title}</Text></Pressable>; }
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
function Row({ cols, onPress, selected }: { cols: string[]; onPress: () => void; selected?: boolean }) { return <Pressable onPress={onPress} style={[styles.row, selected && styles.selected]}>{cols.map((c, i) => <Text key={`${i}-${c}`} style={[styles.rowCell, i===0 && styles.rowCellPrimary]}>{c}</Text>)}</Pressable>; }
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
          <Pressable key={c.key} onPress={() => onSortChange(c.key)} style={styles.headBtn}>
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
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <SmallBtn title="Anterior" onPress={() => onChange(Math.max(1, page - 1))} />
      <Text style={styles.paginationText}>
        Página {page} de {totalPages}
      </Text>
      <SmallBtn title="Próxima" onPress={() => onChange(Math.min(totalPages, page + 1))} />
    </View>
  );
}
function BarChart({
  items,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  return (
    <View style={styles.chartWrap}>
      {items.map((item) => {
        const pct = Math.max(0, Math.min(100, Math.round(((item.value || 0) / max) * 100)));
        return (
          <View key={item.label} style={styles.chartRow}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={styles.chartValue}>{item.value}</Text>
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
  content: { padding: SPACING.base, gap: SPACING.base, paddingBottom: SPACING.xl },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray100, padding: SPACING.base },
  healthKpiBlock: { marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + "18", borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + "05", padding: SPACING.sm },
  loading: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 12, padding: 16, alignItems: "center" },
  topRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  split: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.base, alignItems: "flex-start" },
  pane: { flex: 1, minWidth: 360, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray100, padding: SPACING.base },
  chartPane: { flex: 1, minWidth: 320, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray100, padding: SPACING.sm },
  chartTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 12, marginBottom: 8 },
  chartWrap: { gap: 8 },
  chartRow: { gap: 4 },
  chartHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700" },
  chartValue: { color: COLORS.textPrimary, fontSize: 11, fontWeight: "800" },
  chartTrack: { height: 8, borderRadius: 999, backgroundColor: COLORS.gray100, overflow: "hidden" },
  chartFill: { height: 8, borderRadius: 999 },
  detailPane: { flexGrow: 0, flexBasis: Platform.OS === "web" ? 420 : 360 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: "800", color: COLORS.textPrimary },
  big: { fontSize: FONTS.sizes.base, fontWeight: "800", color: COLORS.textPrimary },
  sub: { color: COLORS.textSecondary, marginTop: 4 },
  muted: { color: COLORS.textSecondary, fontSize: 12 },
  section: { fontSize: FONTS.sizes.base, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  search: { minWidth: 280, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", paddingHorizontal: 10, paddingVertical: 8, color: COLORS.textPrimary },
  filterInput: { minWidth: 120, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5, color: COLORS.textPrimary, fontSize: 12 },
  metric: { minWidth: 120, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 10 },
  metricInteractive: { borderColor: COLORS.primary + "33" },
  metricValue: { fontWeight: "800", color: COLORS.textPrimary }, metricLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  metricMini: { minWidth: 100, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 8 },
  metricMiniValue: { fontWeight: "800", color: COLORS.textPrimary, fontSize: 12 }, metricMiniLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  kpiGrid: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  kpiCard: {
    minWidth: 110,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 10,
    backgroundColor: "#FBFCFE",
    paddingVertical: 10,
    paddingHorizontal: 10,
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
  auditLogItem: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 10, flexDirection: "row", gap: 10, alignItems: "center" },
  automationItem: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 10, flexDirection: "row", gap: 10, alignItems: "center" },
  automationHistoryItem: { marginTop: 6, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: COLORS.white, padding: 10 },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  subtleActionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  disclaimerText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 8 },
  reasonTag: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5 },
  reasonTagText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700" },
  tab: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.white },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" }, tabText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 12 }, tabTextActive: { color: COLORS.primary },
  miniTab: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.white },
  miniTabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  miniTabText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 11 },
  miniTabTextActive: { color: COLORS.primary },
  chip: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.white },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" }, chipText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 11 }, chipTextActive: { color: COLORS.primary },
  input: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", paddingHorizontal: 10, paddingVertical: 8, color: COLORS.textPrimary },
  action: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, actionSecondary: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200 }, actionText: { color: COLORS.white, fontWeight: "700" }, actionTextSecondary: { color: COLORS.textSecondary },
  small: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.white }, smallDanger: { borderColor: "#efb0b0", backgroundColor: "#fff5f5" }, smallText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: "700" }, smallTextDanger: { color: "#b52828" },
  head: { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#F7F9FC", paddingHorizontal: 10, paddingVertical: 8 }, headText: { flex: 1, fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  headBtn: { flex: 1 },
  headTextActive: { color: COLORS.primary },
  row: { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", paddingHorizontal: 10, paddingVertical: 10, marginTop: 8 },
  rowCell: { flex: 1, fontSize: 11, color: COLORS.textSecondary }, rowCellPrimary: { color: COLORS.textPrimary, fontWeight: "700" }, selected: { borderColor: COLORS.primary + "55", backgroundColor: COLORS.primary + "08" },
  pagination: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 10 },
  paginationText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700" },
  item: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 10, flexDirection: "row", gap: 6, alignItems: "center" },
  line: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", padding: 10 }, lineTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 12 }, lineSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  kanbanWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, kanbanCol: { flex: 1, minWidth: 240, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#F8FAFD", padding: 10 }, kanbanCard: { marginTop: 8, borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: COLORS.white, padding: 10 },
  blocked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
});
