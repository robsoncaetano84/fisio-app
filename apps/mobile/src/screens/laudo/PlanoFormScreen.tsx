// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PLANO FORM SCREEN
// ==========================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, useToast } from "../../components/ui";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useLaudoStore } from "../../stores/laudoStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { RootStackParamList } from "../../types";
import {
  getLaudoAiSuggestion,
  logClinicalAiSuggestion,
  trackEvent,
} from "../../services";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from "../../constants/theme";
import { parseApiError } from "../../utils/apiErrors";
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

export function PlanoFormScreen({ route, navigation }: PlanoFormScreenProps) {
  const { pacienteId } = route.params;
  const { t } = useLanguage();
  const AI_REVIEW_REQUIRED = FEATURE_FLAGS.requireAiSuggestionConfirmation;
  const { showToast } = useToast();
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchLaudoByPaciente, createLaudo, updateLaudo } = useLaudoStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();

  const paciente = getPacienteById(pacienteId);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiExamContextMessage, setAiExamContextMessage] = useState("");
  const [aiSuggestionMeta, setAiSuggestionMeta] = useState<{
    source?: "ai" | "rules";
    examesConsiderados: number;
    examesComLeituraIa: number;
    generatedAt?: string | null;
  } | null>(null);
  const [aiSuggestionConfirmed, setAiSuggestionConfirmed] = useState(false);
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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const autoFillRef = useRef(false);

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

  const shouldAutoFill = () =>
    !objetivosCurtoPrazo.trim() &&
    !objetivosMedioPrazo.trim() &&
    !frequenciaSemanal.trim() &&
    !duracaoSemanas.trim() &&
    !condutas.trim() &&
    !planoTratamentoIA.trim() &&
    !criteriosAlta.trim() &&
    !observacoes.trim();

  const buildSuggestionMetaPayload = () => {
    if (!aiSuggestionMeta) return {};
    const payload: {
      sugestaoSource?: "ai" | "rules";
      examesConsiderados?: number;
      examesComLeituraIa?: number;
    } = {};
    if (aiSuggestionMeta.source) payload.sugestaoSource = aiSuggestionMeta.source;
    if (Number.isFinite(aiSuggestionMeta.examesConsiderados)) {
      payload.examesConsiderados = Math.max(0, aiSuggestionMeta.examesConsiderados || 0);
    }
    if (Number.isFinite(aiSuggestionMeta.examesComLeituraIa)) {
      payload.examesComLeituraIa = Math.max(
        0,
        aiSuggestionMeta.examesComLeituraIa || 0,
      );
    }
    return payload;
  };

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
      if (!paciente) {
        await fetchPacientes(true).catch(() => undefined);
      }
      await fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
      const laudo = await fetchLaudoByPaciente(pacienteId, false).catch(() => null);
      if (!active) return;
      if (laudo?.id) {
        setLaudoId(laudo.id);
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
        setPlanoTratamentoIA(laudo.planoTratamentoIA || "");
        setCriteriosAlta(laudo.criteriosAlta || "");
        setObservacoes(laudo.observacoes || "");
        const examesConsiderados = Number(laudo.examesConsiderados || 0);
        const examesComLeituraIa = Number(laudo.examesComLeituraIa || 0);
        const source =
          laudo.sugestaoSource === "ai" || laudo.sugestaoSource === "rules"
            ? (laudo.sugestaoSource as "ai" | "rules")
            : undefined;
        if (source || examesConsiderados > 0 || examesComLeituraIa > 0) {
          setAiSuggestionMeta({
            source,
            examesConsiderados,
            examesComLeituraIa,
            generatedAt: laudo.sugestaoGeradaEm || null,
          });
          setAiSuggestionConfirmed(!AI_REVIEW_REQUIRED);
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
          const draft = JSON.parse(raw) as Partial<PlanoDraft>;
          if (draft.objetivosCurtoPrazo !== undefined) setObjetivosCurtoPrazo(draft.objetivosCurtoPrazo);
          if (draft.objetivosMedioPrazo !== undefined) setObjetivosMedioPrazo(draft.objetivosMedioPrazo);
          if (draft.frequenciaSemanal !== undefined) setFrequenciaSemanal(draft.frequenciaSemanal);
          if (draft.duracaoSemanas !== undefined) setDuracaoSemanas(draft.duracaoSemanas);
          if (draft.condutas !== undefined) setCondutas(draft.condutas);
          if (draft.planoTratamentoIA !== undefined) setPlanoTratamentoIA(draft.planoTratamentoIA);
          if (draft.criteriosAlta !== undefined) setCriteriosAlta(draft.criteriosAlta);
          if (draft.observacoes !== undefined) setObservacoes(draft.observacoes);
          if (draft.lastEditedAt) setLastDraftSavedAt(draft.lastEditedAt);
        }
      } catch {
        // ignore local draft parse
      } finally {
        setDraftLoaded(true);
      }

      if (!autoFillRef.current) {
        autoFillRef.current = true;
        await applySuggestion(false);
      }
    };

    load().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [draftKey, fetchAnamnesesByPaciente, fetchLaudoByPaciente, fetchPacientes, paciente, pacienteId]);

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
      nextErrors.objetivosCurtoPrazo = t("clinical.validation.shortTermRequired");
    }
    if (!condutas.trim()) {
      nextErrors.condutas = t("clinical.validation.therapeuticConductRequired");
    }
    if (frequenciaSemanal.trim() && (!Number.isFinite(freq) || freq <= 0)) {
      nextErrors.frequenciaSemanal = t("clinical.validation.numberGreaterThanZero");
    }
    if (duracaoSemanas.trim() && (!Number.isFinite(dur) || dur <= 0)) {
      nextErrors.duracaoSemanas = t("clinical.validation.numberGreaterThanZero");
    }
    if (AI_REVIEW_REQUIRED && aiSuggestionMeta && !aiSuggestionConfirmed) {
      nextErrors.aiSuggestionConfirmation = t(
        "clinical.validation.aiSuggestionConfirmationRequired",
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", { stage: "PLANO", reason: "MISSING_ANAMNESE", pacienteId }).catch(() => undefined);
      showToast({ type: "error", message: t("clinical.messages.fillAnamnesisBeforeSavingPlan") });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!validate()) {
      trackEvent("clinical_flow_blocked", { stage: "PLANO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      showToast({
        type: "error",
        message: t("clinical.messages.reviewHighlightedFields"),
      });
      return;
    }

    const freq = Number(frequenciaSemanal);
    const dur = Number(duracaoSemanas);

    setLoading(true);
    try {
      if (laudoId) {
        await updateLaudo(laudoId, {
          objetivosCurtoPrazo: objetivosCurtoPrazo.trim() || undefined,
          objetivosMedioPrazo: objetivosMedioPrazo.trim() || undefined,
          frequenciaSemanal: frequenciaSemanal.trim() ? freq : undefined,
          duracaoSemanas: duracaoSemanas.trim() ? dur : undefined,
          condutas: condutas.trim() || undefined,
          planoTratamentoIA: planoTratamentoIA.trim() || undefined,
          criteriosAlta: criteriosAlta.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          ...buildSuggestionMetaPayload(),
        });
      } else {
        const created = await createLaudo({
          pacienteId,
          diagnosticoFuncional: "Diagnostico funcional em elaboracao.",
          objetivosCurtoPrazo: objetivosCurtoPrazo.trim() || undefined,
          objetivosMedioPrazo: objetivosMedioPrazo.trim() || undefined,
          frequenciaSemanal: frequenciaSemanal.trim() ? freq : undefined,
          duracaoSemanas: duracaoSemanas.trim() ? dur : undefined,
          condutas:
            condutas.trim() || "Plano terapeutico inicial em elaboracao.",
          planoTratamentoIA: planoTratamentoIA.trim() || undefined,
          criteriosAlta: criteriosAlta.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          ...buildSuggestionMetaPayload(),
        });
        setLaudoId(created.id);
      }

      await AsyncStorage.removeItem(draftKey).catch(() => undefined);
      showToast({ type: "success", message: t("clinical.messages.planSavedSuccessfully") });
      navigation.goBack();
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      if (axios.isAxiosError(error)) {
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
          setLoading(false);
          return;
        }
      }
      showToast({
        type: "error",
        message: message || t("clinical.messages.planSaveError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAiSuggestion = () => {
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
    showToast({
      type: "success",
      message: t("clinical.status.professionalConfirmed"),
    });
  };

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t("common.messages.patientNotFound")}</Text>
          <Button title={t("common.actions.back")} onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>{t("clinical.sections.treatmentPlanForm")}</Text>
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
                {AI_REVIEW_REQUIRED && !aiSuggestionConfirmed ? (
                  <TouchableOpacity
                    style={styles.aiConfirmButton}
                    onPress={handleConfirmAiSuggestion}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.aiConfirmButtonText}>
                      {t("clinical.actions.confirmAiSuggestion")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
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
                    {new Date(aiSuggestionMeta.generatedAt).toLocaleString("pt-BR")}
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
                          : styles.aiMetaChipLow,
                    ]}
                  >
                    Confiança: {aiConfidence}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
          {errors.aiSuggestionConfirmation ? (
            <Text style={styles.aiConfirmError}>
              {errors.aiSuggestionConfirmation}
            </Text>
          ) : null}
          {lastDraftSavedAt ? (
            <Text style={styles.draftInfo}>
              {t("clinical.messages.lastEditedAt")}: {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}
            </Text>
          ) : null}
          <Button
            title={
              generating
                ? t("common.actions.generating")
                : t("clinical.actions.fillWithAi")
            }
            onPress={() => applySuggestion(true)}
            disabled={generating}
            variant="outline"
            icon={<Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />}
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
          <Button
            title={t("clinical.actions.clearLocalDraft")}
            variant="ghost"
            onPress={() => {
              AsyncStorage.removeItem(draftKey).catch(() => undefined);
              setLastDraftSavedAt(null);
            }}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t("clinical.actions.savePlan")}
          onPress={handleSave}
          loading={loading}
          fullWidth
          disabled={loading}
          icon={<Ionicons name="save-outline" size={18} color={COLORS.white} />}
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
    paddingBottom: 100,
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
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  aiConfirmButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  aiConfirmButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  aiConfirmError: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
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
  aiMetaChipLow: {
    backgroundColor: COLORS.error + "12",
    borderColor: COLORS.error + "44",
    color: COLORS.error,
  },
  aiButton: {
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  half: {
    flex: 1,
  },
  footer: {
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










