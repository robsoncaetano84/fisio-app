// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PLANO FORM SCREEN
// ==========================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  Linking,
  Platform,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Button, Input, useToast } from "../../components/ui";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useLaudoStore } from "../../stores/laudoStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useAuthStore } from "../../stores/authStore";
import { RootStackParamList } from "../../types";
import {
  api,
  getLaudoAiSuggestion,
  logClinicalAiSuggestion,
  recordAuditAction,
  trackEvent,
} from "../../services";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { parseApiError } from "../../utils/apiErrors";
import { parseJsonObject } from "../../utils/safeJson";
import { useLanguage } from "../../i18n/LanguageProvider";

type PlanoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PlanoForm">;
  route: RouteProp<RootStackParamList, "PlanoForm">;
};

type PlanoDraft = {
  objetivosCurtoPrazo: string;
  objetivosMedioPrazo: string;
  frequenciaSemanal: string;
  duracaoSemanas: string;
  condutas: string;
  planoTratamentoIA: string;
  criteriosAlta: string;
  observacoes: string;
  lastEditedAt: string;
};

type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const PLANO_AUTOSAVE_DEBOUNCE_MS = 1800;
const DEFAULT_PLAN_FREQUENCY = "2";
const DEFAULT_PLAN_DURATION_WEEKS = "6";
const DEFAULT_DISCHARGE_CRITERIA =
  "Alta quando houver dor controlada, ganho funcional compatível com a meta do paciente, execução segura dos exercícios domiciliares e ausência de piora progressiva.";

