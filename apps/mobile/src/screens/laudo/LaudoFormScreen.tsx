// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LAUDO FORM SCREEN
// ==========================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Button, Input, useToast } from "../../components/ui";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useAuthStore } from "../../stores/authStore";
import { useLaudoStore } from "../../stores/laudoStore";
import { api, getLaudoAiSuggestion } from "../../services";
import { recordAuditAction, trackEvent } from "../../services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { RootStackParamList } from "../../types";
import { LaudoStatus } from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";

type LaudoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "LaudoForm">;
  route: RouteProp<RootStackParamList, "LaudoForm">;
};

type TemplateKey = "GERAL" | "LOMBAR" | "CERVICAL" | "JOELHO";
type LaudoReferenceItem = {
  id: string;
  title: string;
  category: "LIVRO" | "ARTIGO" | "GUIDELINE";
  source: string;
  year?: number;
  authors?: string;
  url: string;
  rationale: string;
};

type LaudoReferenceSuggestionResponse = {
  profile: "GERAL" | "LOMBAR" | "CERVICAL" | "JOELHO";
  disclaimer: string;
  laudoReferences: LaudoReferenceItem[];
  planoReferences: LaudoReferenceItem[];
};

const TEMPLATE_LABEL_KEY: Record<TemplateKey, string> = {
  GERAL: "clinical.templates.general",
  LOMBAR: "clinical.templates.lumbar",
  CERVICAL: "clinical.templates.cervical",
  JOELHO: "clinical.templates.knee",
};

const TEMPLATE_CONTENT: Record<
  TemplateKey,
  {
    diagnosticoFuncional: string;
    objetivosCurtoPrazo: string;
    objetivosMedioPrazo: string;
    frequenciaSemanal: string;
    duracaoSemanas: string;
    condutas: string;
    planoTratamentoIA: string;
    criteriosAlta: string;
  }
> = {
  GERAL: {
    diagnosticoFuncional:
      "Disfuncao funcional musculo-esqueletica com limitacao de mobilidade, dor ao esforco e impacto em atividades de vida diaria.",
    objetivosCurtoPrazo:
      "Reduzir dor percebida, melhorar controle motor e tolerancia a carga nas primeiras semanas.",
    objetivosMedioPrazo:
      "Restabelecer funcao global, autonomia nas atividades diarias e retorno progressivo a rotina.",
    frequenciaSemanal: "2",
    duracaoSemanas: "8",
    condutas:
      "Exercícios terapêuticos progressivos, mobilização articular conforme necessidade, educação em dor e orientações de autocuidado.",
    planoTratamentoIA:
      "Fase 1 (semanas 1-2): analgesia, mobilidade e ativacao.\nFase 2 (semanas 3-5): fortalecimento e estabilidade.\nFase 3 (semanas 6-8): funcionalidade e retorno gradual.",
    criteriosAlta:
      "Dor controlada, funcao satisfatoria, independencia para exercicios domiciliares e retorno seguro as atividades.",
  },
  LOMBAR: {
    diagnosticoFuncional:
      "Lombalgia mecanica com reducao de mobilidade lombo-pelvica e piora da dor em flexao/prolongamento de postura.",
    objetivosCurtoPrazo:
      "Diminuir dor lombar, reduzir rigidez e melhorar padrao de movimento de tronco.",
    objetivosMedioPrazo:
      "Aumentar resistencia de core e tolerancia funcional para sentar, levantar e caminhar sem agravamento.",
    frequenciaSemanal: "2",
    duracaoSemanas: "10",
    condutas:
      "Treino de estabilizacao lombar, mobilidade de quadril/coluna toracica, higiene postural e progressao de carga funcional.",
    planoTratamentoIA:
      "Semanas 1-3: analgesia e ativacao de core.\nSemanas 4-7: fortalecimento e controle lombo-pelvico.\nSemanas 8-10: treino funcional e prevencao de recidiva.",
    criteriosAlta:
      "Ausencia de dor limitante, movimento funcional sem compensacao relevante e autogestao adequada.",
  },
  CERVICAL: {
    diagnosticoFuncional:
      "Cervicalgia com sobrecarga miofascial, limitacao de amplitude cervical e sintomas associados a postura sustentada.",
    objetivosCurtoPrazo:
      "Reduzir dor cervical e cefaleia associada, melhorar mobilidade e consciencia postural.",
    objetivosMedioPrazo:
      "Melhorar endurance de musculatura cervical/escapular e reduzir recorrencia de sintomas.",
    frequenciaSemanal: "2",
    duracaoSemanas: "8",
    condutas:
      "Liberacao miofascial e mobilidade cervical/toracica, fortalecimento escapular, treino postural e ergonomia.",
    planoTratamentoIA:
      "Semanas 1-2: analgesia e mobilidade.\nSemanas 3-5: fortalecimento cervico-escapular.\nSemanas 6-8: consolidacao funcional e prevencao.",
    criteriosAlta:
      "Mobilidade cervical funcional, dor minima/ausente e controle postural adequado em atividades prolongadas.",
  },
  JOELHO: {
    diagnosticoFuncional:
      "Disfuncao de joelho com dor a carga, deficit de controle neuromuscular e limitacao para agachar/subir escadas.",
    objetivosCurtoPrazo:
      "Reduzir dor no joelho e recuperar amplitude funcional sem aumento de edema.",
    objetivosMedioPrazo:
      "Melhorar forca e controle de membro inferior para retorno seguro as atividades.",
    frequenciaSemanal: "2",
    duracaoSemanas: "12",
    condutas:
      "Fortalecimento progressivo de quadriceps/gluteos, treino proprioceptivo, controle de valgo dinamico e educacao de carga.",
    planoTratamentoIA:
      "Semanas 1-4: controle de dor/edema e ativacao.\nSemanas 5-8: forca e estabilidade.\nSemanas 9-12: funcional e retorno progressivo.",
    criteriosAlta:
      "Dor controlada, forca simetrica funcional, estabilidade em tarefas dinamicas e confianca para retorno.",
  },
};

