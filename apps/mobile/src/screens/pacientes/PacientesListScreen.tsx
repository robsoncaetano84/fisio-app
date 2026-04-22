// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTES LIST SCREEN
// ==========================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../components/ui";
import { api, cachedGet, trackEvent, quickActionIcon } from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useQuickActions } from "../../hooks/useQuickActions";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import {
  RootStackParamList,
  Paciente,
  PacienteCicloStatus,
  PacientesAttentionFocus,
  PacientesListQuickAction,
} from "../../types";

type PacientesListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacientesList">;
  route: RouteProp<RootStackParamList, "PacientesList">;
};

type PacientesQuickFilter =
  | "NONE"
  | "HIGH_RISK"
  | "NO_EVOLUTION"
  | "LAST_SESSION_LATE"
  | "PENDING";

// Componente de Card do Paciente
interface PacienteCardProps {
  paciente: Paciente;
  onPress: () => void;
  onPressAnamnese: () => void;
  onPressEvolucao: () => void;
  onPressExameFisico: () => void;
  attentionLabel?: string | null;
  quickAction?: PacientesListQuickAction;
  clinicalStateChips?: string[];
}

const PacienteCard = React.memo(function PacienteCard({
  paciente,
  onPress,
  onPressAnamnese,
  onPressEvolucao,
  onPressExameFisico,
  attentionLabel,
  quickAction,
  clinicalStateChips = [],
}: PacienteCardProps) {
  const { t } = useLanguage();
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onPress} activeOpacity={0.7}>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {paciente.nomeCompleto.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{paciente.nomeCompleto}</Text>
          <Text style={styles.cardDetails}>
            {(paciente.idade ?? "-")} {t("patients.years")} -{" "}
            {paciente.profissao || t("home.noProfessionInformed")}
          </Text>
          {!!paciente.pacienteUsuarioId && (
            <View style={styles.appAccessBadge}>
              <Ionicons
                name="phone-portrait-outline"
                size={12}
                color={COLORS.success}
              />
              <Text style={styles.appAccessBadgeText}>{t("patients.appAccessActive")}</Text>
            </View>
          )}
          <View style={styles.cardContact}>
            <Ionicons name="logo-whatsapp" size={14} color={COLORS.success} />
            <Text style={styles.cardPhone}>
              {formatPhone(paciente.contato.whatsapp)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
      </TouchableOpacity>

      <View style={styles.cardActions}>
        {clinicalStateChips.length > 0 ? (
          <View style={styles.stateChipsRow}>
            {clinicalStateChips.map((chip) => (
              <View key={`${paciente.id}-${chip}`} style={styles.stateChip}>
                <Text style={styles.stateChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!!attentionLabel && (
          <View style={styles.attentionBadge}>
            <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
            <Text style={styles.attentionText}>{attentionLabel}</Text>
          </View>
        )}
        {quickAction ? (
          <TouchableOpacity style={styles.quickModeActionButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={quickAction === "ANAMNESE" ? t("patients.selectForAnamnesis") : quickAction === "EVOLUCAO" ? t("patients.selectForEvolution") : t("patients.selectForPhysicalExam")}> 
            <Ionicons
              name={quickActionIcon(quickAction)}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.quickModeActionText}>
              {quickAction === "ANAMNESE" ? t("patients.selectForAnamnesis") : quickAction === "EVOLUCAO" ? t("patients.selectForEvolution") : t("patients.selectForPhysicalExam")}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={onPressAnamnese} accessibilityRole="button" accessibilityLabel="Anamnese">
              <Ionicons name="clipboard-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText} numberOfLines={1}>Anamnese</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPressExameFisico}
              accessibilityRole="button"
              accessibilityLabel={t("home.physicalExam")}
            >
              <Ionicons name="fitness-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText} numberOfLines={1}>{t("home.physicalExam")}</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={onPressEvolucao} accessibilityRole="button" accessibilityLabel={t("home.evolution")}> 
              <Ionicons
                name="trending-up-outline"
                size={18}
                color={COLORS.secondary}
              />
              <Text style={styles.actionText} numberOfLines={1}>{t("home.evolution")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export function PacientesListScreen({ navigation, route }: PacientesListScreenProps) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const {
    pacientes,
    isLoading,
    isLoadingMore,
    hasNextPage,
    totalPacientes,
    fetchPacientes,
    fetchNextPacientes,
  } = usePacienteStore();
  const { anamneses } = useAnamneseStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(
    !!route.params?.attentionOnly,
  );
  const [attentionFocus, setAttentionFocus] = useState<PacientesAttentionFocus | null>(
    route.params?.attentionFocus || null,
  );
  const [quickFilter, setQuickFilter] = useState<PacientesQuickFilter>("NONE");
  const [attentionMap, setAttentionMap] = useState<
    Record<string, number | null | undefined>
  >({});
  const { showToast } = useToast();
  const { logout } = useAuthStore();
  const usuarioId = useAuthStore((state) => state.usuario?.id);
  const [attentionRefreshTick, setAttentionRefreshTick] = useState(0);
  const quickAction = route.params?.quickAction;
  const hasAnyActiveFilter = attentionOnly || quickFilter !== "NONE" || !!attentionFocus;
  const isHomeSummaryContext = route.params?.attentionSource === "HOME_SUMMARY";
  const filtersStorageKey = useMemo(
    () => `patients:list:filters:v1:${usuarioId || "anon"}`,
    [usuarioId],
  );
  const hasAnamneseByPacienteId = useMemo(() => {
    const ids = new Set<string>();
    anamneses.forEach((item) => {
      if (item.pacienteId) ids.add(item.pacienteId);
    });
    return ids;
  }, [anamneses]);
  const { selectPatient } = useQuickActions(navigation);
  const isCompactLayout = width < 920;

  const attentionFocusLabel = useMemo(() => {
    if (attentionFocus === "HIGH_RISK") return t("patients.focusHighRisk");
    if (attentionFocus === "EMOTIONAL") return t("patients.focusEmotional");
    if (attentionFocus === "FUNCTIONAL") return t("patients.focusFunctional");
    if (attentionFocus === "GOAL") return t("patients.focusGoal");
    return null;
  }, [attentionFocus, t]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(filtersStorageKey)
      .then((raw) => {
        if (!mounted || !raw || quickAction) return;
        const parsed = JSON.parse(raw) as {
          attentionOnly?: boolean;
          quickFilter?: PacientesQuickFilter;
          attentionFocus?: PacientesAttentionFocus | null;
        };
        if (route.params?.attentionOnly !== undefined) return;
        setAttentionOnly(!!parsed.attentionOnly);
        if (parsed.quickFilter) setQuickFilter(parsed.quickFilter);
        if (parsed.attentionFocus) setAttentionFocus(parsed.attentionFocus);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [filtersStorageKey, quickAction, route.params?.attentionOnly]);

  useEffect(() => {
    if (quickAction) return;
    AsyncStorage.setItem(
      filtersStorageKey,
      JSON.stringify({
        attentionOnly,
        quickFilter,
        attentionFocus,
      }),
    ).catch(() => undefined);
  }, [filtersStorageKey, quickAction, attentionOnly, quickFilter, attentionFocus]);

  useEffect(() => {
    fetchPacientes(true).catch(async (error) => {
      // Se já há dados renderizados, trata como falha de refresh em background
      // para evitar toast genérico e ruidoso.
      if (pacientes.length > 0) {
        return;
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          showToast({
            message:
              status === 403
                ? t("patients.listForbidden")
                : t("patient.sessionExpired"),
            type: "error",
          });
          await logout().catch(() => undefined);
          return;
        }
      }
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    });
  }, [fetchPacientes, logout, pacientes.length, showToast, t]);

  useFocusEffect(
    useCallback(() => {
      // Recalcula o estado de atencao ao voltar para esta tela.
      setAttentionRefreshTick((prev) => prev + 1);
      fetchPacientes(true).catch(() => undefined);
    }, [fetchPacientes]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setAttentionOnly(!!route.params?.attentionOnly);
  }, [route.params?.attentionOnly]);

  useEffect(() => {
    setAttentionFocus(route.params?.attentionFocus || null);
  }, [route.params?.attentionFocus]);

  useEffect(() => {
    // Ao abrir a lista pelo menu/fluxo normal, evita reaplicar filtros antigos
    // que podem esconder pacientes recém-cadastrados por outra sessão da mesma conta.
    if (quickAction || isHomeSummaryContext) return;
    if (route.params?.attentionOnly !== undefined) return;
    if (route.params?.attentionFocus !== undefined) return;

    setAttentionOnly(false);
    setAttentionFocus(null);
    setQuickFilter("NONE");
  }, [
    quickAction,
    isHomeSummaryContext,
    route.params?.attentionOnly,
    route.params?.attentionFocus,
  ]);

  useEffect(() => {
    if (route.params?.attentionSource !== "HOME_SUMMARY") return;
    if (!route.params?.attentionOnly) return;
    setAttentionOnly(true);
    setAttentionFocus(route.params?.attentionFocus || null);
    setQuickFilter("NONE");
    setSearchQuery("");
    setDebouncedQuery("");
  }, [
    route.params?.attentionSource,
    route.params?.attentionOnly,
    route.params?.attentionFocus,
  ]);

  const filteredPacientes = useMemo(() => {
    const query = debouncedQuery.toLowerCase();
    const cpfQuery = debouncedQuery.replace(/\D/g, "");
    const emotionalByPaciente = new Map(
      anamneses.map((a) => [a.pacienteId, a] as const),
    );
    return pacientes.filter((p) => {
      const cpfPaciente = (p.cpf || "").replace(/\D/g, "");
      const matchesSearch =
        p.nomeCompleto.toLowerCase().includes(query) ||
        (cpfQuery.length > 0 && cpfPaciente.includes(cpfQuery));
      if (!matchesSearch) return false;

      const days = attentionMap[p.id];
      const hasAttentionValue = typeof days === "number" || days === null;
      const inAttention = hasAttentionValue && (days === null || (typeof days === "number" && days > 7));

      if (attentionOnly && !inAttention) return false;

      if (attentionOnly && attentionFocus === "HIGH_RISK") {
        if (!(days === null || (typeof days === "number" && days > 14))) return false;
      }

      if (attentionOnly && attentionFocus === "EMOTIONAL") {
        const ultimaAnamnese = emotionalByPaciente.get(p.id);
        if (!ultimaAnamnese) return false;
        const isEmotionalFocus =
          (ultimaAnamnese.nivelEstresse ?? 0) >= 8 ||
          (typeof ultimaAnamnese.energiaDiaria === "number" && ultimaAnamnese.energiaDiaria <= 3) ||
          (typeof ultimaAnamnese.apoioEmocional === "number" && ultimaAnamnese.apoioEmocional <= 3) ||
          (typeof ultimaAnamnese.qualidadeSono === "number" && ultimaAnamnese.qualidadeSono <= 3);
        if (!isEmotionalFocus) return false;
      }

      if (attentionOnly && attentionFocus === "FUNCTIONAL") {
        const ultimaAnamnese = emotionalByPaciente.get(p.id);
        if (!ultimaAnamnese) return false;
        const isFunctionalFocus =
          !!ultimaAnamnese.limitacoesFuncionais?.trim() ||
          !!ultimaAnamnese.atividadesQuePioram?.trim();
        if (!isFunctionalFocus) return false;
      }

      if (attentionOnly && attentionFocus === "GOAL") {
        const ultimaAnamnese = emotionalByPaciente.get(p.id);
        if (!ultimaAnamnese?.metaPrincipalPaciente?.trim()) return false;
      }

      if (quickFilter === "HIGH_RISK") {
        if (!(days === null || (typeof days === "number" && days > 14))) return false;
      }

      if (quickFilter === "NO_EVOLUTION") {
        if (days !== null) return false;
      }

      if (quickFilter === "LAST_SESSION_LATE") {
        if (!(typeof days === "number" && days > 7)) return false;
      }

      if (quickFilter === "PENDING") {
        const missingLink = false;
        const missingAnamnese = !hasAnamneseByPacienteId.has(p.id);
        const pendingSession = days === null || (typeof days === "number" && days > 7);
        if (!(missingLink || missingAnamnese || pendingSession)) return false;
      }


      if (
        quickAction &&
        (quickAction === "EVOLUCAO" || quickAction === "EXAME_FISICO") &&
        !hasAnamneseByPacienteId.has(p.id)
      ) {
        return false;
      }

      return true;
    });
  }, [
    pacientes,
    debouncedQuery,
    attentionOnly,
    attentionMap,
    attentionFocus,
    anamneses,
    quickFilter,
    quickAction,
    hasAnamneseByPacienteId,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadAttentionStatus = async () => {
      if (!pacientes.length) {
        if (mounted) setAttentionMap({});
        return;
      }

      try {
        const response = await cachedGet<Record<string, number | null>>(
          api,
          "/pacientes/attention",
          undefined,
          20_000,
        );
        if (!mounted) return;
        setAttentionMap(response || {});
      } catch {
        if (!mounted) return;
        setAttentionMap({});
      }
    };

    loadAttentionStatus();

    return () => {
      mounted = false;
    };
  }, [pacientes, attentionRefreshTick]);

  useEffect(() => {
    const notifyAttention = async () => {
      const attentionCount = Object.values(attentionMap).filter((days) => {
        if (typeof days !== "number" && days !== null) return false;
        return days === null || days > 7;
      }).length;

      if (!attentionCount) return;

      const todayKey = `attention-notice:${new Date().toISOString().slice(0, 10)}`;
      const alreadyShown = await AsyncStorage.getItem(todayKey);
      if (alreadyShown) return;

      Alert.alert(
        t("patients.attentionTitle"),
        t("patients.attentionMessage", { count: attentionCount }),
      );
      await AsyncStorage.setItem(todayKey, "1");
    };

    notifyAttention().catch(() => undefined);
  }, [attentionMap]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    if (filteredPacientes.length > 0) return;
    trackEvent("patients_list_filter_changed", {
      filter: "search_empty_state",
      queryLength: debouncedQuery.trim().length,
    }).catch(() => undefined);
  }, [debouncedQuery, filteredPacientes.length]);

  const clearQuickActionMode = useCallback(
    (reason: "manual" | "selected") => {
      if (!quickAction) return;
      trackEvent("quick_action_mode_cancelled", { action: quickAction, reason }).catch(
        () => undefined,
      );
      navigation.setParams({ quickAction: undefined });
    },
    [navigation, quickAction],
  );

  const executeQuickAction = useCallback(
    (action: PacientesListQuickAction, pacienteId: string, source: "card" | "cta") => {
      selectPatient(action, pacienteId, source, () => clearQuickActionMode("selected")).catch(
        () => undefined,
      );
    },
    [clearQuickActionMode, selectPatient],
  );

  const handlePacientePress = useCallback(
    (paciente: Paciente) => {
      if (quickAction) {
        executeQuickAction(quickAction, paciente.id, "card");
        return;
      }
      navigation.navigate("PacienteDetails", { pacienteId: paciente.id });
    },
    [navigation, quickAction, executeQuickAction, showToast, t],
  );

  const handleAnamnesePress = useCallback(
    (paciente: Paciente) => {
      if (quickAction === "ANAMNESE") {
        executeQuickAction("ANAMNESE", paciente.id, "cta");
        return;
      }
      navigation.navigate("AnamneseForm", { pacienteId: paciente.id });
    },
    [navigation, quickAction, executeQuickAction, showToast, t],
  );

  const handleEvolucaoPress = useCallback(
    (paciente: Paciente) => {
      if (!hasAnamneseByPacienteId.has(paciente.id)) {
        showToast({
          type: "info",
          message: t("patients.guardAnamnesisBeforeEvolution"),
        });
        trackEvent("clinical_flow_blocked", {
          stage: "EVOLUCAO",
          reason: "MISSING_ANAMNESE",
          pacienteId: paciente.id,
          source: "PacientesList",
        }).catch(() => undefined);
        return;
      }
      if (quickAction === "EVOLUCAO") {
        executeQuickAction("EVOLUCAO", paciente.id, "cta");
        return;
      }
      navigation.navigate("EvolucaoForm", { pacienteId: paciente.id });
    },
    [
      navigation,
      quickAction,
      executeQuickAction,
      hasAnamneseByPacienteId,
      showToast,
      t,
    ],
  );

  const handleExameFisicoPress = useCallback(
    (paciente: Paciente) => {
      if (!hasAnamneseByPacienteId.has(paciente.id)) {
        showToast({
          type: "info",
          message: t("patients.guardAnamnesisBeforePhysicalExam"),
        });
        trackEvent("clinical_flow_blocked", {
          stage: "EXAME_FISICO",
          reason: "MISSING_ANAMNESE",
          pacienteId: paciente.id,
          source: "PacientesList",
        }).catch(() => undefined);
        return;
      }
      if (quickAction === "EXAME_FISICO") {
        executeQuickAction("EXAME_FISICO", paciente.id, "cta");
        return;
      }
      navigation.navigate("ExameFisicoForm", { pacienteId: paciente.id });
    },
    [
      navigation,
      quickAction,
      executeQuickAction,
      hasAnamneseByPacienteId,
      showToast,
      t,
    ],
  );

  const quickActionLabelByType: Record<PacientesListQuickAction, string> = {
    ANAMNESE: t("patients.selectForNewAnamnesis"),
    EVOLUCAO: t("patients.selectForNewEvolution"),
    EXAME_FISICO: t("patients.selectForNewPhysicalExam"),
  };

  const quickFilters: Array<{ key: PacientesQuickFilter; label: string }> = [
    { key: "HIGH_RISK", label: t("patients.filterHighRisk") },
    { key: "NO_EVOLUTION", label: t("patients.filterNoEvolution") },
    { key: "LAST_SESSION_LATE", label: t("patients.filterLastSessionLate") },
    { key: "PENDING", label: t("patients.filterPending") },
  ];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPacientes(true);
      setAttentionRefreshTick((prev) => prev + 1);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          showToast({
            message:
              status === 403
                ? t("patients.listForbidden")
                : t("patient.sessionExpired"),
            type: "error",
          });
          await logout().catch(() => undefined);
          return;
        }
      }
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setRefreshing(false);
    }
  }, [fetchPacientes, showToast, logout]);

  const handleLoadMore = useCallback(async () => {
    if (debouncedQuery || attentionOnly) return;
    try {
      await fetchNextPacientes();
    } catch {
      // silêncio para não poluir UX durante scroll
    }
  }, [attentionOnly, debouncedQuery, fetchNextPacientes]);

  const renderPaciente = useCallback(
    ({ item }: { item: Paciente }) => {
      const hasAnamnese = hasAnamneseByPacienteId.has(item.id);
      const days = attentionMap[item.id];
      const hasNoEvolution = days === null;

      const clinicalStateChips: string[] = [];
      if (item.statusCiclo === PacienteCicloStatus.AGUARDANDO_ANAMNESE) {
        clinicalStateChips.push(t("patients.cycleAwaitingAnamnesis"));
      } else if (item.statusCiclo === PacienteCicloStatus.EM_TRATAMENTO) {
        clinicalStateChips.push(t("patients.cycleInTreatment"));
      } else if (item.statusCiclo === PacienteCicloStatus.ALTA_CONCLUIDA) {
        clinicalStateChips.push(t("patients.cycleCompleted"));
      }

      if (!hasAnamnese) {
        clinicalStateChips.push(t("patients.stateNoAnamnesis"));
      } else {
        clinicalStateChips.push(t("patients.stateReadyForPhysicalExam"));
      }
      if (hasNoEvolution) {
        clinicalStateChips.push(t("patients.stateNoEvolution"));
      }
      if (hasAnamnese && hasNoEvolution) {
        clinicalStateChips.push(t("patients.statePendingReport"));
      }

      return (
        <PacienteCard
          paciente={item}
          onPress={() => handlePacientePress(item)}
          onPressAnamnese={() => handleAnamnesePress(item)}
          onPressEvolucao={() => handleEvolucaoPress(item)}
          onPressExameFisico={() => handleExameFisicoPress(item)}
          quickAction={quickAction}
          clinicalStateChips={clinicalStateChips}
          attentionLabel={
            attentionMap[item.id] === null
              ? t("patients.highRiskNoEvolution")
              : attentionMap[item.id] !== undefined && attentionMap[item.id]! > 14
                ? t("patients.highRiskDaysNoEvolution", { days: attentionMap[item.id]! })
                : attentionMap[item.id] !== undefined && attentionMap[item.id]! > 7
                  ? t("patients.mediumRiskDaysNoEvolution", { days: attentionMap[item.id]! })
                  : null
          }
        />
      );
    },
    [
      handleAnamnesePress,
      handleEvolucaoPress,
      handleExameFisicoPress,
      handlePacientePress,
      attentionMap,
      quickAction,
      hasAnamneseByPacienteId,
      t,
    ],
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>{t("patients.noneFound")}</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? t("patients.tryOtherSearch")
          : t("patients.registerFirst")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("patients.searchByNameOrCpf")}
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {filteredPacientes.length}
          {debouncedQuery || attentionOnly ? "" : ` ${t("patients.of")} ${totalPacientes}`}{" "}
          {t("patients.foundCount")}
        </Text>
        {!quickAction ? (
          <TouchableOpacity
            style={[
              styles.attentionFilterButton,
              attentionOnly && styles.attentionFilterButtonActive,
            ]}
            onPress={() => {
              const next = !attentionOnly;
              setAttentionOnly(next);
              trackEvent("patients_list_filter_changed", {
                filter: "attention_only",
                next,
              }).catch(() => undefined);
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={attentionOnly ? COLORS.white : COLORS.warning}
            />
            <Text
              style={[
                styles.attentionFilterText,
                attentionOnly && styles.attentionFilterTextActive,
              ]}
            >
              {t("patients.attentionOnly")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {!quickAction ? (
        <View
          style={[
            styles.quickFiltersRow,
            isCompactLayout && styles.quickFiltersRowCompact,
          ]}
        >
          {quickFilters.map((filter) => {
            const active = quickFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.quickFilterChip, active && styles.quickFilterChipActive]}
                onPress={() => {
                  const next = quickFilter === filter.key ? "NONE" : filter.key;
                  setQuickFilter(next);
                  trackEvent("patients_list_filter_changed", {
                    filter: filter.key,
                    next,
                  }).catch(() => undefined);
                }}
              >
                <Text style={[styles.quickFilterChipText, active && styles.quickFilterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {hasAnyActiveFilter ? (
            <TouchableOpacity
              style={styles.clearFiltersChip}
              onPress={() => {
                setAttentionOnly(false);
                setAttentionFocus(null);
                setQuickFilter("NONE");
                setSearchQuery("");
                setDebouncedQuery("");
                navigation.setParams({
                  attentionOnly: undefined,
                  attentionFocus: undefined,
                  attentionSource: undefined,
                });
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={COLORS.gray700} />
              <Text style={styles.clearFiltersChipText}>{t("patients.clearFilters")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {attentionOnly && attentionFocusLabel && !quickAction ? (
        <View
          style={[
            styles.attentionFocusBanner,
            isCompactLayout && styles.attentionFocusBannerCompact,
          ]}
        >
          <View style={styles.attentionFocusBadge}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} />
            <Text style={styles.attentionFocusBadgeText}>{attentionFocusLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.attentionFocusClearButton}
            onPress={() => {
              setAttentionFocus(null);
              navigation.setParams({ attentionFocus: undefined });
            }}
          >
            <Text style={styles.attentionFocusClearText}>{t("patients.clearFocus")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {quickAction ? (
        <View style={styles.quickActionHint}>
          <View style={styles.quickActionHintLeft}>
            <Ionicons name="flash-outline" size={14} color={COLORS.primary} />
            <Text style={styles.quickActionHintText}>{quickActionLabelByType[quickAction]}</Text>
          </View>
          <TouchableOpacity
            style={styles.quickActionCancelButton}
            onPress={() => clearQuickActionMode("manual")}
          >
            <Text style={styles.quickActionCancelText}>{t("common.exit")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredPacientes}
          keyExtractor={(item) => item.id}
          renderItem={renderPaciente}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={140}
          removeClippedSubviews
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : !debouncedQuery && !attentionOnly && hasNextPage ? (
              <View style={styles.footerHint}>
                <Text style={styles.footerHintText}>{t("patients.scrollLoadMore")}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      {!quickAction ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("PacienteForm", {})}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  counterContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attentionFocusBanner: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  attentionFocusBannerCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  attentionFocusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + "2D",
    backgroundColor: COLORS.primary + "10",
    flexShrink: 1,
  },
  attentionFocusBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  attentionFocusClearButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
  },
  attentionFocusClearText: {
    color: COLORS.gray700,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  counterText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  quickFiltersRow: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  quickFiltersRowCompact: {
    gap: SPACING.xs,
  },
  quickFilterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
  },
  quickFilterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "14",
  },
  quickFilterChipText: {
    color: COLORS.gray700,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  quickFilterChipTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  clearFiltersChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
  },
  clearFiltersChipText: {
    color: COLORS.gray700,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  quickActionHint: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "11",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    justifyContent: "space-between",
  },
  quickActionHintLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  quickActionHintText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    flex: 1,
  },
  quickActionCancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
  },
  quickActionCancelText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING["4xl"],
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.white,
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardName: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  cardDetails: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardContact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  appAccessBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.success + "55",
    backgroundColor: COLORS.success + "22",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  appAccessBadgeText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  cardPhone: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  stateChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  stateChip: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  stateChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    width: "100%",
  },
  attentionBadge: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  attentionText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.gray100,
  },
  quickModeActionButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  quickModeActionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "700",
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  attentionFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  attentionFilterButtonActive: {
    backgroundColor: COLORS.warning,
  },
  attentionFilterText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  attentionFilterTextActive: {
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING["4xl"],
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  footerHint: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  footerHintText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  fab: {
    position: "absolute",
    right: SPACING.base,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
});
































