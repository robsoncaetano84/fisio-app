// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// EVOLUCAO FORM SCREEN
// ==========================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, PainScale, useToast } from "../../components/ui";
import { trackEvent } from "../../services";
import { useEvolucaoStore } from "../../stores/evolucaoStore";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import {
  RootStackParamList,
  VariacaoStatus,
  AdesaoStatus,
  EvolucaoStatus,
  CondutaStatus,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  CLINICAL_REGION_LABELS,
  inferClinicalRegionsFromAnamnese,
  resolveRelevantClinicalRegions,
} from "../../utils/clinicalRegionContext";

type EvolucaoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EvolucaoForm">;
  route: RouteProp<RootStackParamList, "EvolucaoForm">;
};

type DificuldadeExecucao = "FACIL" | "MEDIO" | "DIFICIL";

type IconName = keyof typeof Ionicons.glyphMap;

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

export function EvolucaoFormScreen({
  navigation,
  route,
}: EvolucaoFormScreenProps) {
  const { t } = useLanguage();
  const VOICE_ENABLED = FEATURE_FLAGS.speechToText;
  const { pacienteId, evolucaoId } = route.params;
  const { getPacienteById } = usePacienteStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const { createEvolucao, updateEvolucao, getEvolucaoById } =
    useEvolucaoStore();
  const { showToast } = useToast();
  const paciente = getPacienteById(pacienteId);
  const hasAnamnese = anamneses.some((item) => item.pacienteId === pacienteId);
  const latestAnamnese = useMemo(() => {
    const list = anamneses
      .filter((item) => item.pacienteId === pacienteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0];
  }, [anamneses, pacienteId]);
  const directRegions = useMemo(
    () => inferClinicalRegionsFromAnamnese(latestAnamnese),
    [latestAnamnese],
  );
  const relevantRegions = useMemo(
    () => resolveRelevantClinicalRegions(latestAnamnese),
    [latestAnamnese],
  );

  const [loading, setLoading] = useState(false);

  const [subjetivo, setSubjetivo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [avaliacao, setAvaliacao] = useState("");
  const [plano, setPlano] = useState("");
  const [checkinDor, setCheckinDor] = useState(0);
  const [checkinDificuldade, setCheckinDificuldade] = useState<
    DificuldadeExecucao | ""
  >("");
  const [checkinObservacao, setCheckinObservacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const didSaveRef = React.useRef(false);
  const stageOpenedAtRef = React.useRef<number>(Date.now());

  const draftKey = `draft:evolucao:${pacienteId}:${evolucaoId || "new"}`;
  const draftTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const appendText = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter((prev) => (prev ? `${prev} ${value}` : value));
  };

  const { isRecording, partial, start, stop } = useSpeechToText({
    enabled: VOICE_ENABLED,
    onResult: (text) => {
      if (!activeField) return;
      switch (activeField) {
        case "subjetivo":
          appendText(setSubjetivo, text);
          break;
        case "objetivo":
          appendText(setObjetivo, text);
          break;
        case "avaliacao":
          appendText(setAvaliacao, text);
          break;
        case "plano":
          appendText(setPlano, text);
          break;
        case "observacoes":
          appendText(setObservacoes, text);
          break;
        default:
          break;
      }
    },
    onError: (message) => {
      Alert.alert(t("common.titles.error"), message);
      setActiveField(null);
    },
  });

  const getMicIcon = (field: string): IconName =>
    isRecording && activeField === field ? "mic-off-outline" : "mic-outline";

  const toggleVoice = async (field: string) => {
    if (!VOICE_ENABLED) {
      Alert.alert(
        t("common.titles.warning"),
        "Recurso de voz desativado nas configurações",
      );
      return;
    }
    try {
      if (isRecording && activeField === field) {
        await stop();
        setActiveField(null);
        return;
      }
      if (isRecording) {
        await stop();
      }
      setActiveField(field);
      await start("pt-BR");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o reconhecimento de voz";
      Alert.alert(t("common.titles.error"), message);
      setActiveField(null);
    }
  };

  useEffect(() => {
    if (!evolucaoId) return;
    const evolucao = getEvolucaoById(evolucaoId);
    if (!evolucao) return;

    setSubjetivo(evolucao.subjetivo || evolucao.listagens || "");
    setObjetivo(evolucao.objetivo || evolucao.legCheck || "");
    setAvaliacao(evolucao.avaliacao || evolucao.ajustes || "");
    setPlano(evolucao.plano || evolucao.orientacoes || "");
    setCheckinDor(evolucao.checkinDor || 0);
    setCheckinDificuldade(evolucao.checkinDificuldade || "");
    setCheckinObservacao(evolucao.checkinObservacao || "");
    setObservacoes(evolucao.observacoes || "");
  }, [evolucaoId]);

  useEffect(() => {
    stageOpenedAtRef.current = Date.now();
    trackEvent("clinical_flow_stage_opened", { stage: "EVOLUCAO", pacienteId, source: "EvolucaoFormScreen" }).catch(() => undefined);
    return () => {
      if (didSaveRef.current) return;
      trackEvent("clinical_flow_stage_abandoned", {
        stage: "EVOLUCAO",
        pacienteId,
        source: "EvolucaoFormScreen",
        isEditing: !!evolucaoId,
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
    };
  }, [evolucaoId, pacienteId]);

  useEffect(() => {
    fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
  }, [fetchAnamnesesByPaciente, pacienteId]);

  useEffect(() => {
    trackEvent("session_started", {
      pacienteId,
      evolucaoId: evolucaoId || null,
      source: "EvolucaoFormScreen",
      stage: "EVOLUCAO",
    });
  }, [pacienteId, evolucaoId]);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (!raw) {
          setDraftLoaded(true);
          return;
        }
        const draft = JSON.parse(raw) as {
          subjetivo?: string;
          objetivo?: string;
          avaliacao?: string;
          plano?: string;
          listagens?: string;
          legCheck?: string;
          ajustes?: string;
          orientacoes?: string;
          checkinDor?: number;
          checkinDificuldade?: DificuldadeExecucao | "";
          checkinObservacao?: string;
          observacoes?: string;
          lastEditedAt?: string;
        };
        if (draft.subjetivo || draft.listagens)
          setSubjetivo(draft.subjetivo ?? draft.listagens ?? "");
        if (draft.objetivo || draft.legCheck)
          setObjetivo(draft.objetivo ?? draft.legCheck ?? "");
        if (draft.avaliacao || draft.ajustes)
          setAvaliacao(draft.avaliacao ?? draft.ajustes ?? "");
        if (draft.plano || draft.orientacoes)
          setPlano(draft.plano ?? draft.orientacoes ?? "");
        if (draft.checkinDor) setCheckinDor(draft.checkinDor);
        if (draft.checkinDificuldade)
          setCheckinDificuldade(draft.checkinDificuldade);
        if (draft.checkinObservacao)
          setCheckinObservacao(draft.checkinObservacao);
        if (draft.observacoes) setObservacoes(draft.observacoes);
        if (draft.lastEditedAt) setLastDraftSavedAt(draft.lastEditedAt);
      } catch {
        // ignore draft load errors
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [draftKey, pacienteId]);

  useEffect(() => {
    if (!draftLoaded) return;
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      const draft = {
        lastEditedAt: new Date().toISOString(),
        subjetivo,
        objetivo,
        avaliacao,
        plano,
        checkinDor,
        checkinDificuldade,
        checkinObservacao,
        observacoes,
      };
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "EVOLUCAO",
            pacienteId,
            isEditing: !!evolucaoId,
          }).catch(() => undefined);
        })
        .catch(() => {
          // ignore draft save errors
        });
    }, 800);

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [
    draftLoaded,
    subjetivo,
    objetivo,
    avaliacao,
    plano,
    checkinDor,
    checkinDificuldade,
    checkinObservacao,
    observacoes,
    draftKey,
  ]);

  const navigateAfterSave = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("PacienteDetails", { pacienteId });
  };
  const handleSave = async () => {
    setHasAttemptedSave(true);
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", { stage: "EVOLUCAO", reason: "MISSING_ANAMNESE", pacienteId }).catch(() => undefined);
      showToast({ type: "error", message: "Preencha a anamnese antes da evolução." });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!avaliacao.trim()) {
      setErrors((prev) => ({
        ...prev,
        avaliacao: "Informe a avaliação clínica",
      }));
      trackEvent("clinical_flow_blocked", { stage: "EVOLUCAO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      trackEvent("clinical_form_validation_error", {
        stage: "EVOLUCAO",
        pacienteId,
        fields: ["avaliacao"],
      }).catch(() => undefined);
      return;
    }
    if (!checkinDor) {
      setErrors((prev) => ({
        ...prev,
        checkinDor: "Informe a dor da sessão de 1 a 10",
      }));
      trackEvent("clinical_flow_blocked", { stage: "EVOLUCAO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      trackEvent("clinical_form_validation_error", {
        stage: "EVOLUCAO",
        pacienteId,
        fields: ["checkinDor"],
      }).catch(() => undefined);
      return;
    }
    if (!checkinDificuldade) {
      setErrors((prev) => ({
        ...prev,
        checkinDificuldade: "Informe a dificuldade da sessão",
      }));
      trackEvent("clinical_flow_blocked", { stage: "EVOLUCAO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      trackEvent("clinical_form_validation_error", {
        stage: "EVOLUCAO",
        pacienteId,
        fields: ["checkinDificuldade"],
      }).catch(() => undefined);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        pacienteId,
        data: new Date().toISOString(),
        subjetivo,
        objetivo,
        avaliacao,
        plano,
        checkinDor,
        checkinDificuldade,
        checkinObservacao,
        observacoes,
      };

      let savedEvolucaoId = evolucaoId || "";

      if (evolucaoId) {
        const { pacienteId: _, ...updatePayload } = payload;
        const updated = await updateEvolucao(evolucaoId, updatePayload);
        savedEvolucaoId = updated.id;
      } else {
        const created = await createEvolucao(payload);
        savedEvolucaoId = created.id;
        await AsyncStorage.setItem(
          "onboarding:professional:first_evolucao_done",
          "1",
        );
      }
      await AsyncStorage.removeItem(draftKey);
      setLastDraftSavedAt(null);

      // Telemetria não pode bloquear o fluxo principal de salvamento.
      await Promise.allSettled([
        trackEvent("checkin_submitted", {
          pacienteId,
          evolucaoId: savedEvolucaoId || null,
          dor: checkinDor,
          dificuldade: checkinDificuldade,
          mode: "form",
        }),
        trackEvent("session_completed", {
          pacienteId,
          evolucaoId: savedEvolucaoId || null,
          stage: "EVOLUCAO",
          durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
        }),
      ]);
      showToast({
        message: "Evolução salva com sucesso.",
        type: "success",
      });
      didSaveRef.current = true;
      navigateAfterSave();
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAttemptedSave) return;
    setErrors((prev) => ({
      ...prev,
      avaliacao: avaliacao.trim() ? "" : "Informe a avaliação clínica",
      checkinDor: checkinDor ? "" : "Informe a dor da sessão de 1 a 10",
      checkinDificuldade: checkinDificuldade
        ? ""
        : "Informe a dificuldade da sessão",
    }));
  }, [hasAttemptedSave, avaliacao, checkinDor, checkinDificuldade]);

  const handleClearDraft = async () => {
    Alert.alert(
      "Limpar rascunho",
      "Tem certeza que deseja apagar o rascunho?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(draftKey);
            } catch {
              // ignore
            }
            setLastDraftSavedAt(null);
            setSubjetivo("");
            setObjetivo("");
            setAvaliacao("");
            setPlano("");
            setCheckinDor(0);
            setCheckinDificuldade("");
            setCheckinObservacao("");
            setObservacoes("");
            setErrors({});
            setHasAttemptedSave(false);
          },
        },
      ],
    );
  };

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Paciente não encontrado</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.patientHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {paciente.nomeCompleto.charAt(0)}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{paciente.nomeCompleto}</Text>
          <Text style={styles.dateText}>{hoje}</Text>
          {lastDraftSavedAt ? (
            <Text style={styles.dateText}>Última edição: {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={handleClearDraft}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          <Text style={styles.draftButtonText}>Limpar rascunho</Text>
        </TouchableOpacity>
      </View>

      {VOICE_ENABLED && isRecording && (
        <View style={styles.voiceBanner}>
          <Ionicons name="mic" size={16} color={COLORS.white} />
          <Text style={styles.voiceBannerText}>
            Gravando... {partial ? `"${partial}"` : ""}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.soapCard}>
          <Text style={styles.soapTitle}>Protocolo de Evolução (SOAP)</Text>
          <Text style={styles.soapSubtitle}>
            S: Subjetivo | O: Objetivo | A: Avaliação | P: Plano
          </Text>
        </View>
        {relevantRegions.length ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Foco clinico por regiao</Text>
            <Text style={styles.contextDescription}>
              Queixa principal:{" "}
              {directRegions.length
                ? directRegions.map((r) => CLINICAL_REGION_LABELS[r]).join(", ")
                : "Nao identificada"}{" "}
              | Cadeia relacionada: {relevantRegions.map((r) => CLINICAL_REGION_LABELS[r]).join(", ")}
            </Text>
            <TouchableOpacity
              style={styles.contextAction}
              onPress={() => {
                const focusText = `Foco regional: ${relevantRegions
                  .map((r) => CLINICAL_REGION_LABELS[r])
                  .join(", ")}.`;
                if (!objetivo.includes("Foco regional")) {
                  setObjetivo((prev) => (prev ? `${prev}\n${focusText}` : focusText));
                }
              }}
            >
              <Text style={styles.contextActionText}>Inserir foco no Objetivo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <FormSection
          title="S - Subjetivo"
          subtitle="Queixas e observações do paciente na sessão"
        >
          <Input
            placeholder="Ex: relata redução da dor, desconforto ao agachar e melhor tolerância nas atividades diárias..."
            value={subjetivo}
            onChangeText={(text) => {
              setSubjetivo(text);
              if (errors.subjetivo) {
                setErrors((prev) => ({ ...prev, subjetivo: "" }));
              }
            }}
            error={errors.subjetivo}
            showCount
            showClear
            maxLength={2000}
            onClear={() => setSubjetivo("")}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("subjetivo") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("subjetivo") : undefined
            }
            hint={
              activeField === "subjetivo" && isRecording ? partial : undefined
            }
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </FormSection>

        <FormSection
          title="O - Objetivo"
          subtitle="Achados objetivos (ADM, força, testes funcionais)"
        >
          <Input
            placeholder="Ex: ADM de flexão aumentou, melhora no teste funcional e menor dor à palpação..."
            value={objetivo}
            onChangeText={(text) => {
              setObjetivo(text);
              if (errors.objetivo) {
                setErrors((prev) => ({ ...prev, objetivo: "" }));
              }
            }}
            error={errors.objetivo}
            showCount
            showClear
            maxLength={2000}
            onClear={() => setObjetivo("")}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("objetivo") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("objetivo") : undefined
            }
            hint={
              activeField === "objetivo" && isRecording ? partial : undefined
            }
            multiline
            numberOfLines={3}
            style={styles.textAreaSmall}
          />
        </FormSection>

        <FormSection
          title="A - Avaliação *"
          subtitle="Interpretação clínica e resposta ao tratamento"
        >
          <Input
            placeholder="Ex: evolução positiva, com redução da irritabilidade e melhora do controle motor..."
            value={avaliacao}
            onChangeText={(text) => {
              setAvaliacao(text);
              if (errors.avaliacao) {
                setErrors((prev) => ({ ...prev, avaliacao: "" }));
              }
            }}
            error={errors.avaliacao}
            showCount
            showClear
            maxLength={2000}
            onClear={() => setAvaliacao("")}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("avaliacao") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("avaliacao") : undefined
            }
            hint={
              activeField === "avaliacao" && isRecording ? partial : undefined
            }
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </FormSection>

        <FormSection
          title="P - Plano"
          subtitle="Exercícios, cuidados e recomendações"
        >
          <Input
            placeholder="Ex: progredir carga, manter exercícios domiciliares e reavaliar em 7 dias..."
            value={plano}
            onChangeText={(text) => {
              setPlano(text);
              if (errors.plano) {
                setErrors((prev) => ({ ...prev, plano: "" }));
              }
            }}
            error={errors.plano}
            showCount
            showClear
            maxLength={2000}
            onClear={() => setPlano("")}
            rightIcon={VOICE_ENABLED ? getMicIcon("plano") : undefined}
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("plano") : undefined
            }
            hint={activeField === "plano" && isRecording ? partial : undefined}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </FormSection>

        <FormSection
          title={`${t("clinical.labels.postSessionCheckin")} *`}
          subtitle="Registro obrigatório de dor e dificuldade da sessão"
        >
          <PainScale
            value={checkinDor}
            onChange={(value) => {
              setCheckinDor(value);
              if (errors.checkinDor) {
                setErrors((prev) => ({ ...prev, checkinDor: "" }));
              }
            }}
            title="Intensidade da Dor"
            subtitle="Selecione o nível de dor da sessão de 0 a 10"
            labelResolver={(score) => {
              if (score <= 1) return "Sem dor";
              if (score <= 3) return "Leve";
              if (score <= 5) return "Moderada";
              if (score <= 7) return "Forte";
              if (score <= 9) return "Muito forte";
              return "Insuportável";
            }}
          />
          {errors.checkinDor ? (
            <Text style={styles.fieldError}>{errors.checkinDor}</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Dificuldade da sessão</Text>
          <View style={styles.dificuldadeRow}>
            {[
              { label: "Fácil", value: "FACIL" as const },
              { label: "Médio", value: "MEDIO" as const },
              { label: "Difícil", value: "DIFICIL" as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => {
                  setCheckinDificuldade(item.value);
                  if (errors.checkinDificuldade) {
                    setErrors((prev) => ({ ...prev, checkinDificuldade: "" }));
                  }
                }}
                style={[
                  styles.dificuldadeButton,
                  checkinDificuldade === item.value &&
                    styles.dificuldadeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.dificuldadeButtonText,
                    checkinDificuldade === item.value &&
                      styles.dificuldadeButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.checkinDificuldade ? (
            <Text style={styles.fieldError}>{errors.checkinDificuldade}</Text>
          ) : null}

          <Input
            placeholder="Observação rápida da sessão (opcional)"
            value={checkinObservacao}
            onChangeText={(text) => {
              setCheckinObservacao(text);
              if (errors.checkinObservacao) {
                setErrors((prev) => ({ ...prev, checkinObservacao: "" }));
              }
            }}
            error={errors.checkinObservacao}
            showCount
            showClear
            maxLength={400}
            onClear={() => setCheckinObservacao("")}
            multiline
            numberOfLines={2}
            style={styles.textAreaSmall}
          />
        </FormSection>

        <FormSection title="Observações Gerais" subtitle="Anotações adicionais">
          <Input
            placeholder="Ex: Paciente apresentou boa resposta..."
            value={observacoes}
            onChangeText={(text) => {
              setObservacoes(text);
              if (errors.observacoes) {
                setErrors((prev) => ({ ...prev, observacoes: "" }));
              }
            }}
            error={errors.observacoes}
            showCount
            showClear
            maxLength={2000}
            onClear={() => setObservacoes("")}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("observacoes") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("observacoes") : undefined
            }
            hint={
              activeField === "observacoes" && isRecording ? partial : undefined
            }
            multiline
            numberOfLines={3}
            style={styles.textAreaSmall}
          />
        </FormSection>

        <View style={styles.buttonsContainer}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={evolucaoId ? "Salvar Alterações" : "Salvar"}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
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
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  patientAvatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.white,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  voiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  voiceBannerText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  draftButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  draftButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
  },
  soapCard: {
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  soapTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  soapSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  contextCard: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
  },
  contextTitle: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 4,
  },
  contextDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  contextAction: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  contextActionText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
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
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  guidedCheckinCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    backgroundColor: COLORS.primary + "08",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  guidedCheckinHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  guidedCheckinTitle: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  guidedCheckinProgressText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  guidedCheckinProgressTrack: {
    width: "100%",
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray200,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  guidedCheckinProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  guidedQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  guidedQuickChip: {
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  guidedQuickChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  guidedQuickChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  guidedQuickChipTextActive: {
    color: COLORS.white,
  },
  dificuldadeRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dificuldadeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  dificuldadeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dificuldadeButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
  dificuldadeButtonTextActive: {
    color: COLORS.white,
  },
  fieldError: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  textAreaSmall: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

















