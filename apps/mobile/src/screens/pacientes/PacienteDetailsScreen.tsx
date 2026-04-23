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
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useEvolucaoStore } from "../../stores/evolucaoStore";
import { useLaudoStore } from "../../stores/laudoStore";
import { api, getAuditEntries, recordAuditAction, toAuditRef, trackEvent } from "../../services";
import {
  getExamErrorMessage,
  isAllowedExamFile,
  MAX_EXAME_SIZE_BYTES,
  withExamRetry,
} from "../../utils/examUpload";
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
  MotivoBusca,
  PacienteCicloStatus,
  RootStackParamList,
  UserRole,
} from "../../types";

type PacienteDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteDetails">;
  route: RouteProp<RootStackParamList, "PacienteDetails">;
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}

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

type ClinicalStageStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type NextBestActionCode =
  | "SEND_CHECKIN_REMINDER"
  | "SEND_ADHERENCE_REMINDER"
  | "SCHEDULE_RETURN"
  | "OPEN_ADHERENCE_PANEL"
  | "RECORD_EVOLUTION";

type AdherenceRiskReasonCode =
  | "NO_EVOLUTION"
  | "LONG_GAP"
  | "MEDIUM_GAP"
  | "LOW_ADHERENCE"
  | "MEDIUM_ADHERENCE"
  | "HIGH_STRESS"
  | "LOW_ENERGY"
  | "LOW_SUPPORT"
  | "POOR_SLEEP";


