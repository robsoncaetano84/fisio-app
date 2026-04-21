// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// HOME SCREEN
// ==========================================
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, useToast } from "../components/ui";
import { useAuthStore } from "../stores/authStore";
import { usePacienteStore } from "../stores/pacienteStore";
import { useAnamneseStore } from "../stores/anamneseStore";
import {
  api,
  getAuditSummary,
  getClinicalFlowSummary,
  getOfflineCheckinQueueStats,
  getOpsHealthSummary,
  registerPushTokenIfNeeded,
  syncOfflineCheckins,
  trackEvent,
  getPatientCheckEngagementSummary,
  openQuickActionSelection,
  cachedGet,
} from "../services";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/theme";
import { AtividadeUpdate, RootStackParamList, UserRole } from "../types";
import { useLanguage } from "../i18n/LanguageProvider";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  onLongPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

function QuickAction({
  icon,
  title,
  subtitle,
  color,
  onPress,
  onLongPress,
  containerStyle,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, containerStyle]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color={COLORS.white} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

type HomeRiskActionCode =
  | "OPEN_ADHERENCE"
  | "OPEN_PATIENT_DETAILS"
  | "RECORD_EVOLUTION";

function StatCard({ value, label, icon, onPress }: StatCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.statCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { usuario, logout } = useAuthStore();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isProfessionalUser = usuario?.role !== UserRole.PACIENTE;
  const { pacientes, totalPacientes, fetchPacientes } = usePacienteStore();
  const [scopedTotalPacientes, setScopedTotalPacientes] = useState<number>(0);
  const { anamneses } = useAnamneseStore();
  const [attentionMap, setAttentionMap] = useState<
    Record<string, number | null>
  >({});
  const [updates, setUpdates] = useState<AtividadeUpdate[]>([]);
  const [lastSeenUpdatesAt, setLastSeenUpdatesAt] = useState<string | null>(
    null,
  );
  const [auditSummary, setAuditSummary] = useState<{
    total: number;
    byAction: {
      CHECKIN_OFFLINE_ENQUEUED: number;
      CHECKIN_OFFLINE_SYNCED: number;
      CHECKIN_OFFLINE_SYNC_FAILED: number;
      LAUDO_VALIDATED: number;
      LAUDO_REVALIDATION_REQUIRED: number;
      QUICK_MESSAGE_SENT: number;
    };
  } | null>(null);
  const [opsHealth, setOpsHealth] = useState<{
    totalRequests: number;
    errorRequests: number;
    errorRate: number;
    avgLatencyMs: number;
    syncRuns: number;
    lastSyncAt: string | null;
  } | null>(null);
  const [queueStats, setQueueStats] = useState<{
    total: number;
    readyToSync: number;
    waitingRetry: number;
    oldestCreatedAt: string | null;
    staleRemoved: number;
    duplicateRemoved: number;
  } | null>(null);
  const [clinicalFlowSummary, setClinicalFlowSummary] = useState<{
    windowDays: number;
    opened: number;
    completed: number;
    abandoned: number;
    blocked: number;
    abandonmentRate: number;
    avgDurationMsByStage: {
      ANAMNESE: number;
      EXAME_FISICO: number;
      EVOLUCAO: number;
    };
    topBlockedReasons: Array<{ reason: string; count: number }>;
  } | null>(null);
  const [patientCheckEngagement, setPatientCheckEngagement] = useState<{
    windowDays: number;
    checkClicks: number;
    checkinsSubmitted: number;
    conversionRate: number;
  } | null>(null);
  const hasLoadedUpdatesRef = useRef(false);
  const latestCheckinIdRef = useRef<string | null>(null);
  const degradationTrackedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const updatesSectionYRef = useRef(0);
  const [lastQuickPatientNameByAction, setLastQuickPatientNameByAction] =
    useState<{
      ANAMNESE: string | null;
      EVOLUCAO: string | null;
    }>({
      ANAMNESE: null,
      EVOLUCAO: null,
    });
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [dismissedActivationChecklist, setDismissedActivationChecklist] =
    useState(false);
  const [isWithinActivationWindow, setIsWithinActivationWindow] =
    useState(true);
  const isCompactLayout = width < 980;
  const [activationFlags, setActivationFlags] = useState<{
    firstAnamneseDone: boolean;
    firstEvolucaoDone: boolean;
  }>({
    firstAnamneseDone: false,
    firstEvolucaoDone: false,
  });
  const getQuickActionShortcutKey = (action: "ANAMNESE" | "EVOLUCAO") =>
    `quick-action:last-patient:v1:${action}`;

  const updatesStorageKey = useMemo(
    () => `updates:lastSeen:${usuario?.id || "anon"}`,
    [usuario?.id],
  );
  const activationChecklistStorageKey = useMemo(
    () => `home:activation-checklist:dismissed:${usuario?.id || "anon"}`,
    [usuario?.id],
  );
  const activationFirstSeenStorageKey = useMemo(
    () => `home:activation-checklist:first-seen:${usuario?.id || "anon"}`,
    [usuario?.id],
  );

  const pacientesEmAtencao = useMemo(
    () =>
      Object.values(attentionMap).filter(
        (days) => days === null || (typeof days === "number" && days > 7),
      ).length,
    [attentionMap],
  );

  const updatesHoje = useMemo(() => {
    const now = new Date();
    return updates.filter((update) => {
      const createdAt = new Date(update.createdAt);
      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getDate() === now.getDate() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [updates]);

  const pacientesRecentes = useMemo(
    () =>
      [...pacientes]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        )
        .slice(0, 5),
    [pacientes],
  );

  const pacientesRisco = useMemo(() => {
    const byPaciente = new Map<
      string,
      {
        pacienteId: string;
        pacienteNome: string;
        risco: number;
        motivo: string;
        hasIncompleteUpdate: boolean;
        attentionDays: number | null | undefined;
        vulnerabilidadeEmocional?: boolean;
        contextoFuncional?: boolean;
        metaFuncional?: boolean;
      }
    >();
    const pacientesById = new Map(pacientes.map((p) => [p.id, p]));

    updates.forEach((update) => {
      if (update.concluiu) return;
      const base = byPaciente.get(update.pacienteId);
      const entry = base || {
        pacienteId: update.pacienteId,
        pacienteNome:
          update.pacienteNome ||
          pacientesById.get(update.pacienteId)?.nomeCompleto ||
          "Paciente",
        risco: 0,
        motivo: t("home.riskReasonNoCompletion"),
        hasIncompleteUpdate: false,
        attentionDays: undefined,
      };
      entry.risco += 2;
      entry.hasIncompleteUpdate = true;
      byPaciente.set(update.pacienteId, entry);
    });

    Object.entries(attentionMap).forEach(([pacienteId, days]) => {
      if (days !== null && days <= 7) return;
      const base = byPaciente.get(pacienteId);
      const entry = base || {
        pacienteId,
        pacienteNome: pacientesById.get(pacienteId)?.nomeCompleto || "Paciente",
        risco: 0,
        motivo:
          days === null
            ? t("home.riskReasonNoEvolutionRecord")
            : t("home.riskReasonDaysWithoutEvolution", { days }),
        hasIncompleteUpdate: false,
        attentionDays: undefined,
      };
      entry.risco += days === null ? 2 : 1;
      entry.attentionDays = days;
      byPaciente.set(pacienteId, entry);
    });

    return Array.from(byPaciente.values())
      .map((entry) => {
        const ultimaAnamnese = anamneses
          .filter((a) => a.pacienteId === entry.pacienteId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];
        const vulnerabilidadeEmocional =
          !!ultimaAnamnese &&
          ((ultimaAnamnese.nivelEstresse ?? 0) >= 8 ||
            (typeof ultimaAnamnese.energiaDiaria === "number" &&
              ultimaAnamnese.energiaDiaria <= 3) ||
            (typeof ultimaAnamnese.apoioEmocional === "number" &&
              ultimaAnamnese.apoioEmocional <= 3) ||
            (typeof ultimaAnamnese.qualidadeSono === "number" &&
              ultimaAnamnese.qualidadeSono <= 3));
        const contextoFuncional =
          !!ultimaAnamnese &&
          (!!ultimaAnamnese.limitacoesFuncionais?.trim() ||
            !!ultimaAnamnese.atividadesQuePioram?.trim());
        const metaFuncional =
          !!ultimaAnamnese && !!ultimaAnamnese.metaPrincipalPaciente?.trim();
        let proximaAcao: HomeRiskActionCode = "OPEN_ADHERENCE";
        let proximaAcaoLabel = "Revisar aderência";

        if (entry.attentionDays === null || (entry.attentionDays ?? 0) > 14) {
          proximaAcao = "OPEN_PATIENT_DETAILS";
          proximaAcaoLabel = "Contato / retorno";
        } else if (vulnerabilidadeEmocional) {
          proximaAcao = "OPEN_PATIENT_DETAILS";
          proximaAcaoLabel = "Contato acolhedor";
        } else if (entry.hasIncompleteUpdate) {
          proximaAcao = "OPEN_ADHERENCE";
          proximaAcaoLabel = "Cobrar check-in";
        } else if ((entry.attentionDays ?? 0) > 7) {
          proximaAcao = "OPEN_ADHERENCE";
          proximaAcaoLabel = "Revisar aderência";
        } else {
          proximaAcao = "RECORD_EVOLUTION";
          proximaAcaoLabel = "Registrar evolução";
        }

        return {
          ...entry,
          vulnerabilidadeEmocional,
          contextoFuncional,
          metaFuncional,
          proximaAcao,
          proximaAcaoLabel,
        };
      })
      .sort((a, b) => b.risco - a.risco);
  }, [updates, attentionMap, pacientes, anamneses, t]);

  const biopsychosocialSummary = useMemo(() => {
    const totalEmRisco = pacientesRisco.length;
    const emocional = pacientesRisco.filter(
      (p) => p.vulnerabilidadeEmocional,
    ).length;
    const funcional = pacientesRisco.filter((p) => p.contextoFuncional).length;
    const metas = pacientesRisco.filter((p) => p.metaFuncional).length;
    const altoRisco = pacientesRisco.filter((p) => p.risco >= 3).length;
    const contatoAcolhedor = pacientesRisco.filter(
      (p) =>
        p.vulnerabilidadeEmocional &&
        p.proximaAcaoLabel === "Contato acolhedor",
    ).length;

    let nextActionLabel = "Abrir pacientes em atenção";
    let nextActionReason = "Priorizar pacientes com maior risco de evasão.";

    if (emocional > 0) {
      nextActionLabel = "Priorizar contato acolhedor";
      nextActionReason =
        emocional === 1
          ? "1 paciente em atenção apresenta sinais emocionais/rotina."
          : `${emocional} pacientes em atenção apresentam sinais emocionais/rotina.`;
    } else if (altoRisco > 0) {
      nextActionLabel = "Revisar adesão da fila";
      nextActionReason =
        altoRisco === 1
          ? "1 paciente está em risco elevado e precisa de ação rápida."
          : `${altoRisco} pacientes estão em risco elevado e precisam de ação rápida.`;
    } else if (funcional > 0) {
      nextActionLabel = "Revisar funcionalidade e metas";
      nextActionReason =
        metas > 0
          ? `${funcional} pacientes em atenção têm contexto funcional relevante e ${metas} têm meta principal registrada.`
          : `${funcional} pacientes em atenção têm contexto funcional relevante para orientar a conduta.`;
    } else if (totalEmRisco > 0) {
      nextActionReason =
        totalEmRisco === 1
          ? "1 paciente requer acompanhamento prioritário hoje."
          : `${totalEmRisco} pacientes requerem acompanhamento prioritário hoje.`;
    }

    return {
      totalEmRisco,
      emocional,
      funcional,
      metas,
      altoRisco,
      contatoAcolhedor,
      nextActionLabel,
      nextActionReason,
    };
  }, [pacientesRisco]);

  const handleRiskSuggestedAction = useCallback(
    (
      item: (typeof pacientesRisco)[number],
      mode: "open_patient" | "run_action" = "run_action",
    ) => {
      if (mode === "open_patient") {
        navigation.navigate("PacienteDetails", { pacienteId: item.pacienteId });
        return;
      }

      switch (item.proximaAcao) {
        case "OPEN_PATIENT_DETAILS":
          navigation.navigate("PacienteDetails", {
            pacienteId: item.pacienteId,
          });
          return;
        case "RECORD_EVOLUTION":
          navigation.navigate("EvolucaoForm", { pacienteId: item.pacienteId });
          return;
        case "OPEN_ADHERENCE":
        default:
          navigation.navigate("PacienteAdesao", {
            pacienteId: item.pacienteId,
          });
      }
    },
    [navigation, pacientesRisco],
  );

  const dashboardSemanal = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const semana = updates.filter((update) => {
      const ts = new Date(update.createdAt).getTime();
      return !Number.isNaN(ts) && now - ts <= sevenDaysMs;
    });

    const total = semana.length;
    const concluidos = semana.filter((item) => item.concluiu).length;
    const adesao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    const comDor = semana.filter(
      (item) =>
        item.concluiu &&
        typeof item.dorAntes === "number" &&
        typeof item.dorDepois === "number",
    );
    const mediaDorAntes =
      comDor.length > 0
        ? (
            comDor.reduce((acc, item) => acc + (item.dorAntes || 0), 0) /
            comDor.length
          ).toFixed(1)
        : "-";
    const mediaDorDepois =
      comDor.length > 0
        ? (
            comDor.reduce((acc, item) => acc + (item.dorDepois || 0), 0) /
            comDor.length
          ).toFixed(1)
        : "-";
    const piora = comDor.filter(
      (item) => (item.dorDepois || 0) > (item.dorAntes || 0),
    ).length;

    return {
      total,
      concluidos,
      adesao,
      mediaDorAntes,
      mediaDorDepois,
      piora,
    };
  }, [updates]);

  const getClinicalBlockedReasonLabel = useCallback(
    (reason: string) => {
      switch (reason) {
        case "MISSING_ANAMNESE":
          return t("home.clinicalBlockedMissingAnamnesis");
        case "MISSING_REQUIRED_FIELDS":
          return t("home.clinicalBlockedMissingRequired");
        default:
          return reason;
      }
    },
    [t],
  );

  useEffect(() => {
    if (dashboardSemanal.total === 0) return;
    trackEvent("weekly_dashboard_viewed", {
      total: dashboardSemanal.total,
      concluidos: dashboardSemanal.concluidos,
      adesao: dashboardSemanal.adesao,
      piora: dashboardSemanal.piora,
    }).catch(() => undefined);
  }, [
    dashboardSemanal.total,
    dashboardSemanal.concluidos,
    dashboardSemanal.adesao,
    dashboardSemanal.piora,
  ]);

  useEffect(() => {
    if (!clinicalFlowSummary || clinicalFlowSummary.opened === 0) return;
    trackEvent("clinical_flow_summary_viewed", {
      windowDays: clinicalFlowSummary.windowDays,
      opened: clinicalFlowSummary.opened,
      completed: clinicalFlowSummary.completed,
      abandoned: clinicalFlowSummary.abandoned,
      blocked: clinicalFlowSummary.blocked,
      abandonmentRate: clinicalFlowSummary.abandonmentRate,
    }).catch(() => undefined);
  }, [clinicalFlowSummary]);

  useEffect(() => {
    fetchPacientes().catch(() => undefined);
  }, [fetchPacientes]);

  useEffect(() => {
    if (!usuario?.id || !usuario?.role) return;

    registerPushTokenIfNeeded(usuario.id, usuario.role).catch(() => {
      showToast({
        type: "info",
        message: t("home.pushUnavailable"),
      });
    });
  }, [usuario?.id, usuario?.role, showToast, t]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(updatesStorageKey)
      .then((value) => {
        if (mounted) setLastSeenUpdatesAt(value);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [updatesStorageKey]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(activationChecklistStorageKey)
      .then((value) => {
        if (!mounted) return;
        setDismissedActivationChecklist(value === "1");
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [activationChecklistStorageKey]);

  useEffect(() => {
    let mounted = true;
    const ACTIVATION_WINDOW_DAYS = 14;
    const ACTIVATION_WINDOW_MS = ACTIVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    AsyncStorage.getItem(activationFirstSeenStorageKey)
      .then(async (value) => {
        const now = Date.now();
        let firstSeenMs = value ? Number(value) : NaN;

        if (!value || Number.isNaN(firstSeenMs)) {
          firstSeenMs = now;
          await AsyncStorage.setItem(
            activationFirstSeenStorageKey,
            String(firstSeenMs),
          );
        }

        if (!mounted) return;
        setIsWithinActivationWindow(now - firstSeenMs <= ACTIVATION_WINDOW_MS);
      })
      .catch(() => {
        if (!mounted) return;
        setIsWithinActivationWindow(true);
      });

    return () => {
      mounted = false;
    };
  }, [activationFirstSeenStorageKey]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem("onboarding:professional:first_anamnese_done"),
      AsyncStorage.getItem("onboarding:professional:first_evolucao_done"),
    ])
      .then(([firstAnamneseDone, firstEvolucaoDone]) => {
        if (!mounted) return;
        setActivationFlags({
          firstAnamneseDone: firstAnamneseDone === "1",
          firstEvolucaoDone: firstEvolucaoDone === "1",
        });
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [usuario?.id]);

  useEffect(() => {
    let mounted = true;
    const loadQuickActionLastPatients = async () => {
      try {
        const [anamneseLastId, evolucaoLastId] = await Promise.all([
          AsyncStorage.getItem(getQuickActionShortcutKey("ANAMNESE")),
          AsyncStorage.getItem(getQuickActionShortcutKey("EVOLUCAO")),
        ]);
        if (!mounted) return;
        const pacientesById = new Map(
          pacientes.map((p) => [p.id, p.nomeCompleto]),
        );
        setLastQuickPatientNameByAction({
          ANAMNESE: anamneseLastId
            ? pacientesById.get(anamneseLastId) || null
            : null,
          EVOLUCAO: evolucaoLastId
            ? pacientesById.get(evolucaoLastId) || null
            : null,
        });
      } catch {
        if (!mounted) return;
        setLastQuickPatientNameByAction({ ANAMNESE: null, EVOLUCAO: null });
      }
    };
    loadQuickActionLastPatients().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [pacientes]);

  const loadAttentionStatus = useCallback(async () => {
    try {
      const response = await cachedGet<Record<string, number | null>>(
        api,
        "/pacientes/attention",
        undefined,
        20_000,
      );
      setAttentionMap(response || {});
    } catch {
      setAttentionMap({});
    }
  }, []);

  const loadPacienteStats = useCallback(async () => {
    if (!isProfessionalUser) {
      setScopedTotalPacientes(0);
      return;
    }

    try {
      const response = await cachedGet<{
        totalPacientes?: number;
      }>(api, "/pacientes/stats", undefined, 20_000);
      setScopedTotalPacientes(Number(response?.totalPacientes || 0));
    } catch {
      setScopedTotalPacientes(0);
    }
  }, [isProfessionalUser]);

  useEffect(() => {
    loadPacienteStats()
      .then(() => undefined)
      .catch(() => undefined);
  }, [loadPacienteStats]);

  useEffect(() => {
    loadAttentionStatus()
      .then(() => undefined)
      .catch(() => undefined);
  }, [loadAttentionStatus]);

  const loadUpdates = useCallback(async () => {
    try {
      const nextUpdates =
        (await cachedGet<AtividadeUpdate[]>(
          api,
          "/atividades/updates",
          {
            params: { limit: 20 },
          },
          8_000,
        )) || [];
      setUpdates(nextUpdates);

      if (!nextUpdates.length) {
        hasLoadedUpdatesRef.current = true;
        latestCheckinIdRef.current = null;
        return;
      }

      const currentTopId = nextUpdates[0].checkinId;
      const previousTopId = latestCheckinIdRef.current;

      if (
        hasLoadedUpdatesRef.current &&
        previousTopId &&
        previousTopId !== currentTopId
      ) {
        const firstUpdate = nextUpdates[0];
        const newUpdatesCount = nextUpdates.findIndex(
          (update) => update.checkinId === previousTopId,
        );
        const count = newUpdatesCount > 0 ? newUpdatesCount : 1;

        showToast({
          type: "info",
          message:
            count > 1
              ? t("home.newUpdatesCount", { count })
              : t("home.newUpdateSingle", { name: firstUpdate.pacienteNome }),
        });
      }

      hasLoadedUpdatesRef.current = true;
      latestCheckinIdRef.current = currentTopId;
    } catch {
      setUpdates([]);
    }
  }, [showToast, t]);

  const loadAuditSummary = async () => {
    try {
      const summary = await getAuditSummary(24);
      setAuditSummary(summary);
    } catch {
      setAuditSummary(null);
    }
  };

  const loadOpsHealth = async () => {
    try {
      const summary = await getOpsHealthSummary(24);
      setOpsHealth(summary);
    } catch {
      setOpsHealth(null);
    }
  };

  const loadQueueStats = async () => {
    try {
      const stats = await getOfflineCheckinQueueStats();
      setQueueStats(stats);
    } catch {
      setQueueStats(null);
    }
  };

  const loadClinicalFlowSummary = async () => {
    try {
      const summary = await getClinicalFlowSummary(7);
      setClinicalFlowSummary(summary);
    } catch {
      setClinicalFlowSummary(null);
    }
  };
  const loadPatientCheckEngagement = async () => {
    try {
      const summary = await getPatientCheckEngagementSummary(7);
      setPatientCheckEngagement(summary);
    } catch {
      setPatientCheckEngagement(null);
    }
  };

  const handleManualSync = async () => {
    try {
      const { synced, remaining } = await syncOfflineCheckins({ force: true });
      await loadAuditSummary();
      await loadOpsHealth();
      await loadQueueStats();
      await trackEvent("ops_sync_manual", { synced, remaining });
      showToast({
        type: "success",
        message: t("home.manualSyncSuccess", { synced, remaining }),
      });
    } catch {
      showToast({ type: "error", message: t("home.manualSyncError") });
    }
  };

  useFocusEffect(
    useCallback(() => {
      syncOfflineCheckins().catch(() => undefined);
      loadUpdates().catch(() => undefined);
      loadPacienteStats().catch(() => undefined);
      loadAttentionStatus().catch(() => undefined);
      loadAuditSummary().catch(() => undefined);
      loadOpsHealth().catch(() => undefined);
      loadQueueStats().catch(() => undefined);
      loadClinicalFlowSummary().catch(() => undefined);
      loadPatientCheckEngagement().catch(() => undefined);
      if (pacientesRisco.length > 0) {
        trackEvent("risk_panel_viewed", { total: pacientesRisco.length }).catch(
          () => undefined,
        );
      }
      const timer = setInterval(() => {
        loadUpdates().catch(() => undefined);
      }, 20000);
      return () => clearInterval(timer);
    }, [loadAttentionStatus, loadPacienteStats, loadUpdates, pacientesRisco.length]),
  );

  useEffect(() => {
    if (!opsHealth || opsHealth.totalRequests === 0) return;
    trackEvent("ops_health_viewed", {
      requests: opsHealth.totalRequests,
      errorRate: opsHealth.errorRate,
      avgLatencyMs: opsHealth.avgLatencyMs,
      syncRuns: opsHealth.syncRuns,
    }).catch(() => undefined);
  }, [opsHealth]);

  const isOperationallyDegraded = useMemo(() => {
    if (!opsHealth) return false;

    const MIN_REQUESTS_FOR_ALERT = 30;
    const MIN_ERRORS_FOR_ALERT = 5;

    const hasEnoughApiSample =
      opsHealth.totalRequests >= MIN_REQUESTS_FOR_ALERT &&
      opsHealth.errorRequests >= MIN_ERRORS_FOR_ALERT;
    const hasHighErrorRate = hasEnoughApiSample && opsHealth.errorRate >= 15;
    const hasHighQueuePressure = (queueStats?.waitingRetry || 0) >= 5;

    return hasHighErrorRate || hasHighQueuePressure;
  }, [opsHealth, queueStats]);

  useEffect(() => {
    if (!isOperationallyDegraded || degradationTrackedRef.current) return;
    degradationTrackedRef.current = true;
    trackEvent("ops_degradation_alerted", {
      errorRate: opsHealth?.errorRate ?? 0,
      waitingRetry: queueStats?.waitingRetry ?? 0,
    }).catch(() => undefined);
  }, [isOperationallyDegraded, opsHealth?.errorRate, queueStats?.waitingRetry]);

  useEffect(() => {
    if (isOperationallyDegraded) return;
    degradationTrackedRef.current = false;
  }, [isOperationallyDegraded]);

  const unreadUpdatesCount = useMemo(() => {
    if (!lastSeenUpdatesAt) return updates.length;
    const lastSeenTs = new Date(lastSeenUpdatesAt).getTime();
    if (Number.isNaN(lastSeenTs)) return updates.length;
    return updates.filter((u) => {
      const createdTs = new Date(u.createdAt).getTime();
      return !Number.isNaN(createdTs) && createdTs > lastSeenTs;
    }).length;
  }, [updates, lastSeenUpdatesAt]);

  const activationChecklist = useMemo(() => {
    const hasPatient = pacientes.length > 0;
    const hasQuickMessage =
      (auditSummary?.byAction.QUICK_MESSAGE_SENT || 0) > 0;
    const hasPatientUpdate = updates.length > 0;

    const items = [
      {
        id: "first_patient",
        title: "Cadastrar 1º paciente",
        description: "Crie o primeiro paciente para iniciar o acompanhamento.",
        done: hasPatient,
        ctaLabel: "Cadastrar paciente",
        onPress: () => {
          trackEvent("professional_activation_checklist_item_clicked", {
            itemId: "first_patient",
            action: "PacienteForm",
          }).catch(() => undefined);
          handleNavigation("PacienteForm").catch(() => undefined);
        },
      },
      {
        id: "first_update",
        title: "Receber 1 atualização/check-in",
        description: "Valide o retorno do paciente por atividade/check-in.",
        done: hasPatientUpdate,
        ctaLabel: "Ver atualizações",
        onPress: () => {
          trackEvent("professional_activation_checklist_item_clicked", {
            itemId: "first_update",
            action: updates.length > 0 ? "mark_updates_read" : "PacientesList",
          }).catch(() => undefined);
          if (updates.length > 0) {
            markUpdatesAsRead().catch(() => undefined);
            return;
          }
          handleNavigation("PacientesList").catch(() => undefined);
        },
      },
      {
        id: "first_quick_message",
        title: "Enviar 1 mensagem rápida",
        description: "Use uma mensagem pronta para reforçar adesão/check-in.",
        done: hasQuickMessage,
        ctaLabel: "Abrir pacientes",
        onPress: () => {
          trackEvent("professional_activation_checklist_item_clicked", {
            itemId: "first_quick_message",
            action: "PacientesList",
          }).catch(() => undefined);
          handleNavigation("PacientesList").catch(() => undefined);
        },
      },
      {
        id: "first_anamnese",
        title: "Registrar 1 anamnese",
        description:
          "Faça a primeira avaliação para começar o histórico clínico.",
        done: activationFlags.firstAnamneseDone,
        ctaLabel: "Nova anamnese",
        onPress: () => {
          trackEvent("professional_activation_checklist_item_clicked", {
            itemId: "first_anamnese",
            action: "AnamneseForm",
          }).catch(() => undefined);
          handleNavigation("AnamneseForm").catch(() => undefined);
        },
      },
      {
        id: "first_evolucao",
        title: "Registrar 1 evolução",
        description:
          "Registre a primeira evolução para validar o fluxo clínico.",
        done: activationFlags.firstEvolucaoDone,
        ctaLabel: "Nova evolução",
        onPress: () => {
          trackEvent("professional_activation_checklist_item_clicked", {
            itemId: "first_evolucao",
            action: "EvolucaoForm",
          }).catch(() => undefined);
          handleNavigation("EvolucaoForm").catch(() => undefined);
        },
      },
    ];

    const completed = items.filter((item) => item.done).length;
    return {
      items,
      completed,
      total: items.length,
      percent: Math.round((completed / items.length) * 100),
    };
  }, [
    pacientes.length,
    auditSummary?.byAction.QUICK_MESSAGE_SENT,
    updates.length,
    activationFlags.firstAnamneseDone,
    activationFlags.firstEvolucaoDone,
  ]);

  useEffect(() => {
    if (!isWithinActivationWindow) return;
    if (dismissedActivationChecklist) return;
    if (activationChecklist.completed >= activationChecklist.total) return;
    trackEvent("professional_activation_checklist_viewed", {
      completed: activationChecklist.completed,
      total: activationChecklist.total,
      percent: activationChecklist.percent,
    }).catch(() => undefined);
  }, [
    dismissedActivationChecklist,
    isWithinActivationWindow,
    activationChecklist.completed,
    activationChecklist.total,
    activationChecklist.percent,
  ]);

  const markUpdatesAsRead = async () => {
    try {
      const latestKnownUpdateIso = updates.reduce<string | null>((acc, item) => {
        const ts = new Date(item.createdAt).getTime();
        if (Number.isNaN(ts)) return acc;
        if (!acc) return new Date(ts).toISOString();
        return ts > new Date(acc).getTime() ? new Date(ts).toISOString() : acc;
      }, null);

      const marker = latestKnownUpdateIso || new Date().toISOString();
      setLastSeenUpdatesAt(marker);
      await AsyncStorage.setItem(updatesStorageKey, marker);
      showToast({ type: "success", message: t("home.markReadSuccess") });
    } catch {
      showToast({ type: "error", message: t("home.markReadError") });
    }
  };
  const scrollToUpdatesSection = useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, updatesSectionYRef.current - 16),
      animated: true,
    });
  }, []);

  const doLogout = async () => {
    try {
      await logout();
      showToast({ message: t("home.logoutSuccess"), type: "success" });
    } catch {
      showToast({ message: "Não foi possível sair", type: "error" });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      doLogout();
      return;
    }

    Alert.alert(t("home.logoutTitle"), t("home.logoutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.exit"), style: "destructive", onPress: doLogout },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.headerRightButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("nav.settings")}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.headerRightButton, styles.headerRightLogoutButton]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.exit")}
            testID="logout-button"
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, t]);

  const pacientesComAnamnese = useMemo(() => {
    const ids = new Set<string>();
    anamneses.forEach((item) => {
      if (item.pacienteId) ids.add(item.pacienteId);
    });
    return ids;
  }, [anamneses]);

  const findSmartPacienteForQuickAction = useCallback(
    (action: "ANAMNESE" | "EVOLUCAO" | "EXAME_FISICO") => {
      const availablePacientes = pacientes;
      const availableComAnamnese = availablePacientes.filter((p) =>
        pacientesComAnamnese.has(p.id),
      );

      if (action === "ANAMNESE") {
        const pendingAnamnese = availablePacientes.find(
          (p) => !pacientesComAnamnese.has(p.id),
        );
        if (pendingAnamnese) {
          return {
            pacienteId: pendingAnamnese.id,
            reason: "missing_anamnese" as const,
          };
        }
        const fallback = availablePacientes[0];
        return fallback
          ? { pacienteId: fallback.id, reason: "linked_fallback" as const }
          : null;
      }

      if (action === "EVOLUCAO") {
        const inAttention = availableComAnamnese.find((p) => {
          const days = attentionMap[p.id];
          return days === null || (typeof days === "number" && days > 7);
        });
        if (inAttention) {
          return {
            pacienteId: inAttention.id,
            reason: "attention_priority" as const,
          };
        }
        const fallback = availableComAnamnese[0];
        return fallback
          ? {
              pacienteId: fallback.id,
              reason: "with_anamnese_fallback" as const,
            }
          : null;
      }

      const exameTarget = availableComAnamnese[0];
      return exameTarget
        ? {
            pacienteId: exameTarget.id,
            reason: "with_anamnese_fallback" as const,
          }
        : null;
    },
    [attentionMap, pacientes, pacientesComAnamnese],
  );
  type HomeNavigationTarget =
    | "PacienteForm"
    | "PacientesList"
    | "PacientesAtencao"
    | "AnamneseForm"
    | "EvolucaoForm"
    | "ExameFisicoForm";

  const handleNavigation = async (
    screen: HomeNavigationTarget,
    options?: {
      forcePatientSelection?: boolean;
      source?: "home" | "home_long_press";
    },
  ) => {
    const source = options?.source || "home";
    switch (screen) {
      case "PacienteForm":
        navigation.navigate("PacienteForm", {});
        break;
      case "PacientesList":
        navigation.navigate("PacientesList");
        break;
      case "PacientesAtencao":
        navigation.navigate("PacientesList", {
          attentionOnly: true,
          attentionSource: "HOME_SUMMARY",
        });
        break;
      case "AnamneseForm":
      case "EvolucaoForm":
      case "ExameFisicoForm": {
        if (screen === "AnamneseForm") {
          const action = "ANAMNESE";
          trackEvent("quick_action_mode_opened", { action, source }).catch(
            () => undefined,
          );
          openQuickActionSelection(navigation, action);
          showToast({
            type: "info",
            message: t("home.selectPatientForAnamnesis"),
          });
          break;
        }

        const action = screen === "EvolucaoForm" ? "EVOLUCAO" : "EXAME_FISICO";

        if (options?.forcePatientSelection) {
          trackEvent("quick_action_mode_opened", { action, source }).catch(
            () => undefined,
          );
          openQuickActionSelection(navigation, action);
          break;
        }

        let targetPacienteId: string | null = null;
        try {
          const shortcutAction =
            action === "EXAME_FISICO" ? "EVOLUCAO" : action;
          const lastPacienteId = await AsyncStorage.getItem(
            getQuickActionShortcutKey(shortcutAction),
          );
          const canUseShortcut =
            !!lastPacienteId && pacientes.some((p) => p.id === lastPacienteId);

          await trackEvent("quick_action_last_patient_shortcut", {
            action,
            hit: canUseShortcut,
          });

          if (canUseShortcut && lastPacienteId) {
            const hasAnamnese = pacientesComAnamnese.has(lastPacienteId);
            const canUseByFlow = hasAnamnese;
            if (canUseByFlow) {
              targetPacienteId = lastPacienteId;
            }
          }
        } catch {
          // ignore shortcut storage errors
        }

        if (!targetPacienteId) {
          const smart = findSmartPacienteForQuickAction(action);
          targetPacienteId = smart?.pacienteId || null;
        }

        if (targetPacienteId) {
          if (action === "EVOLUCAO") {
            navigation.navigate("EvolucaoForm", {
              pacienteId: targetPacienteId,
            });
          } else {
            navigation.navigate("ExameFisicoForm", {
              pacienteId: targetPacienteId,
            });
          }
          break;
        }

        trackEvent("quick_action_mode_opened", { action, source }).catch(
          () => undefined,
        );
        openQuickActionSelection(navigation, action);
        showToast({
          type: "info",
          message: t("home.selectPatientWithAnamnesis"),
        });
        break;
      }
    }
  };
  const handleTodayStatPress = () => {
    if (updatesHoje > 0) {
      scrollToUpdatesSection();
      return;
    }

    handleNavigation("PacientesList").catch(() => undefined);
  };

  const handleBiopsychosocialSummaryClick = useCallback(
    (
      target:
        | "queue"
        | "high_risk"
        | "emotional"
        | "supportive_contact"
        | "functional"
        | "goal",
    ) => {
      trackEvent("home_biopsychosocial_summary_clicked", {
        target,
        totalEmRisco: biopsychosocialSummary.totalEmRisco,
        altoRisco: biopsychosocialSummary.altoRisco,
        emocional: biopsychosocialSummary.emocional,
        contatoAcolhedor: biopsychosocialSummary.contatoAcolhedor,
        funcional: biopsychosocialSummary.funcional,
        metas: biopsychosocialSummary.metas,
      }).catch(() => undefined);

      if (target === "high_risk") {
        navigation.navigate("PacientesList", {
          attentionOnly: true,
          attentionFocus: "HIGH_RISK",
        });
        return;
      }
      if (target === "emotional" || target === "supportive_contact") {
        navigation.navigate("PacientesList", {
          attentionOnly: true,
          attentionFocus: "EMOTIONAL",
        });
        return;
      }
      if (target === "functional") {
        navigation.navigate("PacientesList", {
          attentionOnly: true,
          attentionFocus: "FUNCTIONAL",
        });
        return;
      }
      if (target === "goal") {
        navigation.navigate("PacientesList", {
          attentionOnly: true,
          attentionFocus: "GOAL",
        });
        return;
      }
      navigation.navigate("PacientesList", {
        attentionOnly: true,
        attentionSource: "HOME_SUMMARY",
      });
    },
    [biopsychosocialSummary, navigation],
  );

  const handleQuickActionLongPress = (action: "ANAMNESE" | "EVOLUCAO") => {
    const currentName = lastQuickPatientNameByAction[action];
    if (!currentName) {
      handleNavigation(
        action === "ANAMNESE" ? "AnamneseForm" : "EvolucaoForm",
        {
          forcePatientSelection: true,
          source: "home_long_press",
        },
      ).catch(() => undefined);
      return;
    }

    Alert.alert(
      t("home.shortcutTitle"),
      t("home.shortcutCurrent", { name: currentName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("home.shortcutUseLast"),
          onPress: () => {
            handleNavigation(
              action === "ANAMNESE" ? "AnamneseForm" : "EvolucaoForm",
            ).catch(() => undefined);
          },
        },
        {
          text: t("home.shortcutChooseAnother"),
          onPress: () => {
            handleNavigation(
              action === "ANAMNESE" ? "AnamneseForm" : "EvolucaoForm",
              {
                forcePatientSelection: true,
                source: "home_long_press",
              },
            ).catch(() => undefined);
          },
        },
        {
          text: t("home.shortcutClear"),
          style: "destructive",
          onPress: () => {
            AsyncStorage.removeItem(getQuickActionShortcutKey(action))
              .then(() => {
                setLastQuickPatientNameByAction((prev) => ({
                  ...prev,
                  [action]: null,
                }));
                trackEvent("quick_action_shortcut_cleared", {
                  action,
                  source: "home_long_press",
                }).catch(() => undefined);
                showToast({
                  type: "success",
                  message: t("home.shortcutRemoved", {
                    action:
                      action === "ANAMNESE"
                        ? t("home.anamnesis")
                        : t("home.evolution"),
                  }),
                });
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.focusCard}>
          <View style={styles.updatesHeader}>
            <Text style={styles.focusTitle}>{t("home.focusDay")}</Text>
          </View>
          <View style={styles.statsContainer}>
            <StatCard
              value={String(
                isProfessionalUser
                  ? scopedTotalPacientes
                  : totalPacientes || pacientes.length,
              )}
              label={t("home.patients")}
              icon="people-outline"
              onPress={() =>
                handleNavigation("PacientesList").catch(() => undefined)
              }
            />
            <StatCard
              value={String(pacientesEmAtencao)}
              label={t("home.attention")}
              icon="alert-circle-outline"
              onPress={() =>
                handleNavigation("PacientesAtencao").catch(() => undefined)
              }
            />
            <StatCard
              value={String(updatesHoje)}
              label={t("home.today")}
              icon="calendar-outline"
              onPress={handleTodayStatPress}
            />
          </View>
        </View>

        {isProfessionalUser &&
        isWithinActivationWindow &&
        !dismissedActivationChecklist &&
        activationChecklist.completed < activationChecklist.total ? (
          <View style={styles.activationCard}>
            <View style={styles.activationHeader}>
              <View style={styles.activationHeaderMain}>
                <Text style={styles.activationTitle}>
                  Ativação do profissional
                </Text>
                <Text style={styles.activationSubtitle}>
                  {activationChecklist.completed}/{activationChecklist.total}{" "}
                  concluído
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  trackEvent("professional_activation_checklist_dismissed", {
                    completed: activationChecklist.completed,
                    total: activationChecklist.total,
                  }).catch(() => undefined);
                  setDismissedActivationChecklist(true);
                  AsyncStorage.setItem(
                    activationChecklistStorageKey,
                    "1",
                  ).catch(() => undefined);
                }}
                style={styles.activationCloseButton}
              >
                <Ionicons name="close" size={16} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            <View style={styles.activationProgressTrack}>
              <View
                style={[
                  styles.activationProgressFill,
                  { width: `${activationChecklist.percent}%` },
                ]}
              />
            </View>
            {activationChecklist.items.map((item) => (
              <View key={item.id} style={styles.activationItem}>
                <View style={styles.activationItemMain}>
                  <Ionicons
                    name={item.done ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={item.done ? COLORS.success : COLORS.gray400}
                  />
                  <View style={styles.activationItemTextWrap}>
                    <Text
                      style={[
                        styles.activationItemTitle,
                        item.done && styles.activationItemTitleDone,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.activationItemDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                {!item.done ? (
                  <TouchableOpacity
                    onPress={item.onPress}
                    style={styles.activationItemButton}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.activationItemButtonText}>
                      {item.ctaLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : isWithinActivationWindow &&
          !dismissedActivationChecklist &&
          activationChecklist.completed >= activationChecklist.total ? (
          <View style={[styles.activationCard, styles.activationCompletedCard]}>
            <View style={styles.activationHeader}>
              <View>
                <Text style={styles.activationTitle}>Ativação concluída</Text>
                <Text style={styles.activationSubtitle}>
                  Parabéns! Seu fluxo inicial está pronto.
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.activationCompletionNote}>
              Próximo passo: acompanhar adesão, registrar evoluções e manter os
              retornos dos pacientes em dia.
            </Text>
            <View style={styles.activationCompletionActions}>
              <TouchableOpacity
                style={styles.activationItemButton}
                activeOpacity={0.85}
                onPress={() => {
                  trackEvent("professional_activation_checklist_item_clicked", {
                    itemId: "activation_completed_next_step",
                    action: "PacientesList",
                  }).catch(() => undefined);
                  handleNavigation("PacientesList").catch(() => undefined);
                }}
              >
                <Text style={styles.activationItemButtonText}>
                  Ver pacientes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.activationSecondaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  setDismissedActivationChecklist(true);
                  AsyncStorage.setItem(
                    activationChecklistStorageKey,
                    "1",
                  ).catch(() => undefined);
                }}
              >
                <Text style={styles.activationSecondaryButtonText}>
                  Ocultar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {isProfessionalUser ? (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>
            <View style={styles.quickActionsPrimaryWrap}>
              <QuickAction
                icon="person-add-outline"
                title={t("home.newPatient")}
                subtitle={t("home.register")}
                color={COLORS.primary}
                containerStyle={styles.quickActionPrimary}
                onPress={() => {
                  handleNavigation("PacienteForm").catch(() => undefined);
                }}
              />
            </View>
            <View
              style={[
                styles.quickActionsGrid,
                isCompactLayout && styles.quickActionsGridCompact,
              ]}
            >
              <QuickAction
                icon="people-outline"
                title={t("home.patients")}
                subtitle={t("home.viewAll")}
                color="#5C6BC0"
                containerStyle={[styles.quickActionSecondary, isCompactLayout && styles.quickActionSecondaryCompact]}
                onPress={() => {
                  handleNavigation("PacientesList").catch(() => undefined);
                }}
              />
              <QuickAction
                icon="clipboard-outline"
                title={t("home.anamnesis")}
                subtitle={t("home.newAnamnesis")}
                color={COLORS.accent}
                containerStyle={[styles.quickActionSecondary, isCompactLayout && styles.quickActionSecondaryCompact]}
                onPress={() => {
                  handleNavigation("AnamneseForm", {
                    forcePatientSelection: true,
                  }).catch(() => undefined);
                }}
                onLongPress={() => {
                  handleQuickActionLongPress("ANAMNESE");
                }}
              />
              <QuickAction
                icon="fitness-outline"
                title={t("home.physicalExam")}
                subtitle={t("home.newPhysicalExam")}
                color="#00897B"
                containerStyle={[styles.quickActionSecondary, isCompactLayout && styles.quickActionSecondaryCompact]}
                onPress={() => {
                  handleNavigation("ExameFisicoForm", {
                    forcePatientSelection: true,
                  }).catch(() => undefined);
                }}
              />
                <QuickAction
                  icon="trending-up-outline"
                  title={t("home.evolution")}
                  subtitle={t("home.newEvolution")}
                  color="#9C27B0"
                  containerStyle={[styles.quickActionSecondary, isCompactLayout && styles.quickActionSecondaryCompact]}
                  onPress={() => {
                    handleNavigation("EvolucaoForm", {
                      forcePatientSelection: true,
                    }).catch(() => undefined);
                  }}
                  onLongPress={() => {
                    handleQuickActionLongPress("EVOLUCAO");
                  }}
                />
            </View>
          </View>
        ) : (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>
            <View
              style={[
                styles.quickActionsGrid,
                isCompactLayout && styles.quickActionsGridCompact,
              ]}
            >
              <QuickAction
                icon="home-outline"
                title={t("nav.patientHome")}
                subtitle={t("home.quickView")}
                color={COLORS.primary}
                onPress={() => {
                  navigation.navigate("PacienteHome");
                }}
              />
              <QuickAction
                icon="settings-outline"
                title={t("nav.settings")}
                subtitle={t("home.viewAll")}
                color={COLORS.info}
                onPress={() => {
                  navigation.navigate("Settings");
                }}
              />
              <QuickAction
                icon="log-out-outline"
                title={t("home.logoutTitle")}
                subtitle={t("common.exit")}
                color={COLORS.textSecondary}
                onPress={handleLogout}
              />
            </View>
          </View>
        )}

        <View style={styles.bioSummarySection}>
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>Resumo biopsicossocial</Text>
            <TouchableOpacity
              onPress={() => handleBiopsychosocialSummaryClick("queue")}
            >
              <Text style={styles.seeAllLink}>Abrir fila</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bioSummaryStatsRow}>
            <TouchableOpacity
              style={styles.bioSummaryMiniCard}
              activeOpacity={0.85}
              onPress={() => handleBiopsychosocialSummaryClick("queue")}
            >
              <Text style={styles.bioSummaryMiniValue}>
                {biopsychosocialSummary.totalEmRisco}
              </Text>
              <Text style={styles.bioSummaryMiniLabel}>Em atenção</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bioSummaryMiniCard}
              activeOpacity={0.85}
              onPress={() => handleBiopsychosocialSummaryClick("high_risk")}
            >
              <Text style={styles.bioSummaryMiniValue}>
                {biopsychosocialSummary.altoRisco}
              </Text>
              <Text style={styles.bioSummaryMiniLabel}>Risco alto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bioSummaryMiniCard}
              activeOpacity={0.85}
              onPress={() => handleBiopsychosocialSummaryClick("emotional")}
            >
              <Text style={styles.bioSummaryMiniValue}>
                {biopsychosocialSummary.emocional}
              </Text>
              <Text style={styles.bioSummaryMiniLabel}>Emocional</Text>
            </TouchableOpacity>
          </View>
          {biopsychosocialSummary.funcional > 0 ||
          biopsychosocialSummary.metas > 0 ? (
            <View style={styles.bioSummaryChipRow}>
              {biopsychosocialSummary.funcional > 0 ? (
                <TouchableOpacity
                  style={styles.bioSummaryNeutralChip}
                  activeOpacity={0.85}
                  onPress={() =>
                    handleBiopsychosocialSummaryClick("functional")
                  }
                >
                  <Ionicons
                    name="body-outline"
                    size={12}
                    color={COLORS.primary}
                  />
                  <Text style={styles.bioSummaryNeutralChipText}>
                    {biopsychosocialSummary.funcional} com contexto funcional
                  </Text>
                </TouchableOpacity>
              ) : null}
              {biopsychosocialSummary.metas > 0 ? (
                <TouchableOpacity
                  style={styles.bioSummaryNeutralChip}
                  activeOpacity={0.85}
                  onPress={() => handleBiopsychosocialSummaryClick("goal")}
                >
                  <Ionicons
                    name="flag-outline"
                    size={12}
                    color={COLORS.primary}
                  />
                  <Text style={styles.bioSummaryNeutralChipText}>
                    {biopsychosocialSummary.metas} com meta principal
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {biopsychosocialSummary.contatoAcolhedor > 0 ? (
            <View style={styles.bioSummaryChipRow}>
              <TouchableOpacity
                style={styles.bioSummaryEmotionChip}
                activeOpacity={0.85}
                onPress={() =>
                  handleBiopsychosocialSummaryClick("supportive_contact")
                }
              >
                <Ionicons name="heart-outline" size={12} color={COLORS.error} />
                <Text style={styles.bioSummaryEmotionChipText}>
                  {biopsychosocialSummary.contatoAcolhedor} com indicação de
                  contato acolhedor
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={styles.bioSummaryDescription}>
            {biopsychosocialSummary.totalEmRisco === 0
              ? "Sem alertas relevantes na fila de prioridades no momento."
              : biopsychosocialSummary.nextActionReason}
          </Text>
          <TouchableOpacity
            style={styles.bioSummaryAction}
            activeOpacity={0.85}
            onPress={() => handleBiopsychosocialSummaryClick("queue")}
          >
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.bioSummaryActionText}>
              {biopsychosocialSummary.nextActionLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.riskSection}>
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>
              {t("home.immediatePriorities")}
            </Text>
            <TouchableOpacity
              onPress={() => handleNavigation("PacientesAtencao")}
            >
              <Text style={styles.seeAllLink}>{t("home.openQueue")}</Text>
            </TouchableOpacity>
          </View>
          {pacientesRisco.length === 0 ? (
            <Text style={styles.noUpdatesText}>
              {t("home.noCriticalPatient")}
            </Text>
          ) : (
            pacientesRisco.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.pacienteId}
                style={styles.riskItem}
                onPress={() => handleRiskSuggestedAction(item, "open_patient")}
                activeOpacity={0.85}
              >
                <View style={styles.riskRowTop}>
                  <View style={styles.riskBadgesRow}>
                    <View style={styles.riskBadge}>
                      <Ionicons
                        name="warning-outline"
                        size={14}
                        color={COLORS.warning}
                      />
                      <Text style={styles.riskBadgeText}>
                        {t("home.risk", { value: item.risco })}
                      </Text>
                    </View>
                    {item.vulnerabilidadeEmocional ? (
                      <View style={styles.riskEmotionBadge}>
                        <Ionicons
                          name="heart-outline"
                          size={12}
                          color={COLORS.error}
                        />
                        <Text style={styles.riskEmotionBadgeText}>
                          Emocional
                        </Text>
                      </View>
                    ) : null}
                    {item.contextoFuncional ? (
                      <View style={styles.riskNeutralBadge}>
                        <Ionicons
                          name="body-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.riskNeutralBadgeText}>
                          Funcional
                        </Text>
                      </View>
                    ) : null}
                    {item.metaFuncional ? (
                      <View style={styles.riskNeutralBadge}>
                        <Ionicons
                          name="flag-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.riskNeutralBadgeText}>Meta</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.riskActionChip}
                    onPress={() => handleRiskSuggestedAction(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={12}
                      color={COLORS.primary}
                    />
                    <Text style={styles.riskActionChipText}>
                      {item.proximaAcaoLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.riskRowBottom}>
                  <View style={styles.riskMeta}>
                    <Text style={styles.riskName} numberOfLines={1}>
                      {item.pacienteNome}
                    </Text>
                    <Text style={styles.riskReason} numberOfLines={1}>
                      {item.motivo}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.gray400}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}</View>

        <View style={styles.updatesSection}>
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>
              {t("home.checkEngagementTitle")}
            </Text>
            <Text style={styles.seeAllLink}>
              {t("home.lastDays", {
                days: patientCheckEngagement?.windowDays ?? 7,
              })}
            </Text>
          </View>
          <View style={styles.checkEngagementGrid}>
            <View style={styles.checkEngagementItem}>
              <Text style={styles.checkEngagementValue}>
                {patientCheckEngagement?.checkClicks ?? 0}
              </Text>
              <Text style={styles.checkEngagementLabel}>
                {t("home.checkClicks")}
              </Text>
            </View>
            <View style={styles.checkEngagementItem}>
              <Text style={styles.checkEngagementValue}>
                {patientCheckEngagement?.checkinsSubmitted ?? 0}
              </Text>
              <Text style={styles.checkEngagementLabel}>
                {t("home.checkinsSent")}
              </Text>
            </View>
            <View style={styles.checkEngagementItem}>
              <Text style={styles.checkEngagementValue}>
                {(patientCheckEngagement?.conversionRate ?? 0)}%
              </Text>
              <Text style={styles.checkEngagementLabel}>
                {t("home.checkConversion")}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={styles.updatesSection}
          onLayout={(event) => {
            updatesSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>{t("home.updatesPatients")}</Text>
            <TouchableOpacity
              onPress={markUpdatesAsRead}
              disabled={updates.length === 0 || unreadUpdatesCount === 0}
            >
              <Text
                style={[
                  styles.seeAllLink,
                  (updates.length === 0 || unreadUpdatesCount === 0) &&
                    styles.seeAllLinkDisabled,
                ]}
              >
                {t("home.markRead")}
              </Text>
            </TouchableOpacity>
          </View>
          {updates.length === 0 ? (
            <Text style={styles.noUpdatesText}>{t("home.noUpdates")}</Text>
          ) : (
            <>
              {unreadUpdatesCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Ionicons
                    name="notifications-outline"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.unreadBadgeText}>
                    {t("home.unreadCount", { count: unreadUpdatesCount })}
                  </Text>
                </View>
              ) : null}
              {updates.slice(0, 3).map((update) => (
                <TouchableOpacity
                  key={update.checkinId}
                  style={styles.updateItem}
                  onPress={() =>
                    navigation.navigate("PacienteAdesao", {
                      pacienteId: update.pacienteId,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.updateIconWrap}>
                    <Ionicons
                      name={
                        update.concluiu ? "checkmark-circle" : "alert-circle"
                      }
                      size={16}
                      color={update.concluiu ? COLORS.success : COLORS.warning}
                    />
                  </View>
                  <View style={styles.updateTextWrap}>
                    <Text style={styles.updateTitle} numberOfLines={1}>
                      {update.pacienteNome} - {update.atividadeTitulo}
                    </Text>
                    <Text style={styles.updateSubtitle} numberOfLines={1}>
                      {update.concluiu
                        ? t("home.completedPain", {
                            before: update.dorAntes ?? "-",
                            after: update.dorDepois ?? "-",
                          })
                        : t("home.notCompletedReason", {
                            reason:
                              update.motivoNaoExecucao || t("home.noReason"),
                          })}
                    </Text>
                  </View>
                  <Text style={styles.updateTime}>
                    {new Date(update.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, styles.headerRowTitle]}>
              {t("home.recentPatients")}
            </Text>
            <TouchableOpacity onPress={() => handleNavigation("PacientesList")}>
              <Text style={styles.seeAllLink}>{t("home.viewAll")}</Text>
            </TouchableOpacity>
          </View>

          {pacientesRecentes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={COLORS.gray300}
              />
              <Text style={styles.emptyStateText}>
                {t("home.noPatientRegistered")}
              </Text>
              <Button
                title={t("home.registerFirstPatient")}
                onPress={() => handleNavigation("PacienteForm")}
                variant="outline"
                size="sm"
                style={{ marginTop: SPACING.md }}
              />
            </View>
          ) : (
            pacientesRecentes.slice(0, 4).map((paciente) => (
              <TouchableOpacity
                key={paciente.id}
                style={styles.recentItem}
                onPress={() =>
                  navigation.navigate("PacienteDetails", {
                    pacienteId: paciente.id,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>
                    {paciente.nomeCompleto.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {paciente.nomeCompleto}
                  </Text>
                  <Text style={styles.recentInfo} numberOfLines={1}>
                    {paciente.profissao || t("home.noProfessionInformed")}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.gray400}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.advancedToggle, { display: "none" }]}
          onPress={() => setShowAdvancedMetrics((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.advancedToggleTitle}>
            {t("home.advancedIndicators")}
          </Text>
          <View style={styles.advancedToggleRight}>
            <Text style={styles.advancedToggleSubtitle}>
              {showAdvancedMetrics ? t("common.hide") : t("common.show")}
            </Text>
            <Ionicons
              name={
                showAdvancedMetrics
                  ? "chevron-up-outline"
                  : "chevron-down-outline"
              }
              size={16}
              color={COLORS.primary}
            />
          </View>
        </TouchableOpacity>

        {showAdvancedMetrics ? (
          <>
            <View style={styles.dashboardSection}>
              <View style={styles.updatesHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.weeklyDashboard")}
                </Text>
                <Text style={styles.dashboardMeta}>{t("home.last7days")}</Text>
              </View>
              <View style={styles.dashboardGrid}>
                <View style={styles.dashboardCard}>
                  <Text style={styles.dashboardValue}>
                    {dashboardSemanal.adesao}%
                  </Text>
                  <Text style={styles.dashboardLabel}>
                    {t("home.adherence")}
                  </Text>
                </View>
                <View style={styles.dashboardCard}>
                  <Text
                    style={styles.dashboardValue}
                  >{`${dashboardSemanal.mediaDorAntes} -> ${dashboardSemanal.mediaDorDepois}`}</Text>
                  <Text style={styles.dashboardLabel}>{t("home.avgPain")}</Text>
                </View>
                <View style={styles.dashboardCard}>
                  <Text style={styles.dashboardValue}>
                    {dashboardSemanal.piora}
                  </Text>
                  <Text style={styles.dashboardLabel}>
                    {t("home.worsePain")}
                  </Text>
                </View>
              </View>
              <Text style={styles.dashboardInfo}>
                {t("home.checkins", {
                  completed: dashboardSemanal.concluidos,
                  total: dashboardSemanal.total,
                })}
              </Text>
            </View>

            <View style={styles.auditSection}>
              <View style={styles.updatesHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.clinicalFlowPanelTitle")}
                </Text>
                <Text style={styles.dashboardMeta}>
                  {t("home.last7days")}
                </Text>
              </View>
              {!clinicalFlowSummary ? (
                <Text style={styles.noUpdatesText}>
                  {t("home.noAuditData")}
                </Text>
              ) : (
                <>
                  <View style={styles.dashboardGrid}>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {clinicalFlowSummary.completed}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.clinicalStagesCompleted")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {clinicalFlowSummary.abandoned}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.clinicalStagesAbandoned")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {clinicalFlowSummary.blocked}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.clinicalStagesBlocked")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dashboardInfo}>
                    {t("home.clinicalAbandonRate", {
                      value: clinicalFlowSummary.abandonmentRate,
                    })}
                  </Text>
                  <Text style={styles.dashboardInfo}>
                    {t("home.clinicalAvgTimeByStage", {
                      anamnese: clinicalFlowSummary.avgDurationMsByStage.ANAMNESE
                        ? `${Math.round(
                            clinicalFlowSummary.avgDurationMsByStage.ANAMNESE / 1000,
                          )}s`
                        : "-",
                      exam: clinicalFlowSummary.avgDurationMsByStage.EXAME_FISICO
                        ? `${Math.round(
                            clinicalFlowSummary.avgDurationMsByStage.EXAME_FISICO /
                              1000,
                          )}s`
                        : "-",
                      evolucao: clinicalFlowSummary.avgDurationMsByStage.EVOLUCAO
                        ? `${Math.round(
                            clinicalFlowSummary.avgDurationMsByStage.EVOLUCAO / 1000,
                          )}s`
                        : "-",
                    })}
                  </Text>
                  {clinicalFlowSummary.topBlockedReasons.length > 0 ? (
                    <Text style={styles.dashboardInfo}>
                      {t("home.clinicalTopBlockers", {
                        first: `${getClinicalBlockedReasonLabel(
                          clinicalFlowSummary.topBlockedReasons[0].reason,
                        )} (${clinicalFlowSummary.topBlockedReasons[0].count})`,
                        second: clinicalFlowSummary.topBlockedReasons[1]
                          ? `${getClinicalBlockedReasonLabel(
                              clinicalFlowSummary.topBlockedReasons[1].reason,
                            )} (${clinicalFlowSummary.topBlockedReasons[1].count})`
                          : "-",
                      })}
                    </Text>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.auditSection}>
              <View style={styles.updatesHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.reliability24h")}
                </Text>
                <Text style={styles.dashboardMeta}>{t("home.localAudit")}</Text>
              </View>
              {!auditSummary ? (
                <Text style={styles.noUpdatesText}>
                  {t("home.noAuditData")}
                </Text>
              ) : (
                <>
                  <View style={styles.dashboardGrid}>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {auditSummary.total}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.auditedActions")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {auditSummary.byAction.CHECKIN_OFFLINE_SYNCED}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.offlineSync")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {auditSummary.byAction.CHECKIN_OFFLINE_SYNC_FAILED}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.syncFailures")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dashboardInfo}>
                    {t("home.auditSummary", {
                      validated: auditSummary.byAction.LAUDO_VALIDATED,
                      revalidation:
                        auditSummary.byAction.LAUDO_REVALIDATION_REQUIRED,
                      quickMessages: auditSummary.byAction.QUICK_MESSAGE_SENT,
                    })}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.auditSection}>
              <View style={styles.updatesHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.operationalHealth24h")}
                </Text>
                <TouchableOpacity onPress={handleManualSync}>
                  <Text style={styles.seeAllLink}>{t("home.syncNow")}</Text>
                </TouchableOpacity>
              </View>
              {!opsHealth ? (
                <Text style={styles.noUpdatesText}>{t("home.noOpsData")}</Text>
              ) : (
                <>
                  <View style={styles.dashboardGrid}>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {opsHealth.avgLatencyMs}ms
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.avgLatency")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {opsHealth.errorRate}%
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.errorRate")}
                      </Text>
                    </View>
                    <View style={styles.dashboardCard}>
                      <Text style={styles.dashboardValue}>
                        {opsHealth.syncRuns}
                      </Text>
                      <Text style={styles.dashboardLabel}>
                        {t("home.syncRuns")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dashboardInfo}>
                    {t("home.requestsErrorsLastSync", {
                      requests: opsHealth.totalRequests,
                      errors: opsHealth.errorRequests,
                      lastSync: opsHealth.lastSyncAt
                        ? new Date(opsHealth.lastSyncAt).toLocaleString("pt-BR")
                        : t("common.na"),
                    })}
                  </Text>
                  {queueStats ? (
                    <Text style={styles.dashboardInfo}>
                      {t("home.offlineQueue", {
                        total: queueStats.total,
                        ready: queueStats.readyToSync,
                        retry: queueStats.waitingRetry,
                      })}
                    </Text>
                  ) : null}
                  {queueStats &&
                  (queueStats.staleRemoved > 0 ||
                    queueStats.duplicateRemoved > 0) ? (
                    <Text style={styles.dashboardInfo}>
                      {t("home.autoCleanup", {
                        stale: queueStats.staleRemoved,
                        duplicates: queueStats.duplicateRemoved,
                      })}
                    </Text>
                  ) : null}
                  {isOperationallyDegraded ? (
                    <Text style={styles.degradationAlert}>
                      {t("home.opsDegradation")}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING["2xl"],
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
    gap: SPACING.xs,
  },
  greeting: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerRightButton: {
    padding: SPACING.xs,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  headerRightLogoutButton: {
    marginRight: SPACING.sm,
  },
  focusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  activationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    ...SHADOWS.sm,
  },
  activationCompletedCard: {
    borderColor: COLORS.success + "33",
  },
  activationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  activationHeaderMain: {
    flex: 1,
    alignItems: "flex-start",
  },
  activationTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  activationSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activationCloseButton: {
    padding: 4,
  },
  activationProgressTrack: {
    width: "100%",
    height: 7,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  activationProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  activationItem: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  activationItemMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  activationItemTextWrap: {
    flex: 1,
  },
  activationItemTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  activationItemTitleDone: {
    color: COLORS.success,
  },
  activationItemDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  activationItemButton: {
    alignSelf: "flex-start",
    marginTop: SPACING.xs,
    marginLeft: 26,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  activationItemButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  activationCompletionNote: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  activationCompletionActions: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    alignItems: "center",
  },
  activationSecondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  activationSecondaryButtonText: {
    color: COLORS.gray700,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  focusTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickActionsSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  quickActionsPrimaryWrap: {
    marginBottom: SPACING.sm,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  quickActionsGridCompact: {
    justifyContent: "flex-start",
    gap: SPACING.sm,
  },
  quickAction: {
    width: "48%",
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  quickActionPrimary: {
    width: "100%",
  },
  quickActionSecondary: {
    width: "31.5%",
  },
  quickActionSecondaryCompact: {
    width: "48%",
  },
  quickActionsMoreToggleRow: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    alignItems: "flex-start",
  },
  quickActionsMoreToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    backgroundColor: COLORS.primary + "0F",
  },
  quickActionsMoreToggleText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  quickActionSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  recentSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: SPACING.md,
  },
  headerRowTitle: {
    marginBottom: 0,
  },
  seeAllLink: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: SPACING.xs,
  },
  seeAllLinkDisabled: {
    color: COLORS.gray400,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  recentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary + "1F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  recentAvatarText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  recentMeta: {
    flex: 1,
  },
  recentName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  recentInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  updatesSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  updatesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  checkEngagementGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  checkEngagementItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkEngagementValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  checkEngagementLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + "18",
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  unreadBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  noUpdatesText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  updateItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  updateIconWrap: {
    marginRight: SPACING.sm,
  },
  updateTextWrap: {
    flex: 1,
  },
  updateTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  updateSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  updateTime: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginLeft: SPACING.sm,
  },
  riskSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  bioSummarySection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  bioSummaryStatsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  bioSummaryMiniCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: "center",
  },
  bioSummaryMiniValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  bioSummaryMiniLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: "center",
  },
  bioSummaryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.xs,
  },
  bioSummaryEmotionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.error + "12",
    borderWidth: 1,
    borderColor: COLORS.error + "2D",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  bioSummaryEmotionChipText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  bioSummaryNeutralChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "0D",
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  bioSummaryNeutralChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  bioSummaryDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  bioSummaryAction: {
    marginTop: SPACING.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + "2D",
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  bioSummaryActionText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  riskItem: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  riskRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  riskRowBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.warning + "1A",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  riskBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flexShrink: 1,
  },
  riskEmotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.error + "12",
    borderWidth: 1,
    borderColor: COLORS.error + "2D",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  riskEmotionBadgeText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  riskNeutralBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "0D",
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  riskNeutralBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  riskBadgeText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  riskMeta: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  riskName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  riskReason: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  riskActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "14",
    borderColor: COLORS.primary + "2D",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  riskActionChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  dashboardSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  dashboardMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  dashboardGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dashboardCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  dashboardLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: "center",
  },
  dashboardInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  auditSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  advancedToggle: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  advancedToggleTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  advancedToggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  advancedToggleSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  degradationAlert: {
    marginTop: SPACING.sm,
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
});




