export function LaudoFormScreen({ route, navigation }: LaudoFormScreenProps) {
  const { pacienteId } = route.params;
  const { t } = useLanguage();
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);
  const { fetchLaudoByPaciente, createLaudo, updateLaudo, validarLaudo } =
    useLaudoStore();
  const { showToast } = useToast();


  const paciente = getPacienteById(pacienteId);
  const hasAnamnese = anamneses.some((item) => item.pacienteId === pacienteId);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosticoFuncional, setDiagnosticoFuncional] = useState("");
  const [objetivosCurtoPrazo, setObjetivosCurtoPrazo] = useState("");
  const [objetivosMedioPrazo, setObjetivosMedioPrazo] = useState("");
  const [frequenciaSemanal, setFrequenciaSemanal] = useState("");
  const [duracaoSemanas, setDuracaoSemanas] = useState("");
  const [condutas, setCondutas] = useState("");
  const [exameFisico, setExameFisico] = useState("");
  const [planoTratamentoIA, setPlanoTratamentoIA] = useState("");
  const [rascunhoProfissional, setRascunhoProfissional] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [criteriosAlta, setCriteriosAlta] = useState("");
  const [laudoStatus, setLaudoStatus] = useState<LaudoStatus>(
    LaudoStatus.RASCUNHO_IA,
  );
  const [validadoEm, setValidadoEm] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiExamContextMessage, setAiExamContextMessage] = useState("");
  const autoSuggestionAttemptedRef = useRef(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("GERAL");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>("");
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [validatedSnapshot, setValidatedSnapshot] = useState<string | null>(
    null,
  );
  const [validationHistory, setValidationHistory] = useState<
    Array<{
      id: string;
      action: "VALIDADO" | "REVALIDACAO_PENDENTE";
      at: string;
      by: string;
      consultedReferencesCount?: number;
      totalSuggestedReferences?: number;
    }>
  >([]);
  const [referenceSuggestions, setReferenceSuggestions] =
    useState<LaudoReferenceSuggestionResponse | null>(null);
  const [consultedReferenceIds, setConsultedReferenceIds] = useState<string[]>(
    [],
  );
  const [professionalValidationConfirmed, setProfessionalValidationConfirmed] =
    useState(false);
  const totalSuggestedReferences =
    (referenceSuggestions?.laudoReferences.length || 0) +
    (referenceSuggestions?.planoReferences.length || 0);
  const hasSuggestedReferences = totalSuggestedReferences > 0;
  const consultedReferencesCount = consultedReferenceIds.length;
  const hasConsultedAnyReference = consultedReferencesCount > 0;
  const getTemplateLabel = (templateKey: TemplateKey) =>
    t(TEMPLATE_LABEL_KEY[templateKey]);
  const downloadBaseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");

  const resolveAbsoluteDownloadUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    const safePath = path.startsWith("/") ? path : `/${path}`;
    return `${downloadBaseUrl}${safePath}`;
  };
  const shouldAutoFill = useMemo(() => {
    return (
      !diagnosticoFuncional.trim() &&
      !condutas.trim() &&
      !planoTratamentoIA.trim() &&
      !objetivosCurtoPrazo.trim() &&
      !objetivosMedioPrazo.trim()
    );
  }, [
    diagnosticoFuncional,
    condutas,
    planoTratamentoIA,
    objetivosCurtoPrazo,
    objetivosMedioPrazo,
  ]);

  const generateAutomaticSuggestion = async () => {
    if (generatingAi) return;
    setGeneratingAi(true);
    autoSuggestionAttemptedRef.current = true;
    try {
      const data = await getLaudoAiSuggestion(pacienteId);
      if (data) {
        if ((data.examesComLeituraIa || 0) > 0) {
          const message = t("clinical.messages.aiUsedExamReadings", {
            total: data.examesComLeituraIa || 0,
          });
          setAiExamContextMessage(message);
          showToast({
            type: "info",
            message,
          });
        } else if ((data.examesConsiderados || 0) > 0) {
          const message = t("clinical.messages.aiUsedExamMetadata", {
            total: data.examesConsiderados || 0,
          });
          setAiExamContextMessage(message);
          showToast({
            type: "info",
            message,
          });
        } else {
          setAiExamContextMessage("");
        }
        if (!diagnosticoFuncional.trim() && data.diagnosticoFuncional) {
          setDiagnosticoFuncional(data.diagnosticoFuncional);
        }
        if (!objetivosCurtoPrazo.trim() && data.objetivosCurtoPrazo) {
          setObjetivosCurtoPrazo(data.objetivosCurtoPrazo);
        }
        if (!objetivosMedioPrazo.trim() && data.objetivosMedioPrazo) {
          setObjetivosMedioPrazo(data.objetivosMedioPrazo);
        }
        if (!frequenciaSemanal.trim() && data.frequenciaSemanal) {
          setFrequenciaSemanal(String(data.frequenciaSemanal));
        }
        if (!duracaoSemanas.trim() && data.duracaoSemanas) {
          setDuracaoSemanas(String(data.duracaoSemanas));
        }
        if (!condutas.trim() && data.condutas) {
          setCondutas(data.condutas);
        }
        if (!planoTratamentoIA.trim() && data.planoTratamentoIA) {
          setPlanoTratamentoIA(data.planoTratamentoIA);
        }
        if (!criteriosAlta.trim() && data.criteriosAlta) {
          setCriteriosAlta(data.criteriosAlta);
        }
      }
    } catch {
      // falha silenciosa
    } finally {
      setGeneratingAi(false);
    }
  };


  const buildSnapshot = (source: {
    diagnosticoFuncional?: string;
    objetivosCurtoPrazo?: string;
    objetivosMedioPrazo?: string;
    frequenciaSemanal?: string | number;
    duracaoSemanas?: string | number;
    condutas?: string;
    exameFisico?: string;
    planoTratamentoIA?: string;
    rascunhoProfissional?: string;
    observacoes?: string;
    criteriosAlta?: string;
  }) =>
    JSON.stringify({
      diagnosticoFuncional: String(source.diagnosticoFuncional || "").trim(),
      objetivosCurtoPrazo: String(source.objetivosCurtoPrazo || "").trim(),
      objetivosMedioPrazo: String(source.objetivosMedioPrazo || "").trim(),
      frequenciaSemanal:
        typeof source.frequenciaSemanal === "number"
          ? String(source.frequenciaSemanal)
          : String(source.frequenciaSemanal || "").trim(),
      duracaoSemanas:
        typeof source.duracaoSemanas === "number"
          ? String(source.duracaoSemanas)
          : String(source.duracaoSemanas || "").trim(),
      condutas: String(source.condutas || "").trim(),
      exameFisico: String(source.exameFisico || "").trim(),
      planoTratamentoIA: String(source.planoTratamentoIA || "").trim(),
      rascunhoProfissional: String(source.rascunhoProfissional || "").trim(),
      observacoes: String(source.observacoes || "").trim(),
      criteriosAlta: String(source.criteriosAlta || "").trim(),
    });

  const getSnapshot = () =>
    buildSnapshot({
      diagnosticoFuncional,
      objetivosCurtoPrazo,
      objetivosMedioPrazo,
      frequenciaSemanal,
      duracaoSemanas,
      condutas,
      exameFisico,
      planoTratamentoIA,
      rascunhoProfissional,
      observacoes,
      criteriosAlta,
    });

  const isValidated = laudoStatus === LaudoStatus.VALIDADO_PROFISSIONAL;
  const hasUnsavedChanges =
    !!laudoId && !!lastSavedSnapshot && getSnapshot() !== lastSavedSnapshot;
  const hasCriticalChangesAfterValidation =
    isValidated && !!validatedSnapshot && validatedSnapshot !== getSnapshot();
  const hasReviewedLaudo = initialSnapshot
    ? lastSavedSnapshot !== initialSnapshot
    : !!lastSavedSnapshot;
  const canGenerateLaudo = !!laudoId && !hasUnsavedChanges && hasReviewedLaudo;

  const getValidationHistoryKey = (id: string) =>
    `laudo:validation-history:v1:${id}`;
  const getValidatedSnapshotKey = (id: string) =>
    `laudo:validated-snapshot:v1:${id}`;
  const getConsultedReferencesKey = (pacienteIdParam: string) =>
    `laudo:consulted-references:v1:${pacienteIdParam}`;

  const appendHistory = async (
    id: string,
    action: "VALIDADO" | "REVALIDACAO_PENDENTE",
    extra?: {
      consultedReferencesCount?: number;
      totalSuggestedReferences?: number;
    },
  ) => {
    const key = getValidationHistoryKey(id);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      at: new Date().toISOString(),
      by: usuario?.nome || "Profissional",
      consultedReferencesCount: extra?.consultedReferencesCount,
      totalSuggestedReferences: extra?.totalSuggestedReferences,
    };
    const currentRaw = await AsyncStorage.getItem(key);
    const current = currentRaw
      ? (JSON.parse(currentRaw) as Array<{
          id: string;
          action: "VALIDADO" | "REVALIDACAO_PENDENTE";
          at: string;
          by: string;
          consultedReferencesCount?: number;
          totalSuggestedReferences?: number;
        }>)
      : [];
    const next = [entry, ...current].slice(0, 20);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    setValidationHistory(next);
  };

  useEffect(() => {
    let isMounted = true;
    setInitialSnapshot("");

    const applyLaudoState = (laudo: any) => {
      setLaudoId(laudo.id);
      setDiagnosticoFuncional(laudo.diagnosticoFuncional || "");
      setObjetivosCurtoPrazo(laudo.objetivosCurtoPrazo || "");
      setObjetivosMedioPrazo(laudo.objetivosMedioPrazo || "");
      setFrequenciaSemanal(
        typeof laudo.frequenciaSemanal === "number"
          ? String(laudo.frequenciaSemanal)
          : "",
      );
      setDuracaoSemanas(
        typeof laudo.duracaoSemanas === "number"
          ? String(laudo.duracaoSemanas)
          : "",
      );
      setCondutas(laudo.condutas || "");
      setExameFisico(laudo.exameFisico || "");
      setPlanoTratamentoIA(laudo.planoTratamentoIA || "");
      setRascunhoProfissional(laudo.rascunhoProfissional || "");
      setObservacoes(laudo.observacoes || "");
      setCriteriosAlta(laudo.criteriosAlta || "");
      setLaudoStatus(laudo.status || LaudoStatus.RASCUNHO_IA);
      setValidadoEm(laudo.validadoEm || "");
      const loadedSnapshot = buildSnapshot(laudo);
      setLastSavedSnapshot(loadedSnapshot);
      setInitialSnapshot(loadedSnapshot);
      const id = String(laudo.id || "");
      if (id) {
        AsyncStorage.getItem(getValidatedSnapshotKey(id))
          .then((savedSnapshot) => {
            if (savedSnapshot) {
              setValidatedSnapshot(savedSnapshot);
            } else if (laudo.status === LaudoStatus.VALIDADO_PROFISSIONAL) {
              setValidatedSnapshot(loadedSnapshot);
              AsyncStorage.setItem(
                getValidatedSnapshotKey(id),
                loadedSnapshot,
              ).catch(() => undefined);
            } else {
              setValidatedSnapshot(null);
            }
          })
          .catch(() => undefined);
        AsyncStorage.getItem(getValidationHistoryKey(id))
          .then((historyRaw) => {
            if (!historyRaw) {
              setValidationHistory([]);
              return;
            }
            setValidationHistory(
              JSON.parse(historyRaw) as Array<{
                id: string;
                action: "VALIDADO" | "REVALIDACAO_PENDENTE";
                at: string;
                by: string;
                consultedReferencesCount?: number;
                totalSuggestedReferences?: number;
              }>,
            );
          })
          .catch(() => undefined);
      }
    };

    const load = async () => {
      try {
        await fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
        const laudo = await fetchLaudoByPaciente(pacienteId, true);
        if (!isMounted) return;
        if (!laudo) {
          if (!autoSuggestionAttemptedRef.current) {
            await generateAutomaticSuggestion();
          }
          return;
        }
        applyLaudoState(laudo);
        const hasAnyAiField =
          !!String(laudo.diagnosticoFuncional || "").trim() ||
          !!String(laudo.objetivosCurtoPrazo || "").trim() ||
          !!String(laudo.objetivosMedioPrazo || "").trim() ||
          !!String(laudo.condutas || "").trim() ||
          !!String(laudo.planoTratamentoIA || "").trim();
        if (!hasAnyAiField && !autoSuggestionAttemptedRef.current) {
          await generateAutomaticSuggestion();
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 403 || status === 404) {
            await fetchPacientes(true).catch(() => undefined);
            showToast({
              message:
                status === 403
                  ? t("clinical.messages.noPermissionAccessPatient")
                  : t("clinical.messages.patientNotFoundCurrentSession"),
              type: "error",
            });
            navigation.goBack();
            return;
          }
        }
        // Falha transitória de rede não bloqueia a edição manual.
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [fetchAnamnesesByPaciente, pacienteId]);

  useEffect(() => {
    if (!laudoId) return;
    if (!shouldAutoFill) return;
    if (autoSuggestionAttemptedRef.current) return;
    generateAutomaticSuggestion().catch(() => undefined);
  }, [laudoId, shouldAutoFill]);

  useEffect(() => {
    let isMounted = true;
    setInitialSnapshot("");
    AsyncStorage.getItem(getConsultedReferencesKey(pacienteId))
      .then((raw) => {
        if (!isMounted || !raw) return;
        try {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed)) {
            setConsultedReferenceIds(
              parsed.filter((v) => typeof v === "string"),
            );
          }
        } catch {
          // ignore malformed local cache
        }
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [fetchAnamnesesByPaciente, pacienteId]);

  useEffect(() => {
    let isMounted = true;
    setInitialSnapshot("");
    api
      .get<LaudoReferenceSuggestionResponse>("/laudos/referencias-sugeridas", {
        params: { pacienteId },
      })
      .then((response) => {
        if (!isMounted) return;
        setReferenceSuggestions(response.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setReferenceSuggestions(null);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchAnamnesesByPaciente, pacienteId]);

  const toOptionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return undefined;
    return numeric;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!diagnosticoFuncional.trim()) {
      nextErrors.diagnosticoFuncional = t(
        "clinical.validation.functionalDiagnosisRequired",
      );
    }
    if (!condutas.trim()) {
      nextErrors.condutas = t("clinical.validation.therapeuticConductRequired");
    }

    const freq = toOptionalNumber(frequenciaSemanal);
    if (frequenciaSemanal.trim() && (!freq || freq < 1 || freq > 7)) {
      nextErrors.frequenciaSemanal = t(
        "clinical.validation.weeklyFrequencyRange",
      );
    }

    const dur = toOptionalNumber(duracaoSemanas);
    if (duracaoSemanas.trim() && (!dur || dur < 1 || dur > 52)) {
      nextErrors.duracaoSemanas = t("clinical.validation.durationWeeksRange");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    trackEvent("clinical_flow_stage_opened", {
      stage: "LAUDO",
      pacienteId,
      source: "LaudoFormScreen",
    }).catch(() => undefined);
  }, [pacienteId]);

  const handleSave = async () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", { stage: "LAUDO", reason: "MISSING_ANAMNESE", pacienteId }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("clinical.messages.fillAnamnesisBeforeSavingReport"),
      });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!validate()) {
      trackEvent("clinical_flow_blocked", { stage: "LAUDO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      return;
    }
    setLoading(true);

    try {
      const payload = {
        pacienteId,
        diagnosticoFuncional: diagnosticoFuncional.trim(),
        objetivosCurtoPrazo: objetivosCurtoPrazo.trim() || undefined,
        objetivosMedioPrazo: objetivosMedioPrazo.trim() || undefined,
        frequenciaSemanal: toOptionalNumber(frequenciaSemanal),
        duracaoSemanas: toOptionalNumber(duracaoSemanas),
        condutas: condutas.trim(),
        exameFisico: exameFisico.trim() || undefined,
        planoTratamentoIA: planoTratamentoIA.trim() || undefined,
        rascunhoProfissional: rascunhoProfissional.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        criteriosAlta: criteriosAlta.trim() || undefined,
      };

      if (laudoId) {
        const { pacienteId: _pacienteId, ...updatePayload } = payload;
        const updated = await updateLaudo(laudoId, updatePayload);
        if (hasCriticalChangesAfterValidation) {
          setLaudoStatus(LaudoStatus.RASCUNHO_IA);
          setValidadoEm("");
          setValidatedSnapshot(null);
          await AsyncStorage.removeItem(getValidatedSnapshotKey(laudoId));
          await appendHistory(laudoId, "REVALIDACAO_PENDENTE");
          await trackEvent("laudo_revalidation_required", {
            laudoId,
            pacienteId,
          });
          await recordAuditAction(
            "LAUDO_REVALIDATION_REQUIRED",
            {
              laudoId,
              pacienteId,
            },
            usuario?.id,
          );
          showToast({
            message: t("clinical.messages.criticalChangesApplied"),
            type: "info",
          });
        } else {
          setLaudoStatus(updated.status || LaudoStatus.RASCUNHO_IA);
          setValidadoEm(updated.validadoEm || "");
        }
        setLastSavedSnapshot(getSnapshot());
      } else {
        const created = await createLaudo(payload);
        setLaudoId(created.id);
        setLaudoStatus(created.status || LaudoStatus.RASCUNHO_IA);
        setValidadoEm(created.validadoEm || "");
        setLastSavedSnapshot(getSnapshot());
      }

      Alert.alert(
        t("common.titles.success"),
        t("clinical.messages.reportAndPlanSavedSuccessfully"),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }],
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          await fetchPacientes(true).catch(() => undefined);
          showToast({
            message:
              status === 403
                ? t("clinical.messages.noPermissionSavePatientReport")
                : t("clinical.messages.patientNotFoundCurrentSession"),
            type: "error",
          });
          navigation.goBack();
          return;
        }
      }
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const performValidate = async () => {
    if (!laudoId) {
      showToast({
        message: t("clinical.messages.saveReportBeforeValidation"),
        type: "error",
      });
      return;
    }
    if (hasUnsavedChanges) {
      showToast({
        message: t("clinical.messages.saveChangesBeforeValidation"),
        type: "info",
      });
      return;
    }
    if (isValidated) {
      showToast({
        message: t("clinical.messages.reportAlreadyValidated"),
        type: "info",
      });
      return;
    }
    if (!professionalValidationConfirmed) {
      showToast({
        message: t("clinical.messages.validationChecklistRequired"),
        type: "info",
      });
      return;
    }
    setLoading(true);
    try {
      const validated = await validarLaudo(laudoId);
      setLaudoStatus(validated.status || LaudoStatus.VALIDADO_PROFISSIONAL);
      setValidadoEm(validated.validadoEm || "");
      const snapshot = getSnapshot();
      setValidatedSnapshot(snapshot);
      await AsyncStorage.setItem(getValidatedSnapshotKey(laudoId), snapshot);
      await appendHistory(laudoId, "VALIDADO", {
        consultedReferencesCount,
        totalSuggestedReferences,
      });
      await trackEvent("laudo_validated", {
        laudoId,
        pacienteId,
      });
      await recordAuditAction(
        "LAUDO_VALIDATED",
        {
          laudoId,
          pacienteId,
          professionalValidationConfirmed: true,
          consultedReferencesCount,
          totalSuggestedReferences,
        },
        usuario?.id,
      );
      showToast({
        message: t("clinical.messages.reportAndPlanValidatedSuccessfully"),
        type: "success",
      });
    } catch (error: unknown) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (hasSuggestedReferences && !hasConsultedAnyReference) {
      Alert.alert(
        t("common.titles.attention"),
        t("clinical.messages.validateWithoutConsultedReferencesConfirm"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("clinical.actions.validateAnyway"),
            onPress: () => {
              void performValidate();
            },
          },
        ],
      );
      return;
    }

    await performValidate();
  };

  const applyTemplate = (templateKey: TemplateKey) => {
    setSelectedTemplate(templateKey);
    const template = TEMPLATE_CONTENT[templateKey];
    Alert.alert(
      t("clinical.actions.applyTemplate"),
      t("clinical.messages.applyTemplateConfirm").replace(
        "{template}",
        getTemplateLabel(templateKey),
      ),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("clinical.actions.apply"),
          onPress: () => {
            setDiagnosticoFuncional(template.diagnosticoFuncional);
            setObjetivosCurtoPrazo(template.objetivosCurtoPrazo);
            setObjetivosMedioPrazo(template.objetivosMedioPrazo);
            setFrequenciaSemanal(template.frequenciaSemanal);
            setDuracaoSemanas(template.duracaoSemanas);
            setCondutas(template.condutas);
            setPlanoTratamentoIA(template.planoTratamentoIA);
            setCriteriosAlta(template.criteriosAlta);
            setErrors({});
          },
        },
      ],
    );
  };

  const openPdf = async (type: "laudo" | "plano") => {
    if (!laudoId) {
      showToast({
        message: t("clinical.messages.saveBeforeGeneratePdf"),
        type: "error",
      });
      return;
    }
    if (hasSuggestedReferences && !hasConsultedAnyReference) {
      showToast({
        message: t("clinical.messages.pdfWithoutConsultedReferencesWarning"),
        type: "info",
      });
    }
    setLoading(true);
    try {
      await openPdfUrl(type, laudoId);
    } catch (error: unknown) {
      const { message } = parseApiError(error);
      showToast({
        message:
          message === "Network Error"
            ? t("clinical.messages.pdfGenerationError")
            : message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openPdfUrl = async (type: "laudo" | "plano", id: string) => {
    const endpoint =
      type === "laudo" ? `/laudos/${id}/pdf-laudo` : `/laudos/${id}/pdf-plano`;
    const authHeader = token
      ? `Bearer ${token}`
      : String(api.defaults.headers.common.Authorization || "");
    if (!authHeader) {
      throw new Error(t("common.messages.sessionExpiredLogin"));
    }
    const params =
      consultedReferenceIds.length > 0
        ? { consultedRefs: consultedReferenceIds.join(",") }
        : undefined;
    await trackEvent("laudo_professional_pdf_opened", {
      pacienteId,
      laudoId: id,
      pdfType: type,
      consultedReferencesCount,
      totalSuggestedReferences,
      profile: referenceSuggestions?.profile ?? null,
    });
    await recordAuditAction(
      "LAUDO_PROFESSIONAL_PDF_OPENED",
      {
        pacienteId,
        laudoId: id,
        pdfType: type,
        consultedReferencesCount,
        totalSuggestedReferences,
        profile: referenceSuggestions?.profile ?? null,
      },
      usuario?.id,
    );

    if (Platform.OS === "web") {
      const response = await api.get<Blob>(endpoint, {
        responseType: "blob",
        params,
      });
      const blobUrl = window.URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      return;
    }

    const absoluteUrl = resolveAbsoluteDownloadUrl(endpoint);
    const query = params?.consultedRefs
      ? `?consultedRefs=${encodeURIComponent(params.consultedRefs)}`
      : "";
    const localPathBase = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!localPathBase) {
      throw new Error("no_local_storage_path");
    }
    const fileName = type === "laudo" ? "laudo.pdf" : "plano.pdf";
    const localUri = `${localPathBase}${Date.now()}-${fileName}`;
    await FileSystem.downloadAsync(`${absoluteUrl}${query}`, localUri, {
      headers: { Authorization: authHeader },
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle:
          type === "laudo"
            ? t("clinical.actions.generateReportPdf")
            : t("clinical.actions.generatePlanPdf"),
      });
    } else {
      await Linking.openURL(localUri);
    }
  };

  const openReferenceLink = async (
    ref: LaudoReferenceItem,
    context: "laudo" | "plano",
  ) => {
    try {
      await trackEvent("laudo_reference_opened", {
        pacienteId,
        laudoId,
        referenceId: ref.id,
        category: ref.category,
        context,
        profile: referenceSuggestions?.profile,
      });
      await recordAuditAction(
        "LAUDO_REFERENCE_OPENED",
        {
          pacienteId,
          laudoId,
          referenceId: ref.id,
          title: ref.title,
          context,
        },
        usuario?.id,
      );
      await Linking.openURL(ref.url);
    } catch {
      showToast({
        message: t("clinical.messages.referenceOpenError"),
        type: "error",
      });
    }
  };

  const toggleReferenceConsulted = async (referenceId: string) => {
    const alreadyConsulted = consultedReferenceIds.includes(referenceId);
    const next = alreadyConsulted
      ? consultedReferenceIds.filter((id) => id !== referenceId)
      : [...consultedReferenceIds, referenceId];
    setConsultedReferenceIds(next);
    try {
      await AsyncStorage.setItem(
        getConsultedReferencesKey(pacienteId),
        JSON.stringify(next),
      );
    } catch {
      // local persistence is best-effort
    }
    trackEvent("laudo_reference_consulted_toggled", {
      pacienteId,
      laudoId,
      referenceId,
      checked: !alreadyConsulted,
      totalConsulted: next.length,
      totalSuggested: totalSuggestedReferences,
      profile: referenceSuggestions?.profile,
    }).catch(() => undefined);
    recordAuditAction(
      "LAUDO_REFERENCE_CONSULTED_TOGGLED",
      {
        pacienteId,
        laudoId,
        referenceId,
        checked: !alreadyConsulted,
      },
      usuario?.id,
    ).catch(() => undefined);
  };

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("common.messages.patientNotFound")}</Text>
          <Button title={t("common.actions.back")} onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {paciente.nomeCompleto.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.patientName}>{paciente.nomeCompleto}</Text>
          <Text style={styles.subtitle}>
            {laudoId
              ? t("clinical.messages.editReportAndPlan")
              : t("clinical.messages.newReportAndPlan")}
          </Text>
        </View>
      </View>
      <View style={styles.aiNotice}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={COLORS.primary}
        />
        <Text style={styles.aiNoticeText}>
          Rascunho gerado automaticamente por IA. Revise antes de salvar.
        </Text>
      </View>
      {referenceSuggestions ? (
        <View style={styles.scientificValidationBar}>
          <View style={styles.scientificValidationHeader}>
            <Ionicons name="library-outline" size={16} color={COLORS.primary} />
            <Text style={styles.scientificValidationTitle}>
              {t("clinical.sections.scientificValidation")}
            </Text>
          </View>
          <Text style={styles.scientificValidationText}>
            {t("clinical.messages.consultedSourcesCount")}:{" "}
            {consultedReferencesCount}/{totalSuggestedReferences}
          </Text>
          <Text
            style={[
              styles.scientificValidationChip,
              totalSuggestedReferences === 0
                ? styles.scientificValidationChipMuted
                : consultedReferencesCount === 0
                  ? styles.scientificValidationChipPending
                  : consultedReferencesCount < totalSuggestedReferences
                    ? styles.scientificValidationChipPartial
                    : styles.scientificValidationChipComplete,
            ]}
          >
            {totalSuggestedReferences === 0
              ? t("clinical.status.noSuggestedSources")
              : consultedReferencesCount === 0
                ? t("clinical.status.pending")
                : consultedReferencesCount < totalSuggestedReferences
                  ? t("clinical.status.partial")
                  : t("clinical.status.completed")}
          </Text>
        </View>
      ) : null}
      <View style={styles.statusBar}>
        <Text
          style={[
            styles.statusChip,
            isValidated ? styles.statusApproved : styles.statusDraft,
          ]}
        >
          {isValidated
            ? t("clinical.messages.validatedByProfessional")
            : t("clinical.messages.pendingValidationDraft")}
        </Text>
        {hasCriticalChangesAfterValidation ? (
          <Text style={styles.statusDate}>
            {t("clinical.messages.criticalChangesDetectedRevalidation")}
          </Text>
        ) : null}
        {hasUnsavedChanges ? (
          <Text style={styles.statusDate}>
            {t("clinical.messages.unsavedChangesInReport")}
          </Text>
        ) : null}
        {validadoEm ? (
          <Text style={styles.statusDate}>
            {t("clinical.messages.validatedAt")}{" "}
            {new Date(validadoEm).toLocaleString("pt-BR")}
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clinical.sections.clinicalTemplate")}
          </Text>
          <Text style={styles.templateHint}>
            {t("clinical.messages.applyInitialTemplateHint")}
          </Text>
          {aiExamContextMessage ? (
            <Text style={styles.templateHint}>{aiExamContextMessage}</Text>
          ) : null}
          <View style={styles.templateRow}>
            {(["GERAL", "LOMBAR", "CERVICAL", "JOELHO"] as TemplateKey[]).map(
              (templateKey) => (
                <TouchableOpacity
                  key={templateKey}
                  onPress={() => applyTemplate(templateKey)}
                  style={[
                    styles.templateChip,
                    selectedTemplate === templateKey &&
                      styles.templateChipActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.templateChipText,
                      selectedTemplate === templateKey &&
                        styles.templateChipTextActive,
                    ]}
                  >
                    {getTemplateLabel(templateKey)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clinical.sections.functionalDiagnosis")}
          </Text>
          <Input
            placeholder={t("clinical.placeholders.functionalDiagnosis")}
            value={diagnosticoFuncional}
            onChangeText={(text) => {
              setDiagnosticoFuncional(text);
              if (errors.diagnosticoFuncional) {
                setErrors((prev) => ({ ...prev, diagnosticoFuncional: "" }));
              }
            }}
            error={errors.diagnosticoFuncional}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
            showCount
            maxLength={2000}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clinical.sections.treatmentGoals")}
          </Text>
          <Input
            label={t("clinical.labels.shortTerm")}
            placeholder={t("clinical.placeholders.shortTermGoals")}
            value={objetivosCurtoPrazo}
            onChangeText={setObjetivosCurtoPrazo}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
          <Input
            label={t("clinical.labels.mediumTerm")}
            placeholder={t("clinical.placeholders.mediumTermGoals")}
            value={objetivosMedioPrazo}
            onChangeText={setObjetivosMedioPrazo}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
        </View>

        <View
          style={styles.section}
          >
          <Text style={styles.sectionTitle}>
            {t("clinical.sections.carePlan")}
          </Text>
          <View style={styles.row}>
            <Input
              label={t("clinical.labels.weeklyFrequency")}
              placeholder={t("common.placeholders.example", { value: 2 })}
              keyboardType="numeric"
              value={frequenciaSemanal}
              onChangeText={setFrequenciaSemanal}
              error={errors.frequenciaSemanal}
              containerStyle={styles.half}
            />
            <Input
              label={t("clinical.labels.durationWeeks")}
              placeholder={t("common.placeholders.example", { value: 8 })}
              keyboardType="numeric"
              value={duracaoSemanas}
              onChangeText={setDuracaoSemanas}
              error={errors.duracaoSemanas}
              containerStyle={styles.half}
            />
          </View>
          <Input
            label={t("clinical.labels.therapeuticConducts")}
            placeholder={t("clinical.placeholders.therapeuticConducts")}
            value={condutas}
            onChangeText={(text) => {
              setCondutas(text);
              if (errors.condutas) {
                setErrors((prev) => ({ ...prev, condutas: "" }));
              }
            }}
            error={errors.condutas}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
            showCount
            maxLength={2000}
          />
          <Input
            label={t("clinical.labels.aiTreatmentPlan")}
            placeholder={t("clinical.placeholders.phasedPlan")}
            value={planoTratamentoIA}
            onChangeText={setPlanoTratamentoIA}
            multiline
            numberOfLines={5}
            style={{ height: 120, textAlignVertical: "top" }}
            showCount
            maxLength={3000}
          />
          <Input
            label={t("clinical.labels.dischargeCriteria")}
            placeholder={t("clinical.placeholders.dischargeCriteriaPatient")}
            value={criteriosAlta}
            onChangeText={setCriteriosAlta}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
          <Input
            label={t("clinical.labels.observations")}
            placeholder={t("clinical.placeholders.additionalObservations")}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clinical.labels.professionalDraft")}
          </Text>
          <Text style={styles.templateHint}>
            {t("clinical.messages.professionalNotesHint")}
          </Text>
          <Input
            placeholder={t("clinical.placeholders.professionalDraftNotes")}
            value={rascunhoProfissional}
            onChangeText={setRascunhoProfissional}
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top" }}
            showCount
            maxLength={2000}
          />
        </View>

        {referenceSuggestions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("clinical.sections.scientificReferencesSuggested")}
            </Text>
            <Text style={styles.templateHint}>
              {referenceSuggestions.disclaimer}
            </Text>
            <View style={styles.referenceProfileBadge}>
              <Ionicons
                name="library-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.referenceProfileBadgeText}>
                {t("clinical.messages.suggestedProfile")}:{" "}
                {getTemplateLabel(referenceSuggestions.profile)}
              </Text>
            </View>
            <View style={styles.referenceProgressRow}>
              <View style={styles.referenceProgressTrack}>
                <View
                  style={[
                    styles.referenceProgressFill,
                    {
                      width:
                        totalSuggestedReferences > 0
                          ? `${Math.round(
                              (consultedReferenceIds.length /
                                totalSuggestedReferences) *
                                100,
                            )}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.referenceProgressText}>
                {t("clinical.messages.consultedSourcesCount")}:{" "}
                {consultedReferenceIds.length}/{totalSuggestedReferences || 0}
              </Text>
            </View>
            <Text style={styles.referencePdfHint}>
              {t("clinical.messages.scientificPdfTraceabilityHint")}
            </Text>

            <Text style={styles.referenceSubsectionTitle}>
              {t("clinical.messages.forReport")}
            </Text>
            {referenceSuggestions.laudoReferences.map((ref) => (
              <View key={ref.id} style={styles.referenceCardWrap}>
                <TouchableOpacity
                  style={styles.referenceCard}
                  activeOpacity={0.85}
                  onPress={() => openReferenceLink(ref, "laudo")}
                >
                  <View style={styles.referenceCardHeader}>
                    <Text style={styles.referenceCategory}>{ref.category}</Text>
                    <Ionicons
                      name="open-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.referenceTitle}>{ref.title}</Text>
                  <Text style={styles.referenceMeta}>
                    {[
                      ref.source,
                      ref.year ? String(ref.year) : "",
                      ref.authors || "",
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                  <Text style={styles.referenceRationale}>{ref.rationale}</Text>
                  <Text style={styles.referenceLink}>
                    {t("clinical.actions.openSource")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.referenceConsultButton,
                    consultedReferenceIds.includes(ref.id) &&
                      styles.referenceConsultButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleReferenceConsulted(ref.id)}
                >
                  <Ionicons
                    name={
                      consultedReferenceIds.includes(ref.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={14}
                    color={
                      consultedReferenceIds.includes(ref.id)
                        ? COLORS.success
                        : COLORS.gray500
                    }
                  />
                  <Text
                    style={[
                      styles.referenceConsultButtonText,
                      consultedReferenceIds.includes(ref.id) &&
                        styles.referenceConsultButtonTextActive,
                    ]}
                  >
                    {consultedReferenceIds.includes(ref.id)
                      ? t("clinical.actions.markedAsConsulted")
                      : t("clinical.actions.markAsConsulted")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.referenceSubsectionTitle}>
              {t("clinical.messages.forTreatmentPlan")}
            </Text>
            {referenceSuggestions.planoReferences.map((ref) => (
              <View key={ref.id} style={styles.referenceCardWrap}>
                <TouchableOpacity
                  style={styles.referenceCard}
                  activeOpacity={0.85}
                  onPress={() => openReferenceLink(ref, "plano")}
                >
                  <View style={styles.referenceCardHeader}>
                    <Text style={styles.referenceCategory}>{ref.category}</Text>
                    <Ionicons
                      name="open-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.referenceTitle}>{ref.title}</Text>
                  <Text style={styles.referenceMeta}>
                    {[
                      ref.source,
                      ref.year ? String(ref.year) : "",
                      ref.authors || "",
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                  <Text style={styles.referenceRationale}>{ref.rationale}</Text>
                  <Text style={styles.referenceLink}>
                    {t("clinical.actions.openSource")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.referenceConsultButton,
                    consultedReferenceIds.includes(ref.id) &&
                      styles.referenceConsultButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleReferenceConsulted(ref.id)}
                >
                  <Ionicons
                    name={
                      consultedReferenceIds.includes(ref.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={14}
                    color={
                      consultedReferenceIds.includes(ref.id)
                        ? COLORS.success
                        : COLORS.gray500
                    }
                  />
                  <Text
                    style={[
                      styles.referenceConsultButtonText,
                      consultedReferenceIds.includes(ref.id) &&
                        styles.referenceConsultButtonTextActive,
                    ]}
                  >
                    {consultedReferenceIds.includes(ref.id)
                      ? t("clinical.actions.markedAsConsulted")
                      : t("clinical.actions.markAsConsulted")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clinical.sections.validationHistory")}
          </Text>
          {validationHistory.length === 0 ? (
            <Text style={styles.statusDate}>
              {t("clinical.messages.noValidationHistory")}
            </Text>
          ) : (
            validationHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Ionicons
                  name={
                    item.action === "VALIDADO"
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={14}
                  color={
                    item.action === "VALIDADO" ? COLORS.success : COLORS.warning
                  }
                />
                <Text style={styles.historyText}>
                  {item.action === "VALIDADO"
                    ? t("clinical.status.validated")
                    : t("clinical.status.revalidationPending")}{" "}
                  {t("common.by")} {item.by} {t("common.in")}{" "}
                  {new Date(item.at).toLocaleString("pt-BR")}
                  {item.action === "VALIDADO" &&
                  typeof item.totalSuggestedReferences === "number" &&
                  item.totalSuggestedReferences > 0
                    ? ` • ${t("clinical.labels.references")}: ${item.consultedReferencesCount || 0}/${item.totalSuggestedReferences}`
                    : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title={t("clinical.actions.saveReport")}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            fullWidth
            icon={
              <Ionicons name="save-outline" size={18} color={COLORS.white} />
            }
          />
          {hasSuggestedReferences && !hasConsultedAnyReference ? (
            <View style={styles.referencesValidateHint}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={COLORS.warning}
              />
              <Text style={styles.referencesValidateHintText}>
                {t(
                  "clinical.messages.scientificReferencesValidationRecommended",
                )}
              </Text>
            </View>
          ) : null}
          <View style={styles.professionalValidationChecklist}>
            <Text style={styles.professionalValidationChecklistTitle}>
              {t("clinical.messages.professionalValidationChecklistTitle")}
            </Text>
            <TouchableOpacity
              style={styles.professionalValidationChecklistRow}
              activeOpacity={0.85}
              onPress={() =>
                setProfessionalValidationConfirmed((current) => !current)
              }
            >
              <Ionicons
                name={
                  professionalValidationConfirmed
                    ? "checkbox-outline"
                    : "square-outline"
                }
                size={20}
                color={
                  professionalValidationConfirmed
                    ? COLORS.success
                    : COLORS.textSecondary
                }
              />
              <Text style={styles.professionalValidationChecklistText}>
                {t("clinical.messages.professionalValidationChecklistItem")}
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            title={
              isValidated
                ? t("clinical.actions.reportValidated")
                : t("clinical.actions.validateAndApprove")
            }
            onPress={handleValidate}
            loading={loading}
            disabled={
              loading ||
              !laudoId ||
              hasUnsavedChanges ||
              (isValidated && !hasCriticalChangesAfterValidation)
            }
            fullWidth
            style={{ marginTop: SPACING.sm }}
            icon={
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={COLORS.white}
              />
            }
          />
          {!canGenerateLaudo ? (
            <View style={styles.referencesValidateHint}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={COLORS.warning}
              />
              <Text style={styles.referencesValidateHintText}>
                Edite e salve o laudo antes de gerar o PDF.
              </Text>
            </View>
          ) : null}
          <Button
            title={t("clinical.actions.generateReportPdf")}
            onPress={() => openPdf("laudo")}
            loading={loading}
            disabled={loading || !canGenerateLaudo}
            fullWidth
            style={{ marginTop: SPACING.sm }}
            icon={
              <Ionicons
                name="document-text-outline"
                size={18}
                color={COLORS.white}
              />
            }
          />
          <Button
            title={t("clinical.actions.generatePlanPdf")}
            onPress={() => openPdf("plano")}
            loading={loading}
            disabled={loading || !canGenerateLaudo}
            fullWidth
            style={{ marginTop: SPACING.sm }}
            icon={
              <Ionicons name="medkit-outline" size={18} color={COLORS.white} />
            }
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  headerText: {
    flex: 1,
  },
  patientName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  aiNotice: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  aiNoticeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  scientificValidationBar: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  scientificValidationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scientificValidationTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  scientificValidationText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  scientificValidationChip: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  scientificValidationChipMuted: {
    color: COLORS.textSecondary,
    backgroundColor: COLORS.gray100,
  },
  scientificValidationChipPending: {
    color: COLORS.warning,
    backgroundColor: COLORS.warning + "12",
  },
  scientificValidationChipPartial: {
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  scientificValidationChipComplete: {
    color: COLORS.success,
    backgroundColor: COLORS.success + "12",
  },
  statusBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  statusChip: {
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    overflow: "hidden",
  },
  statusDraft: {
    backgroundColor: COLORS.warning + "22",
    color: COLORS.warning,
  },
  statusApproved: {
    backgroundColor: COLORS.success + "22",
    color: COLORS.success,
  },
  statusDate: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  templateHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  templateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  templateChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  templateChipActive: {
    backgroundColor: COLORS.primary,
  },
  templateChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  templateChipTextActive: {
    color: COLORS.white,
  },
  half: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  historyText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  referenceProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  referenceProfileBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  referenceProgressRow: {
    marginBottom: SPACING.sm,
  },
  referenceProgressTrack: {
    width: "100%",
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    overflow: "hidden",
  },
  referenceProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  referenceProgressText: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  referencePdfHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  referenceSubsectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  referenceCardWrap: {
    marginBottom: SPACING.sm,
  },
  referenceCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
  },
  referenceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  referenceCategory: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  referenceTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  referenceMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  referenceRationale: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  referenceLink: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginTop: SPACING.xs,
  },
  referenceConsultButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    alignSelf: "flex-start",
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  referenceConsultButtonActive: {
    borderColor: COLORS.success + "55",
    backgroundColor: COLORS.success + "12",
  },
  referenceConsultButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  referenceConsultButtonTextActive: {
    color: COLORS.success,
  },
  referencesValidateHint: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    backgroundColor: COLORS.warning + "10",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  referencesValidateHintText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
  },
  professionalValidationChecklist: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  professionalValidationChecklistTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  professionalValidationChecklistRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  professionalValidationChecklistText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
  },
  pdfTraceabilityPendingBadge: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    backgroundColor: COLORS.warning + "10",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  pdfTraceabilityPendingBadgeText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    flexShrink: 1,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
});
