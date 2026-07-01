// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE DETAILS SCREEN
// ==========================================

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../components/ui";
import {
  usePacienteStore,
  type PacientePayload,
} from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useEvolucaoStore } from "../../stores/evolucaoStore";
import { useLaudoStore } from "../../stores/laudoStore";
import {
  api,
  buildCareTimeline,
  getAuditEntries,
  getClinicalOrchestratorNextAction,
  clinicalFlowReadinessCopyKeys,
  getClinicalFlowGuard,
  getClinicalFlowNextStep,
  getClinicalFlowStageStatus,
  recordAuditAction,
  toAuditRef,
  trackEvent,
  type AuditEntry,
  type ClinicalFlowAction,
  type ClinicalFlowGuard,
  type ClinicalFlowStageStatus,
  type ClinicalOrchestratorNextActionResponse,
} from "../../services";
import {
  getExamErrorMessage,
  inferExamMimeType,
  isAllowedExamFile,
  MAX_EXAME_SIZE_BYTES,
  withExamRetry,
} from "../../utils/examUpload";
import { createNativeUploadFile } from "../../utils/formDataUpload";
import { useAuthStore } from "../../stores/authStore";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import {
  LaudoStatus,
  AnamneseOrigem,
  PacienteCicloStatus,
  PacienteVinculoStatus,
  RootStackParamList,
  UserRole,
} from "../../types";
import {
  getMotivoBuscaLabel,
  parseDatePreservingDateOnly,
  usePacienteDetailsSummaries,
  type NextBestActionCode,
} from "./hooks/usePacienteDetailsSummaries";
import { PatientDetailsSection } from "./components/PatientDetailsSection";
import { PatientAppAccessCard } from "./components/PatientAppAccessCard";
import { CareTimeline, type CareTimelineViewItem } from "../../components/clinical/CareTimeline";

type PacienteDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteDetails">;
  route: RouteProp<RootStackParamList, "PacienteDetails">;
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

