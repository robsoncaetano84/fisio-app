// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE HOME SCREEN
// ==========================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import { Atividade, PacienteProfileResponse, RootStackParamList } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import {
  api,
  ensurePatientDailyReminder,
  getBadgeLabel,
  getGamificationState,
  getOfflineCheckinQueueStats,
  syncOfflineCheckins,
  trackEvent,
} from "../../services";
import { useToast } from "../../components/ui";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  getExamErrorMessage,
  isAllowedExamFile,
  MAX_EXAME_SIZE_BYTES,
  withExamRetry,
} from "../../utils/examUpload";

const parseDatePreservingDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};
const getCurrentWeekday = () => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
};

type PacienteHomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteHome">;
};

interface PacienteExameItem {
  id: string;
  pacienteId: string;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  tipoExame?: string | null;
  observacao?: string | null;
  dataExame?: string | null;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

export function PacienteHomeScreen({ navigation }: PacienteHomeScreenProps) {
  const { usuario, logout, token } = useAuthStore();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [hasProfessionalLink, setHasProfessionalLink] = useState(false);
  const [hasAnamnesePreenchida, setHasAnamnesePreenchida] = useState(false);
  const [ultimaEvolucaoEm, setUltimaEvolucaoEm] = useState<string | null>(null);
  const [ultimoLaudoAtualizadoEm, setUltimoLaudoAtualizadoEm] = useState<string | null>(null);
  const [statusLaudo, setStatusLaudo] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<"laudo" | "plano" | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [selectedDia, setSelectedDia] = useState<number>(getCurrentWeekday());
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [streak, setStreak] = useState(0);
  const [badge, setBadge] = useState("Iniciante");
  const [pendingOfflineCheckins, setPendingOfflineCheckins] = useState(0);
  const [waitingRetryCheckins, setWaitingRetryCheckins] = useState(0);
  const [offlineOldestCreatedAt, setOfflineOldestCreatedAt] = useState<string | null>(null);
  const [syncingNow, setSyncingNow] = useState(false);
  const [exames, setExames] = useState<PacienteExameItem[]>([]);
  const [isLoadingExames, setIsLoadingExames] = useState(false);
  const [isUploadingExame, setIsUploadingExame] = useState(false);
  const [downloadingExameId, setDownloadingExameId] = useState<string | null>(null);
  const [removingExameId, setRemovingExameId] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const degradationTrackedRef = useRef(false);
  const onboardingStorageKey = `patient:onboarding:v1:${usuario?.id || "anon"}`;
  const smartReminderSnoozeKey = `patient:smart-reminder:snooze:${usuario?.id || "anon"}`;
  const weeklySummaryViewedKey = `patient:weekly-summary:viewed:${usuario?.id || "anon"}`;
  const [smartReminderSnoozedToday, setSmartReminderSnoozedToday] = useState(false);

  const onboardingSteps = [
    {
      title: t("patient.onboardingWelcomeTitle"),
      description: t("patient.onboardingWelcomeDescription"),
    },
    {
      title: t("patient.onboardingGoalTitle"),
      description: t("patient.onboardingGoalDescription"),
    },
    {
      title: t("patient.onboardingFirstCheckinTitle"),
      description: t("patient.onboardingFirstCheckinDescription"),
    },
  ];

  const statusLabel =
    statusLaudo === "VALIDADO_PROFISSIONAL"
      ? t("patient.statusValidated")
      : statusLaudo === "RASCUNHO_IA"
        ? t("patient.statusDraft")
        : t("patient.statusUnavailable");

  const atividadesPorDia = useMemo<Array<{ day: number; label: string; itens: Atividade[] }>>(() => {
    const groups = new Map<number, Atividade[]>();

    const sorted = [...atividades].sort((a, b) => {
      const dayA = a.diaPrescricao ?? 8;
      const dayB = b.diaPrescricao ?? 8;
      if (dayA !== dayB) return dayA - dayB;

      const orderA = a.ordemNoDia ?? 999;
      const orderB = b.ordemNoDia ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      const da = a.dataLimite
        ? parseDatePreservingDateOnly(a.dataLimite).getTime()
        : new Date(a.createdAt).getTime();
      const db = b.dataLimite
        ? parseDatePreservingDateOnly(b.dataLimite).getTime()
        : new Date(b.createdAt).getTime();
      return da - db;
    });

    for (const atividade of sorted) {
      const key = atividade.diaPrescricao ?? 8;
      const list = groups.get(key) || [];
      list.push(atividade);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([day, itens]) => ({
      day,
      label: day >= 1 && day <= 7 ? `Dia ${day}` : t("patient.noWeeklySchedule"),
      itens,
    }));
  }, [atividades]);

  const diaSelecionadoItens = useMemo(() => {
    const match = atividadesPorDia.find((item) => item.day === selectedDia);
    return match?.itens ?? [];
  }, [atividadesPorDia, selectedDia]);
  const diaAtualDaSemana = getCurrentWeekday();
  const atividadesHoje = useMemo(() => {
    const match = atividadesPorDia.find((item) => item.day === diaAtualDaSemana);
    return match?.itens ?? [];
  }, [atividadesPorDia, diaAtualDaSemana]);

  const atividadesConcluidas = useMemo(
    () => atividades.filter((item) => item.ultimoCheckinConcluiu === true).length,
    [atividades],
  );

  const metaSemanal = useMemo(() => {
    const total = atividades.length;
    if (!total) {
      return { total: 0, concluidas: 0, percentual: 0 };
    }
    const concluidas = atividadesConcluidas;
    const percentual = Math.min(100, Math.round((concluidas / total) * 100));
    return { total, concluidas, percentual };
  }, [atividades.length, atividadesConcluidas]);

  const planoDoDia = useMemo(() => {
    const total = diaSelecionadoItens.length;
    if (!total) {
      return {
        total: 0,
        concluidas: 0,
        percentual: 0,
        proximaAtividade: null as Atividade | null,
      };
    }

    const concluidas = diaSelecionadoItens.filter(
      (item) => item.ultimoCheckinConcluiu === true,
    ).length;
    const percentual = Math.min(100, Math.round((concluidas / total) * 100));
    const proximaAtividade =
      diaSelecionadoItens.find((item) => item.ultimoCheckinConcluiu !== true) || null;

    return {
      total,
      concluidas,
      percentual,
      proximaAtividade,
    };
  }, [diaSelecionadoItens]);
  const checksHoje = useMemo(() => {
    const total = atividadesHoje.length;
    const concluidos = atividadesHoje.filter(
      (item) => item.ultimoCheckinConcluiu === true,
    ).length;
    const pendentes = Math.max(0, total - concluidos);
    return { total, concluidos, pendentes };
  }, [atividadesHoje]);
  const proximaAtividadeHoje = useMemo(
    () => atividadesHoje.find((item) => item.ultimoCheckinConcluiu !== true) || null,
    [atividadesHoje],
  );
  const pendenciasHojePreview = useMemo(
    () =>
      atividadesHoje
        .filter((item) => item.ultimoCheckinConcluiu !== true)
        .slice(0, 3),
    [atividadesHoje],
  );

  const primeiraAtividadeDisponivel = useMemo(() => atividades[0] || null, [atividades]);
  const ultimaDataCheckin = useMemo(() => {
    const timestamps = atividades
      .map((item) =>
        item.ultimoCheckinEm ? new Date(item.ultimoCheckinEm).getTime() : null,
      )
      .filter((ts): ts is number => typeof ts === "number" && !Number.isNaN(ts));
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  }, [atividades]);
  const diasSemCheckin = useMemo(() => {
    if (!ultimaDataCheckin) return null;
    return Math.max(
      0,
      Math.floor((Date.now() - ultimaDataCheckin.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [ultimaDataCheckin]);
  const precisaRetomada = useMemo(() => {
    if (!hasProfessionalLink || atividades.length === 0) return false;
    if (diasSemCheckin === null) return true;
    return diasSemCheckin >= 2;
  }, [hasProfessionalLink, atividades.length, diasSemCheckin]);
  const mostrarSmartReminder = hasProfessionalLink && precisaRetomada && !smartReminderSnoozedToday;
  const resumoSemanal = useMemo(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - sevenDaysMs;
    const totalComRegistroSemana = atividades.filter((item) => {
      if (!item.ultimoCheckinEm) return false;
      const ts = new Date(item.ultimoCheckinEm).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    }).length;

    const concluidasSemana = atividades.filter((item) => {
      if (!item.ultimoCheckinEm || item.ultimoCheckinConcluiu !== true) return false;
      const ts = new Date(item.ultimoCheckinEm).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    }).length;

    const aderencia =
      totalComRegistroSemana > 0
        ? Math.round((concluidasSemana / totalComRegistroSemana) * 100)
        : 0;

    const mensagem =
      totalComRegistroSemana === 0
        ? t("patient.weeklySummaryMessageStart")
        : aderencia >= 70
          ? t("patient.weeklySummaryMessageGood")
          : t("patient.weeklySummaryMessageAttention");

    return {
      totalComRegistroSemana,
      concluidasSemana,
      aderencia,
      mensagem,
    };
  }, [atividades, t]);
  const isOfflineSyncDegraded = useMemo(
    () => waitingRetryCheckins >= 3 || pendingOfflineCheckins >= 8,
    [waitingRetryCheckins, pendingOfflineCheckins],
  );
  const downloadBaseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");

  const loadQueueStats = useCallback(async () => {
    const stats = await getOfflineCheckinQueueStats();
    setPendingOfflineCheckins(stats.total);
    setWaitingRetryCheckins(stats.waitingRetry);
    setOfflineOldestCreatedAt(stats.oldestCreatedAt);
  }, []);

  const formatFileSize = (sizeBytes?: number) => {
    const size = Number(sizeBytes || 0);
    if (!Number.isFinite(size) || size <= 0) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resolveAbsoluteDownloadUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    const safePath = path.startsWith("/") ? path : `/${path}`;
    return `${downloadBaseUrl}${safePath}`;
  };

  const loadExames = useCallback(
    async (targetPacienteId: string) => {
      setIsLoadingExames(true);
      try {
        const response = await withExamRetry(() =>
          api.get<PacienteExameItem[]>(`/pacientes/${targetPacienteId}/exames`),
        );
        const ordered = [...response.data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setExames(ordered);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setExames([]);
            return;
          }
        }
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const message = getExamErrorMessage(error, t, "patient", "load");
        trackEvent("patient_exam_load_failed", {
          pacienteId: targetPacienteId,
          status,
          error: message,
        }).catch(() => undefined);
        showToast({ type: "error", message });
      } finally {
        setIsLoadingExames(false);
      }
    },
    [showToast, t],
  );

  const handleUploadExame = async () => {
    if (!pacienteId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      if (!file?.uri || !file?.name) {
        showToast({ type: "error", message: t("patient.examUploadInvalidFile") });
        return;
      }
      if (typeof file.size === "number" && file.size > MAX_EXAME_SIZE_BYTES) {
        showToast({ type: "error", message: t("patient.examErrorTooLarge") });
        return;
      }

      const formData = new FormData();
      const lowerName = file.name.toLowerCase();
      const inferredMime =
        file.mimeType ||
        (lowerName.endsWith(".pdf")
          ? "application/pdf"
          : lowerName.endsWith(".png")
            ? "image/png"
            : lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
              ? "image/jpeg"
              : lowerName.endsWith(".webp")
                ? "image/webp"
                : "application/octet-stream");
      if (!isAllowedExamFile(file.name, inferredMime)) {
        showToast({ type: "error", message: t("patient.examErrorUnsupportedType") });
        return;
      }

      if (Platform.OS === "web") {
        const webAsset = file as DocumentPicker.DocumentPickerAsset & { file?: File };
        if (webAsset.file) {
          formData.append("file", webAsset.file, file.name);
        } else {
          const blob = await fetch(file.uri).then((res) => res.blob());
          formData.append("file", blob, file.name);
        }
      } else {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: inferredMime,
        } as unknown as Blob);
      }

      setIsUploadingExame(true);
      await withExamRetry(
        () =>
          api.post(`/pacientes/${pacienteId}/exames`, formData, {
            timeout: 120000,
            headers:
              Platform.OS === "web"
                ? undefined
                : {
                    "Content-Type": "multipart/form-data",
                  },
          }),
        1,
        700,
      );

      trackEvent("patient_exam_uploaded", {
        pacienteId,
        fileName: file.name,
        mimeType: inferredMime,
      }).catch(() => undefined);
      showToast({ type: "success", message: t("patient.examUploadedSuccess") });
      await loadExames(pacienteId);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = getExamErrorMessage(error, t, "patient", "upload");
      trackEvent("patient_exam_upload_failed", {
        pacienteId,
        status,
        error: message,
      }).catch(() => undefined);
      showToast({ type: "error", message });
    } finally {
      setIsUploadingExame(false);
    }
  };

  const handleOpenExame = async (item: PacienteExameItem) => {
    if (!pacienteId) return;
    let webPopup: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      webPopup = window.open("about:blank", "_blank");
    }
    setDownloadingExameId(item.id);
    try {
      if (Platform.OS === "web") {
        const response = await withExamRetry(
          () =>
            api.get<Blob>(`/pacientes/${pacienteId}/exames/${item.id}/arquivo`, {
              responseType: "blob",
            }),
          1,
          700,
        );
        const blobUrl = window.URL.createObjectURL(response.data);
        if (webPopup && !webPopup.closed) {
          webPopup.location.href = blobUrl;
        } else {
          window.open(blobUrl, "_blank");
        }
        window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      } else {
        const absoluteUrl = resolveAbsoluteDownloadUrl(item.downloadUrl);
        const safeName = String(item.nomeOriginal || `exame-${item.id}`)
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_{2,}/g, "_");
        const localPathBase =
          FileSystem.cacheDirectory || FileSystem.documentDirectory;
        if (!localPathBase) {
          throw new Error("no_local_storage_path");
        }
        const localUri = `${localPathBase}${Date.now()}-${safeName}`;
        const authHeader = token
          ? `Bearer ${token}`
          : String(api.defaults.headers.common.Authorization || "");

        await withExamRetry(
          () =>
            FileSystem.downloadAsync(absoluteUrl, localUri, {
              headers: authHeader ? { Authorization: authHeader } : undefined,
            }),
          1,
          700,
        );

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, {
            mimeType: item.mimeType,
            dialogTitle: t("patient.openExamDialogTitle"),
          });
        } else {
          await Linking.openURL(localUri);
        }
      }
    } catch (error) {
      if (webPopup && !webPopup.closed) {
        webPopup.close();
      }
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = getExamErrorMessage(error, t, "patient", "open");
      trackEvent("patient_exam_open_failed", {
        pacienteId,
        exameId: item.id,
        status,
        error: message,
      }).catch(() => undefined);
      showToast({ type: "error", message });
    } finally {
      setDownloadingExameId(null);
    }
  };

  const handleDeleteExame = async (exameId: string) => {
    if (!pacienteId) return;
    setRemovingExameId(exameId);
    try {
      await withExamRetry(() => api.delete(`/pacientes/${pacienteId}/exames/${exameId}`));
      setExames((prev) => prev.filter((item) => item.id !== exameId));
      trackEvent("patient_exam_removed", { pacienteId, exameId }).catch(() => undefined);
      showToast({ type: "success", message: t("patient.examRemoveSuccess") });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = getExamErrorMessage(error, t, "patient", "remove");
      trackEvent("patient_exam_remove_failed", {
        pacienteId,
        exameId,
        status,
        error: message,
      }).catch(() => undefined);
      showToast({ type: "error", message });
    } finally {
      setRemovingExameId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!usuario?.id) return () => undefined;

    AsyncStorage.getItem(onboardingStorageKey)
      .then((value) => {
        if (!mounted) return;
        if (value === "done") {
          setShowOnboarding(false);
          return;
        }
        setShowOnboarding(true);
        setOnboardingStep(0);
        trackEvent("patient_onboarding_started", {
          usuarioId: usuario.id,
        }).catch(() => undefined);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [onboardingStorageKey, usuario?.id]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(smartReminderSnoozeKey)
      .then((value) => {
        if (!mounted) return;
        const today = new Date().toISOString().slice(0, 10);
        setSmartReminderSnoozedToday(value === today);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [smartReminderSnoozeKey, usuario?.id]);

  useEffect(() => {
    if (!usuario?.id || !usuario?.role) return;
    ensurePatientDailyReminder(usuario.id)
      .then((created) => {
        if (created) {
          trackEvent("patient_reminder_scheduled", { usuarioId: usuario.id }).catch(
            () => undefined,
          );
        }
      })
      .catch(() => undefined);
  }, [usuario?.id, usuario?.role]);

  useEffect(() => {
    if (!usuario?.id) return;
    getGamificationState(usuario.id)
      .then((state) => {
        setStreak(state.streak);
        setBadge(getBadgeLabel(state.streak));
      })
      .catch(() => undefined);
  }, [usuario?.id, atividades]);

  useFocusEffect(
    useCallback(() => {
      syncOfflineCheckins()
        .then(({ synced, remaining }) => {
          setPendingOfflineCheckins(remaining);
          if (synced > 0) {
            showToast({
              message: t("patient.syncSuccess", { count: synced }),
              type: "success",
            });
          }
        })
        .catch(() => undefined);

      loadQueueStats().catch(() => undefined);

      return () => undefined;
    }, [loadQueueStats, showToast, t]),
  );

  useEffect(() => {
    if (!isOfflineSyncDegraded || degradationTrackedRef.current) return;
    degradationTrackedRef.current = true;
    trackEvent("patient_sync_degradation_alerted", {
      pending: pendingOfflineCheckins,
      waitingRetry: waitingRetryCheckins,
    }).catch(() => undefined);
  }, [isOfflineSyncDegraded, pendingOfflineCheckins, waitingRetryCheckins]);

  useEffect(() => {
    if (isOfflineSyncDegraded) return;
    degradationTrackedRef.current = false;
  }, [isOfflineSyncDegraded]);

  useEffect(() => {
    if (!hasProfessionalLink) return;
    const today = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem(weeklySummaryViewedKey)
      .then((value) => {
        if (value === today) return;
        return trackEvent("patient_weekly_summary_viewed", {
          total: resumoSemanal.totalComRegistroSemana,
          done: resumoSemanal.concluidasSemana,
          adherence: resumoSemanal.aderencia,
        }).then(() => AsyncStorage.setItem(weeklySummaryViewedKey, today));
      })
      .catch(() => undefined);
  }, [
    hasProfessionalLink,
    resumoSemanal.totalComRegistroSemana,
    resumoSemanal.concluidasSemana,
    resumoSemanal.aderencia,
    weeklySummaryViewedKey,
  ]);

  const loadMyProfile = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await api.get<PacienteProfileResponse>("/pacientes/me");
      const linked = !!response.data?.vinculado && !!response.data?.paciente?.id;

      setHasProfessionalLink(linked);
      setPacienteNome(response.data.paciente?.nomeCompleto || usuario?.nome || t("home.user"));
      setPacienteId(response.data.paciente?.id || null);
      setUltimaEvolucaoEm(response.data.resumo?.ultimaEvolucaoEm || null);
      setUltimoLaudoAtualizadoEm(response.data.resumo?.ultimoLaudoAtualizadoEm || null);
      setStatusLaudo(response.data.resumo?.statusLaudo || null);

      if (linked) {
        const linkedPacienteId = response.data.paciente?.id || null;
        if (linkedPacienteId) {
          await loadExames(linkedPacienteId);
        } else {
          setExames([]);
        }

        const atividadesResponse = await api.get<Atividade[]>("/atividades/minhas");
        setAtividades(atividadesResponse.data || []);
        if (atividadesResponse.data?.length) {
          const hasToday = atividadesResponse.data.some(
            (item) => item.diaPrescricao === diaAtualDaSemana,
          );
          const firstDay = atividadesResponse.data
            .map((item) => item.diaPrescricao)
            .find((day) => typeof day === "number" && day >= 1 && day <= 7);
          setSelectedDia(hasToday ? diaAtualDaSemana : firstDay || diaAtualDaSemana);
        }

        try {
          await api.get("/anamneses/me/latest");
          setHasAnamnesePreenchida(true);
        } catch {
          setHasAnamnesePreenchida(false);
        }
      } else {
        setAtividades([]);
        setHasAnamnesePreenchida(false);
        setExames([]);
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setHasProfessionalLink(false);
        setPacienteId(null);
        setPacienteNome(usuario?.nome || t("home.user"));
        setHasAnamnesePreenchida(false);
        setUltimaEvolucaoEm(null);
        setUltimoLaudoAtualizadoEm(null);
        setStatusLaudo(null);
        setAtividades([]);
        setExames([]);
      } else {
        showToast({
          message: t("patient.loadError"),
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const shouldUseManualRefresh = hasLoadedOnceRef.current;
      loadMyProfile(shouldUseManualRefresh).catch(() => undefined);
      hasLoadedOnceRef.current = true;
      return () => undefined;
    }, [usuario?.nome]),
  );
  const openMyPdf = async (type: "laudo" | "plano") => {
    let webPopup: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      webPopup = window.open("about:blank", "_blank");
    }
    try {
      setLoadingPdf(type);
      const authHeader = token
        ? `Bearer ${token}`
        : String(api.defaults.headers.common.Authorization || "");
      if (!authHeader) {
        showToast({ message: t("patient.sessionExpired"), type: "error" });
        return;
      }

      const endpoint =
        type === "laudo" ? "/laudos/self/pdf-laudo" : "/laudos/self/pdf-plano";
      if (Platform.OS === "web") {
        const absoluteUrl = resolveAbsoluteDownloadUrl(endpoint);
        const tokenValue = authHeader.replace(/^Bearer\s+/i, "").trim();
        const finalUrl = `${absoluteUrl}?token=${encodeURIComponent(tokenValue)}`;
        if (webPopup && !webPopup.closed) {
          webPopup.location.href = finalUrl;
        } else if (typeof window !== "undefined") {
          window.open(finalUrl, "_blank");
        }
      } else {
        const absoluteUrl = resolveAbsoluteDownloadUrl(endpoint);
        const localPathBase =
          FileSystem.cacheDirectory || FileSystem.documentDirectory;
        if (!localPathBase) {
          throw new Error("no_local_storage_path");
        }

        const fileName = type === "laudo" ? "laudo.pdf" : "plano.pdf";
        const localUri = `${localPathBase}${Date.now()}-${fileName}`;
        await FileSystem.downloadAsync(absoluteUrl, localUri, {
          headers: { Authorization: authHeader },
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, {
            mimeType: "application/pdf",
            dialogTitle: t("patient.openExamDialogTitle"),
          });
        } else {
          await Linking.openURL(localUri);
        }
      }
    } catch {
      if (webPopup && !webPopup.closed) {
        webPopup.close();
      }
      showToast({ message: t("patient.openPdfError"), type: "error" });
    } finally {
      setLoadingPdf(null);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncingNow(true);
      const { synced, remaining } = await syncOfflineCheckins({ force: true });
      await loadQueueStats();
      await trackEvent("patient_sync_manual", { synced, remaining });
      showToast({
        message: t("patient.manualSyncDone", { synced, remaining }),
        type: "success",
      });
    } catch {
      showToast({ message: t("patient.manualSyncError"), type: "error" });
    } finally {
      setSyncingNow(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(onboardingStorageKey, "done");
      setShowOnboarding(false);
      await trackEvent("patient_onboarding_completed", {
        usuarioId: usuario?.id,
      });
    } catch {
      setShowOnboarding(false);
    }
  };

  const nextOnboardingStep = async () => {
    const next = onboardingStep + 1;
    await trackEvent("patient_onboarding_step_completed", {
      usuarioId: usuario?.id,
      step: onboardingStep + 1,
    });
    if (next >= onboardingSteps.length) {
      await completeOnboarding();
      return;
    }
    setOnboardingStep(next);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerTopActions}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("PacienteForm", {
                pacienteId: pacienteId || undefined,
              })
            }
            style={styles.headerTopActionButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("patient.editMyData")}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={logout}
            style={[styles.headerTopActionButton, styles.headerTopLogoutButton]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.logout")}
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, logout, pacienteId, t]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("patient.areaTitle")}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t("patient.loadingData")}</Text>
        </View>
      ) : (
        <>
          {showOnboarding ? (
            <View style={[styles.card, styles.onboardingCard]}>
              <Text style={styles.onboardingLabel}>
                {t("patient.onboardingTitle", {
                  step: onboardingStep + 1,
                  total: onboardingSteps.length,
                })}
              </Text>
              <Text style={styles.sectionTitle}>{onboardingSteps[onboardingStep].title}</Text>
              <Text style={styles.item}>{onboardingSteps[onboardingStep].description}</Text>
              <View style={styles.onboardingActions}>
                <TouchableOpacity
                  onPress={completeOnboarding}
                  style={styles.onboardingSkip}
                  activeOpacity={0.8}
                >
                  <Text style={styles.onboardingSkipText}>{t("patient.skip")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => nextOnboardingStep().catch(() => undefined)}
                  style={styles.onboardingNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.onboardingNextText}>
                    {onboardingStep === onboardingSteps.length - 1
                      ? t("patient.finish")
                      : t("patient.next")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {pacienteId && !hasAnamnesePreenchida ? (
            <View style={[styles.card, styles.startCard]}>
              <Text style={styles.startTitle}>{t("patient.startHereTitle")}</Text>
              <Text style={styles.startDescription}>{t("patient.startHereDescription")}</Text>
              <TouchableOpacity
                  style={styles.startButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("AnamneseForm", {
                      pacienteId: pacienteId as string,
                      selfMode: true,
                      pacienteNome: pacienteNome || usuario?.nome || t("home.user"),
                    })
                  }
                >
                  <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
                  <Text style={styles.startButtonText}>{t("patient.startAnamnese")}</Text>
                </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.card}>
            <Text style={styles.welcome}>
              {t("patient.welcome", {
                name: pacienteNome || usuario?.nome || t("home.user"),
              })}
            </Text>
            <Text style={styles.subtitle}>
              {t("patient.exclusiveAccess")}
            </Text>
            {pacienteId ? (
              <TouchableOpacity
                style={styles.selfAnamneseButton}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("AnamneseForm", {
                    pacienteId: pacienteId as string,
                    selfMode: true,
                    pacienteNome: pacienteNome || usuario?.nome || t("home.user"),
                  })
                }
              >
                <Ionicons
                  name={hasAnamnesePreenchida ? "create-outline" : "document-text-outline"}
                  size={18}
                  color={COLORS.white}
                />
                <Text style={styles.selfAnamneseButtonText}>
                  {hasAnamnesePreenchida
                    ? t("patient.editMyAnamnese")
                    : t("patient.fillMyAnamnese")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {hasProfessionalLink ? (
            <View style={[styles.card, styles.checksCard]}>
              <Text style={styles.sectionTitle}>{t("patient.todayChecksTitle")}</Text>
              <Text style={styles.item}>
                {t("patient.todayChecksSummary", {
                  done: checksHoje.concluidos,
                  total: checksHoje.total,
                })}
              </Text>
              {checksHoje.total > 0 ? (
                <Text style={styles.item}>
                  {t("patient.todayChecksPending", { pending: checksHoje.pendentes })}
                </Text>
              ) : (
                <Text style={styles.item}>{t("patient.noActivityForDay")}</Text>
              )}
              {checksHoje.total > 0 && pendenciasHojePreview.length > 0 ? (
                <View style={styles.pendingChecksList}>
                  {pendenciasHojePreview.map((atividade) => (
                    <TouchableOpacity
                      key={atividade.id}
                      style={styles.pendingCheckItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        trackEvent("patient_home_check_click", {
                          source: "today_checks_list",
                          atividadeId: atividade.id,
                          atividadeTitulo: atividade.titulo,
                          pendentesHoje: checksHoje.pendentes,
                        }).catch(() => undefined);
                        navigation.navigate("PacienteAtividadeCheckin", {
                          atividadeId: atividade.id,
                          titulo: atividade.titulo,
                        });
                      }}
                    >
                      <Text style={styles.pendingCheckTitle} numberOfLines={1}>
                        {atividade.titulo}
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {(proximaAtividadeHoje || primeiraAtividadeDisponivel) ? (
                <TouchableOpacity
                  style={styles.guidedCheckinButton}
                  onPress={() => {
                    const target =
                      proximaAtividadeHoje || primeiraAtividadeDisponivel;
                    if (!target) return;
                    trackEvent("patient_home_check_click", {
                      source: "today_checks_cta",
                      atividadeId: target.id,
                      atividadeTitulo: target.titulo,
                      pendentesHoje: checksHoje.pendentes,
                    }).catch(() => undefined);
                    navigation.navigate("PacienteAtividadeCheckin", {
                      atividadeId: target.id,
                      titulo: target.titulo,
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                  <Text style={styles.guidedCheckinText}>
                    {t("patient.todayChecksAction")}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {!hasProfessionalLink ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("patient.noLinkTitle")}</Text>
              <Text style={styles.item}>{t("patient.noLinkDescription")}</Text>
              <Text style={styles.item}>{t("patient.noLinkHint")}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("patient.weekGoal")}</Text>
            <Text style={styles.item}>
              {t("patient.progress", {
                done: metaSemanal.concluidas,
                total: metaSemanal.total || "-",
              })}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${metaSemanal.percentual}%` }]} />
            </View>
            <Text style={styles.item}>{t("patient.percentDone", { value: metaSemanal.percentual })}</Text>
            {primeiraAtividadeDisponivel ? (
              <TouchableOpacity
                style={styles.guidedCheckinButton}
                onPress={() =>
                  navigation.navigate("PacienteAtividadeCheckin", {
                    atividadeId: primeiraAtividadeDisponivel.id,
                    titulo: primeiraAtividadeDisponivel.titulo,
                  })
                }
                activeOpacity={0.85}
              >
                <Ionicons name="flash-outline" size={16} color={COLORS.white} />
                <Text style={styles.guidedCheckinText}>{t("patient.firstGuidedCheckin")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {hasProfessionalLink ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("patient.gamification")}</Text>
            <View style={styles.gamificationRow}>
              <View style={styles.gamificationItem}>
                <Text style={styles.gamificationValue}>{streak}</Text>
                <Text style={styles.gamificationLabel}>{t("patient.streakDays")}</Text>
              </View>
              <View style={styles.gamificationBadge}>
                <Ionicons name="trophy-outline" size={16} color={COLORS.warning} />
                <Text style={styles.gamificationBadgeText}>{t("patient.badge", { badge })}</Text>
              </View>
            </View>
            {pendingOfflineCheckins > 0 ? (
              <Text style={styles.pendingSyncText}>
                {t("patient.pendingSync", { count: pendingOfflineCheckins })}
              </Text>
            ) : null}
            {waitingRetryCheckins > 0 ? (
              <Text style={styles.pendingSyncText}>
                {t("patient.waitingRetry", { count: waitingRetryCheckins })}
              </Text>
            ) : null}
            {offlineOldestCreatedAt ? (
              <Text style={styles.pendingSyncText}>
                {t("patient.oldestItem", {
                  date: new Date(offlineOldestCreatedAt).toLocaleString("pt-BR"),
                })}
              </Text>
            ) : null}
            {isOfflineSyncDegraded ? (
              <Text style={styles.syncAlertText}>{t("patient.syncDegradation")}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.syncNowButton, syncingNow && styles.syncNowButtonDisabled]}
              onPress={() => handleManualSync().catch(() => undefined)}
              activeOpacity={0.85}
              disabled={syncingNow}
            >
              {syncingNow ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={14} color={COLORS.white} />
                  <Text style={styles.syncNowButtonText}>{t("patient.syncOfflineNow")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          ) : null}

          {hasProfessionalLink ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("patient.clinicalSummary")}</Text>
            <Text style={styles.item}>
              {t("patient.lastEvolution", {
                date: ultimaEvolucaoEm
                  ? new Date(ultimaEvolucaoEm).toLocaleDateString("pt-BR")
                  : t("patient.notRegistered"),
              })}
            </Text>
            <Text style={styles.item}>
              {t("patient.lastReportUpdated", {
                date: ultimoLaudoAtualizadoEm
                  ? new Date(ultimoLaudoAtualizadoEm).toLocaleDateString("pt-BR")
                  : t("patient.notRegisteredMale"),
              })}
            </Text>
            <Text style={styles.item}>
              {t("patient.reportStatus", { status: statusLabel })}
            </Text>
            <View style={styles.pdfActions}>
              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => openMyPdf("laudo")}
                activeOpacity={0.85}
                disabled={loadingPdf !== null}
              >
                {loadingPdf === "laudo" ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.white} />
                    <Text style={styles.pdfButtonText}>{t("patient.myReportPdf")}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfButton, styles.pdfButtonSecondary]}
                onPress={() => openMyPdf("plano")}
                activeOpacity={0.85}
                disabled={loadingPdf !== null}
              >
                {loadingPdf === "plano" ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="medkit-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.pdfButtonSecondaryText}>{t("patient.myPlanPdf")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          ) : null}

          {hasProfessionalLink ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("patient.recentDocuments")}</Text>
            <View style={styles.documentItem}>
              <View style={styles.documentMeta}>
                <Text style={styles.documentTitle}>{t("patient.myReportPdf")}</Text>
                <Text style={styles.documentInfo}>
                  {t("patient.updatedAt", {
                    date: ultimoLaudoAtualizadoEm
                      ? new Date(ultimoLaudoAtualizadoEm).toLocaleDateString("pt-BR")
                      : t("patient.unavailableDate"),
                  })}
                </Text>
                <View style={styles.documentStatusRow}>
                  <Ionicons
                    name={
                      statusLaudo === "VALIDADO_PROFISSIONAL"
                        ? "checkmark-circle"
                        : "time-outline"
                    }
                    size={14}
                    color={
                      statusLaudo === "VALIDADO_PROFISSIONAL"
                        ? COLORS.success
                        : COLORS.warning
                    }
                  />
                  <Text
                    style={[
                      styles.documentStatusText,
                      statusLaudo === "VALIDADO_PROFISSIONAL"
                        ? styles.documentStatusApproved
                        : styles.documentStatusDraft,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.documentAction}
                onPress={() => openMyPdf("laudo")}
                activeOpacity={0.85}
                disabled={loadingPdf !== null}
              >
                {loadingPdf === "laudo" ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name="open-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.documentItem}>
              <View style={styles.documentMeta}>
                <Text style={styles.documentTitle}>{t("patient.treatmentPlan")}</Text>
                <Text style={styles.documentInfo}>
                  {t("patient.updatedAt", {
                    date: ultimoLaudoAtualizadoEm
                      ? new Date(ultimoLaudoAtualizadoEm).toLocaleDateString("pt-BR")
                      : t("patient.unavailableDate"),
                  })}
                </Text>
                <Text style={styles.documentInfo}>{t("patient.formatPdf")}</Text>
              </View>
              <TouchableOpacity
                style={styles.documentAction}
                onPress={() => openMyPdf("plano")}
                activeOpacity={0.85}
                disabled={loadingPdf !== null}
              >
                {loadingPdf === "plano" ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name="open-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          ) : null}

          {hasProfessionalLink ? (
          <View style={styles.card}>
            <View style={styles.examsHeaderRow}>
              <Text style={styles.sectionTitle}>{t("patient.documentsExams")}</Text>
              <TouchableOpacity
                style={[
                  styles.attachExamButton,
                  isUploadingExame && styles.attachExamButtonDisabled,
                ]}
                onPress={() => handleUploadExame().catch(() => undefined)}
                activeOpacity={0.85}
                disabled={isUploadingExame}
              >
                {isUploadingExame ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="attach-outline" size={16} color={COLORS.white} />
                    <Text style={styles.attachExamButtonText}>
                      {t("patient.attachExam")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {isLoadingExames ? (
              <View style={styles.examsLoadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.item}>{t("patient.loadingExams")}</Text>
              </View>
            ) : exames.length === 0 ? (
              <Text style={styles.item}>{t("patient.noExamsAttached")}</Text>
            ) : (
              exames.map((item) => (
                <View key={item.id} style={styles.exameCard}>
                  <View style={styles.exameHeader}>
                    <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                    <View style={styles.exameHeaderTextWrap}>
                      <Text numberOfLines={1} style={styles.exameTitle}>
                        {item.nomeOriginal}
                      </Text>
                      <Text style={styles.exameMeta}>
                        {formatFileSize(item.tamanhoBytes)} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exameActionsRow}>
                    <TouchableOpacity
                      style={styles.exameActionButton}
                      onPress={() => handleOpenExame(item).catch(() => undefined)}
                      activeOpacity={0.85}
                      disabled={downloadingExameId === item.id}
                    >
                      {downloadingExameId === item.id ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <>
                          <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.exameActionText}>
                            {t("patient.openExamAction")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.exameActionButton, styles.exameDeleteButton]}
                      onPress={() => handleDeleteExame(item.id).catch(() => undefined)}
                      activeOpacity={0.85}
                      disabled={removingExameId === item.id}
                    >
                      {removingExameId === item.id ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                          <Text style={styles.exameDeleteText}>
                            {t("patient.removeExamAction")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
          ) : null}

          {hasProfessionalLink ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("patient.dailyPlanTitle")}</Text>
              <Text style={styles.item}>
                {t("patient.dailyGoal", {
                  count: planoDoDia.total || 0,
                })}
              </Text>
              <Text style={styles.item}>
                {t("patient.dailyProgress", {
                  done: planoDoDia.concluidas,
                  total: planoDoDia.total || 0,
                })}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${planoDoDia.percentual}%` }]}
                />
              </View>
              {planoDoDia.total > 0 ? (
                <Text style={styles.item}>
                  {t("patient.percentDone", { value: planoDoDia.percentual })}
                </Text>
              ) : (
                <Text style={styles.item}>{t("patient.noActivityForDay")}</Text>
              )}

              {planoDoDia.proximaAtividade ? (
                <TouchableOpacity
                  style={styles.guidedCheckinButton}
                  onPress={() =>
                    navigation.navigate("PacienteAtividadeCheckin", {
                      atividadeId: planoDoDia.proximaAtividade!.id,
                      titulo: planoDoDia.proximaAtividade!.titulo,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="play-outline" size={16} color={COLORS.white} />
                  <Text style={styles.guidedCheckinText}>
                    {planoDoDia.concluidas > 0
                      ? t("patient.dailyContinue")
                      : t("patient.dailyStartFirst")}
                  </Text>
                </TouchableOpacity>
              ) : planoDoDia.total > 0 ? (
                <View style={styles.dailyDoneBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.dailyDoneText}>{t("patient.dailyDone")}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {mostrarSmartReminder ? (
            <View style={[styles.card, styles.smartReminderCard]}>
              <Text style={styles.sectionTitle}>{t("patient.smartReminderTitle")}</Text>
              <Text style={styles.item}>
                {diasSemCheckin === null
                  ? t("patient.smartReminderNoRecentCheckin")
                  : t("patient.smartReminderNeedAction", { days: diasSemCheckin })}
              </Text>
              {(planoDoDia.proximaAtividade || primeiraAtividadeDisponivel) ? (
                <TouchableOpacity
                  style={styles.smartReminderButton}
                  onPress={() => {
                    const target = planoDoDia.proximaAtividade || primeiraAtividadeDisponivel;
                    if (!target) return;
                    trackEvent("patient_smart_reminder_cta_clicked", {
                      atividadeId: target.id,
                      diasSemCheckin,
                    }).catch(() => undefined);
                    navigation.navigate("PacienteAtividadeCheckin", {
                      atividadeId: target.id,
                      titulo: target.titulo,
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flash-outline" size={16} color={COLORS.white} />
                  <Text style={styles.smartReminderButtonText}>
                    {t("patient.smartReminderAction")}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.smartReminderSecondaryButton}
                onPress={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setSmartReminderSnoozedToday(true);
                  AsyncStorage.setItem(smartReminderSnoozeKey, today).catch(
                    () => undefined,
                  );
                  trackEvent("patient_smart_reminder_snoozed", {
                    diasSemCheckin,
                  }).catch(() => undefined);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.smartReminderSecondaryButtonText}>
                  {t("patient.smartReminderLater")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {hasProfessionalLink ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("patient.weeklySummaryTitle")}</Text>
              <Text style={styles.item}>
                {t("patient.weeklySummaryStats", {
                  done: resumoSemanal.concluidasSemana,
                  total: resumoSemanal.totalComRegistroSemana,
                })}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(0, Math.min(100, resumoSemanal.aderencia))}%` },
                  ]}
                />
              </View>
              <Text style={styles.item}>
                {t("patient.weeklySummaryAdherence", {
                  value: resumoSemanal.aderencia,
                })}
              </Text>
              <Text style={styles.weeklySummaryHint}>{resumoSemanal.mensagem}</Text>
            </View>
          ) : null}

          {hasProfessionalLink ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("patient.myActivities")}</Text>
            {atividades.length === 0 ? (
              <Text style={styles.item}>{t("patient.noAssignedActivity")}</Text>
            ) : (
              <>
                <View style={styles.dayTabs}>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayTab, selectedDia === day && styles.dayTabActive]}
                      onPress={() => setSelectedDia(day)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dayTabText,
                          selectedDia === day && styles.dayTabTextActive,
                        ]}
                      >
                        D{day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.dayTitle}>{t("patient.dayPlan", { day: selectedDia })}</Text>
                {diaSelecionadoItens.length === 0 ? (
                  <Text style={styles.item}>{t("patient.noActivityForDay")}</Text>
                ) : (
                  diaSelecionadoItens.map((atividade: Atividade) => (
                    <View key={atividade.id} style={styles.activityItem}>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityTitle}>
                          {atividade.ordemNoDia ? `${atividade.ordemNoDia}. ` : ""}
                          {atividade.titulo}
                        </Text>
                        <Text style={styles.activityInfo}>
                          {atividade.ultimoCheckinConcluiu === true
                            ? t("patient.lastCheckDone")
                            : atividade.ultimoCheckinConcluiu === false
                              ? t("patient.lastCheckNotDone")
                              : t("patient.noCheckYet")}
                        </Text>
                        {atividade.descricao ? (
                          <Text style={styles.activityInfo} numberOfLines={2}>
                            {atividade.descricao}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={styles.activityAction}
                        onPress={() =>
                          navigation.navigate("PacienteAtividadeCheckin", {
                            atividadeId: atividade.id,
                            titulo: atividade.titulo,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={
                            atividade.ultimoCheckinConcluiu === true
                              ? "checkmark-done-outline"
                              : "create-outline"
                          }
                          size={16}
                          color={COLORS.white}
                        />
                          <Text style={styles.activityActionText}>{t("patient.check")}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {atividadesPorDia.some((grupo) => grupo.day === 8) ? (
                  <View style={styles.dayGroup}>
                    <Text style={styles.dayTitle}>{t("patient.noWeeklySchedule")}</Text>
                    {atividadesPorDia
                      .find((grupo) => grupo.day === 8)
                      ?.itens.map((atividade) => (
                        <View key={atividade.id} style={styles.activityItem}>
                          <View style={styles.activityMeta}>
                            <Text style={styles.activityTitle}>{atividade.titulo}</Text>
                            <Text style={styles.activityInfo}>
                              {atividade.dataLimite
                                ? t("patient.deadline", {
                                    date: parseDatePreservingDateOnly(
                                      atividade.dataLimite,
                                    ).toLocaleDateString("pt-BR"),
                                  })
                                : t("patient.noDeadline")}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.activityAction}
                            onPress={() =>
                              navigation.navigate("PacienteAtividadeCheckin", {
                                atividadeId: atividade.id,
                                titulo: atividade.titulo,
                              })
                            }
                            activeOpacity={0.85}
                          >
                            <Ionicons name="create-outline" size={16} color={COLORS.white} />
                            <Text style={styles.activityActionText}>{t("patient.check")}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
          ) : null}
        </>
      )}

          {hasProfessionalLink ? (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("patient.soon")}</Text>
        <Text style={styles.item}>{t("patient.soonPlan")}</Text>
        <Text style={styles.item}>{t("patient.soonEvolutions")}</Text>
        <Text style={styles.item}>{t("patient.soonDocs")}</Text>
      </View>
          ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={logout}
          activeOpacity={0.85}
        >
          <Ionicons name="information-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>{t("common.exit")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  headerTopActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
    gap: SPACING.xs,
  },
  headerTopActionButton: {
    padding: SPACING.xs,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  headerTopLogoutButton: {
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  languageWrap: {
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  loadingBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  welcome: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  item: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  checksCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingChecksList: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  pendingCheckItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
  },
  pendingCheckTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    flex: 1,
    marginRight: SPACING.xs,
  },
  examsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  attachExamButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  attachExamButtonDisabled: {
    opacity: 0.7,
  },
  attachExamButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  examsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  exameCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  exameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  exameHeaderTextWrap: {
    flex: 1,
  },
  exameTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  exameMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  exameActionsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  exameActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 34,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  exameActionText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  exameDeleteButton: {
    borderColor: COLORS.error,
  },
  exameDeleteText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: "auto",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.xs,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
  },
  pdfActions: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  pdfButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  pdfButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  pdfButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  documentItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  documentMeta: {
    flex: 1,
    gap: 2,
  },
  documentTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  documentInfo: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  documentStatusRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  documentStatusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  documentStatusApproved: {
    color: COLORS.success,
  },
  documentStatusDraft: {
    color: COLORS.warning,
  },
  documentAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.sm,
  },
  dayGroup: {
    marginBottom: SPACING.sm,
  },
  dayTabs: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    flexWrap: "wrap",
  },
  dayTab: {
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  dayTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayTabText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  dayTabTextActive: {
    color: COLORS.white,
  },
  dayTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  activityItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  activityMeta: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  activityTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginBottom: 2,
  },
  activityInfo: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  activityAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  activityActionText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  onboardingCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
  },
  onboardingLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  onboardingActions: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  onboardingSkip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  onboardingSkipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  onboardingNext: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  onboardingNextText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.gray200,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.success,
  },
  guidedCheckinButton: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  guidedCheckinText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  dailyDoneBadge: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.success + "1A",
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.success + "55",
  },
  dailyDoneText: {
    color: COLORS.success,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  smartReminderCard: {
    borderWidth: 1,
    borderColor: COLORS.warning + "66",
    backgroundColor: COLORS.warning + "10",
  },
  smartReminderButton: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  smartReminderButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  smartReminderSecondaryButton: {
    marginTop: SPACING.xs,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  smartReminderSecondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  weeklySummaryHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  selfAnamneseButton: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  selfAnamneseButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  gamificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gamificationItem: {
    alignItems: "flex-start",
  },
  gamificationValue: {
    color: COLORS.primary,
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "700",
  },
  gamificationLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  gamificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.warning + "1A",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
  },
  gamificationBadgeText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  pendingSyncText: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  syncAlertText: {
    marginTop: SPACING.xs,
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  syncNowButton: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  syncNowButtonDisabled: {
    opacity: 0.6,
  },
  startCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    backgroundColor: "#F4FBF7",
  },
  startTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  startDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  startButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sizes.md,
  },

  syncNowButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
});