export function PlanoFormScreen({ route, navigation }: PlanoFormScreenProps) {
  const { pacienteId } = route.params;
  const { t, language } = useLanguage();
  const AI_REVIEW_REQUIRED = FEATURE_FLAGS.requireAiSuggestionConfirmation;
  const { showToast } = useToast();
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchLaudoByPaciente, createLaudo, updateLaudo } = useLaudoStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);

  const paciente = getPacienteById(pacienteId);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiExamContextMessage, setAiExamContextMessage] = useState("");
  const [aiSuggestionMeta, setAiSuggestionMeta] = useState<{
    source?: "ai" | "rules";
    examesConsiderados: number;
    examesComLeituraIa: number;
    generatedAt?: string | null;
  } | null>(null);
  const [aiSuggestionConfirmed, setAiSuggestionConfirmed] = useState(false);
  const [professionalValidationConfirmed, setProfessionalValidationConfirmed] =
    useState(false);
  const [validatedPlanSnapshot, setValidatedPlanSnapshot] = useState<
    string | null
  >(null);
  const [planValidatedAt, setPlanValidatedAt] = useState<string | null>(null);
  const aiConfidence = useMemo<"ALTA" | "MODERADA" | "BAIXA" | null>(() => {
    if (!aiSuggestionMeta) return null;
    if (
      aiSuggestionMeta.source === "ai" &&
      (aiSuggestionMeta.examesComLeituraIa || 0) > 0
    ) {
      return "ALTA";
    }
    if (
      aiSuggestionMeta.source === "ai" ||
      (aiSuggestionMeta.examesConsiderados || 0) > 0
    ) {
      return "MODERADA";
    }
    return "BAIXA";
  }, [aiSuggestionMeta]);
  const clinicalBaseLabel = useMemo(() => {
    if (!aiConfidence) return "";
    if (aiConfidence === "ALTA") {
      return t("clinical.status.clinicalBaseComplete");
    }
    if (aiConfidence === "MODERADA") {
      return t("clinical.status.clinicalBasePartial");
    }
    return t("clinical.status.clinicalBaseInitial");
  }, [aiConfidence, t]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] =
    useState<AutosaveStatus>("idle");
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [clearingPlan, setClearingPlan] = useState(false);
  const autoFillRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastSavedPlanSnapshotRef = useRef<string | null>(null);

  const [objetivosCurtoPrazo, setObjetivosCurtoPrazo] = useState("");
  const [objetivosMedioPrazo, setObjetivosMedioPrazo] = useState("");
  const [frequenciaSemanal, setFrequenciaSemanal] = useState("");
  const [duracaoSemanas, setDuracaoSemanas] = useState("");
  const [condutas, setCondutas] = useState("");
  const [planoTratamentoIA, setPlanoTratamentoIA] = useState("");
  const [criteriosAlta, setCriteriosAlta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const draftKey = `draft:plano:${pacienteId}`;
  const hasAnamnese = anamneses.some((item) => item.pacienteId === pacienteId);
  const downloadBaseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");
  const isBusy = loading || pdfLoading || clearingPlan;
  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    },
    [],
  );

  const shouldAutoFill = () =>
    !objetivosCurtoPrazo.trim() &&
    !objetivosMedioPrazo.trim() &&
    !frequenciaSemanal.trim() &&
    !duracaoSemanas.trim() &&
    !condutas.trim() &&
    !planoTratamentoIA.trim() &&
    !criteriosAlta.trim() &&
    !observacoes.trim();

  const hasPlanContent = (source: {
    objetivosCurtoPrazo?: string | null;
    objetivosMedioPrazo?: string | null;
    frequenciaSemanal?: string | number | null;
    duracaoSemanas?: string | number | null;
    condutas?: string | null;
    planoTratamentoIA?: string | null;
    criteriosAlta?: string | null;
    observacoes?: string | null;
  }) =>
    [
      source.objetivosCurtoPrazo,
      source.objetivosMedioPrazo,
      source.frequenciaSemanal,
      source.duracaoSemanas,
      source.condutas,
      source.planoTratamentoIA,
      source.criteriosAlta,
      source.observacoes,
    ].some((value) => String(value || "").trim().length > 0);

  const resetPlanFields = () => {
    setObjetivosCurtoPrazo("");
    setObjetivosMedioPrazo("");
    setFrequenciaSemanal("");
    setDuracaoSemanas("");
    setCondutas("");
    setPlanoTratamentoIA("");
    setCriteriosAlta("");
    setObservacoes("");
  };

  const getValidatedPlanSnapshotKey = (id: string) =>
    `plano:validated-snapshot:v1:${id}`;

  const buildSuggestionMetaPayload = () => {
    if (!aiSuggestionMeta) return {};
    const payload: {
      sugestaoSource?: "ai" | "rules";
      examesConsiderados?: number;
      examesComLeituraIa?: number;
    } = {};
    if (aiSuggestionMeta.source)
      payload.sugestaoSource = aiSuggestionMeta.source;
    if (Number.isFinite(aiSuggestionMeta.examesConsiderados)) {
      payload.examesConsiderados = Math.max(
        0,
        aiSuggestionMeta.examesConsiderados || 0,
      );
    }
    if (Number.isFinite(aiSuggestionMeta.examesComLeituraIa)) {
      payload.examesComLeituraIa = Math.max(
        0,
        aiSuggestionMeta.examesComLeituraIa || 0,
      );
    }
    return payload;
  };

  const resolveAbsoluteDownloadUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    const safePath = path.startsWith("/") ? path : `/${path}`;
    return `${downloadBaseUrl}${safePath}`;
  };

  const openPdfBlobOnWeb = (blob: Blob, webPopup?: Window | null) => {
    const blobUrl = URL.createObjectURL(blob);
    if (webPopup && !webPopup.closed) {
      webPopup.location.href = blobUrl;
    } else if (typeof window !== "undefined") {
      window.open(blobUrl, "_blank");
    }
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  };

  const buildPlanPayload = () => {
    const freq = Number(frequenciaSemanal);
    const dur = Number(duracaoSemanas);
    return {
      objetivosCurtoPrazo: objetivosCurtoPrazo.trim() || undefined,
      objetivosMedioPrazo: objetivosMedioPrazo.trim() || undefined,
      frequenciaSemanal: frequenciaSemanal.trim() ? freq : undefined,
      duracaoSemanas: duracaoSemanas.trim() ? dur : undefined,
      condutas: condutas.trim() || undefined,
      planoTratamentoIA: planoTratamentoIA.trim() || undefined,
      criteriosAlta: criteriosAlta.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      ...buildSuggestionMetaPayload(),
    };
  };

  const buildPlanSnapshot = (
    payload: Partial<ReturnType<typeof buildPlanPayload>> = buildPlanPayload(),
  ) =>
    JSON.stringify(payload);

  const hasValidOptionalNumber = (value: string, min: number, max: number) => {
    if (!value.trim()) return true;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= min && numeric <= max;
  };

  const canAutosavePlan = () =>
    draftLoaded &&
    hasAnamnese &&
    !generating &&
    !!objetivosCurtoPrazo.trim() &&
    !!condutas.trim() &&
    hasValidOptionalNumber(frequenciaSemanal, 1, 7) &&
    hasValidOptionalNumber(duracaoSemanas, 1, 52) &&
    (!AI_REVIEW_REQUIRED || !aiSuggestionMeta || aiSuggestionConfirmed);

  const autosaveStatusMessage = useMemo(() => {
    if (autosaveStatus === "pending") {
      return t("clinical.messages.autosavePending");
    }
    if (autosaveStatus === "saving") {
      return t("clinical.messages.autosaveSaving");
    }
    if (autosaveStatus === "error") {
      return t("clinical.messages.autosaveError");
    }
    if (autosaveStatus === "saved" && lastAutosavedAt) {
      return `${t("clinical.messages.autosaveSaved")} ${new Date(
        lastAutosavedAt,
      ).toLocaleTimeString(dateLocale, {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "";
  }, [autosaveStatus, dateLocale, lastAutosavedAt, t]);

  const currentPlanSnapshot = buildPlanSnapshot();
  const hasUnsavedPlanChanges =
    currentPlanSnapshot !== lastSavedPlanSnapshotRef.current;
  const isAutosaving = autosaveStatus === "saving";
  const hasConfirmedRequiredAiReview =
    !AI_REVIEW_REQUIRED || !aiSuggestionMeta || aiSuggestionConfirmed;
  const isPlanValidatedWithoutPendingChanges =
    !!validatedPlanSnapshot && validatedPlanSnapshot === currentPlanSnapshot;
  const hasPlanChangesAfterValidation =
    !!validatedPlanSnapshot && validatedPlanSnapshot !== currentPlanSnapshot;
  const validationChecklistChecked =
    isPlanValidatedWithoutPendingChanges ||
    (professionalValidationConfirmed && hasConfirmedRequiredAiReview);
  const canToggleValidationChecklist = !isPlanValidatedWithoutPendingChanges;
  const canGeneratePlanPdf =
    !!laudoId &&
    !hasUnsavedPlanChanges &&
    !isAutosaving &&
    isPlanValidatedWithoutPendingChanges &&
    hasConfirmedRequiredAiReview;
  const planPdfGateMessage =
    !laudoId || hasUnsavedPlanChanges || isAutosaving
      ? t("clinical.messages.waitAutosaveBeforeGeneratePdf")
      : !hasConfirmedRequiredAiReview
        ? t("clinical.messages.confirmAiReviewBeforePdf")
        : !isPlanValidatedWithoutPendingChanges
          ? t("clinical.messages.reviewPlanBeforePdf")
          : "";

  const applySuggestion = async (force = false) => {
    if (generating) return;
    if (!force && !shouldAutoFill()) return;

    setGenerating(true);
    try {
      const data = await getLaudoAiSuggestion(pacienteId);
      const confidence: "ALTA" | "MODERADA" | "BAIXA" =
        data.confidence ||
        (data.source === "ai" && (data.examesComLeituraIa || 0) > 0
          ? "ALTA"
          : data.source === "ai" || (data.examesConsiderados || 0) > 0
            ? "MODERADA"
            : "BAIXA");
      setAiSuggestionMeta({
        source: data.source,
        examesConsiderados: data.examesConsiderados || 0,
        examesComLeituraIa: data.examesComLeituraIa || 0,
        generatedAt: data.sugestaoGeradaEm || new Date().toISOString(),
      });
      setAiSuggestionConfirmed(!AI_REVIEW_REQUIRED);
      setErrors((prev) => ({ ...prev, aiSuggestionConfirmation: "" }));
      logClinicalAiSuggestion({
        stage: "PLANO",
        suggestionType: "PLANO_TRATAMENTO",
        confidence,
        reason:
          data.reason ||
          (data.source === "ai"
            ? "Sugestão de plano gerada por IA."
            : "Sugestão de plano gerada por regras clínicas (fallback)."),
        evidenceFields:
          Array.isArray(data.evidenceFields) && data.evidenceFields.length > 0
            ? data.evidenceFields
            : ["anamnese", "exames"],
        patientId: pacienteId,
      }).catch(() => undefined);
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
      if (!objetivosCurtoPrazo.trim() && data.objetivosCurtoPrazo) {
        setObjetivosCurtoPrazo(data.objetivosCurtoPrazo);
      }
      if (!objetivosMedioPrazo.trim() && data.objetivosMedioPrazo) {
        setObjetivosMedioPrazo(data.objetivosMedioPrazo);
      }
      if (!frequenciaSemanal.trim()) {
        setFrequenciaSemanal(
          data.frequenciaSemanal
            ? String(data.frequenciaSemanal)
            : DEFAULT_PLAN_FREQUENCY,
        );
      }
      if (!duracaoSemanas.trim()) {
        setDuracaoSemanas(
          data.duracaoSemanas
            ? String(data.duracaoSemanas)
            : DEFAULT_PLAN_DURATION_WEEKS,
        );
      }
      if (!condutas.trim() && data.condutas) {
        setCondutas(data.condutas);
      }
      if (!planoTratamentoIA.trim() && data.planoTratamentoIA) {
        setPlanoTratamentoIA(data.planoTratamentoIA);
      }
      if (!criteriosAlta.trim()) {
        setCriteriosAlta(data.criteriosAlta || DEFAULT_DISCHARGE_CRITERIA);
      }
    } catch {
      showToast({
        type: "error",
        message: t("clinical.messages.aiSuggestionError"),
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      let shouldPrefillWithAi = true;
      if (!paciente) {
        await fetchPacientes(true).catch(() => undefined);
      }
      await fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
      const laudo = await fetchLaudoByPaciente(pacienteId, false).catch(
        () => null,
      );
      if (!active) return;
      if (laudo?.id) {
        setLaudoId(laudo.id);
        shouldPrefillWithAi = !hasPlanContent({
          objetivosCurtoPrazo: laudo.objetivosCurtoPrazo,
          objetivosMedioPrazo: laudo.objetivosMedioPrazo,
          frequenciaSemanal: laudo.frequenciaSemanal,
          duracaoSemanas: laudo.duracaoSemanas,
          condutas: laudo.condutas,
          planoTratamentoIA: laudo.planoTratamentoIA,
          criteriosAlta: laudo.criteriosAlta,
          observacoes: laudo.observacoes,
        });
        setObjetivosCurtoPrazo(laudo.objetivosCurtoPrazo || "");
        setObjetivosMedioPrazo(laudo.objetivosMedioPrazo || "");
        setFrequenciaSemanal(
          typeof laudo.frequenciaSemanal === "number"
            ? String(laudo.frequenciaSemanal)
            : shouldPrefillWithAi
              ? ""
              : DEFAULT_PLAN_FREQUENCY,
        );
        setDuracaoSemanas(
          typeof laudo.duracaoSemanas === "number"
            ? String(laudo.duracaoSemanas)
            : shouldPrefillWithAi
              ? ""
              : DEFAULT_PLAN_DURATION_WEEKS,
        );
        setCondutas(laudo.condutas || "");
        setPlanoTratamentoIA(laudo.planoTratamentoIA || "");
        setCriteriosAlta(
          laudo.criteriosAlta ||
            (shouldPrefillWithAi ? "" : DEFAULT_DISCHARGE_CRITERIA),
        );
        setObservacoes(laudo.observacoes || "");
        const examesConsiderados = Number(laudo.examesConsiderados || 0);
        const examesComLeituraIa = Number(laudo.examesComLeituraIa || 0);
        const source =
          laudo.sugestaoSource === "ai" || laudo.sugestaoSource === "rules"
            ? (laudo.sugestaoSource as "ai" | "rules")
            : undefined;
        const loadedPlanSnapshot = buildPlanSnapshot({
          objetivosCurtoPrazo: laudo.objetivosCurtoPrazo || undefined,
          objetivosMedioPrazo: laudo.objetivosMedioPrazo || undefined,
          frequenciaSemanal:
            typeof laudo.frequenciaSemanal === "number"
              ? laudo.frequenciaSemanal
              : undefined,
          duracaoSemanas:
            typeof laudo.duracaoSemanas === "number"
              ? laudo.duracaoSemanas
              : undefined,
          condutas: laudo.condutas || undefined,
          planoTratamentoIA: laudo.planoTratamentoIA || undefined,
          criteriosAlta: laudo.criteriosAlta || undefined,
          observacoes: laudo.observacoes || undefined,
          ...(source || examesConsiderados > 0 || examesComLeituraIa > 0
            ? {
                sugestaoSource: source,
                examesConsiderados: Math.max(0, examesConsiderados),
                examesComLeituraIa: Math.max(0, examesComLeituraIa),
              }
            : {}),
        });
        lastSavedPlanSnapshotRef.current = loadedPlanSnapshot;
        const validatedRaw = await AsyncStorage.getItem(
          getValidatedPlanSnapshotKey(laudo.id),
        ).catch(() => null);
        if (active && validatedRaw) {
          try {
            const parsed = parseJsonObject<{
              snapshot?: string;
              validatedAt?: string;
            }>(validatedRaw);
            if (parsed?.snapshot) {
              setValidatedPlanSnapshot(parsed.snapshot);
              setPlanValidatedAt(parsed.validatedAt || null);
              setProfessionalValidationConfirmed(
                parsed.snapshot === loadedPlanSnapshot,
              );
            }
          } catch {
            // ignore invalid local validation snapshot
          }
        }
        if (source || examesConsiderados > 0 || examesComLeituraIa > 0) {
          setAiSuggestionMeta({
            source,
            examesConsiderados,
            examesComLeituraIa,
            generatedAt: laudo.sugestaoGeradaEm || null,
          });
          setAiSuggestionConfirmed(
            !AI_REVIEW_REQUIRED || laudo.status === "VALIDADO_PROFISSIONAL",
          );
          if (examesComLeituraIa > 0) {
            setAiExamContextMessage(
              t("clinical.messages.aiUsedExamReadings", {
                total: examesComLeituraIa,
              }),
            );
          } else if (examesConsiderados > 0) {
            setAiExamContextMessage(
              t("clinical.messages.aiUsedExamMetadata", {
                total: examesConsiderados,
              }),
            );
          } else {
            setAiExamContextMessage("");
          }
        } else {
          setAiSuggestionMeta(null);
          setAiSuggestionConfirmed(true);
        }
      }

      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (raw && !laudo?.id) {
          const draft = parseJsonObject<Partial<PlanoDraft>>(raw);
          if (draft) {
            shouldPrefillWithAi = !hasPlanContent(draft);
            if (draft.objetivosCurtoPrazo !== undefined)
              setObjetivosCurtoPrazo(draft.objetivosCurtoPrazo);
            if (draft.objetivosMedioPrazo !== undefined)
              setObjetivosMedioPrazo(draft.objetivosMedioPrazo);
            if (draft.frequenciaSemanal !== undefined)
              setFrequenciaSemanal(draft.frequenciaSemanal);
            if (draft.duracaoSemanas !== undefined)
              setDuracaoSemanas(draft.duracaoSemanas);
            if (draft.condutas !== undefined) setCondutas(draft.condutas);
            if (draft.planoTratamentoIA !== undefined)
              setPlanoTratamentoIA(draft.planoTratamentoIA);
            if (draft.criteriosAlta !== undefined)
              setCriteriosAlta(draft.criteriosAlta);
            if (draft.observacoes !== undefined)
              setObservacoes(draft.observacoes);
            if (draft.lastEditedAt) setLastDraftSavedAt(draft.lastEditedAt);
          }
        }
      } catch {
        // ignore local draft parse
      } finally {
        setDraftLoaded(true);
      }

      if (shouldPrefillWithAi && !autoFillRef.current) {
        autoFillRef.current = true;
        await applySuggestion(true);
      }
    };

    load().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [
    draftKey,
    fetchAnamnesesByPaciente,
    fetchLaudoByPaciente,
    fetchPacientes,
    paciente,
    pacienteId,
  ]);

  useEffect(() => {
    if (!draftLoaded || laudoId) return;
    const timer = setTimeout(() => {
      const payload: PlanoDraft = {
        objetivosCurtoPrazo,
        objetivosMedioPrazo,
        frequenciaSemanal,
        duracaoSemanas,
        condutas,
        planoTratamentoIA,
        criteriosAlta,
        observacoes,
        lastEditedAt: new Date().toISOString(),
      };
      AsyncStorage.setItem(draftKey, JSON.stringify(payload))
        .then(() => setLastDraftSavedAt(payload.lastEditedAt))
        .catch(() => undefined);
    }, 700);
    return () => clearTimeout(timer);
  }, [
    condutas,
    criteriosAlta,
    draftKey,
    draftLoaded,
    duracaoSemanas,
    frequenciaSemanal,
    laudoId,
    objetivosCurtoPrazo,
    objetivosMedioPrazo,
    observacoes,
    planoTratamentoIA,
  ]);

  useEffect(() => {
    trackEvent("clinical_flow_stage_opened", {
      stage: "PLANO",
      pacienteId,
      source: "PlanoFormScreen",
    }).catch(() => undefined);
  }, [pacienteId]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const freq = Number(frequenciaSemanal);
    const dur = Number(duracaoSemanas);

    if (!objetivosCurtoPrazo.trim()) {
      nextErrors.objetivosCurtoPrazo = t(
        "clinical.validation.shortTermRequired",
      );
    }
    if (!condutas.trim()) {
      nextErrors.condutas = t("clinical.validation.therapeuticConductRequired");
    }
    if (frequenciaSemanal.trim() && (!Number.isFinite(freq) || freq <= 0)) {
      nextErrors.frequenciaSemanal = t(
        "clinical.validation.numberGreaterThanZero",
      );
    }
    if (duracaoSemanas.trim() && (!Number.isFinite(dur) || dur <= 0)) {
      nextErrors.duracaoSemanas = t(
        "clinical.validation.numberGreaterThanZero",
      );
    }
    if (AI_REVIEW_REQUIRED && aiSuggestionMeta && !aiSuggestionConfirmed) {
      nextErrors.aiSuggestionConfirmation = t(
        "clinical.validation.aiSuggestionConfirmationRequired",
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlan = async ({
    navigateAfterSave,
    showSuccessToast,
    silent = false,
  }: {
    navigateAfterSave: boolean;
    showSuccessToast: boolean;
    silent?: boolean;
  }) => {
    if (!hasAnamnese) {
      if (!silent) {
        trackEvent("clinical_flow_blocked", {
          stage: "PLANO",
          reason: "MISSING_ANAMNESE",
          pacienteId,
        }).catch(() => undefined);
        showToast({
          type: "error",
          message: t("clinical.messages.fillAnamnesisBeforeSavingPlan"),
        });
        navigation.navigate("AnamneseForm", { pacienteId });
      }
      return null;
    }
    if (!validate()) {
      if (!silent) {
        trackEvent("clinical_flow_blocked", {
          stage: "PLANO",
          reason: "MISSING_REQUIRED_FIELDS",
          pacienteId,
        }).catch(() => undefined);
        showToast({
          type: "error",
          message: t("clinical.messages.reviewHighlightedFields"),
        });
      }
      return null;
    }

    const payload = buildPlanPayload();

    setLoading(true);
    try {
      const savedLaudo = laudoId
        ? await updateLaudo(laudoId, payload)
        : await createLaudo({
            pacienteId,
            diagnosticoFuncional: "Diagnostico funcional em elaboracao.",
            ...payload,
            condutas:
              payload.condutas || "Plano terapeutico inicial em elaboracao.",
          });

      setLaudoId(savedLaudo.id);
      await AsyncStorage.removeItem(draftKey).catch(() => undefined);
      setLastDraftSavedAt(null);
      if (showSuccessToast && !silent) {
        showToast({
          type: "success",
          message: t("clinical.messages.planSavedSuccessfully"),
        });
      }
      if (navigateAfterSave) {
        navigation.goBack();
      }
      return savedLaudo;
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      if (axios.isAxiosError(error) && !silent) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          showToast({
            type: "error",
            message:
              status === 403
                ? t("clinical.messages.noPermissionEditPlan")
                : t("common.messages.patientNotFound"),
          });
          navigation.goBack();
          return null;
        }
      }
      if (!silent) {
        showToast({
          type: "error",
          message: message || t("clinical.messages.planSaveError"),
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runAutosave = async () => {
    if (autosaveInFlightRef.current || !canAutosavePlan()) return;
    const snapshotBeforeSave = buildPlanSnapshot();
    if (snapshotBeforeSave === lastSavedPlanSnapshotRef.current) return;

    autosaveInFlightRef.current = true;
    setAutosaveStatus("saving");
    try {
      const savedLaudo = await savePlan({
        navigateAfterSave: false,
        showSuccessToast: false,
        silent: true,
      });
      if (!isMountedRef.current) return;
      if (!savedLaudo?.id) {
        setAutosaveStatus("error");
        return;
      }
      lastSavedPlanSnapshotRef.current = snapshotBeforeSave;
      if (
        validatedPlanSnapshot &&
        validatedPlanSnapshot !== snapshotBeforeSave
      ) {
        setProfessionalValidationConfirmed(false);
      }
      const savedAt = new Date().toISOString();
      setLastAutosavedAt(savedAt);
      setAutosaveStatus("saved");
      await trackEvent("clinical_form_autosave_saved", {
        stage: "PLANO",
        pacienteId,
        laudoId: savedLaudo.id,
        source: "PlanoFormScreen",
      });
    } catch {
      if (isMountedRef.current) {
        setAutosaveStatus("error");
      }
    } finally {
      autosaveInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!canAutosavePlan()) {
      if (autosaveStatus === "pending" || autosaveStatus === "saving") {
        setAutosaveStatus("idle");
      }
      return;
    }

    const currentSnapshot = buildPlanSnapshot();
    if (currentSnapshot === lastSavedPlanSnapshotRef.current) return;

    setAutosaveStatus("pending");
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave();
    }, PLANO_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    objetivosCurtoPrazo,
    objetivosMedioPrazo,
    frequenciaSemanal,
    duracaoSemanas,
    condutas,
    planoTratamentoIA,
    criteriosAlta,
    observacoes,
    aiSuggestionConfirmed,
    aiSuggestionMeta,
    draftLoaded,
    generating,
    hasAnamnese,
    validatedPlanSnapshot,
  ]);

  const openPlanPdfUrl = async (id: string, webPopup?: Window | null) => {
    const endpoint = `/laudos/${id}/pdf-plano`;
    const authHeader = token
      ? `Bearer ${token}`
      : String(api.defaults.headers.common.Authorization || "");
    if (!authHeader) {
      throw new Error(t("common.messages.sessionExpiredLogin"));
    }

    await trackEvent("laudo_professional_pdf_opened", {
      pacienteId,
      laudoId: id,
      pdfType: "plano",
    });
    await recordAuditAction(
      "LAUDO_PROFESSIONAL_PDF_OPENED",
      {
        pacienteId,
        laudoId: id,
        pdfType: "plano",
      },
      usuario?.id,
    );

    if (Platform.OS === "web") {
      const response = await api.get<Blob>(endpoint, {
        responseType: "blob",
        headers: { Authorization: authHeader },
      });
      openPdfBlobOnWeb(response.data, webPopup);
      return;
    }

    const absoluteUrl = resolveAbsoluteDownloadUrl(endpoint);
    const localPathBase =
      FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!localPathBase) {
      throw new Error("no_local_storage_path");
    }
    const localUri = `${localPathBase}${Date.now()}-plano.pdf`;
    await FileSystem.downloadAsync(absoluteUrl, localUri, {
      headers: { Authorization: authHeader },
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle: t("clinical.actions.generatePlanPdf"),
      });
    } else {
      await Linking.openURL(localUri);
    }
  };

  const handleGeneratePlanPdf = async () => {
    if (!canGeneratePlanPdf) {
      showToast({
        type: "error",
        message:
          planPdfGateMessage ||
          t("clinical.messages.waitAutosaveBeforeGeneratePdf"),
      });
      return;
    }

    const currentLaudoId = laudoId;
    if (!currentLaudoId) return;

    let webPopup: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      webPopup = window.open("about:blank", "_blank");
    }

    setPdfLoading(true);
    try {
      await openPlanPdfUrl(currentLaudoId, webPopup);
    } catch (error: unknown) {
      if (webPopup && !webPopup.closed) {
        webPopup.close();
      }
      const { message } = parseApiError(error);
      showToast({
        type: "error",
        message:
          message === "Network Error"
            ? t("clinical.messages.pdfGenerationError")
            : message || t("clinical.messages.pdfGenerationError"),
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const confirmAiSuggestionReview = () => {
    setAiSuggestionConfirmed(true);
    setErrors((prev) => ({ ...prev, aiSuggestionConfirmation: "" }));
    logClinicalAiSuggestion({
      stage: "PLANO",
      suggestionType: "PLANO_TRATAMENTO_CONFIRMED",
      confidence: aiConfidence || "BAIXA",
      reason: "Sugestão de plano revisada e confirmada por profissional.",
      evidenceFields: ["objetivosCurtoPrazo", "condutas", "planoTratamentoIA"],
      patientId: pacienteId,
    }).catch(() => undefined);
  };

  const clearPlanValidationState = async (id?: string | null) => {
    setProfessionalValidationConfirmed(false);
    setValidatedPlanSnapshot(null);
    setPlanValidatedAt(null);
    if (id) {
      await AsyncStorage.removeItem(getValidatedPlanSnapshotKey(id)).catch(
        () => undefined,
      );
    }
  };

  const handleClearPlan = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    setClearingPlan(true);
    try {
      resetPlanFields();
      setErrors({});
      setAiExamContextMessage("");
      setAiSuggestionMeta(null);
      setAiSuggestionConfirmed(true);
      setLastDraftSavedAt(null);
      setLastAutosavedAt(null);
      setAutosaveStatus("idle");
      await AsyncStorage.removeItem(draftKey).catch(() => undefined);
      await clearPlanValidationState(laudoId);

      const clearedSnapshot = buildPlanSnapshot({});
      if (laudoId) {
        await updateLaudo(laudoId, {
          objetivosCurtoPrazo: "",
          objetivosMedioPrazo: "",
          frequenciaSemanal: null,
          duracaoSemanas: null,
          condutas: "",
          planoTratamentoIA: "",
          criteriosAlta: "",
          observacoes: "",
          sugestaoSource: null,
          examesConsiderados: null,
          examesComLeituraIa: null,
        });
      }
      lastSavedPlanSnapshotRef.current = clearedSnapshot;

      showToast({
        type: "success",
        message: t("clinical.messages.planClearedSuccessfully"),
      });
    } catch (error: unknown) {
      const { message } = parseApiError(error);
      showToast({
        type: "error",
        message: message || t("clinical.messages.planClearError"),
      });
    } finally {
      setClearingPlan(false);
    }
  };

  const handleToggleProfessionalValidationChecklist = () => {
    if (!canToggleValidationChecklist) return;
    const nextChecked = !validationChecklistChecked;
    setProfessionalValidationConfirmed(nextChecked);
    if (nextChecked) {
      if (AI_REVIEW_REQUIRED && aiSuggestionMeta && !aiSuggestionConfirmed) {
        confirmAiSuggestionReview();
      }
      return;
    }
    if (AI_REVIEW_REQUIRED && aiSuggestionMeta) {
      setAiSuggestionConfirmed(false);
    }
  };

  const handleValidatePlan = async () => {
    if (!validate()) {
      showToast({
        type: "error",
        message: t("clinical.messages.reviewHighlightedFields"),
      });
      return;
    }
    if (!laudoId) {
      showToast({
        type: "error",
        message: t("clinical.messages.waitAutosaveBeforeValidation"),
      });
      return;
    }
    if (hasUnsavedPlanChanges || isAutosaving) {
      showToast({
        type: "info",
        message: t("clinical.messages.waitAutosaveChangesBeforePlanValidation"),
      });
      return;
    }
    if (isPlanValidatedWithoutPendingChanges) {
      showToast({
        type: "info",
        message: t("clinical.messages.planAlreadyValidated"),
      });
      return;
    }
    if (!validationChecklistChecked) {
      showToast({
        type: "info",
        message: t("clinical.messages.validationChecklistRequired"),
      });
      return;
    }

    setLoading(true);
    try {
      const validatedAt = new Date().toISOString();
      setValidatedPlanSnapshot(currentPlanSnapshot);
      setPlanValidatedAt(validatedAt);
      setProfessionalValidationConfirmed(true);
      await AsyncStorage.setItem(
        getValidatedPlanSnapshotKey(laudoId),
        JSON.stringify({
          snapshot: currentPlanSnapshot,
          validatedAt,
        }),
      );
      await trackEvent("plano_validated", {
        laudoId,
        pacienteId,
      });
      await recordAuditAction(
        "PLANO_VALIDATED",
        {
          laudoId,
          pacienteId,
          professionalValidationConfirmed: true,
        },
        usuario?.id,
      );
      showToast({
        type: "success",
        message: t("clinical.messages.planValidatedSuccessfully"),
      });
    } catch (error: unknown) {
      const { message } = parseApiError(error);
      showToast({
        type: "error",
        message: message || t("clinical.messages.planValidationError"),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {t("common.messages.patientNotFound")}
          </Text>
          <Button
            title={t("common.actions.back")}
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.title}>
            {t("clinical.sections.treatmentPlanForm")}
          </Text>
          <Text style={styles.subtitle}>
            {t("clinical.messages.treatmentPlanFormSubtitle")}
          </Text>
          {aiExamContextMessage ? (
            <Text style={styles.draftInfo}>{aiExamContextMessage}</Text>
          ) : null}
          {aiSuggestionMeta ? (
            <View style={styles.aiSuggestionWrap}>
              <View style={styles.aiSuggestionStatusRow}>
                <Text
                  style={[
                    styles.aiMetaChip,
                    aiSuggestionConfirmed
                      ? styles.aiMetaChipHigh
                      : styles.aiMetaChipMedium,
                  ]}
                >
                  {aiSuggestionConfirmed
                    ? t("clinical.status.professionalConfirmed")
                    : t("clinical.status.aiSuggested")}
                </Text>
              </View>
              <View style={styles.aiMetaRow}>
                <Text style={styles.aiMetaChip}>
                  Fonte: {aiSuggestionMeta.source === "ai" ? "IA" : "Regras"}
                </Text>
                <Text style={styles.aiMetaChip}>
                  Exames: {aiSuggestionMeta.examesConsiderados}
                </Text>
                <Text style={styles.aiMetaChip}>
                  Leitura IA: {aiSuggestionMeta.examesComLeituraIa}
                </Text>
                {aiSuggestionMeta.generatedAt ? (
                  <Text style={styles.aiMetaChip}>
                    Gerada em:{" "}
                    {new Date(aiSuggestionMeta.generatedAt).toLocaleString(
                      "pt-BR",
                    )}
                  </Text>
                ) : null}
                {aiConfidence ? (
                  <Text
                    style={[
                      styles.aiMetaChip,
                      aiConfidence === "ALTA"
                        ? styles.aiMetaChipHigh
                        : aiConfidence === "MODERADA"
                          ? styles.aiMetaChipMedium
                          : styles.aiMetaChipInitial,
                    ]}
                  >
                    {t("clinical.labels.clinicalBase")}: {clinicalBaseLabel}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
          {lastDraftSavedAt ? (
            <Text style={styles.draftInfo}>
              {t("clinical.messages.lastEditedAt")}:{" "}
              {new Date(lastDraftSavedAt).toLocaleString(dateLocale)}
            </Text>
          ) : null}
          {autosaveStatusMessage ? (
            <View style={styles.autosaveStatusRow}>
              <Ionicons
                name={
                  autosaveStatus === "error"
                    ? "alert-circle-outline"
                    : autosaveStatus === "saved"
                      ? "cloud-done-outline"
                      : "cloud-upload-outline"
                }
                size={14}
                color={
                  autosaveStatus === "error"
                    ? COLORS.error
                    : autosaveStatus === "saved"
                      ? COLORS.success
                      : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.autosaveStatusText,
                  autosaveStatus === "error" && styles.autosaveStatusError,
                  autosaveStatus === "saved" && styles.autosaveStatusSaved,
                ]}
              >
                {autosaveStatusMessage}
              </Text>
            </View>
          ) : null}
          <Button
            title={t("clinical.actions.clearPlan")}
            onPress={handleClearPlan}
            disabled={generating || isBusy}
            loading={clearingPlan}
            variant="outline"
            icon={
              <Ionicons
                name="trash-outline"
                size={16}
                color={COLORS.primary}
              />
            }
            style={styles.aiButton}
          />
        </View>

        <View style={styles.section}>
          <Input
            label={t("clinical.labels.shortTermGoals")}
            placeholder={t("clinical.placeholders.shortTermGoals")}
            value={objetivosCurtoPrazo}
            onChangeText={setObjetivosCurtoPrazo}
            error={errors.objetivosCurtoPrazo}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
          <Input
            label={t("clinical.labels.mediumTermGoals")}
            placeholder={t("clinical.placeholders.mediumTermGoals")}
            value={objetivosMedioPrazo}
            onChangeText={setObjetivosMedioPrazo}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
          />
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
            onChangeText={setCondutas}
            error={errors.condutas}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
            showCount
            maxLength={2000}
          />
          <Input
            label={t("clinical.labels.phasedPlan")}
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
            placeholder={t("clinical.placeholders.dischargeCriteria")}
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
      </ScrollView>

      <View style={styles.footer}>
        {errors.aiSuggestionConfirmation ? (
          <Text style={styles.aiConfirmError}>
            {errors.aiSuggestionConfirmation}
          </Text>
        ) : null}
        <View style={styles.professionalValidationChecklist}>
          <Text style={styles.professionalValidationChecklistTitle}>
            {t("clinical.messages.professionalValidationChecklistTitle")}
          </Text>
          <TouchableOpacity
            style={styles.professionalValidationChecklistRow}
            activeOpacity={0.85}
            disabled={!canToggleValidationChecklist}
            onPress={handleToggleProfessionalValidationChecklist}
          >
            <Ionicons
              name={
                validationChecklistChecked
                  ? "checkbox-outline"
                  : "square-outline"
              }
              size={20}
              color={
                validationChecklistChecked
                  ? COLORS.success
                  : COLORS.textSecondary
              }
            />
            <Text style={styles.professionalValidationChecklistText}>
              {t("clinical.messages.planProfessionalValidationChecklistItem")}
            </Text>
          </TouchableOpacity>
        </View>
        <Button
          title={
            isPlanValidatedWithoutPendingChanges
              ? t("clinical.actions.planValidated")
              : t("clinical.actions.validateAndApprove")
          }
          onPress={handleValidatePlan}
          loading={loading}
          fullWidth
          disabled={
            loading ||
            !laudoId ||
            hasUnsavedPlanChanges ||
            isAutosaving ||
            isPlanValidatedWithoutPendingChanges
          }
          icon={
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={COLORS.white}
            />
          }
        />
        {!canGeneratePlanPdf ? (
          <View style={styles.referencesValidateHint}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.warning}
            />
            <Text style={styles.referencesValidateHintText}>
              {hasPlanChangesAfterValidation
                ? t("clinical.messages.planRevalidationPending")
                : planPdfGateMessage}
            </Text>
          </View>
        ) : null}
        {planValidatedAt ? (
          <Text style={styles.draftInfo}>
            {t("clinical.messages.validatedAt")}{" "}
            {new Date(planValidatedAt).toLocaleString(dateLocale)}
          </Text>
        ) : null}
        <Button
          title={t("clinical.actions.generatePlanPdf")}
          onPress={handleGeneratePlanPdf}
          loading={pdfLoading}
          fullWidth
          disabled={isBusy || !canGeneratePlanPdf}
          icon={
            <Ionicons name="medkit-outline" size={18} color={COLORS.white} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: 112,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  draftInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  autosaveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  autosaveStatusText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  autosaveStatusSaved: {
    color: COLORS.success,
  },
  autosaveStatusError: {
    color: COLORS.error,
  },
  aiMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  aiSuggestionWrap: {
    marginBottom: SPACING.xs,
  },
  aiSuggestionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  aiConfirmError: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  referencesValidateHint: {
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
  aiMetaChip: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.gray100,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    overflow: "hidden",
  },
  aiMetaChipHigh: {
    backgroundColor: COLORS.success + "12",
    borderColor: COLORS.success + "44",
    color: COLORS.success,
  },
  aiMetaChipMedium: {
    backgroundColor: COLORS.warning + "12",
    borderColor: COLORS.warning + "44",
    color: COLORS.warning,
  },
  aiMetaChipInitial: {
    backgroundColor: COLORS.primary + "10",
    borderColor: COLORS.primary + "33",
    color: COLORS.primary,
  },
  aiButton: {
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  half: {
    flex: 1,
    minWidth: 140,
  },
  footer: {
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.base,
    marginBottom: SPACING.md,
  },
});