const getMotivoBuscaLabel = (motivoBusca?: MotivoBusca | string | null) => {
  if (!motivoBusca) return "Não informado";
  if (motivoBusca === MotivoBusca.SINTOMA_EXISTENTE) return "Sintoma existente";
  if (motivoBusca === MotivoBusca.PREVENTIVO) return "Preventivo";
  return String(motivoBusca).replace(/_/g, " ");
};
const formatEnumLabel = (value?: string | null) => {
  if (!value) return "";

  const normalized = String(value).trim();
  if (!normalized) return "";

  const map: Record<string, string> = {
    MASCULINO: "Masculino",
    FEMININO: "Feminino",
    OUTRO: "Outro",
    SOLTEIRO: "Solteiro",
    CASADO: "Casado",
    VIUVO: "Viúvo",
    DIVORCIADO: "Divorciado",
    UNIAO_ESTAVEL: "União estável",
  };

  const upper = normalized.toUpperCase();
  if (map[upper]) return map[upper];

  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const parseDatePreservingDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

function InfoRow({ icon, label, value, onPress }: InfoRowProps) {
  const { t } = useLanguage();
  const Content = (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={20}
        color={COLORS.primary}
        style={styles.infoIcon}
      />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || t("patientDetails.notInformed")}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
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
  const { getPacienteById, updatePaciente, fetchPacienteById } = usePacienteStore();
  const {
    anamneses,
    fetchAnamnesesByPaciente,
    getAnamneseById,
  } = useAnamneseStore();
  const {
    evolucoes,
    fetchEvolucoesByPaciente,
    getEvolucaoById,
  } = useEvolucaoStore();
  const { fetchLaudoByPaciente } = useLaudoStore();
  const { showToast } = useToast();
  const actorId = useAuthStore((state) => state.usuario?.id);
  const viewerRole = useAuthStore((state) => state.usuario?.role);
  const authToken = useAuthStore((state) => state.token);
  const [exames, setExames] = useState<PacienteExameItem[]>([]);
  const [isLoadingExames, setIsLoadingExames] = useState(false);
  const [isUploadingExame, setIsUploadingExame] = useState(false);
  const [downloadingExameId, setDownloadingExameId] = useState<string | null>(null);
  const [removingExameId, setRemovingExameId] = useState<string | null>(null);
  const [updatingAnamnesePermission, setUpdatingAnamnesePermission] = useState(false);
  const [lastEmotionalSupportContactAt, setLastEmotionalSupportContactAt] =
    useState<string | null>(null);
  const [laudoSnapshot, setLaudoSnapshot] = useState<{
    id: string;
    exameFisico?: string;
    condutas?: string;
  } | null>(null);
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

  useFocusEffect(
    React.useCallback(() => {
      fetchPacienteById(pacienteId).catch(() => undefined);
    }, [fetchPacienteById, pacienteId]),
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
      showToast({ message: t("patientDetails.loadAnamnesisError"), type: "error" });
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
      showToast({ message: t("patientDetails.loadEvolutionError"), type: "error" });
    });
  }, [pacienteId]);

  useEffect(() => {
    let active = true;
    fetchLaudoByPaciente(pacienteId, false)
      .then((laudo: { id: string; exameFisico?: string; condutas?: string } | null) => {
        if (!active) return;
        if (!laudo?.id) {
          setLaudoSnapshot(null);
          return;
        }
        setLaudoSnapshot({
          id: laudo.id,
          exameFisico: laudo.exameFisico,
          condutas: laudo.condutas,
        });
      })
      .catch(() => {
        if (!active) return;
        setLaudoSnapshot(null);
      });

    return () => {
      active = false;
    };
  }, [fetchLaudoByPaciente, pacienteId]);

  useEffect(() => {
    getAuditEntries(200)
      .then((entries) => {
        const last = entries.find(
          (entry) =>
            entry.action === "QUICK_MESSAGE_SENT" &&
            entry.metadata?.pacienteId === toAuditRef(pacienteId) &&
            entry.metadata?.templateId === "EMOTIONAL_SUPPORT",
        );
        setLastEmotionalSupportContactAt(last?.at || null);
      })
      .catch(() => setLastEmotionalSupportContactAt(null));
  }, [pacienteId]);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleWhatsApp = () => {
    const phone = paciente.contato.whatsapp.replace(/\D/g, "");
    Linking.openURL(`whatsapp://send?phone=55${phone}`);
  };

  const dateLocale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
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
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
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
        showToast({ type: "error", message: t("patientDetails.examUploadInvalidFile") });
        return;
      }
      if (typeof file.size === "number" && file.size > MAX_EXAME_SIZE_BYTES) {
        showToast({ type: "error", message: t("patientDetails.examErrorTooLarge") });
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
        showToast({ type: "error", message: t("patientDetails.examErrorUnsupportedType") });
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
      showToast({ type: "success", message: t("patientDetails.examUploadedSuccess") });
      await loadExames();
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
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
        const localPathBase = FileSystem.cacheDirectory || FileSystem.documentDirectory;
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
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
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
      await withExamRetry(() => api.delete(`/pacientes/${pacienteId}/exames/${exameId}`));
      setExames((prev) => prev.filter((item) => item.id !== exameId));
      trackEvent("patient_exam_removed", { pacienteId, exameId }).catch(() => undefined);
      showToast({ type: "success", message: t("patientDetails.examRemoveSuccess") });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
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
  const prescribeActivityLabel =
    /^prescrib/i.test(prescribeActivityLabelRaw.trim())
      ? "Prescrever atividade"
      : prescribeActivityLabelRaw;

  const quickMessages: Array<{
    id:
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
      text: t("patientDetails.quickMessageCheckinText", { name: paciente.nomeCompleto }),
    },
    {
      id: "ADHERENCE",
      label: t("patientDetails.quickMessageAdherenceLabel"),
      text: t("patientDetails.quickMessageAdherenceText", { name: paciente.nomeCompleto }),
    },
    {
      id: "SCHEDULE",
      label: t("patientDetails.quickMessageScheduleLabel"),
      text: t("patientDetails.quickMessageScheduleText", { name: paciente.nomeCompleto }),
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
      await recordAuditAction("QUICK_MESSAGE_SENT", {
        pacienteId,
        templateId: templateId || null,
      }, actorId);
    } catch {
      showToast({ message: t("patientDetails.openWhatsappError"), type: "error" });
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
      await updatePaciente(paciente.id, {
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
      } as any);

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

  const anamnesesFiltradas = anamneses
    .filter((a) => a.pacienteId === pacienteId)
    .slice(0, 2);
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
  const evolucoesFiltradas = evolucoesDoPaciente.slice(0, 2);
  const hasAnamnese = anamneses.some((a) => a.pacienteId === pacienteId);
  const hasExameFisico = !!String(laudoSnapshot?.exameFisico || "").trim();
  const hasEvolucao = evolucoesDoPaciente.length > 0;
  const hasLaudoPlano = !!laudoSnapshot?.id;
  const hasVinculoAtivo = !!paciente.pacienteUsuarioId;

  const resolveStageStatus = (
    done: boolean,
    gateReady: boolean,
  ): ClinicalStageStatus => {
    if (done) return "DONE";
    if (!gateReady) return "BLOCKED";
    return "IN_PROGRESS";
  };

  const clinicalFlowItems = [
    {
      key: "anamnese",
      label: "Anamnese",
      status: resolveStageStatus(hasAnamnese, hasVinculoAtivo),
    },
    {
      key: "exame",
      label: "Exame físico",
      status: resolveStageStatus(hasExameFisico, hasVinculoAtivo && hasAnamnese),
    },
    {
      key: "evolucao",
      label: "Evolução",
      status: resolveStageStatus(
        hasEvolucao,
        hasVinculoAtivo && hasAnamnese && hasExameFisico,
      ),
    },
    {
      key: "laudo",
      label: "Laudo",
      status: resolveStageStatus(hasLaudoPlano, hasVinculoAtivo && hasAnamnese),
    },
    {
      key: "plano",
      label: "Plano",
      status: resolveStageStatus(hasLaudoPlano, hasVinculoAtivo && hasAnamnese),
    },
  ] as const;

  const clinicalFlowProgress =
    (clinicalFlowItems.filter((item) => item.status === "DONE").length /
      clinicalFlowItems.length) *
    100;

  const handleOpenAnamnese = () => {
    trackEvent("clinical_flow_stage_opened", {
      stage: "ANAMNESE",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("AnamneseForm", { pacienteId: paciente.id });
  };

  const handleOpenExameFisico = () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", {
        stage: "EXAME_FISICO",
        reason: "MISSING_ANAMNESE",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("patientDetails.guardAnamnesisBeforePhysicalExam"),
      });
      navigation.navigate("AnamneseForm", { pacienteId: paciente.id });
      return;
    }
    trackEvent("clinical_flow_stage_opened", {
      stage: "EXAME_FISICO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("ExameFisicoForm", { pacienteId: paciente.id });
  };

  const handleOpenEvolucao = () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", {
        stage: "EVOLUCAO",
        reason: "MISSING_ANAMNESE",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("patientDetails.guardAnamnesisBeforeEvolution"),
      });
      navigation.navigate("AnamneseForm", { pacienteId: paciente.id });
      return;
    }
    if (!hasExameFisico) {
      trackEvent("clinical_flow_blocked", {
        stage: "EVOLUCAO",
        reason: "MISSING_EXAME_FISICO",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("patientDetails.guardPhysicalExamBeforeEvolution"),
      });
      navigation.navigate("ExameFisicoForm", { pacienteId: paciente.id });
      return;
    }
    trackEvent("clinical_flow_stage_opened", {
      stage: "EVOLUCAO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("EvolucaoForm", { pacienteId: paciente.id });
  };

  const handleOpenLaudo = () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", {
        stage: "LAUDO",
        reason: "MISSING_ANAMNESE",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("patientDetails.guardLinkAndAnamnesisBeforeReport"),
      });
      return;
    }
    trackEvent("clinical_flow_stage_opened", {
      stage: "LAUDO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("LaudoForm", { pacienteId: paciente.id });
  };

  const handleOpenPlano = () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", {
        stage: "PLANO",
        reason: "MISSING_ANAMNESE",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("patientDetails.guardLinkAndAnamnesisBeforeReport"),
      });
      return;
    }
    trackEvent("clinical_flow_stage_opened", {
      stage: "PLANO",
      pacienteId,
    }).catch(() => undefined);
    navigation.navigate("PlanoForm", { pacienteId: paciente.id });
  };

  const readiness = useMemo(() => {
    if (!hasVinculoAtivo) {
      return {
        title: "Paciente sem vínculo de app",
        description:
          "Vincule o paciente no app para liberar o fluxo clínico completo.",
        actionLabel: "Vincular paciente",
        action: () => navigation.navigate("PacienteForm", { pacienteId: paciente.id }),
      };
    }

    if (!hasAnamnese) {
      return {
        title: "Pronto para iniciar anamnese",
        description: "Próximo passo recomendado: preencher a anamnese.",
        actionLabel: "Continuar fluxo · Anamnese",
        action: handleOpenAnamnese,
      };
    }

    if (!hasExameFisico) {
      return {
        title: "Pronto para exame físico",
        description:
          "Anamnese concluída. Próximo passo recomendado: exame físico.",
        actionLabel: "Continuar fluxo · Exame físico",
        action: handleOpenExameFisico,
      };
    }

    if (!hasEvolucao) {
      return {
        title: "Pronto para registrar evolução",
        description:
          "Exame físico concluído. Próximo passo recomendado: evolução.",
        actionLabel: "Continuar fluxo · Evolução",
        action: handleOpenEvolucao,
      };
    }

    if (!hasLaudoPlano) {
      return {
        title: "Pronto para laudo e plano",
        description:
          "Fluxo base concluído. Gere laudo/plano para fechar a sessão.",
        actionLabel: "Continuar fluxo · Laudo/Plano",
        action: handleOpenLaudo,
      };
    }

    return {
      title: "Sessão pronta para fechamento",
      description:
        "Fluxo clínico concluído. Revise adesão/check-ins e pendências da sessão.",
      actionLabel: "Abrir adesão e checks",
      action: () => navigation.navigate("PacienteAdesao", { pacienteId: paciente.id }),
    };
  }, [
    hasVinculoAtivo,
    hasAnamnese,
    hasExameFisico,
    hasEvolucao,
    hasLaudoPlano,
    navigation,
    paciente.id,
  ]);

  const adesao = useMemo(() => {
    const now = Date.now();
    const last28Days = 28 * 24 * 60 * 60 * 1000;
    const last14Days = 14 * 24 * 60 * 60 * 1000;
    const last7Days = 7 * 24 * 60 * 60 * 1000;

    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    const sessionsIn28Days = evolucoesDoPaciente.filter((e) => {
      const time = parseDatePreservingDateOnly(e.data).getTime();
      if (Number.isNaN(time)) return false;
      return now - time <= last28Days;
    }).length;

    const score = Math.max(0, Math.min(100, Math.round((sessionsIn28Days / 4) * 100)));

    const lastSession = evolucoesDoPaciente[0];
    const lastSessionMs = lastSession
      ? parseDatePreservingDateOnly(lastSession.data).getTime()
      : NaN;
    const daysWithoutSession =
      Number.isNaN(lastSessionMs) ? null : Math.floor((now - lastSessionMs) / (24 * 60 * 60 * 1000));

    const riskReasons: AdherenceRiskReasonCode[] = [];
    let riskScore = 0;

    if (daysWithoutSession === null) {
      riskScore += 80;
      riskReasons.push("NO_EVOLUTION");
    } else if (now - lastSessionMs > last14Days) {
      riskScore += 60;
      riskReasons.push("LONG_GAP");
    } else if (now - lastSessionMs > last7Days) {
      riskScore += 35;
      riskReasons.push("MEDIUM_GAP");
    }

    if (score < 50) {
      riskScore += 30;
      riskReasons.push("LOW_ADHERENCE");
    } else if (score < 75) {
      riskScore += 15;
      riskReasons.push("MEDIUM_ADHERENCE");
    }

    if ((ultimaAnamnese?.nivelEstresse ?? 0) >= 8) {
      riskScore += 12;
      riskReasons.push("HIGH_STRESS");
    }
    if (
      typeof ultimaAnamnese?.energiaDiaria === "number" &&
      ultimaAnamnese.energiaDiaria <= 3
    ) {
      riskScore += 10;
      riskReasons.push("LOW_ENERGY");
    }
    if (
      typeof ultimaAnamnese?.apoioEmocional === "number" &&
      ultimaAnamnese.apoioEmocional <= 3
    ) {
      riskScore += 8;
      riskReasons.push("LOW_SUPPORT");
    }
    if (
      typeof ultimaAnamnese?.qualidadeSono === "number" &&
      ultimaAnamnese.qualidadeSono <= 3
    ) {
      riskScore += 8;
      riskReasons.push("POOR_SLEEP");
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    let risco: "ALTO" | "MODERADO" | "BAIXO" = "BAIXO";
    if (riskScore >= 70) {
      risco = "ALTO";
    } else if (riskScore >= 40) {
      risco = "MODERADO";
    }

    const proximaSessaoSugerida = Number.isNaN(lastSessionMs)
      ? new Date(now + 24 * 60 * 60 * 1000)
      : new Date(lastSessionMs + 7 * 24 * 60 * 60 * 1000);

    const hasEmotionalVulnerability =
      riskReasons.includes("HIGH_STRESS") ||
      riskReasons.includes("LOW_ENERGY") ||
      riskReasons.includes("LOW_SUPPORT") ||
      riskReasons.includes("POOR_SLEEP");
    const hasHighEmotionalVulnerability =
      riskReasons.includes("HIGH_STRESS") &&
      (riskReasons.includes("LOW_ENERGY") || riskReasons.includes("LOW_SUPPORT"));

    let nextBestAction: NextBestActionCode = "RECORD_EVOLUTION";
    if (daysWithoutSession === null || (daysWithoutSession ?? 0) >= 14) {
      nextBestAction = "SCHEDULE_RETURN";
    } else if (hasHighEmotionalVulnerability) {
      nextBestAction = "SCHEDULE_RETURN";
    } else if ((daysWithoutSession ?? 0) >= 7) {
      nextBestAction = "SEND_CHECKIN_REMINDER";
    } else if (hasEmotionalVulnerability) {
      nextBestAction = "SEND_CHECKIN_REMINDER";
    } else if (score < 50) {
      nextBestAction = "SEND_ADHERENCE_REMINDER";
    } else if (score < 75) {
      nextBestAction = "OPEN_ADHERENCE_PANEL";
    }

    return {
      sessionsIn28Days,
      score,
      riskScore,
      riskReasons,
      daysWithoutSession,
      risco,
      proximaSessaoSugerida,
      nextBestAction,
      hasEmotionalVulnerability,
      hasHighEmotionalVulnerability,
    };
  }, [evolucoesDoPaciente, anamneses, pacienteId]);

  const resumoClinicoAutomatico = useMemo(() => {
    const partes: string[] = [];
    const ultimaEvolucao = evolucoesDoPaciente[0];
    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    if (ultimaAnamnese?.motivoBusca) {
      partes.push(`Queixa principal: ${getMotivoBuscaLabel(ultimaAnamnese.motivoBusca)}.`);
    }
    if (ultimaAnamnese?.limitacoesFuncionais?.trim()) {
      partes.push(
        `Limitações funcionais relatadas: ${ultimaAnamnese.limitacoesFuncionais.trim()}.`,
      );
    }
    if (ultimaAnamnese?.atividadesQuePioram?.trim()) {
      partes.push(
        `Piora com: ${ultimaAnamnese.atividadesQuePioram.trim()}.`,
      );
    }
    if (ultimaAnamnese?.metaPrincipalPaciente?.trim()) {
      partes.push(
        `Meta principal do paciente: ${ultimaAnamnese.metaPrincipalPaciente.trim()}.`,
      );
    }

    if (ultimaEvolucao) {
      const dataUltima = parseDatePreservingDateOnly(ultimaEvolucao.data);
      const dataLabel = Number.isNaN(dataUltima.getTime())
        ? "data indisponível"
        : dataUltima.toLocaleDateString(dateLocale);
      partes.push(`Última evolução registrada em ${dataLabel}.`);

      if ((ultimaEvolucao.avaliacao || ultimaEvolucao.ajustes)?.trim()) {
        partes.push(`Avaliação clínica recente: ${(ultimaEvolucao.avaliacao || ultimaEvolucao.ajustes || "").trim()}.`);
      }
    } else {
      partes.push("Sem evoluções registradas até o momento.");
    }

    if (adesao.risco === "ALTO") {
      partes.push(
        "Atenção para risco alto de evasão; priorizar contato e revisão do plano.",
      );
    } else if (adesao.risco === "MODERADO") {
      partes.push(
        "Risco moderado de evasão; reforçar aderência e acompanhar de perto.",
      );
    } else {
      partes.push("Acompanhamento com bom sinal de continuidade no momento.");
    }

    partes.push(
      `Aderência estimada (28 dias): ${adesao.score}% (${adesao.sessionsIn28Days}/4 sessões).`,
    );

    return partes.join(" ");
  }, [anamneses, pacienteId, evolucoesDoPaciente, adesao, dateLocale]);

  const resumoEstiloVidaEmocional = useMemo(() => {
    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    if (!ultimaAnamnese) return null;

    const chips: string[] = [];

    if (ultimaAnamnese.horasSonoMedia?.trim()) {
      chips.push(`Sono: ${ultimaAnamnese.horasSonoMedia.trim()}`);
    }
    if (typeof ultimaAnamnese.qualidadeSono === "number") {
      chips.push(`Qualidade do sono: ${ultimaAnamnese.qualidadeSono}/10`);
    }
    if (typeof ultimaAnamnese.nivelEstresse === "number") {
      chips.push(`Estresse: ${ultimaAnamnese.nivelEstresse}/10`);
    }
    if (typeof ultimaAnamnese.energiaDiaria === "number") {
      chips.push(`Energia: ${ultimaAnamnese.energiaDiaria}/10`);
    }
    if (typeof ultimaAnamnese.apoioEmocional === "number") {
      chips.push(`Apoio emocional: ${ultimaAnamnese.apoioEmocional}/10`);
    }
    if (ultimaAnamnese.humorPredominante?.trim()) {
      chips.push(`Humor: ${ultimaAnamnese.humorPredominante.trim()}`);
    }
    if (ultimaAnamnese.atividadeFisicaRegular === true) {
      chips.push(
        ultimaAnamnese.frequenciaAtividadeFisica?.trim()
          ? `Atividade física: ${ultimaAnamnese.frequenciaAtividadeFisica.trim()}`
          : "Atividade física regular: sim",
      );
    } else if (ultimaAnamnese.atividadeFisicaRegular === false) {
      chips.push("Atividade física regular: não");
    }

    const hasAnyData =
      chips.length > 0 || !!ultimaAnamnese.observacoesEstiloVida?.trim();

    if (!hasAnyData) return null;

    let status = "Sem alerta emocional relevante";
    let tone: "good" | "warn" | "risk" = "good";
    const estresse = ultimaAnamnese.nivelEstresse ?? 0;
    const energia = ultimaAnamnese.energiaDiaria ?? 0;
    const apoio = ultimaAnamnese.apoioEmocional ?? 0;

    if (estresse >= 8 || energia <= 3 || apoio <= 3) {
      status = "Maior atenção para estado emocional/rotina";
      tone = "risk";
    } else if (estresse >= 6 || energia <= 5 || apoio <= 5) {
      status = "Atenção para fatores de estilo de vida";
      tone = "warn";
    }

    return {
      status,
      tone,
      chips,
      observacoes: ultimaAnamnese.observacoesEstiloVida?.trim() || "",
    };
  }, [anamneses, pacienteId]);

  const resumoFuncionalObjetivos = useMemo(() => {
    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    if (!ultimaAnamnese) return null;

    const limitacoes = ultimaAnamnese.limitacoesFuncionais?.trim() || "";
    const piora = ultimaAnamnese.atividadesQuePioram?.trim() || "";
    const meta = ultimaAnamnese.metaPrincipalPaciente?.trim() || "";

    if (!limitacoes && !piora && !meta) return null;

    return { limitacoes, piora, meta };
  }, [anamneses, pacienteId]);

  const riskReasonLabels: Record<AdherenceRiskReasonCode, string> = {
    NO_EVOLUTION: "Sem evolução registrada",
    LONG_GAP: "Longo intervalo sem sessão (14+ dias)",
    MEDIUM_GAP: "Intervalo elevado sem sessão (7+ dias)",
    LOW_ADHERENCE: "Aderência baixa nos últimos 28 dias",
    MEDIUM_ADHERENCE: "Aderência moderada nos últimos 28 dias",
    HIGH_STRESS: "Estresse elevado na anamnese",
    LOW_ENERGY: "Baixa energia no dia a dia",
    LOW_SUPPORT: "Baixo apoio emocional/social",
    POOR_SLEEP: "Sono com baixa qualidade",
  };

  const contextualNextActionHint = useMemo(() => {
    if (!resumoFuncionalObjetivos) return "";
    if (resumoFuncionalObjetivos.meta) {
      return ` Considere alinhar a condução à meta principal: ${resumoFuncionalObjetivos.meta}.`;
    }
    if (resumoFuncionalObjetivos.limitacoes) {
      return ` Priorize condutas voltadas às limitações funcionais relatadas.`;
    }
    return "";
  }, [resumoFuncionalObjetivos]);

  const hasFunctionalContextForMessage = !!(
    resumoFuncionalObjetivos?.meta ||
    resumoFuncionalObjetivos?.limitacoes ||
    resumoFuncionalObjetivos?.piora
  );

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
      SEND_CHECKIN_REMINDER: {
        title: "Enviar lembrete de check-in",
        description:
          (adesao.hasEmotionalVulnerability
            ? "Há sinais de vulnerabilidade emocional/rotina. Faça um contato acolhedor e incentive um check-in breve para entender como o paciente está."
            : "Paciente com intervalo recente sem sessão. Reforce o check-in para retomar o acompanhamento.") +
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
        title: "Reforçar aderência",
        description:
          "Aderência abaixo do ideal. Envie uma mensagem rápida para aumentar consistência nesta semana." +
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
        title: "Agendar retorno",
        description:
          (adesao.hasHighEmotionalVulnerability
            ? "Há sinais importantes de sobrecarga emocional/rotina. Priorize contato para acolhimento e revisão do plano antes da perda de vínculo."
            : "Risco alto de evasão por ausência prolongada. Priorize contato para revisar evolução e plano.") +
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
        title: "Revisar aderência e checks",
        description:
          "Há sinais de queda de consistência. Confira a timeline de check-ins para agir com precisão." +
          contextualNextActionHint,
        ctaLabel: t("patientDetails.adherenceChecks"),
        onPress: () =>
          navigation.navigate("PacienteAdesao", { pacienteId: paciente.id }),
      },
      RECORD_EVOLUTION: {
        title: t("patientDetails.recordEvolution"),
        description:
          "Paciente está em acompanhamento adequado. Mantenha a cadência registrando evolução clínica." +
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
    adesao.nextBestAction,
    navigation,
    paciente.id,
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
            {(paciente.idade ?? "-")} {t("patients.years")} -{" "}
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

          {!!paciente.pacienteUsuarioId && (
            <View style={styles.appAccessBadge}>
              <Ionicons
                name="phone-portrait-outline"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.appAccessBadgeText}>{t("patients.appAccessActive")}</Text>
            </View>
          )}
          {!paciente.pacienteUsuarioId && (
            <View style={styles.appAccessWarning}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={COLORS.warning}
              />
              <Text style={styles.appAccessWarningText}>
                Paciente sem vínculo com acesso do app. Vincule um e-mail para liberar os recursos do paciente.
              </Text>
            </View>
          )}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} />
              <Text style={styles.quickActionText}>{t("patientDetails.whatsapp")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
              <Ionicons name="call" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>{t("patientDetails.call")}</Text>
            </TouchableOpacity>
            {paciente.contato.email && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={24} color={COLORS.secondary} />
                <Text style={styles.quickActionText}>{t("patientDetails.email")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() =>
                navigation.navigate("PacienteForm", { pacienteId: paciente.id })
              }
            >
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>{"Editar"}</Text>
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
                    ? "Atualizando..."
                    : paciente.anamneseLiberadaPaciente
                      ? tSafe("patientDetails.blockAnamnesis", "Bloquear anamnese")
                      : tSafe("patientDetails.releaseAnamnesis", "Liberar anamnese")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {viewerRole === UserRole.PACIENTE && anamnesesFiltradas.length === 0 ? (
          <View style={styles.startHereCard}>
            <View style={styles.startHereHeader}>
              <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
              <Text style={styles.startHereTitle}>Vamos iniciar por aqui</Text>
            </View>
            <Text style={styles.startHereDescription}>
              Abra a ficha de anamnese para registrar os dados iniciais do paciente.
            </Text>
            <Button
              title="Abrir ficha de anamnese"
              onPress={() => navigation.navigate("AnamneseForm", { pacienteId })}
              fullWidth
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.personalData")}</Text>
          <InfoRow
            icon="card-outline"
            label={t("patientDetails.cpf")}
            value={formatCPF(paciente.cpf)}
          />
          <InfoRow
            icon="calendar-outline"
            label={
              t("patientDetails.birth") === "patientDetails.birth"
                ? "Nascimento"
                : t("patientDetails.birth")
            }
            value={paciente.dataNascimentoFormatada || paciente.dataNascimento}
          />
          <InfoRow icon="person-outline" label={t("patientDetails.sex")} value={formatEnumLabel(paciente.sexo)} />
          <InfoRow
            icon="briefcase-outline"
            label={t("patientDetails.profession")}
            value={paciente.profissao || ""}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.contact")}</Text>
          <InfoRow
            icon="logo-whatsapp"
            label={t("patientDetails.whatsapp")}
            value={formatPhone(paciente.contato.whatsapp)}
            onPress={handleWhatsApp}
          />
          {paciente.contato.telefone && (
            <InfoRow
              icon="call-outline"
              label={t("patientDetails.phone")}
              value={formatPhone(paciente.contato.telefone)}
              onPress={handleCall}
            />
          )}
          {paciente.contato.email && (
            <InfoRow
              icon="mail-outline"
              label={t("patientDetails.email")}
              value={paciente.contato.email}
              onPress={handleEmail}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.address")}</Text>
          <InfoRow
            icon="location-outline"
            label={t("patientDetails.addressLabel")}
            value={`${paciente.endereco.rua}, ${paciente.endereco.numero}${paciente.endereco.complemento ? ` - ${paciente.endereco.complemento}` : ""}`}
          />
          <InfoRow
            icon="business-outline"
            label={t("patientDetails.neighborhood")}
            value={paciente.endereco.bairro}
          />
          <InfoRow
            icon="map-outline"
            label={t("patientDetails.city")}
            value={`${paciente.endereco.cidade} - ${paciente.endereco.uf}`}
          />
        </View>

        {/* Resumo de Anamneses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.latestAnamneses")}</Text>
          {anamnesesFiltradas.length === 0 ? (
            <Text style={styles.emptyInline}>{t("patientDetails.noAnamnesis")}</Text>
          ) : (
            anamnesesFiltradas.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() =>
                  navigation.navigate("AnamneseForm", {
                    pacienteId,
                    anamneseId: a.id,
                  })
                }
                style={styles.inlineCard}
              >
                <Text style={styles.inlineTitle}>
                  {new Date(a.createdAt).toLocaleDateString(dateLocale)}
                </Text>
                <Text style={styles.inlineText} numberOfLines={1}>
                  {getMotivoBuscaLabel(a.motivoBusca)}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <Button
            title={t("common.viewAll")}
            onPress={() =>
              navigation.navigate("AnamneseList", { pacienteId: paciente.id })
            }
            variant="ghost"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        {/* Resumo de Evolucoes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.adherenceRetention")}</Text>
          <View style={styles.adherenceCard}>
            <View style={styles.adherenceHeader}>
              <Text style={styles.adherenceTitle}>{t("patientDetails.adherence28")}</Text>
              <Text style={styles.adherenceScore}>{adesao.score}%</Text>
            </View>
            <View style={styles.adherenceTrack}>
              <View
                style={[
                  styles.adherenceFill,
                  {
                    width: `${adesao.score}%`,
                    backgroundColor:
                      adesao.score >= 75
                        ? COLORS.success
                        : adesao.score >= 50
                          ? COLORS.warning
                          : COLORS.error,
                  },
                ]}
              />
            </View>
            <Text style={styles.adherenceMeta}>
              {t("patientDetails.sessions28", { count: adesao.sessionsIn28Days })}
            </Text>
            <Text style={styles.adherenceMeta}>
              {t("patientDetails.lastSession")}:{" "}
              {adesao.daysWithoutSession === null
                ? t("patientDetails.noEvolutionRegistered")
                : t("patientDetails.daysAgo", { days: adesao.daysWithoutSession })}
            </Text>
            <Text style={styles.adherenceMeta}>
              {t("patientDetails.nextSuggestedSession")}:{" "}
              {adesao.proximaSessaoSugerida.toLocaleDateString(dateLocale)}
            </Text>
            <Text style={styles.adherenceMeta}>
              Score de risco (MVP): {adesao.riskScore}/100
            </Text>
            <View
              style={[
                styles.riskBadge,
                adesao.risco === "ALTO"
                  ? styles.riskHigh
                  : adesao.risco === "MODERADO"
                    ? styles.riskMedium
                    : styles.riskLow,
              ]}
            >
              <Ionicons
                name={adesao.risco === "ALTO" ? "alert-circle" : "checkmark-circle"}
                size={14}
                color={
                  adesao.risco === "ALTO"
                    ? COLORS.error
                    : adesao.risco === "MODERADO"
                      ? COLORS.warning
                      : COLORS.success
                }
              />
              <Text
                style={[
                  styles.riskBadgeText,
                  adesao.risco === "ALTO"
                    ? styles.riskHighText
                    : adesao.risco === "MODERADO"
                      ? styles.riskMediumText
                      : styles.riskLowText,
                ]}
              >
                {t("patientDetails.dropoutRisk", { risk: adesao.risco })}
              </Text>
            </View>
            {adesao.riskReasons.length > 0 ? (
              <View style={styles.riskReasonsWrap}>
                {adesao.riskReasons.map((reason) => (
                  <View key={reason} style={styles.riskReasonChip}>
                    <Text style={styles.riskReasonChipText}>
                      {riskReasonLabels[reason]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {resumoEstiloVidaEmocional ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Estilo de vida e estado emocional
            </Text>
            <View style={styles.nextActionCard}>
              <View style={styles.nextActionHeader}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.nextActionTitle}>
                  {resumoEstiloVidaEmocional.status}
                </Text>
              </View>
              <View style={styles.riskReasonsWrap}>
                <View
                  style={[
                    styles.riskReasonChip,
                    resumoEstiloVidaEmocional.tone === "risk"
                      ? styles.riskReasonChipRisk
                      : resumoEstiloVidaEmocional.tone === "warn"
                        ? styles.riskReasonChipWarn
                        : styles.riskReasonChipGood,
                  ]}
                >
                  <Text style={styles.riskReasonChipText}>
                    {resumoEstiloVidaEmocional.tone === "risk"
                      ? "Maior atenção"
                      : resumoEstiloVidaEmocional.tone === "warn"
                        ? "Atenção"
                        : "Baixo risco"}
                  </Text>
                </View>
                {resumoEstiloVidaEmocional.chips.map((chip) => (
                  <View key={chip} style={styles.riskReasonChip}>
                    <Text style={styles.riskReasonChipText}>{chip}</Text>
                  </View>
                ))}
              </View>
              {resumoEstiloVidaEmocional.observacoes ? (
                <Text style={styles.nextActionDescription}>
                  Observações: {resumoEstiloVidaEmocional.observacoes}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {resumoFuncionalObjetivos ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funcionalidade e objetivos</Text>
            <View style={styles.nextActionCard}>
              <View style={styles.nextActionHeader}>
                <Ionicons
                  name="body-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.nextActionTitle}>
                  Resumo funcional (Última anamnese)
                </Text>
              </View>
              {resumoFuncionalObjetivos.limitacoes ? (
                <Text style={styles.nextActionDescription}>
                  <Text style={{ fontWeight: "700", color: COLORS.textPrimary }}>
                    Limitações:
                  </Text>{" "}
                  {resumoFuncionalObjetivos.limitacoes}
                </Text>
              ) : null}
              {resumoFuncionalObjetivos.piora ? (
                <Text style={styles.nextActionDescription}>
                  <Text style={{ fontWeight: "700", color: COLORS.textPrimary }}>
                    Piora com:
                  </Text>{" "}
                  {resumoFuncionalObjetivos.piora}
                </Text>
              ) : null}
              {resumoFuncionalObjetivos.meta ? (
                <Text style={styles.nextActionDescription}>
                  <Text style={{ fontWeight: "700", color: COLORS.textPrimary }}>
                    Meta principal:
                  </Text>{" "}
                  {resumoFuncionalObjetivos.meta}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo clínico automático (MVP)</Text>
          <View style={styles.nextActionCard}>
            <View style={styles.nextActionHeader}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.nextActionTitle}>Resumo por regras</Text>
            </View>
            <Text style={styles.nextActionDescription}>{resumoClinicoAutomatico}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próxima melhor ação</Text>
          <View style={styles.nextActionCard}>
            <View style={styles.nextActionHeader}>
              <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
              <Text style={styles.nextActionTitle}>{nextActionConfig.title}</Text>
            </View>
            <Text style={styles.nextActionDescription}>
              {nextActionConfig.description}
            </Text>
            <TouchableOpacity
              style={styles.nextActionButton}
              onPress={nextActionConfig.onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.nextActionButtonText}>{nextActionConfig.ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{quickMessagesSectionTitle}</Text>
          {lastEmotionalSupportContactAt ? (
            <View style={styles.emotionalContactInfo}>
              <Ionicons name="heart-outline" size={14} color={COLORS.error} />
              <Text style={styles.emotionalContactInfoText}>
                Último contato acolhedor:{" "}
                {new Date(lastEmotionalSupportContactAt).toLocaleString(dateLocale)}
              </Text>
            </View>
          ) : null}
          {quickMessages.map((message) => (
            <TouchableOpacity
              key={message.label}
              style={[
                styles.quickMessageButton,
                ((message.id === "EMOTIONAL_SUPPORT" && adesao.hasEmotionalVulnerability) ||
                  (message.id === "FUNCTIONAL_GOAL" && hasFunctionalContextForMessage))
                  ? styles.quickMessageButtonHighlight
                  : null,
              ]}
              onPress={() => handleQuickMessage(message.text, message.label, message.id)}
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
                  ((message.id === "EMOTIONAL_SUPPORT" && adesao.hasEmotionalVulnerability) ||
                    (message.id === "FUNCTIONAL_GOAL" && hasFunctionalContextForMessage))
                    ? COLORS.error
                    : COLORS.primary
                }
              />
              <Text style={styles.quickMessageText}>{message.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("patientDetails.latestEvolutions")}</Text>
          {evolucoesFiltradas.length === 0 ? (
            <Text style={styles.emptyInline}>{t("patientDetails.noEvolution")}</Text>
          ) : (
            evolucoesFiltradas.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() =>
                  navigation.navigate("EvolucaoForm", {
                    pacienteId,
                    evolucaoId: e.id,
                  })
                }
                style={styles.inlineCard}
              >
                <Text style={styles.inlineTitle}>
                  {parseDatePreservingDateOnly(e.data).toLocaleDateString(dateLocale)}
                </Text>
                <Text style={styles.inlineText} numberOfLines={1}>
                  {e.avaliacao || e.ajustes || t("patientDetails.noAdjustments")}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <Button
            title={t("common.viewAll")}
            onPress={() =>
              navigation.navigate("EvolucaoList", { pacienteId: paciente.id })
            }
            variant="ghost"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.examesHeaderRow}>
            <Text style={styles.sectionTitle}>{t("patientDetails.documentsExams")}</Text>
            <Button
              title={t("patientDetails.attachExam")}
              onPress={handleUploadExame}
              loading={isUploadingExame}
              size="sm"
              icon={<Ionicons name="attach-outline" size={16} color={COLORS.white} />}
            />
          </View>

          {isLoadingExames ? (
            <Text style={styles.emptyInline}>{t("patientDetails.loadingExams")}</Text>
          ) : exames.length === 0 ? (
            <Text style={styles.emptyInline}>{t("patientDetails.noExamsAttached")}</Text>
          ) : (
            exames.map((item) => (
              <View key={item.id} style={styles.exameCard}>
                <View style={styles.exameHeader}>
                  <Ionicons name="document-attach-outline" size={18} color={COLORS.primary} />
                  <View style={styles.exameHeaderTextWrap}>
                    <Text numberOfLines={1} style={styles.exameTitle}>
                      {item.nomeOriginal}
                    </Text>
                    <Text style={styles.exameMeta}>
                      {formatFileSize(item.tamanhoBytes)}
                      {item.dataExame
                        ? ` ? ${new Date(item.dataExame).toLocaleDateString(dateLocale)}`
                        : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.exameActionsRow}>
                  <Button
                    title={downloadingExameId === item.id ? t("patientDetails.openingExam") : t("patientDetails.openExam")}
                    onPress={() => handleOpenExame(item)}
                    loading={downloadingExameId === item.id}
                    size="sm"
                    variant="outline"
                    icon={<Ionicons name="open-outline" size={14} color={COLORS.primary} />}
                  />
                  <Button
                    title={removingExameId === item.id ? t("patientDetails.removingExam") : t("patientDetails.removeExam")}
                    onPress={() => handleDeleteExame(item.id)}
                    loading={removingExameId === item.id}
                    size="sm"
                    variant="ghost"
                    icon={<Ionicons name="trash-outline" size={14} color={COLORS.error} />}
                    textStyle={{ color: COLORS.error }}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.flowSection}>
          <View style={styles.readinessCard}>
            <View style={styles.readinessHeaderRow}>
              <Ionicons name="pulse-outline" size={18} color={COLORS.primary} />
              <Text style={styles.readinessTitle}>{t("patientDetails.readinessSummary")}</Text>
            </View>
            <Text style={styles.readinessMain}>{readiness.title}</Text>
            <Text style={styles.readinessDescription}>{readiness.description}</Text>
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

          <Text style={styles.flowTitle}>{t("patientDetails.clinicalFlowSteps")}</Text>
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
              <View
                key={item.key}
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
                    item.status === "IN_PROGRESS" && styles.flowChipTextInProgress,
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
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Button
            title="Anamnese"
            onPress={handleOpenAnamnese}
            fullWidth
            icon={<Ionicons name="clipboard-outline" size={20} color={COLORS.white} />}
          />
          <Button
            title={t("nav.physicalExam")}
            onPress={handleOpenExameFisico}
            fullWidth
            icon={<Ionicons name="fitness-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("patientDetails.recordEvolution")}
            onPress={handleOpenEvolucao}
            fullWidth
            icon={
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={COLORS.white}
              />
            }
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("nav.report")}
            onPress={handleOpenLaudo}
            fullWidth
            icon={<Ionicons name="document-text-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("nav.plan")}
            onPress={handleOpenPlano}
            fullWidth
            icon={<Ionicons name="document-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={prescribeActivityLabel}
            onPress={() =>
              navigation.navigate("AtividadeForm", {
                pacienteId: paciente.id,
                pacienteNome: paciente.nomeCompleto,
              })
            }
            fullWidth
            icon={<Ionicons name="checkmark-done-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("patientDetails.adherenceChecks")}
            onPress={() =>
              navigation.navigate("PacienteAdesao", { pacienteId: paciente.id })
            }
            fullWidth
            icon={<Ionicons name="analytics-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("nav.anamnesisHistory")}
            onPress={() =>
              navigation.navigate("AnamneseList", { pacienteId: paciente.id })
            }
            fullWidth
            icon={<Ionicons name="time-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
          <Button
            title={t("nav.evolutionHistory")}
            onPress={() =>
              navigation.navigate("EvolucaoList", { pacienteId: paciente.id })
            }
            fullWidth
            icon={<Ionicons name="time-outline" size={20} color={COLORS.white} />}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
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
  },  startHereCard: {
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
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  adherenceCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  adherenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adherenceTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  adherenceScore: {
    fontSize: FONTS.sizes.base,
    color: COLORS.primary,
    fontWeight: "700",
  },
  adherenceTrack: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.gray100,
    borderRadius: 999,
    overflow: "hidden",
  },
  adherenceFill: {
    height: "100%",
    borderRadius: 999,
  },
  adherenceMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  riskBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  riskHigh: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  riskHighText: {
    color: COLORS.error,
  },
  riskMedium: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  riskMediumText: {
    color: "#92400E",
  },
  riskLow: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  riskLowText: {
    color: COLORS.success,
  },
  riskReasonsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  riskReasonChip: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  riskReasonChipGood: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  riskReasonChipWarn: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  riskReasonChipRisk: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  riskReasonChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
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
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  examesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
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
  actionsSection: {
    padding: SPACING.base,
    marginTop: SPACING.md,
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
  emptyInline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});



















































































