// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// EVOLUCAO FORM SCREEN
// ==========================================

import React, { useEffect, useMemo, useState } from "react";
import {
  AppState,
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
import {
  getEvolucaoSoapSuggestion,
  getClinicalOrchestratorNextAction,
  logClinicalAiSuggestion,
  trackEvent,
  type ClinicalOrchestratorNextActionResponse,
  type EvolucaoSoapSuggestionResponse,
} from "../../services";
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
  inferClinicalRegionsFromHints,
  mapClinicalChainCodeToLabel,
  inferClinicalRegionsFromAnamnese,
  resolveRelevantClinicalRegions,
} from "../../utils/clinicalRegionContext";

type EvolucaoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EvolucaoForm">;
  route: RouteProp<RootStackParamList, "EvolucaoForm">;
};

type DificuldadeExecucao = "FACIL" | "MEDIO" | "DIFICIL";

type IconName = keyof typeof Ionicons.glyphMap;

const REGION_EVOLUTION_TEMPLATES: Record<
  string,
  {
    objetivo: string;
    avaliacao: string;
    plano: string;
  }
> = {
  CERVICAL: {
    objetivo:
      "Cervical: melhora de mobilidade segmentar e menor dor em rotações/inclinações cervicais.",
    avaliacao:
      "Evolução compatível com redução de irritabilidade cervical e melhor controle cervicoescapular.",
    plano:
      "Manter progressão de mobilidade cervical, estabilidade escapular e higiene postural.",
  },
  TORACICA: {
    objetivo:
      "Torácica: ganho de mobilidade torácica e melhor dissociação tronco-cintura escapular.",
    avaliacao:
      "Resposta funcional favorável em cadeia torácica, com menor compensação cervical/lombar.",
    plano:
      "Progredir mobilidade torácica e integração respiratória com controle de tronco.",
  },
  LOMBAR: {
    objetivo:
      "Lombar: melhora da tolerância a flexão/extensão e redução da dor em tarefas de carga.",
    avaliacao:
      "Evolução positiva do controle lombo-pélvico, com menor resposta dolorosa mecânica.",
    plano:
      "Progredir estabilidade lombo-pélvica, fortalecimento funcional e educação de carga.",
  },
  SACROILIACA: {
    objetivo:
      "Sacroilíaca: menor dor provocada em transições e melhor controle de pelve durante marcha.",
    avaliacao:
      "Boa evolução da estabilidade pélvica e redução de sobrecarga na cadeia posterior.",
    plano:
      "Manter estratégias de estabilidade de pelve e progressão de exercícios de dissociação.",
  },
  QUADRIL: {
    objetivo:
      "Quadril: ganho de ADM e melhora no controle de rotação/flexão sem dor significativa.",
    avaliacao:
      "Evolução consistente da função do quadril com redução de compensações adjacentes.",
    plano:
      "Progredir força de abdutores/extensores e controle neuromuscular em cadeia inferior.",
  },
  JOELHO: {
    objetivo:
      "Joelho: melhora do alinhamento dinâmico e menor dor em agachamento/subida de escadas.",
    avaliacao:
      "Resposta satisfatória em controle femorotibial e redução de sintomas em carga funcional.",
    plano:
      "Manter progressão de força, controle de valgo dinâmico e retorno gradual às demandas.",
  },
  TORNOZELO_PE: {
    objetivo:
      "Tornozelo/Pé: melhora de mobilidade e apoio, com menor dor na fase de propulsão.",
    avaliacao:
      "Evolução funcional do padrão de apoio e absorção de carga na cadeia distal.",
    plano:
      "Progredir mobilidade, fortalecimento intrínseco e treino de estabilidade funcional.",
  },
  OMBRO: {
    objetivo:
      "Ombro: melhora de ADM e controle escapuloumeral com menor dor nos arcos funcionais.",
    avaliacao:
      "Boa resposta clínica do complexo do ombro, com redução de irritabilidade mecânica.",
    plano:
      "Progredir estabilidade escapular, força do manguito e controle em tarefas acima da cabeça.",
  },
  COTOVELO: {
    objetivo:
      "Cotovelo: melhora de tolerância a carga e redução de dor em preensão e extensão resistida.",
    avaliacao:
      "Evolução favorável do segmento com menor sensibilidade em demanda repetitiva.",
    plano:
      "Progredir carga gradual, controle de punho-cotovelo e educação de volume de esforço.",
  },
  PUNHO_MAO: {
    objetivo:
      "Punho/Mão: melhora de função de preensão e movimentos finos com menor dor local.",
    avaliacao:
      "Evolução compatível com redução de sintomas periféricos e melhor capacidade funcional manual.",
    plano:
      "Manter progressão de mobilidade, força funcional e estratégias de proteção em sobrecarga.",
  },
};

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
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const { createEvolucao, getEvolucaoById } = useEvolucaoStore();
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
  const [orchestratorNextAction, setOrchestratorNextAction] =
    useState<ClinicalOrchestratorNextActionResponse | null>(null);
  const [evolucaoSuggestion, setEvolucaoSuggestion] =
    useState<EvolucaoSoapSuggestionResponse | null>(null);
  const [soapSuggestionApplied, setSoapSuggestionApplied] = useState(false);
  const [soapSuggestionConfirmed, setSoapSuggestionConfirmed] = useState(false);
  const orchestratorFocusedRegions = useMemo(
    () => {
      const hints = [
        ...(orchestratorNextAction?.context?.regioesPrioritarias || []),
        ...(orchestratorNextAction?.context?.regioesRelacionadas || []),
      ];
      return inferClinicalRegionsFromHints(hints);
    },
    [orchestratorNextAction],
  );
  const focusedRegions = useMemo(
    () => Array.from(new Set([...orchestratorFocusedRegions, ...relevantRegions])),
    [orchestratorFocusedRegions, relevantRegions],
  );
  const cadeiaProvavel = useMemo(
    () => mapClinicalChainCodeToLabel(orchestratorNextAction?.context?.cadeiaProvavel),
    [orchestratorNextAction],
  );
  const localFallbackSuggestion = useMemo<EvolucaoSoapSuggestionResponse | null>(() => {
    if (!latestAnamnese) return null;
    const sintomas = String(latestAnamnese.descricaoSintomas || "").trim();
    const piora = String(latestAnamnese.fatoresPiora || "").trim();
    const alivio = String(latestAnamnese.fatorAlivio || "").trim();
    const areas = (latestAnamnese.areasAfetadas || [])
      .map((item) => String(item.regiao || "").trim())
      .filter(Boolean);

    if (!sintomas && !areas.length) return null;

    const regiaoTexto = areas.length ? areas.join(", ") : "região principal";
    return {
      orchestrator: "CLINICAL_ORCHESTRATOR",
      mode: "assistive-v1",
      requiresProfessionalApproval: true,
      patientId: pacienteId,
      stage: "EVOLUCAO",
      suggestionType: "EVOLUCAO_SOAP",
      confidence: "BAIXA",
      reason:
        "Sugestão local de contingência gerada a partir da anamnese (fallback sem backend).",
      evidenceFields: [
        ...(sintomas ? ["descricaoSintomas"] : []),
        ...(areas.length ? ["areasAfetadas"] : []),
        ...(piora ? ["fatoresPiora"] : []),
        ...(alivio ? ["fatorAlivio"] : []),
      ],
      protocolVersion: null,
      protocolName: null,
      subjetivo: sintomas
        ? `Paciente relata ${sintomas}${piora ? `. Piora com ${piora}` : ""}${alivio ? ` e alívio com ${alivio}` : ""}.`
        : null,
      objetivo: `Registrar resposta funcional e evolução dos achados objetivos na ${regiaoTexto}.`,
      avaliacao:
        "Evolução inicial em acompanhamento; validar resposta clínica e progressão funcional.",
      plano:
        "Manter conduta progressiva com reavaliação próxima e reforço de orientações domiciliares.",
    };
  }, [latestAnamnese, pacienteId]);

  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

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

  const appendLineIfMissing = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    const next = String(value || "").trim();
    if (!next) return;
    setter((prev) => {
      const current = String(prev || "").trim();
      if (!current) return next;
      if (current.toLowerCase().includes(next.toLowerCase())) return prev;
      return `${prev}\n${next}`;
    });
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
    let active = true;

    const bootstrapPaciente = async () => {
      try {
        if (!paciente) {
          await fetchPacientes(true);
        }
      } catch {
        // ignore bootstrap errors; not-found fallback handles final state
      } finally {
        if (active) setBootstrapping(false);
      }
    };

    bootstrapPaciente();

    return () => {
      active = false;
    };
  }, [fetchPacientes, paciente]);

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
    let active = true;
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
  }, [pacienteId]);

  useEffect(() => {
    let active = true;
    getEvolucaoSoapSuggestion(pacienteId)
      .then((response) => {
        if (!active) return;
        setEvolucaoSuggestion(response);
      })
      .catch(() => {
        if (!active) return;
        setEvolucaoSuggestion(localFallbackSuggestion);
      });
    return () => {
      active = false;
    };
  }, [pacienteId, localFallbackSuggestion]);

  const handleApplySoapSuggestion = () => {
    if (!evolucaoSuggestion) return;
    if (
      !evolucaoSuggestion.subjetivo &&
      !evolucaoSuggestion.objetivo &&
      !evolucaoSuggestion.avaliacao &&
      !evolucaoSuggestion.plano
    ) {
      showToast({
        type: "error",
        message: "Não há sugestão aplicável com os dados atuais.",
      });
      return;
    }

    setSubjetivo((prev) => prev || evolucaoSuggestion.subjetivo || "");
    setObjetivo((prev) => prev || evolucaoSuggestion.objetivo || "");
    setAvaliacao((prev) => prev || evolucaoSuggestion.avaliacao || "");
    setPlano((prev) => prev || evolucaoSuggestion.plano || "");
    setSoapSuggestionApplied(true);
    setSoapSuggestionConfirmed(false);

    logClinicalAiSuggestion({
      patientId: pacienteId,
      stage: "EVOLUCAO",
      suggestionType: "EVOLUCAO_SOAP",
      confidence: evolucaoSuggestion.confidence,
      reason: evolucaoSuggestion.reason,
      evidenceFields: evolucaoSuggestion.evidenceFields,
    }).catch(() => undefined);

    showToast({
      type: "success",
      message: `Sugestão SOAP aplicada (${evolucaoSuggestion.confidence.toLowerCase()}).`,
    });
  };

  const handleConfirmSoapSuggestion = () => {
    if (!soapSuggestionApplied || !evolucaoSuggestion) return;
    setSoapSuggestionConfirmed(true);
    logClinicalAiSuggestion({
      patientId: pacienteId,
      stage: "EVOLUCAO",
      suggestionType: "EVOLUCAO_SOAP_REVIEWED",
      confidence: evolucaoSuggestion.confidence,
      reason: "Sugestão SOAP revisada e confirmada pelo profissional.",
      evidenceFields: evolucaoSuggestion.evidenceFields,
    }).catch(() => undefined);
    showToast({
      type: "success",
      message: "Sugestão revisada e confirmada.",
    });
  };

  const applyRegionTemplate = (regionCode: string) => {
    const template = REGION_EVOLUTION_TEMPLATES[regionCode];
    if (!template) return;
    appendLineIfMissing(setObjetivo, template.objetivo);
    appendLineIfMissing(setAvaliacao, template.avaliacao);
    appendLineIfMissing(setPlano, template.plano);
    if (soapSuggestionApplied) {
      setSoapSuggestionConfirmed(false);
    }
    showToast({
      type: "success",
      message: `Modelo aplicado para ${CLINICAL_REGION_LABELS[regionCode as keyof typeof CLINICAL_REGION_LABELS] || regionCode}.`,
    });
  };

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
    const buildDraftPayload = () => ({
      lastEditedAt: new Date().toISOString(),
      subjetivo,
      objetivo,
      avaliacao,
      plano,
      checkinDor,
      checkinDificuldade,
      checkinObservacao,
      observacoes,
    });
    const persistDraft = (reason: string) => {
      const draft = buildDraftPayload();
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "EVOLUCAO",
            pacienteId,
            isEditing: !!evolucaoId,
            reason,
          }).catch(() => undefined);
        })
        .catch(() => {
          // ignore draft save errors
        });
    };

    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      persistDraft("debounced");
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

  useEffect(() => {
    if (!draftLoaded) return;
    const buildDraftPayload = () => ({
      lastEditedAt: new Date().toISOString(),
      subjetivo,
      objetivo,
      avaliacao,
      plano,
      checkinDor,
      checkinDificuldade,
      checkinObservacao,
      observacoes,
    });
    const persistDraftNow = (reason: string) => {
      const draft = buildDraftPayload();
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "EVOLUCAO",
            pacienteId,
            isEditing: !!evolucaoId,
            reason,
          }).catch(() => undefined);
        })
        .catch(() => undefined);
    };

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        persistDraftNow("app_background");
      }
    });
    const beforeRemoveSub = navigation.addListener("beforeRemove", () => {
      persistDraftNow("before_remove");
    });

    return () => {
      appStateSub.remove();
      beforeRemoveSub();
      persistDraftNow("unmount");
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
    pacienteId,
    evolucaoId,
    navigation,
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
    if (soapSuggestionApplied && !soapSuggestionConfirmed) {
      setErrors((prev) => ({
        ...prev,
        soapSuggestionConfirmation:
          "Confirme a sugestão SOAP antes de salvar a evolução.",
      }));
      showToast({
        type: "error",
        message: "Confirme a sugestão aplicada antes de salvar.",
      });
      trackEvent("clinical_flow_blocked", {
        stage: "EVOLUCAO",
        reason: "SUGGESTION_NOT_CONFIRMED",
        pacienteId,
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

      const created = await createEvolucao(payload);
      const savedEvolucaoId = created.id;
      await AsyncStorage.setItem(
        "onboarding:professional:first_evolucao_done",
        "1",
      );
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
        ...(soapSuggestionApplied && evolucaoSuggestion
          ? [
              logClinicalAiSuggestion({
                patientId: pacienteId,
                stage: "EVOLUCAO",
                suggestionType: "EVOLUCAO_SOAP_CONFIRMED",
                confidence: evolucaoSuggestion.confidence,
                reason:
                  "Sugestao SOAP assistiva confirmada pelo profissional no salvamento.",
                evidenceFields: evolucaoSuggestion.evidenceFields,
              }),
            ]
          : []),
      ]);
      showToast({
        message: evolucaoId
          ? "Nova evolução registrada. A sessão anterior foi preservada."
          : "Evolução salva com sucesso.",
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

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Carregando evolução...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerActions}>
          {evolucaoId ? (
            <TouchableOpacity
              style={styles.newVersionButton}
              onPress={() => navigation.navigate("EvolucaoForm", { pacienteId })}
            >
              <Ionicons name="add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.newVersionButtonText}>Nova</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleClearDraft}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            <Text style={styles.draftButtonText}>Limpar rascunho</Text>
          </TouchableOpacity>
        </View>
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
        {evolucaoSuggestion ? (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>Sugestão do Charles (SOAP)</Text>
              <Text style={styles.suggestionConfidence}>
                {evolucaoSuggestion.confidence}
              </Text>
            </View>
            <Text style={styles.suggestionReason}>{evolucaoSuggestion.reason}</Text>
            {evolucaoSuggestion.evidenceFields.length > 0 ? (
              <Text style={styles.suggestionEvidence}>
                Evidências: {evolucaoSuggestion.evidenceFields.join(", ")}
              </Text>
            ) : null}
            {evolucaoSuggestion.protocolVersion ? (
              <Text style={styles.suggestionEvidence}>
                Protocolo: {evolucaoSuggestion.protocolName || "Ativo"} v
                {evolucaoSuggestion.protocolVersion}
              </Text>
            ) : null}
            {soapSuggestionApplied ? (
              <View
                style={[
                  styles.suggestionAppliedPill,
                  soapSuggestionConfirmed && styles.suggestionAppliedPillConfirmed,
                ]}
              >
                <Text
                  style={[
                    styles.suggestionAppliedPillText,
                    soapSuggestionConfirmed && styles.suggestionAppliedPillTextConfirmed,
                  ]}
                >
                  {soapSuggestionConfirmed
                    ? "Sugestão confirmada pelo profissional"
                    : "Sugestão aplicada (revisar e confirmar)"}
                </Text>
              </View>
            ) : null}
            {evolucaoSuggestion.confidence === "BAIXA" ? (
              <Text style={styles.suggestionLowConfidenceText}>
                Baixa confiança: revise os campos antes de confirmar.
              </Text>
            ) : null}
            {errors.soapSuggestionConfirmation ? (
              <Text style={styles.fieldError}>{errors.soapSuggestionConfirmation}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.suggestionApplyButton}
              onPress={handleApplySoapSuggestion}
            >
              <Text style={styles.suggestionApplyButtonText}>
                Aplicar sugestão (campos vazios)
              </Text>
            </TouchableOpacity>
            {soapSuggestionApplied && !soapSuggestionConfirmed ? (
              <TouchableOpacity
                style={styles.suggestionConfirmButton}
                onPress={handleConfirmSoapSuggestion}
              >
                <Text style={styles.suggestionConfirmButtonText}>
                  Confirmar sugestão revisada
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {orchestratorNextAction?.blocked ? (
          <View style={[styles.contextCard, styles.contextBlockedCard]}>
            <Text style={styles.contextTitle}>Atenção clínica imediata</Text>
            <Text style={styles.contextDescription}>
              {orchestratorNextAction.blockers[0]?.message ||
                "Há bloqueio clínico para continuidade do fluxo."}
            </Text>
          </View>
        ) : null}
        {focusedRegions.length ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Foco clinico por regiao</Text>
            <Text style={styles.contextDescription}>
              Queixa principal:{" "}
              {directRegions.length
                ? directRegions.map((r) => CLINICAL_REGION_LABELS[r]).join(", ")
                : "Nao identificada"}{" "}
              | Cadeia relacionada: {focusedRegions.map((r) => CLINICAL_REGION_LABELS[r]).join(", ")}
              {cadeiaProvavel ? ` • ${cadeiaProvavel}` : ""}
            </Text>
            <TouchableOpacity
              style={styles.contextAction}
              onPress={() => {
                const focusText = `Foco regional: ${focusedRegions
                  .map((r) => CLINICAL_REGION_LABELS[r])
                  .join(", ")}.`;
                if (!objetivo.includes("Foco regional")) {
                  setObjetivo((prev) => (prev ? `${prev}\n${focusText}` : focusText));
                }
              }}
            >
              <Text style={styles.contextActionText}>Inserir foco no Objetivo</Text>
            </TouchableOpacity>
            <Text style={styles.regionTemplateTitle}>Apoio por região (queixa + cadeia)</Text>
            <View style={styles.regionTemplateBlockList}>
              {focusedRegions.map((region) => {
                const template = REGION_EVOLUTION_TEMPLATES[region];
                if (!template) return null;
                return (
                  <View key={region} style={styles.regionTemplateBlock}>
                    <View style={styles.regionTemplateBlockHeader}>
                      <Text style={styles.regionTemplateBlockTitle}>
                        {CLINICAL_REGION_LABELS[region]}
                      </Text>
                      <TouchableOpacity
                        style={styles.regionTemplateApplyButton}
                        onPress={() => applyRegionTemplate(region)}
                      >
                        <Text style={styles.regionTemplateApplyButtonText}>Aplicar</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.regionTemplateBlockText}>O: {template.objetivo}</Text>
                    <Text style={styles.regionTemplateBlockText}>A: {template.avaliacao}</Text>
                    <Text style={styles.regionTemplateBlockText}>P: {template.plano}</Text>
                  </View>
                );
              })}
            </View>
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
              if (soapSuggestionApplied) {
                setSoapSuggestionConfirmed(false);
              }
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
              if (soapSuggestionApplied) {
                setSoapSuggestionConfirmed(false);
              }
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
              if (soapSuggestionApplied) {
                setSoapSuggestionConfirmed(false);
              }
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
              if (soapSuggestionApplied) {
                setSoapSuggestionConfirmed(false);
              }
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
            title={evolucaoId ? "Registrar nova evolução" : "Salvar"}
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
  headerActions: {
    marginLeft: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  newVersionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  newVersionButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
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
  suggestionCard: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  suggestionTitle: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  suggestionConfidence: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  suggestionReason: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  suggestionEvidence: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  suggestionApplyButton: {
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    backgroundColor: COLORS.white,
  },
  suggestionApplyButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  suggestionAppliedPill: {
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + "1A",
    borderWidth: 1,
    borderColor: COLORS.success + "66",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    marginBottom: SPACING.sm,
  },
  suggestionAppliedPillText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  suggestionAppliedPillConfirmed: {
    backgroundColor: COLORS.primary + "14",
    borderColor: COLORS.primary + "66",
  },
  suggestionAppliedPillTextConfirmed: {
    color: COLORS.primary,
  },
  suggestionLowConfidenceText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  suggestionConfirmButton: {
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    backgroundColor: COLORS.primary + "10",
    marginTop: SPACING.xs,
  },
  suggestionConfirmButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  contextCard: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
  },
  contextBlockedCard: {
    backgroundColor: COLORS.error + "10",
    borderColor: COLORS.error + "33",
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
  regionTemplateTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  regionTemplateBlockList: {
    gap: SPACING.xs,
  },
  regionTemplateBlock: {
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  regionTemplateBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  regionTemplateBlockTitle: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  regionTemplateApplyButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.primary + "10",
  },
  regionTemplateApplyButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  regionTemplateBlockText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginBottom: 2,
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

