export function PacienteDetailsScreen({
  navigation,
  route,
}: PacienteDetailsScreenProps) {
  const { t, language } = useLanguage();
  const tSafe = (key: string, fallback: string) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };
  const { pacienteId } = route.params;
  const { getPacienteById, updatePaciente, fetchPacienteById } =
    usePacienteStore();
  const {
    anamneses,
    fetchAnamnesesByPaciente,
    getAnamneseById,
    validateAnamnese,
  } =
    useAnamneseStore();
  const { evolucoes, fetchEvolucoesByPaciente, getEvolucaoById } =
    useEvolucaoStore();
  const { fetchLaudoByPaciente } = useLaudoStore();
  const { showToast } = useToast();
  const actorId = useAuthStore((state) => state.usuario?.id);
  const viewerRole = useAuthStore((state) => state.usuario?.role);
  const authToken = useAuthStore((state) => state.token);
  const [exames, setExames] = useState<PacienteExameItem[]>([]);
  const [isLoadingExames, setIsLoadingExames] = useState(false);
  const [isUploadingExame, setIsUploadingExame] = useState(false);
  const [downloadingExameId, setDownloadingExameId] = useState<string | null>(
    null,
  );
  const [removingExameId, setRemovingExameId] = useState<string | null>(null);
  const [updatingAnamnesePermission, setUpdatingAnamnesePermission] =
    useState(false);
  const [validatingAnamneseId, setValidatingAnamneseId] = useState<
    string | null
  >(null);
  const [lastEmotionalSupportContactAt, setLastEmotionalSupportContactAt] =
    useState<string | null>(null);
  const [visibleAuditEntries, setVisibleAuditEntries] = useState<AuditEntry[]>(
    [],
  );
  const [showAllQuickMessages, setShowAllQuickMessages] = useState(false);
  const [showAllExames, setShowAllExames] = useState(false);
  const [laudoSnapshot, setLaudoSnapshot] = useState<{
    id: string;
    exameFisico?: string;
    condutas?: string;
    status?: LaudoStatus;
    updatedAt?: string;
    publicadoPacienteEm?: string | null;
  } | null>(null);
  const [orchestratorNextAction, setOrchestratorNextAction] =
    useState<ClinicalOrchestratorNextActionResponse | null>(null);
  const paciente = getPacienteById(pacienteId);

  const cicloStatusUi = useMemo(() => {
    const status = paciente?.statusCiclo;
    if (status === PacienteCicloStatus.ALTA_CONCLUIDA) {
      return {
        label: t("patients.cycleCompleted"),
        icon: "checkmark-circle-outline" as const,
        containerStyle: styles.cycleBadgeCompleted,
        textStyle: styles.cycleBadgeTextCompleted,
      };
    }
    if (status === PacienteCicloStatus.EM_TRATAMENTO) {
      return {
        label: t("patients.cycleInTreatment"),
        icon: "pulse-outline" as const,
        containerStyle: styles.cycleBadgeInTreatment,
        textStyle: styles.cycleBadgeTextInTreatment,
      };
    }
    return {
      label: t("patients.cycleAwaitingAnamnesis"),
      icon: "time-outline" as const,
      containerStyle: styles.cycleBadgeAwaiting,
      textStyle: styles.cycleBadgeTextAwaiting,
    };
  }, [paciente?.statusCiclo, t]);

  const applyLaudoSnapshot = React.useCallback(
    (
      laudo: {
        id: string;
        exameFisico?: string;
        condutas?: string;
        status?: LaudoStatus;
        updatedAt?: string;
        publicadoPacienteEm?: string | null;
      } | null,
    ) => {
      if (!laudo?.id) {
        setLaudoSnapshot(null);
        return;
      }
      setLaudoSnapshot({
        id: laudo.id,
        exameFisico: laudo.exameFisico,
        condutas: laudo.condutas,
        status: laudo.status,
        updatedAt: laudo.updatedAt,
        publicadoPacienteEm: laudo.publicadoPacienteEm,
      });
    },
    [],
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      fetchPacienteById(pacienteId).catch(() => undefined);
      fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
      fetchEvolucoesByPaciente(pacienteId).catch(() => undefined);
      fetchLaudoByPaciente(pacienteId, false)
        .then((laudo) => {
          if (!active) return;
          applyLaudoSnapshot(laudo);
        })
        .catch(() => {
          if (!active) return;
          setLaudoSnapshot(null);
        });
      getClinicalOrchestratorNextAction(pacienteId)
        .then((response) => {
          if (!active) return;
          setOrchestratorNextAction(response);
        })
        .catch(() => {
          if (!active) return;
          setOrchestratorNextAction(null);
        });
      return () => {
        active = false;
      };
    }, [
      applyLaudoSnapshot,
      fetchAnamnesesByPaciente,
      fetchEvolucoesByPaciente,
      fetchLaudoByPaciente,
      fetchPacienteById,
      pacienteId,
    ]),
  );

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{t("patientDetails.notFound")}</Text>
          <Button
            title={t("common.back")}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate("PacientesList");
            }}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    fetchAnamnesesByPaciente(pacienteId).catch((error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          return;
        }
        if (status === 403) {
          showToast({
            message: t("patientDetails.noPermissionAnamnesis"),
            type: "error",
          });
          return;
        }
      }
      showToast({
        message: t("patientDetails.loadAnamnesisError"),
        type: "error",
      });
    });
    fetchEvolucoesByPaciente(pacienteId).catch((error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          return;
        }
        if (status === 403) {
          showToast({
            message: t("patientDetails.noPermissionEvolution"),
            type: "error",
          });
          return;
        }
      }
      showToast({
        message: t("patientDetails.loadEvolutionError"),
        type: "error",
      });
    });
  }, [pacienteId]);

  useEffect(() => {
    getAuditEntries(200)
      .then((entries) => {
        const pacienteAuditRef = toAuditRef(pacienteId);
        setVisibleAuditEntries(
          entries
            .filter((entry) => entry.metadata?.pacienteId === pacienteAuditRef)
            .slice(0, 8),
        );
        const last = entries.find(
          (entry) =>
            entry.action === "QUICK_MESSAGE_SENT" &&
            entry.metadata?.pacienteId === pacienteAuditRef &&
            entry.metadata?.templateId === "EMOTIONAL_SUPPORT",
        );
        setLastEmotionalSupportContactAt(last?.at || null);
      })
      .catch(() => {
        setVisibleAuditEntries([]);
        setLastEmotionalSupportContactAt(null);
      });
  }, [pacienteId]);

  const handleWhatsApp = () => {
    const phone = paciente.contato.whatsapp.replace(/\D/g, "");
    Linking.openURL(`whatsapp://send?phone=55${phone}`);
  };

  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const downloadBaseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");

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

  const loadExames = async () => {
    setIsLoadingExames(true);
    try {
      const response = await withExamRetry(() =>
        api.get<PacienteExameItem[]>(`/pacientes/${pacienteId}/exames`),
      );
      const ordered = [...response.data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setExames(ordered);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          setExames([]);
          return;
        }
      }
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const message = getExamErrorMessage(error, t, "patientDetails", "load");
      trackEvent("patient_exam_load_failed", {
        pacienteId,
        status,
        error: message,
      }).catch(() => undefined);
      showToast({ type: "error", message });
    } finally {
      setIsLoadingExames(false);
    }
  };

  const handleUploadExame = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      if (!file?.uri || !file?.name) {
        showToast({
          type: "error",
          message: t("patientDetails.examUploadInvalidFile"),
        });
        return;
      }
      if (typeof file.size === "number" && file.size > MAX_EXAME_SIZE_BYTES) {
        showToast({
          type: "error",
          message: t("patientDetails.examErrorTooLarge"),
        });
        return;
      }

      const formData = new FormData();
      const inferredMime = inferExamMimeType(file.name, file.mimeType);
      if (!isAllowedExamFile(file.name, inferredMime)) {
        showToast({
          type: "error",
          message: t("patientDetails.examErrorUnsupportedType"),
        });
        return;
      }
      if (Platform.OS === "web") {
        const webAsset = file as DocumentPicker.DocumentPickerAsset & {
          file?: File;
        };
        if (webAsset.file) {
          formData.append("file", webAsset.file, file.name);
        } else {
          const blob = await fetch(file.uri).then((res) => res.blob());
          formData.append("file", blob, file.name);
        }
      } else {
        formData.append(
          "file",
          createNativeUploadFile({
            uri: file.uri,
            name: file.name,
            type: inferredMime,
          }),
        );
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
      showToast({
        type: "success",
        message: t("patientDetails.examUploadedSuccess"),
      });
      await loadExames();
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const message = getExamErrorMessage(error, t, "patientDetails", "upload");
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
    let webPopup: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      webPopup = window.open("about:blank", "_blank");
    }
    setDownloadingExameId(item.id);
    try {
      if (Platform.OS === "web") {
        const response = await withExamRetry(
          () =>
            api.get<Blob>(
              `/pacientes/${pacienteId}/exames/${item.id}/arquivo`,
              {
                responseType: "blob",
              },
            ),
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
        const authHeader = authToken
          ? `Bearer ${authToken}`
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
            dialogTitle: t("patientDetails.openExamDialogTitle"),
          });
        } else {
          await Linking.openURL(localUri);
        }
      }
    } catch (error) {
      if (webPopup && !webPopup.closed) {
        webPopup.close();
      }
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const message = getExamErrorMessage(error, t, "patientDetails", "open");
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
    setRemovingExameId(exameId);
    try {
      await withExamRetry(() =>
        api.delete(`/pacientes/${pacienteId}/exames/${exameId}`),
      );
      setExames((prev) => prev.filter((item) => item.id !== exameId));
      trackEvent("patient_exam_removed", { pacienteId, exameId }).catch(
        () => undefined,
      );
      showToast({
        type: "success",
        message: t("patientDetails.examRemoveSuccess"),
      });
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const message = getExamErrorMessage(error, t, "patientDetails", "remove");
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
    loadExames().catch(() => undefined);
  }, [pacienteId]);

  const quickMessagesSectionTitleRaw = t("patientDetails.quickMessages");
  const quickMessagesSectionTitle =
    quickMessagesSectionTitleRaw.trim().toLowerCase() === "meninos"
      ? "Mensagens rápidas"
      : quickMessagesSectionTitleRaw;

  const prescribeActivityLabelRaw = t("patientDetails.prescribeActivity");
  const prescribeActivityLabel = /^prescrib/i.test(
    prescribeActivityLabelRaw.trim(),
  )
    ? "Prescrever atividade"
    : prescribeActivityLabelRaw;

  const quickMessages: Array<{
    id:
      | "FIRST_APPOINTMENT"
      | "CHECKIN"
      | "ADHERENCE"
      | "SCHEDULE"
      | "EMOTIONAL_SUPPORT"
      | "FUNCTIONAL_GOAL";
    label: string;
    text: string;
  }> = [
    {
      id: "CHECKIN",
      label: t("patientDetails.quickMessageCheckinLabel"),
      text: t("patientDetails.quickMessageCheckinText", {
        name: paciente.nomeCompleto,
      }),
    },
    {
      id: "ADHERENCE",
      label: t("patientDetails.quickMessageAdherenceLabel"),
      text: t("patientDetails.quickMessageAdherenceText", {
        name: paciente.nomeCompleto,
      }),
    },
    {
      id: "SCHEDULE",
      label: t("patientDetails.quickMessageScheduleLabel"),
      text: t("patientDetails.quickMessageScheduleText", {
        name: paciente.nomeCompleto,
      }),
    },
    {
      id: "EMOTIONAL_SUPPORT",
      label: t("patientDetails.quickMessageEmotionalSupportLabel"),
      text: t("patientDetails.quickMessageEmotionalSupportText", {
        name: paciente.nomeCompleto,
      }),
    },
    {
      id: "FUNCTIONAL_GOAL",
      label: t("patientDetails.quickMessageFunctionalGoalLabel"),
      text: t("patientDetails.quickMessageFunctionalGoalText", {
        name: paciente.nomeCompleto,
      }),
    },
  ];

  const handleQuickMessage = async (
    text: string,
    label: string,
    templateId?:
      | "FIRST_APPOINTMENT"
      | "CHECKIN"
      | "ADHERENCE"
      | "SCHEDULE"
      | "EMOTIONAL_SUPPORT"
      | "FUNCTIONAL_GOAL",
  ) => {
    const phone = paciente.contato.whatsapp.replace(/\D/g, "");
    const url = `whatsapp://send?phone=55${phone}&text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(url);
      await trackEvent("quick_message_sent", {
        source: "PacienteDetailsScreen",
        template: label,
        templateId,
        pacienteId,
      });
      if (templateId === "EMOTIONAL_SUPPORT") {
        setLastEmotionalSupportContactAt(new Date().toISOString());
        await trackEvent("quick_message_emotional_support_sent", {
          source: "PacienteDetailsScreen",
          pacienteId,
        });
      } else if (templateId === "FUNCTIONAL_GOAL") {
        await trackEvent("quick_message_functional_goal_sent", {
          source: "PacienteDetailsScreen",
          pacienteId,
          hasFunctionalContext: hasFunctionalContextForMessage,
        });
      }
      await recordAuditAction(
        "QUICK_MESSAGE_SENT",
        {
          pacienteId,
          templateId: templateId || null,
        },
        actorId,
      );
    } catch {
      showToast({
        message: t("patientDetails.openWhatsappError"),
        type: "error",
      });
    }
  };

  const handleCall = () => {
    const phone = paciente.contato.telefone || paciente.contato.whatsapp;
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    if (paciente.contato.email) {
      Linking.openURL(`mailto:${paciente.contato.email}`);
    }
  };

  const handleToggleAnamnesePermission = async () => {
    if (!paciente.pacienteUsuarioId) {
      showToast({
        message: t("patientDetails.guardCreateLinkFirst"),
        type: "error",
      });
      return;
    }

    const nextPermission = !paciente.anamneseLiberadaPaciente;
    setUpdatingAnamnesePermission(true);

    try {
      const payload: PacientePayload = {
        nomeCompleto: paciente.nomeCompleto,
        cpf: paciente.cpf,
        rg: paciente.rg,
        dataNascimento: paciente.dataNascimento,
        sexo: paciente.sexo,
        estadoCivil: paciente.estadoCivil,
        profissao: paciente.profissao,
        endereco: { ...paciente.endereco },
        contato: { ...paciente.contato },
        pacienteUsuarioId: paciente.pacienteUsuarioId,
        cadastroOrigem: paciente.cadastroOrigem,
        anamneseLiberadaPaciente: nextPermission,
      };
      await updatePaciente(paciente.id, payload);

      showToast({
        type: "success",
        message: nextPermission
          ? tSafe(
              "patientDetails.anamnesisPermissionEnabled",
              "Preenchimento da anamnese liberado para o paciente.",
            )
          : tSafe(
              "patientDetails.anamnesisPermissionDisabled",
              "Preenchimento da anamnese ainda não liberado para o paciente.",
            ),
      });
    } catch {
      showToast({
        type: "error",
        message: tSafe(
          "patientDetails.anamnesisPermissionUpdateError",
          "Não foi possível atualizar a permissão da anamnese.",
        ),
      });
    } finally {
      setUpdatingAnamnesePermission(false);
    }
  };

  const anamnesesDoPaciente = useMemo(
    () =>
      anamneses
        .filter((a) => a.pacienteId === pacienteId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime(),
        ),
    [anamneses, pacienteId],
  );
  const evolucoesDoPaciente = useMemo(
    () =>
      evolucoes
        .filter((e) => e.pacienteId === pacienteId)
        .sort(
          (a, b) =>
            parseDatePreservingDateOnly(b.data).getTime() -
            parseDatePreservingDateOnly(a.data).getTime(),
        ),
    [evolucoes, pacienteId],
  );
  const latestAnamnese = anamnesesDoPaciente[0];
  const latestEvolucao = evolucoesDoPaciente[0];
  const sortedExames = useMemo(
    () =>
      [...exames].sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime(),
      ),
    [exames],
  );
  const latestExame = sortedExames[0];
  const latestAnamneseId = anamnesesDoPaciente[0]?.id;
  const latestEvolucaoId = evolucoesDoPaciente[0]?.id;
  const hasAnamnese = anamneses.some((a) => a.pacienteId === pacienteId);
  const latestAnamneseNeedsProfessionalReview =
    latestAnamnese?.origem === AnamneseOrigem.PACIENTE &&
    !latestAnamnese.validadaEm;
  const latestAnamneseAlreadyReviewed =
    !!latestAnamnese &&
    (!!latestAnamnese.validadaEm ||
      latestAnamnese.origem === AnamneseOrigem.PROFISSIONAL);
  const latestAnamneseReviewStatus = latestAnamnese
    ? latestAnamneseAlreadyReviewed
      ? t("patientDetails.anamnesisReviewed")
      : t("patientDetails.anamnesisPendingReview")
    : "";
  const hasExameFisico = !!String(laudoSnapshot?.exameFisico || "").trim();
  const hasEvolucao = evolucoesDoPaciente.length > 0;
  const hasLaudoPlano = !!laudoSnapshot?.id;
  const hasVinculoAtivo = !!paciente.pacienteUsuarioId;

  const auditActionLabels = useMemo<Record<string, string>>(
    () => ({
      LAUDO_VALIDATED: t("patientDetails.auditLaudoValidated"),
      LAUDO_PUBLISHED_TO_PATIENT: t("patientDetails.auditLaudoPublished"),
      ANAMNESE_VALIDATED_BY_PROFESSIONAL: t(
        "patientDetails.auditAnamnesisReviewed",
      ),
      PDF_VIEWED_BY_PATIENT: t("patientDetails.auditPdfViewed"),
      LAUDO_PROFESSIONAL_PDF_OPENED: t("patientDetails.auditProfessionalPdf"),
      QUICK_MESSAGE_SENT: t("patientDetails.auditQuickMessage"),
      EXAME_FISICO_VALIDATED: t("patientDetails.auditPhysicalExamValidated"),
      PLANO_VALIDATED: t("patientDetails.auditPlanValidated"),
      CHECKIN_OFFLINE_SYNCED: t("patientDetails.auditCheckinSynced"),
    }),
    [t],
  );

  const handleValidateLatestAnamnese = async () => {
    if (!latestAnamnese?.id || !latestAnamneseNeedsProfessionalReview) return;
    setValidatingAnamneseId(latestAnamnese.id);
    try {
      await validateAnamnese(
        latestAnamnese.id,
        t("patientDetails.anamnesisReviewDefaultNote"),
      );
      await fetchAnamnesesByPaciente(pacienteId);
      await recordAuditAction(
        "ANAMNESE_VALIDATED_BY_PROFESSIONAL",
        {
          anamneseId: latestAnamnese.id,
          pacienteId,
        },
        actorId,
      );
      const entries = await getAuditEntries(200);
      const pacienteAuditRef = toAuditRef(pacienteId);
      setVisibleAuditEntries(
        entries
          .filter((entry) => entry.metadata?.pacienteId === pacienteAuditRef)
          .slice(0, 8),
      );
      showToast({
        type: "success",
        message: t("patientDetails.anamnesisReviewedSuccess"),
      });
    } catch {
      showToast({
        type: "error",
        message: t("patientDetails.anamnesisReviewedError"),
      });
    } finally {
      setValidatingAnamneseId(null);
    }
  };

  const clinicalFlowState = useMemo(
    () => ({
      hasVinculoAtivo,
      hasAnamnese,
      hasExameFisico,
      hasEvolucao,
      hasLaudoPlano,
    }),
    [hasVinculoAtivo, hasAnamnese, hasExameFisico, hasEvolucao, hasLaudoPlano],
  );

  const localClinicalFlowItems = [
    {
      key: "anamnese",
      label: t("patientDetails.anamnesis"),
      status: getClinicalFlowStageStatus("ANAMNESE", clinicalFlowState, {
        requirePhysicalExamForEvolution: true,
      }),
    },
    {
      key: "exame",
      label: t("patientDetails.physicalExam"),
      status: getClinicalFlowStageStatus("EXAME_FISICO", clinicalFlowState, {
        requirePhysicalExamForEvolution: true,
      }),
    },
    {
      key: "evolucao",
      label: t("patientDetails.evolution"),
      status: getClinicalFlowStageStatus("EVOLUCAO", clinicalFlowState, {
        requirePhysicalExamForEvolution: true,
      }),
    },
    {
      key: "laudo",
      label: t("patientDetails.report"),
      status: getClinicalFlowStageStatus("LAUDO", clinicalFlowState, {
        requirePhysicalExamForEvolution: true,
      }),
    },
    {
      key: "plano",
      label: t("patientDetails.plan"),
      status: getClinicalFlowStageStatus("PLANO", clinicalFlowState, {
        requirePhysicalExamForEvolution: true,
      }),
    },
  ] as const;

  const clinicalFlowItems = useMemo(() => {
    const stages = orchestratorNextAction?.stages;
    if (!Array.isArray(stages) || !stages.length) return localClinicalFlowItems;

    const stageKeyMap: Record<
      string,
      "anamnese" | "exame" | "evolucao" | "laudo" | "plano"
    > = {
      ANAMNESE: "anamnese",
      EXAME_FISICO: "exame",
      EVOLUCAO: "evolucao",
      LAUDO: "laudo",
      PLANO: "plano",
    };
    const labels: Record<
      "anamnese" | "exame" | "evolucao" | "laudo" | "plano",
      string
    > = {
      anamnese: t("patientDetails.anamnesis"),
      exame: t("patientDetails.physicalExam"),
      evolucao: t("patientDetails.evolution"),
      laudo: t("patientDetails.report"),
      plano: t("patientDetails.plan"),
    };

    const nextStage = String(
      orchestratorNextAction?.nextAction?.stage || "",
    ).toUpperCase();
    const nextKey = stageKeyMap[nextStage];
    const localStatusByKey = new Map(
      localClinicalFlowItems.map((item) => [item.key, item.status]),
    );

    const items = (Object.keys(labels) as Array<keyof typeof labels>).map(
      (key) => ({
        key,
        label: labels[key],
        status: "NOT_STARTED" as ClinicalFlowStageStatus,
      }),
    );

    for (const stage of stages) {
      const mappedKey = stageKeyMap[String(stage.stage || "").toUpperCase()];
      if (!mappedKey) continue;
      let status: ClinicalFlowStageStatus = "NOT_STARTED";
      if (stage.status === "COMPLETED") status = "DONE";
      else if (stage.status === "BLOCKED") status = "BLOCKED";
      else if (mappedKey === nextKey && !orchestratorNextAction?.blocked)
        status = "IN_PROGRESS";
      const target = items.find((item) => item.key === mappedKey);
      if (target) target.status = status;
    }

    for (const item of items) {
      if (localStatusByKey.get(item.key) === "DONE") {
        item.status = "DONE";
      }
    }

    const hasInProgress = items.some((item) => item.status === "IN_PROGRESS");
    if (!hasInProgress) {
      const localInProgress = localClinicalFlowItems.find(
        (item) => item.status === "IN_PROGRESS",
      );
      const target = items.find((item) => item.key === localInProgress?.key);
      if (target && target.status !== "DONE" && target.status !== "BLOCKED") {
        target.status = "IN_PROGRESS";
      }
    }

    return items;
  }, [localClinicalFlowItems, orchestratorNextAction, t]);

  const clinicalFlowProgress =
    (clinicalFlowItems.filter((item) => item.status === "DONE").length /
      clinicalFlowItems.length) *
    100;

  const getClinicalFlowGuardMessage = (guard: ClinicalFlowGuard): string => {
    if (guard.reason === "MISSING_EXAME_FISICO") {
      return t("patientDetails.guardPhysicalExamBeforeEvolution");
    }
    if (guard.action === "LAUDO" || guard.action === "PLANO") {
      return t("patientDetails.guardLinkAndAnamnesisBeforeReport");
    }
    if (guard.action === "EXAME_FISICO") {
      return t("patientDetails.guardAnamnesisBeforePhysicalExam");
    }
    return t("patientDetails.guardAnamnesisBeforeEvolution");
  };

  const redirectToClinicalFlowStep = (
    step: "VINCULO" | "ANAMNESE" | "EXAME_FISICO",
  ) => {
    if (step === "VINCULO") {
      navigation.navigate("PacienteForm", { pacienteId: paciente.id });
      return;
    }
    if (step === "ANAMNESE") {
      navigation.navigate("AnamneseForm", { pacienteId: paciente.id });
      return;
    }
    navigation.navigate("ExameFisicoForm", { pacienteId: paciente.id });
  };

  const blockClinicalFlowAction = (
    action: ClinicalFlowAction,
    guard: ClinicalFlowGuard,
  ) => {
    trackEvent("clinical_flow_blocked", {
      stage: action,
      reason: guard.analyticsReason,
      pacienteId,
      source: "PacienteDetails",
    }).catch(() => undefined);
    showToast({
      type: "error",
      message: getClinicalFlowGuardMessage(guard),
    });
    if (
      guard.redirectStep === "VINCULO" ||
      guard.redirectStep === "ANAMNESE" ||
      guard.redirectStep === "EXAME_FISICO"
    ) {
      redirectToClinicalFlowStep(guard.redirectStep);
    }
  };

  const guardClinicalFlowAction = (action: ClinicalFlowAction): boolean => {
    const guard = getClinicalFlowGuard(action, clinicalFlowState, {
      requirePhysicalExamForEvolution: true,
    });
    if (!guard) return false;
    blockClinicalFlowAction(action, guard);
    return true;
  };

  const handleOpenAnamnese = () => {
    if (guardClinicalFlowAction("ANAMNESE")) return;
    trackEvent("clinical_flow_stage_opened", {
      stage: "ANAMNESE",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("AnamneseForm", {
      pacienteId: paciente.id,
      ...(latestAnamneseId ? { anamneseId: latestAnamneseId } : {}),
    });
  };

  const handleOpenExameFisico = () => {
    if (guardClinicalFlowAction("EXAME_FISICO")) return;
    trackEvent("clinical_flow_stage_opened", {
      stage: "EXAME_FISICO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("ExameFisicoForm", { pacienteId: paciente.id });
  };

  const handleOpenEvolucao = () => {
    if (guardClinicalFlowAction("EVOLUCAO")) return;
    trackEvent("clinical_flow_stage_opened", {
      stage: "EVOLUCAO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("EvolucaoForm", {
      pacienteId: paciente.id,
      ...(latestEvolucaoId ? { evolucaoId: latestEvolucaoId } : {}),
    });
  };

  const handleOpenLaudo = () => {
    if (guardClinicalFlowAction("LAUDO")) return;
    trackEvent("clinical_flow_stage_opened", {
      stage: "LAUDO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("LaudoForm", { pacienteId: paciente.id });
  };

  const handleOpenPlano = () => {
    if (guardClinicalFlowAction("PLANO")) return;
    trackEvent("clinical_flow_stage_opened", {
      stage: "PLANO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("PlanoForm", { pacienteId: paciente.id });
  };

  const handleOpenClinicalFlowItem = (
    key: "anamnese" | "exame" | "evolucao" | "laudo" | "plano",
  ) => {
    if (key === "anamnese") {
      handleOpenAnamnese();
      return;
    }
    if (key === "exame") {
      handleOpenExameFisico();
      return;
    }
    if (key === "evolucao") {
      handleOpenEvolucao();
      return;
    }
    if (key === "laudo") {
      handleOpenLaudo();
      return;
    }
    handleOpenPlano();
  };

  const readiness = useMemo(() => {
    const nextStep = getClinicalFlowNextStep(clinicalFlowState);
    const copy = clinicalFlowReadinessCopyKeys[nextStep];
    const actionByStep: Record<typeof nextStep, () => void> = {
      VINCULO: () =>
        navigation.navigate("PacienteForm", { pacienteId: paciente.id }),
      ANAMNESE: handleOpenAnamnese,
      EXAME_FISICO: handleOpenExameFisico,
      EVOLUCAO: handleOpenEvolucao,
      LAUDO: handleOpenLaudo,
      PLANO: handleOpenPlano,
      MONITORAMENTO: () =>
        navigation.navigate("PacienteAdesao", { pacienteId: paciente.id }),
    };
    return {
      title: t(copy.title),
      description: t(copy.description),
      actionLabel: t(copy.action),
      action: actionByStep[nextStep],
    };
  }, [clinicalFlowState, navigation, paciente.id, t]);

  const formatTimelineDate = useMemo(
    () => (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toLocaleDateString(dateLocale);
    },
    [dateLocale],
  );

  const careTimelineItems = useMemo<CareTimelineViewItem[]>(() => {
    const latestDocumentAt =
      laudoSnapshot?.status === LaudoStatus.PUBLICADO_PACIENTE
        ? laudoSnapshot.publicadoPacienteEm || laudoSnapshot.updatedAt || null
        : null;
    const hasPublishedDocuments =
      laudoSnapshot?.status === LaudoStatus.PUBLICADO_PACIENTE;
    const hasAppAccess = !!paciente.pacienteUsuarioId;

    const timeline = buildCareTimeline({
      hasProfessionalLink: hasVinculoAtivo,
      hasAppAccess,
      hasPendingInvite:
        !hasAppAccess &&
        paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO,
      canFillAnamnese: !!paciente.anamneseLiberadaPaciente,
      hasAnamnese,
      hasExameMedico: hasExameFisico || sortedExames.length > 0,
      hasEvolucao,
      hasPublishedDocuments,
      hasActivities: hasLaudoPlano,
      latestAnamneseAt:
        latestAnamnese?.updatedAt || latestAnamnese?.createdAt || null,
      latestExameAt:
        sortedExames[0]?.createdAt || sortedExames[0]?.updatedAt || null,
      latestEvolucaoAt: latestEvolucao?.data || null,
      latestDocumentAt,
    });

    return timeline.items.map((item) => {
      const stageKey = item.stage.toLowerCase();
      const actionByStage: Partial<Record<string, () => void>> = {
        APP_ACCESS:
          item.action === "SEND_INVITE"
            ? () => navigation.navigate("PacienteForm", { pacienteId })
            : undefined,
        ANAMNESE: item.action === "FILL_ANAMNESE" ? handleOpenAnamnese : undefined,
        EXAME_MEDICO:
          item.action === "UPLOAD_EXAM"
            ? () => handleUploadExame().catch(() => undefined)
            : undefined,
        EVOLUCAO:
          item.action === "RECORD_EVOLUTION" ? handleOpenEvolucao : undefined,
        PLANO_LAUDO:
          item.action === "PUBLISH_REPORT" ? handleOpenLaudo : undefined,
        CHECKIN:
          item.action === "DO_CHECKIN" || item.action === "VIEW_DOCUMENTS"
            ? () => navigation.navigate("PacienteAdesao", { pacienteId })
            : undefined,
      };

      return {
        id: item.stage,
        title: t(`careTimeline.stage.${stageKey}`),
        description: t(`careTimeline.professional.status.${item.status}`),
        status: item.status,
        dateLabel: formatTimelineDate(item.date),
        actionLabel: item.action
          ? t(`careTimeline.professional.action.${item.action}`)
          : null,
        onPress: actionByStage[item.stage] || null,
      };
    });
  }, [
    formatTimelineDate,
    hasAnamnese,
    hasEvolucao,
    hasExameFisico,
    hasLaudoPlano,
    hasVinculoAtivo,
    laudoSnapshot,
    latestAnamnese,
    latestEvolucao,
    navigation,
    paciente.anamneseLiberadaPaciente,
    paciente.pacienteUsuarioId,
    paciente.vinculoStatus,
    pacienteId,
    sortedExames,
    t,
  ]);

  const {
    adesao,
    caseSummaryItems,
    contextualNextActionHint,
    hasFunctionalContextForMessage,
    riskReasonLabels,
  } = usePacienteDetailsSummaries({
    anamneses,
    dateLocale,
    evolucoesDoPaciente,
    latestAnamnese,
    latestEvolucao,
    pacienteCreatedAt: paciente.createdAt,
    pacienteId,
    t,
  });

  const nextActionConfig = useMemo(() => {
    const actionMap: Record<
      NextBestActionCode,
      {
        title: string;
        description: string;
        ctaLabel: string;
        onPress: () => void;
      }
    > = {
      SCHEDULE_FIRST_APPOINTMENT: {
        title: t("patientDetails.nextActionFirstAppointmentTitle"),
        description:
          t(
            adesao.isRecentPatient
              ? "patientDetails.nextActionFirstAppointmentRecentDescription"
              : "patientDetails.nextActionFirstAppointmentPendingDescription",
          ) + contextualNextActionHint,
        ctaLabel: t("patientDetails.quickMessageFirstAppointmentLabel"),
        onPress: () =>
          handleQuickMessage(
            t("patientDetails.quickMessageFirstAppointmentText", {
              name: paciente.nomeCompleto,
            }),
            t("patientDetails.quickMessageFirstAppointmentLabel"),
            "FIRST_APPOINTMENT",
          ).catch(() => undefined),
      },
      SEND_CHECKIN_REMINDER: {
        title: t("patientDetails.nextActionCheckinTitle"),
        description:
          (adesao.hasEmotionalVulnerability
            ? t("patientDetails.nextActionCheckinVulnerableDescription")
            : t("patientDetails.nextActionCheckinDescription")) +
          contextualNextActionHint,
        ctaLabel: adesao.hasEmotionalVulnerability
          ? t("patientDetails.quickMessageEmotionalSupportLabel")
          : hasFunctionalContextForMessage
            ? t("patientDetails.quickMessageFunctionalGoalLabel")
            : t("patientDetails.quickMessageCheckinLabel"),
        onPress: () =>
          handleQuickMessage(
            adesao.hasEmotionalVulnerability
              ? quickMessages[3].text
              : hasFunctionalContextForMessage
                ? quickMessages[4].text
                : quickMessages[0].text,
            adesao.hasEmotionalVulnerability
              ? quickMessages[3].label
              : hasFunctionalContextForMessage
                ? quickMessages[4].label
                : quickMessages[0].label,
            adesao.hasEmotionalVulnerability
              ? quickMessages[3].id
              : hasFunctionalContextForMessage
                ? quickMessages[4].id
                : quickMessages[0].id,
          ).catch(() => undefined),
      },
      SEND_ADHERENCE_REMINDER: {
        title: t("patientDetails.nextActionAdherenceTitle"),
        description:
          t("patientDetails.nextActionAdherenceDescription") +
          contextualNextActionHint,
        ctaLabel: t("patientDetails.quickMessageAdherenceLabel"),
        onPress: () =>
          handleQuickMessage(
            quickMessages[1].text,
            quickMessages[1].label,
            quickMessages[1].id,
          ).catch(() => undefined),
      },
      SCHEDULE_RETURN: {
        title: t("patientDetails.nextActionScheduleTitle"),
        description:
          (adesao.hasHighEmotionalVulnerability
            ? t("patientDetails.nextActionScheduleVulnerableDescription")
            : t("patientDetails.nextActionScheduleDescription")) +
          contextualNextActionHint,
        ctaLabel: adesao.hasHighEmotionalVulnerability
          ? t("patientDetails.quickMessageEmotionalSupportLabel")
          : hasFunctionalContextForMessage
            ? t("patientDetails.quickMessageFunctionalGoalLabel")
            : t("patientDetails.quickMessageScheduleLabel"),
        onPress: () =>
          handleQuickMessage(
            adesao.hasHighEmotionalVulnerability
              ? quickMessages[3].text
              : hasFunctionalContextForMessage
                ? quickMessages[4].text
                : quickMessages[2].text,
            adesao.hasHighEmotionalVulnerability
              ? quickMessages[3].label
              : hasFunctionalContextForMessage
                ? quickMessages[4].label
                : quickMessages[2].label,
            adesao.hasHighEmotionalVulnerability
              ? quickMessages[3].id
              : hasFunctionalContextForMessage
                ? quickMessages[4].id
                : quickMessages[2].id,
          ).catch(() => undefined),
      },
      OPEN_ADHERENCE_PANEL: {
        title: t("patientDetails.nextActionReviewAdherenceTitle"),
        description:
          t("patientDetails.nextActionReviewAdherenceDescription") +
          contextualNextActionHint,
        ctaLabel: t("patientDetails.adherenceChecks"),
        onPress: () =>
          navigation.navigate("PacienteAdesao", { pacienteId: paciente.id }),
      },
      RECORD_EVOLUTION: {
        title: t("patientDetails.recordEvolution"),
        description:
          t("patientDetails.nextActionRecordEvolutionDescription") +
          contextualNextActionHint,
        ctaLabel: t("patientDetails.recordEvolution"),
        onPress: () =>
          navigation.navigate("EvolucaoForm", { pacienteId: paciente.id }),
      },
    };

    return actionMap[adesao.nextBestAction];
  }, [
    adesao.hasEmotionalVulnerability,
    adesao.hasHighEmotionalVulnerability,
    adesao.isRecentPatient,
    adesao.nextBestAction,
    navigation,
    paciente.id,
    paciente.nomeCompleto,
    quickMessages,
    contextualNextActionHint,
    hasFunctionalContextForMessage,
    t,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {paciente.nomeCompleto.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{paciente.nomeCompleto}</Text>
          <Text style={styles.subtitle}>
            {paciente.idade ?? "-"} {t("patients.years")} -{" "}
            {paciente.profissao || t("home.noProfessionInformed")}
          </Text>
          <View style={[styles.cycleBadge, cicloStatusUi.containerStyle]}>
            <Ionicons
              name={cicloStatusUi.icon}
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={[styles.cycleBadgeText, cicloStatusUi.textStyle]}>
              {cicloStatusUi.label}
            </Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} />
              <Text style={styles.quickActionText}>
                {t("patientDetails.whatsapp")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>
                {t("patientDetails.call")}
              </Text>
            </TouchableOpacity>
            {paciente.contato.email && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={24} color={COLORS.secondary} />
                <Text style={styles.quickActionText}>
                  {t("patientDetails.email")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() =>
                navigation.navigate("PacienteForm", {
                  pacienteId: paciente.id,
                  mode: "view",
                })
              }
            >
              <Ionicons
                name="id-card-outline"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.quickActionText}>
                {t("patientDetails.patientData")}
              </Text>
            </TouchableOpacity>
            {viewerRole !== UserRole.PACIENTE && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleToggleAnamnesePermission}
                disabled={updatingAnamnesePermission}
              >
                <Ionicons
                  name={
                    paciente.anamneseLiberadaPaciente
                      ? "lock-open-outline"
                      : "lock-closed-outline"
                  }
                  size={24}
                  color={
                    paciente.anamneseLiberadaPaciente
                      ? COLORS.success
                      : COLORS.warning
                  }
                />
                <Text style={styles.quickActionText}>
                  {updatingAnamnesePermission
                    ? t("patientDetails.updating")
                    : paciente.anamneseLiberadaPaciente
                      ? tSafe(
                          "patientDetails.blockAnamnesis",
                          "Bloquear anamnese",
                        )
                      : tSafe(
                          "patientDetails.releaseAnamnesis",
                          "Liberar anamnese",
                        )}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {viewerRole !== UserRole.PACIENTE ? (
            <PatientAppAccessCard
              pacienteId={paciente.id}
              nome={paciente.nomeCompleto}
              email={paciente.contato.email}
              whatsapp={paciente.contato.whatsapp}
              pacienteUsuarioId={paciente.pacienteUsuarioId}
              vinculoStatus={paciente.vinculoStatus}
              conviteEnviadoEm={paciente.conviteEnviadoEm}
              conviteExpiraEm={paciente.conviteExpiraEm}
              conviteAceitoEm={paciente.conviteAceitoEm}
              appAccessEvents={paciente.appAccessEvents}
              onRefresh={async () => {
                await fetchPacienteById(paciente.id);
              }}
            />
          ) : null}
          {viewerRole !== UserRole.PACIENTE ? (
            <View style={styles.careTimelineWrap}>
              <CareTimeline
                title={t("careTimeline.title")}
                subtitle={t("careTimeline.professional.subtitle")}
                items={careTimelineItems}
              />
            </View>
          ) : null}
        </View>

        {viewerRole === UserRole.PACIENTE &&
        anamnesesDoPaciente.length === 0 ? (
          <View style={styles.startHereCard}>
            <View style={styles.startHereHeader}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.startHereTitle}>
                {t("patientDetails.startHereTitle")}
              </Text>
            </View>
            <Text style={styles.startHereDescription}>
              {t("patientDetails.startHereDescription")}
            </Text>
            <Button
              title={t("patientDetails.startHereAction")}
              onPress={() =>
                navigation.navigate("AnamneseForm", { pacienteId })
              }
              fullWidth
            />
          </View>
        ) : null}

        <View style={styles.flowSection}>
          <View style={styles.readinessCard}>
            <View style={styles.readinessHeaderRow}>
              <Ionicons name="pulse-outline" size={18} color={COLORS.primary} />
              <Text style={styles.readinessTitle}>
                {t("patientDetails.readinessSummary")}
              </Text>
            </View>
            <Text style={styles.readinessMain}>{readiness.title}</Text>
            <Text style={styles.readinessDescription}>
              {readiness.description}
            </Text>
            <Button
              title={readiness.actionLabel}
              onPress={() => {
                trackEvent("clinical_flow_continue_clicked", {
                  pacienteId,
                  action: readiness.actionLabel,
                }).catch(() => undefined);
                readiness.action();
              }}
              fullWidth
              style={{ marginTop: SPACING.sm }}
              icon={
                <Ionicons
                  name="play-forward-outline"
                  size={18}
                  color={COLORS.white}
                />
              }
            />
          </View>

          <Text style={styles.flowTitle}>
            {t("patientDetails.clinicalFlowSteps")}
          </Text>
          <View style={styles.flowProgressTrack}>
            <View
              style={[
                styles.flowProgressFill,
                { width: `${clinicalFlowProgress}%` },
              ]}
            />
          </View>
          <View style={styles.flowChips}>
            {clinicalFlowItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleOpenClinicalFlowItem(item.key)}
                activeOpacity={0.85}
                style={[
                  styles.flowChip,
                  item.status === "DONE" && styles.flowChipDone,
                  item.status === "IN_PROGRESS" && styles.flowChipInProgress,
                  item.status === "BLOCKED" && styles.flowChipBlocked,
                ]}
              >
                <Ionicons
                  name={
                    item.status === "DONE"
                      ? "checkmark-circle"
                      : item.status === "IN_PROGRESS"
                        ? "play-circle"
                        : item.status === "BLOCKED"
                          ? "time-outline"
                          : "ellipse-outline"
                  }
                  size={14}
                  color={
                    item.status === "DONE"
                      ? COLORS.success
                      : item.status === "IN_PROGRESS"
                        ? COLORS.primary
                        : item.status === "BLOCKED"
                          ? COLORS.warning
                          : COLORS.gray500
                  }
                />
                <Text
                  style={[
                    styles.flowChipText,
                    item.status === "DONE" && styles.flowChipTextDone,
                    item.status === "IN_PROGRESS" &&
                      styles.flowChipTextInProgress,
                    item.status === "BLOCKED" && styles.flowChipTextBlocked,
                  ]}
                >
                  {item.label}{" "}
                  {item.status === "DONE"
                    ? `· ${t("patientDetails.flowStatusDone")}`
                    : item.status === "IN_PROGRESS"
                      ? `· ${t("patientDetails.flowStatusInProgress")}`
                      : item.status === "BLOCKED"
                        ? `· ${t("patientDetails.flowStatusPending")}`
                        : `· ${t("patientDetails.flowStatusNotStarted")}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.secondaryActionChip}
              onPress={() =>
                navigation.navigate("AtividadeForm", {
                  pacienteId: paciente.id,
                  pacienteNome: paciente.nomeCompleto,
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.secondaryActionChipText}>
                {prescribeActivityLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryActionChip}
              onPress={() =>
                navigation.navigate("PlanoTerapeuticoIa", {
                  pacienteId: paciente.id,
                  pacienteNome: paciente.nomeCompleto,
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryActionChipText}>Plano por IA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryActionChip}
              onPress={() =>
                navigation.navigate("PacienteAdesao", {
                  pacienteId: paciente.id,
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="analytics-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.secondaryActionChipText}>
                {t("patientDetails.adherenceChecks")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <PatientDetailsSection title={t("patientDetails.caseSummary")}>
          <View style={styles.caseSummaryList}>
            {caseSummaryItems.map((item) => (
              <View key={item.key} style={styles.caseSummaryItem}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={
                    item.key === "alerta" ? COLORS.warning : COLORS.primary
                  }
                />
                <View style={styles.caseSummaryTextWrap}>
                  <Text style={styles.caseSummaryLabel}>{item.label}</Text>
                  <Text style={styles.caseSummaryValue} numberOfLines={3}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </PatientDetailsSection>

        <PatientDetailsSection title={t("patientDetails.recentHistory")}>
          <View style={styles.historyGrid}>
            <View style={styles.historyBlock}>
              <Text style={styles.historyLabel}>
                {t("patientDetails.anamnesis")}
              </Text>
              {latestAnamnese ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("AnamneseForm", {
                      pacienteId,
                      anamneseId: latestAnamnese.id,
                    })
                  }
                  style={styles.inlineCard}
                >
                  <Text style={styles.inlineTitle}>
                    {new Date(latestAnamnese.createdAt).toLocaleDateString(
                      dateLocale,
                    )}
                  </Text>
                  <Text style={styles.inlineText} numberOfLines={1}>
                    {getMotivoBuscaLabel(latestAnamnese.motivoBusca, t)}
                  </Text>
                  <View
                    style={[
                      styles.reviewBadge,
                      latestAnamneseNeedsProfessionalReview
                        ? styles.reviewBadgePending
                        : styles.reviewBadgeDone,
                    ]}
                  >
                    <Ionicons
                      name={
                        latestAnamneseNeedsProfessionalReview
                          ? "time-outline"
                          : "checkmark-circle-outline"
                      }
                      size={13}
                      color={
                        latestAnamneseNeedsProfessionalReview
                          ? COLORS.warning
                          : COLORS.success
                      }
                    />
                    <Text
                      style={[
                        styles.reviewBadgeText,
                        latestAnamneseNeedsProfessionalReview
                          ? styles.reviewBadgeTextPending
                          : styles.reviewBadgeTextDone,
                      ]}
                    >
                      {latestAnamneseReviewStatus}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={styles.emptyInline}>
                  {t("patientDetails.noAnamnesis")}
                </Text>
              )}
              {latestAnamneseNeedsProfessionalReview ? (
                <Button
                  title={t("patientDetails.validateAnamnesisReview")}
                  onPress={handleValidateLatestAnamnese}
                  loading={validatingAnamneseId === latestAnamnese?.id}
                  size="sm"
                  fullWidth
                  style={{ marginTop: SPACING.xs }}
                />
              ) : null}
              <Button
                title={t("common.viewAll")}
                onPress={() =>
                  navigation.navigate("AnamneseList", {
                    pacienteId: paciente.id,
                  })
                }
                variant="ghost"
                size="sm"
              />
            </View>

            <View style={styles.historyBlock}>
              <Text style={styles.historyLabel}>
                {t("patientDetails.evolution")}
              </Text>
              {latestEvolucao ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EvolucaoForm", {
                      pacienteId,
                      evolucaoId: latestEvolucao.id,
                    })
                  }
                  style={styles.inlineCard}
                >
                  <Text style={styles.inlineTitle}>
                    {parseDatePreservingDateOnly(
                      latestEvolucao.data,
                    ).toLocaleDateString(dateLocale)}
                  </Text>
                  <Text style={styles.inlineText} numberOfLines={1}>
                    {latestEvolucao.avaliacao ||
                      latestEvolucao.ajustes ||
                      t("patientDetails.noAdjustments")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.emptyInline}>
                  {t("patientDetails.noEvolution")}
                </Text>
              )}
              <Button
                title={t("common.viewAll")}
                onPress={() =>
                  navigation.navigate("EvolucaoList", {
                    pacienteId: paciente.id,
                  })
                }
                variant="ghost"
                size="sm"
              />
            </View>
          </View>
        </PatientDetailsSection>

        <PatientDetailsSection title={t("patientDetails.visibleAudit")}>
          {visibleAuditEntries.length === 0 ? (
            <Text style={styles.emptyInline}>
              {t("patientDetails.noVisibleAudit")}
            </Text>
          ) : (
            <View style={styles.auditList}>
              {visibleAuditEntries.map((entry) => {
                const parsedAt = new Date(entry.at);
                const atLabel = Number.isNaN(parsedAt.getTime())
                  ? t("patientDetails.dateUnavailable")
                  : parsedAt.toLocaleString(dateLocale, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                return (
                  <View key={entry.id} style={styles.auditItem}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <View style={styles.auditTextWrap}>
                      <Text style={styles.auditTitle}>
                        {auditActionLabels[entry.action] || entry.action}
                      </Text>
                      <Text style={styles.auditMeta}>{atLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </PatientDetailsSection>

        <PatientDetailsSection
          title={t("patientDetails.documentsExams")}
          headerRight={
            <Button
              title={t("patientDetails.attachExam")}
              onPress={handleUploadExame}
              loading={isUploadingExame}
              size="sm"
              icon={
                <Ionicons
                  name="attach-outline"
                  size={16}
                  color={COLORS.white}
                />
              }
            />
          }
        >
          {isLoadingExames ? (
            <Text style={styles.emptyInline}>
              {t("patientDetails.loadingExams")}
            </Text>
          ) : exames.length === 0 ? (
            <Text style={styles.emptyInline}>
              {t("patientDetails.noExamsAttached")}
            </Text>
          ) : (
            <>
              <View style={styles.documentSummaryCard}>
                <View style={styles.exameHeader}>
                  <Ionicons
                    name="documents-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <View style={styles.exameHeaderTextWrap}>
                    <Text style={styles.exameTitle}>
                      {t("patientDetails.documentsCount", {
                        count: exames.length,
                      })}
                    </Text>
                    <Text style={styles.exameMeta} numberOfLines={1}>
                      {t("patientDetails.latestDocument", {
                        name:
                          latestExame?.nomeOriginal ||
                          t("patientDetails.attachedFileFallback"),
                      })}
                    </Text>
                  </View>
                </View>
                {latestExame ? (
                  <View style={styles.exameActionsRow}>
                    <Button
                      title={
                        downloadingExameId === latestExame.id
                          ? t("patientDetails.openingExam")
                          : t("patientDetails.openExam")
                      }
                      onPress={() => handleOpenExame(latestExame)}
                      loading={downloadingExameId === latestExame.id}
                      size="sm"
                      variant="outline"
                      icon={
                        <Ionicons
                          name="open-outline"
                          size={14}
                          color={COLORS.primary}
                        />
                      }
                    />
                    <Button
                      title={
                        removingExameId === latestExame.id
                          ? t("patientDetails.removingExam")
                          : t("patientDetails.removeExam")
                      }
                      onPress={() => handleDeleteExame(latestExame.id)}
                      loading={removingExameId === latestExame.id}
                      size="sm"
                      variant="ghost"
                      icon={
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color={COLORS.error}
                        />
                      }
                      textStyle={{ color: COLORS.error }}
                    />
                  </View>
                ) : null}
              </View>
              {sortedExames.length > 1 ? (
                <>
                  <TouchableOpacity
                    style={styles.moreMessagesButton}
                    onPress={() => setShowAllExames((value) => !value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={
                        showAllExames ? "chevron-up-outline" : "albums-outline"
                      }
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.moreMessagesButtonText}>
                      {showAllExames
                        ? t("patientDetails.hideDocuments")
                        : t("patientDetails.showAllDocuments")}
                    </Text>
                  </TouchableOpacity>
                  {showAllExames
                    ? sortedExames.slice(1).map((item) => (
                        <View key={item.id} style={styles.exameCard}>
                          <View style={styles.exameHeader}>
                            <Ionicons
                              name="document-attach-outline"
                              size={18}
                              color={COLORS.primary}
                            />
                            <View style={styles.exameHeaderTextWrap}>
                              <Text numberOfLines={1} style={styles.exameTitle}>
                                {item.nomeOriginal}
                              </Text>
                              <Text style={styles.exameMeta}>
                                {formatFileSize(item.tamanhoBytes)}
                                {item.dataExame
                                  ? ` - ${new Date(item.dataExame).toLocaleDateString(dateLocale)}`
                                  : ""}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.exameActionsRow}>
                            <Button
                              title={
                                downloadingExameId === item.id
                                  ? t("patientDetails.openingExam")
                                  : t("patientDetails.openExam")
                              }
                              onPress={() => handleOpenExame(item)}
                              loading={downloadingExameId === item.id}
                              size="sm"
                              variant="outline"
                              icon={
                                <Ionicons
                                  name="open-outline"
                                  size={14}
                                  color={COLORS.primary}
                                />
                              }
                            />
                            <Button
                              title={
                                removingExameId === item.id
                                  ? t("patientDetails.removingExam")
                                  : t("patientDetails.removeExam")
                              }
                              onPress={() => handleDeleteExame(item.id)}
                              loading={removingExameId === item.id}
                              size="sm"
                              variant="ghost"
                              icon={
                                <Ionicons
                                  name="trash-outline"
                                  size={14}
                                  color={COLORS.error}
                                />
                              }
                              textStyle={{ color: COLORS.error }}
                            />
                          </View>
                        </View>
                      ))
                    : null}
                </>
              ) : null}
            </>
          )}
        </PatientDetailsSection>

        <PatientDetailsSection title={t("patientDetails.followUp")}>
          <View style={styles.followUpMetricRow}>
            <View style={styles.followUpMetric}>
              <Text style={styles.followUpMetricLabel}>
                {t("patientDetails.lastSession")}
              </Text>
              <Text style={styles.followUpMetricValue}>
                {adesao.sessionLabel}
              </Text>
            </View>
            <View style={styles.followUpMetric}>
              <Text style={styles.followUpMetricLabel}>
                {t("patientDetails.adherence")}
              </Text>
              <Text style={styles.followUpMetricValue}>
                {adesao.adherenceLabel}
              </Text>
            </View>
            <View style={styles.followUpMetric}>
              <Text style={styles.followUpMetricLabel}>
                {t("patientDetails.risk")}
              </Text>
              <Text
                style={[
                  styles.followUpMetricValue,
                  adesao.risco === "ALTO"
                    ? styles.riskHighText
                    : adesao.risco === "MODERADO"
                      ? styles.riskMediumText
                      : adesao.risco === "AGUARDANDO_DADOS"
                        ? styles.riskNeutralText
                        : styles.riskLowText,
                ]}
              >
                {adesao.riskLabel}
              </Text>
            </View>
          </View>
          {adesao.followUpNote ? (
            <Text style={styles.followUpNote}>{adesao.followUpNote}</Text>
          ) : adesao.riskReasons.length > 0 ? (
            <Text style={styles.followUpNote}>
              {adesao.riskReasons
                .slice(0, 2)
                .map((reason) => riskReasonLabels[reason])
                .join(" · ")}
            </Text>
          ) : null}
          <Button
            title={t("patientDetails.adherenceChecks")}
            onPress={() =>
              navigation.navigate("PacienteAdesao", { pacienteId: paciente.id })
            }
            variant="outline"
            fullWidth
            style={{ marginTop: SPACING.sm }}
          />
        </PatientDetailsSection>

        <PatientDetailsSection title={t("patientDetails.recommendedAction")}>
          <View style={styles.nextActionCard}>
            <View style={styles.nextActionHeader}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.nextActionTitle}>
                {nextActionConfig.title}
              </Text>
            </View>
            <Text style={styles.nextActionDescription}>
              {nextActionConfig.description}
            </Text>
            <TouchableOpacity
              style={styles.nextActionButton}
              onPress={nextActionConfig.onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.nextActionButtonText}>
                {nextActionConfig.ctaLabel}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {lastEmotionalSupportContactAt ? (
            <View style={styles.emotionalContactInfo}>
              <Ionicons name="heart-outline" size={14} color={COLORS.error} />
              <Text style={styles.emotionalContactInfoText}>
                {t("patientDetails.lastSupportiveContact", {
                  date: new Date(lastEmotionalSupportContactAt).toLocaleString(
                    dateLocale,
                  ),
                })}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.moreMessagesButton}
            onPress={() => setShowAllQuickMessages((value) => !value)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={
                showAllQuickMessages
                  ? "chevron-up-outline"
                  : "chatbubbles-outline"
              }
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.moreMessagesButtonText}>
              {showAllQuickMessages
                ? t("patientDetails.hideMessages")
                : quickMessagesSectionTitle}
            </Text>
          </TouchableOpacity>

          {showAllQuickMessages
            ? quickMessages.map((message) => (
                <TouchableOpacity
                  key={message.label}
                  style={[
                    styles.quickMessageButton,
                    (message.id === "EMOTIONAL_SUPPORT" &&
                      adesao.hasEmotionalVulnerability) ||
                    (message.id === "FUNCTIONAL_GOAL" &&
                      hasFunctionalContextForMessage)
                      ? styles.quickMessageButtonHighlight
                      : null,
                  ]}
                  onPress={() =>
                    handleQuickMessage(message.text, message.label, message.id)
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      message.id === "EMOTIONAL_SUPPORT"
                        ? "heart-outline"
                        : message.id === "FUNCTIONAL_GOAL"
                          ? "flag-outline"
                          : "chatbubble-ellipses-outline"
                    }
                    size={16}
                    color={
                      (message.id === "EMOTIONAL_SUPPORT" &&
                        adesao.hasEmotionalVulnerability) ||
                      (message.id === "FUNCTIONAL_GOAL" &&
                        hasFunctionalContextForMessage)
                        ? COLORS.error
                        : COLORS.primary
                    }
                  />
                  <Text style={styles.quickMessageText}>{message.label}</Text>
                </TouchableOpacity>
              ))
            : null}
        </PatientDetailsSection>
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
    paddingBottom: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginVertical: SPACING.md,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: "center",
    paddingVertical: SPACING.xl,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FONTS.sizes["3xl"],
    fontWeight: "bold",
    color: COLORS.white,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  cycleBadge: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  cycleBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  cycleBadgeAwaiting: {
    borderColor: COLORS.warning + "66",
    backgroundColor: COLORS.warning + "15",
  },
  cycleBadgeTextAwaiting: {
    color: COLORS.warning,
  },
  cycleBadgeInTreatment: {
    borderColor: COLORS.primary + "66",
    backgroundColor: COLORS.primary + "15",
  },
  cycleBadgeTextInTreatment: {
    color: COLORS.primary,
  },
  cycleBadgeCompleted: {
    borderColor: COLORS.success + "66",
    backgroundColor: COLORS.success + "15",
  },
  cycleBadgeTextCompleted: {
    color: COLORS.success,
  },
  appAccessBadge: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.success + "55",
    backgroundColor: COLORS.success + "22",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  appAccessBadgeText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  appAccessWarning: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.warning + "66",
    backgroundColor: COLORS.warning + "1A",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  appAccessWarningText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: SPACING.lg,
    gap: SPACING.lg,
  },
  careTimelineWrap: {
    marginTop: SPACING.md,
    width: "100%",
  },
  quickAction: {
    alignItems: "center",
  },
  quickActionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  quickMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  quickMessageButtonHighlight: {
    borderColor: COLORS.error + "55",
    backgroundColor: COLORS.error + "08",
  },
  emotionalContactInfo: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.error + "08",
    borderColor: COLORS.error + "22",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  emotionalContactInfoText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    flex: 1,
  },
  quickMessageText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  startHereCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    ...SHADOWS.sm,
  },
  startHereHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  startHereTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  startHereDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  riskHighText: {
    color: COLORS.error,
  },
  riskMediumText: {
    color: "#92400E",
  },
  riskLowText: {
    color: COLORS.success,
  },
  riskNeutralText: {
    color: COLORS.textSecondary,
  },
  nextActionCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    backgroundColor: COLORS.primary + "08",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  nextActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  nextActionTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  nextActionDescription: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },
  nextActionButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  nextActionButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  moreMessagesButton: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  moreMessagesButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  exameCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  exameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  exameHeaderTextWrap: {
    flex: 1,
  },
  exameTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  exameMeta: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  exameActionsRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  documentSummaryCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
  },
  flowSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  readinessCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    backgroundColor: COLORS.primary + "08",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  readinessHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  readinessTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  readinessMain: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  readinessDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  flowTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  flowProgressTrack: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  flowProgressFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  flowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  flowChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  flowChipDone: {
    borderColor: COLORS.success + "66",
    backgroundColor: COLORS.success + "15",
  },
  flowChipInProgress: {
    borderColor: COLORS.primary + "66",
    backgroundColor: COLORS.primary + "10",
  },
  flowChipBlocked: {
    borderColor: COLORS.warning + "66",
    backgroundColor: COLORS.warning + "15",
  },
  flowChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  flowChipTextDone: {
    color: COLORS.success,
  },
  flowChipTextInProgress: {
    color: COLORS.primary,
  },
  flowChipTextBlocked: {
    color: COLORS.warning,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  secondaryActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + "08",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  secondaryActionChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  caseSummaryList: {
    gap: SPACING.sm,
  },
  caseSummaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingBottom: SPACING.sm,
  },
  caseSummaryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  caseSummaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: 2,
  },
  caseSummaryValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 19,
  },
  historyGrid: {
    gap: SPACING.sm,
  },
  historyBlock: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
  },
  historyLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  followUpMetricRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  followUpMetric: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
  },
  followUpMetricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: 2,
  },
  followUpMetricValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  followUpNote: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
  },
  inlineCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inlineTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  inlineText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reviewBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    marginTop: SPACING.xs,
  },
  reviewBadgePending: {
    borderColor: COLORS.warning + "66",
    backgroundColor: COLORS.warning + "15",
  },
  reviewBadgeDone: {
    borderColor: COLORS.success + "66",
    backgroundColor: COLORS.success + "15",
  },
  reviewBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  reviewBadgeTextPending: {
    color: COLORS.warning,
  },
  reviewBadgeTextDone: {
    color: COLORS.success,
  },
  auditList: {
    gap: SPACING.xs,
  },
  auditItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
  },
  auditTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  auditTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  auditMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  emptyInline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});
