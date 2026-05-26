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
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useAuthStore } from "../../stores/authStore";
import { useLaudoStore } from "../../stores/laudoStore";
import { api, getLaudoAiSuggestion } from "../../services";
import {
  logClinicalAiSuggestion,
  recordAuditAction,
  trackEvent,
} from "../../services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
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

type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type LaudoDraftPayload = {
  pacienteId: string;
  motivoAvaliacao?: string;
  historicoClinico?: string;
  achadosClinicos?: string;
  diagnosticoFuncional?: string;
  objetivosCurtoPrazo?: string;
  objetivosMedioPrazo?: string;
  frequenciaSemanal?: number;
  duracaoSemanas?: number;
  conclusao?: string;
  condutas?: string;
  planoTratamentoIA?: string;
  rascunhoProfissional?: string;
  observacoes?: string;
  criteriosAlta?: string;
  sugestaoSource?: "ai" | "rules";
  examesConsiderados?: number;
  examesComLeituraIa?: number;
};

const LAUDO_AUTOSAVE_DEBOUNCE_MS = 1800;

const TEMPLATE_LABEL_KEY: Record<TemplateKey, string> = {
  GERAL: "clinical.templates.general",
  LOMBAR: "clinical.templates.lumbar",
  CERVICAL: "clinical.templates.cervical",
  JOELHO: "clinical.templates.knee",
};

const TEMPLATE_CONTENT: Record<
  TemplateKey,
  {
    motivoAvaliacao: string;
    historicoClinico: string;
    achadosClinicos: string;
    diagnosticoFuncional: string;
    conclusao: string;
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
    motivoAvaliacao:
      "Paciente comparece para avaliacao funcional e emissao de laudo clinico, com objetivo de documentar queixa, achados observados e orientacoes iniciais.",
    historicoClinico:
      "Historico clinico a ser complementado pelo profissional, considerando inicio dos sintomas, tempo de evolucao, fatores de melhora/piora, tratamentos previos e impacto na rotina.",
    achadosClinicos:
      "Avaliacao clinica inicial com necessidade de documentar inspeção, mobilidade, força, dor ao movimento, testes especificos e limitacoes funcionais observadas.",
    diagnosticoFuncional:
      "Disfuncao funcional musculo-esqueletica com limitacao de mobilidade, dor ao esforco e impacto em atividades de vida diaria.",
    conclusao:
      "O quadro avaliado apresenta repercussao funcional e deve ser acompanhado com conduta terapeutica individualizada, progressao conforme resposta clinica e reavaliacao periodica.",
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
    motivoAvaliacao:
      "Paciente comparece para avaliacao de dor lombar e emissao de laudo funcional, com impacto em atividades diarias e necessidade de orientacao terapeutica.",
    historicoClinico:
      "Historico sugestivo de lombalgia a ser detalhado conforme tempo de evolucao, comportamento da dor, fatores de piora, fatores de alivio, tratamentos previos e impacto laboral ou funcional.",
    achadosClinicos:
      "Avaliacao dirigida para coluna lombar, controle lombo-pelvico, mobilidade de tronco/quadril, dor ao movimento, tolerancia a sedestacao, marcha e testes funcionais pertinentes.",
    diagnosticoFuncional:
      "Lombalgia mecanica com reducao de mobilidade lombo-pelvica e piora da dor em flexao/prolongamento de postura.",
    conclusao:
      "O paciente apresenta alteracao funcional lombar com impacto nas atividades de vida diaria, sendo indicada intervencao fisioterapeutica para controle de sintomas, mobilidade e recuperacao funcional.",
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
    motivoAvaliacao:
      "Paciente comparece para avaliacao de dor ou desconforto cervical, com objetivo de documentar achados funcionais e orientar conduta terapeutica.",
    historicoClinico:
      "Historico cervical a ser detalhado conforme inicio dos sintomas, tempo de evolucao, relacao com postura sustentada, cefaleia associada, fatores de alivio/piora e impacto na rotina.",
    achadosClinicos:
      "Avaliacao dirigida para mobilidade cervical e toracica, controle cervico-escapular, dor ao movimento, sensibilidade miofascial, postura e testes funcionais pertinentes.",
    diagnosticoFuncional:
      "Cervicalgia com sobrecarga miofascial, limitacao de amplitude cervical e sintomas associados a postura sustentada.",
    conclusao:
      "O quadro avaliado sugere disfuncao cervical com repercussao funcional, sendo indicada conduta fisioterapeutica para controle dos sintomas, melhora da mobilidade e endurance cervico-escapular.",
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
    motivoAvaliacao:
      "Paciente comparece para avaliacao de dor ou limitacao funcional em joelho, com objetivo de documentar achados e orientar retorno seguro as atividades.",
    historicoClinico:
      "Historico do joelho a ser complementado com inicio dos sintomas, mecanismo de lesao, tempo de evolucao, fatores de piora, edema, tratamentos previos e impacto em marcha, escadas ou esporte.",
    achadosClinicos:
      "Avaliacao dirigida para amplitude de movimento, dor a carga, edema, controle neuromuscular, estabilidade dinamica, forca de membro inferior, marcha, agachamento e testes especificos.",
    diagnosticoFuncional:
      "Disfuncao de joelho com dor a carga, deficit de controle neuromuscular e limitacao para agachar/subir escadas.",
    conclusao:
      "O paciente apresenta limitacao funcional de joelho com necessidade de progressao terapeutica criteriosa para controle de sintomas, ganho de estabilidade e retorno funcional seguro.",
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
  const { t, language } = useLanguage();
  const AI_REVIEW_REQUIRED = FEATURE_FLAGS.requireAiSuggestionConfirmation;
  const VOICE_ENABLED = FEATURE_FLAGS.speechToText;
  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
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
  const [motivoAvaliacao, setMotivoAvaliacao] = useState("");
  const [historicoClinico, setHistoricoClinico] = useState("");
  const [achadosClinicos, setAchadosClinicos] = useState("");
  const [diagnosticoFuncional, setDiagnosticoFuncional] = useState("");
  const [objetivosCurtoPrazo, setObjetivosCurtoPrazo] = useState("");
  const [objetivosMedioPrazo, setObjetivosMedioPrazo] = useState("");
  const [frequenciaSemanal, setFrequenciaSemanal] = useState("");
  const [duracaoSemanas, setDuracaoSemanas] = useState("");
  const [conclusao, setConclusao] = useState("");
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
  const [activeField, setActiveField] = useState<string | null>(null);
  const [consultedReferenceIds, setConsultedReferenceIds] = useState<string[]>(
    [],
  );
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [professionalValidationConfirmed, setProfessionalValidationConfirmed] =
    useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const totalSuggestedReferences =
    (referenceSuggestions?.laudoReferences.length || 0) +
    (referenceSuggestions?.planoReferences.length || 0);
  const hasSuggestedReferences = totalSuggestedReferences > 0;
  const consultedReferencesCount = consultedReferenceIds.length;
  const hasConsultedAnyReference = consultedReferencesCount > 0;
  const getTemplateLabel = (templateKey: TemplateKey) =>
    t(TEMPLATE_LABEL_KEY[templateKey]);
  const downloadBaseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    },
    [],
  );

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

  const appendText = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter((prev) => (prev ? `${prev} ${value}` : value));
  };

  const { isRecording, partial, start, stop } = useSpeechToText({
    enabled: VOICE_ENABLED,
    onResult: (text) => {
      switch (activeField) {
        case "motivoAvaliacao":
          appendText(setMotivoAvaliacao, text);
          break;
        case "historicoClinico":
          appendText(setHistoricoClinico, text);
          break;
        case "achadosClinicos":
          appendText(setAchadosClinicos, text);
          break;
        case "diagnosticoFuncional":
          appendText(setDiagnosticoFuncional, text);
          break;
        case "objetivosCurtoPrazo":
          appendText(setObjetivosCurtoPrazo, text);
          break;
        case "objetivosMedioPrazo":
          appendText(setObjetivosMedioPrazo, text);
          break;
        case "condutas":
          appendText(setCondutas, text);
          break;
        case "planoTratamentoIA":
          appendText(setPlanoTratamentoIA, text);
          break;
        case "conclusao":
          appendText(setConclusao, text);
          break;
        case "criteriosAlta":
          appendText(setCriteriosAlta, text);
          break;
        case "observacoes":
          appendText(setObservacoes, text);
          break;
        case "rascunhoProfissional":
          appendText(setRascunhoProfissional, text);
          break;
        default:
          break;
      }
    },
    onError: (message) => {
      showToast({ type: "error", message });
      setActiveField(null);
    },
  });

  const getMicIcon = (field: string) =>
    isRecording && activeField === field ? "mic-off-outline" : "mic-outline";

  const toggleVoice = async (field: string) => {
    if (!VOICE_ENABLED) return;
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
          : "Não foi possível iniciar o reconhecimento de voz.";
      showToast({ type: "error", message });
      setActiveField(null);
    }
  };

  const shouldAutoFill = useMemo(() => {
    return (
      !motivoAvaliacao.trim() &&
      !historicoClinico.trim() &&
      !achadosClinicos.trim() &&
      !diagnosticoFuncional.trim() &&
      !conclusao.trim() &&
      !condutas.trim() &&
      !planoTratamentoIA.trim() &&
      !objetivosCurtoPrazo.trim() &&
      !objetivosMedioPrazo.trim()
    );
  }, [
    motivoAvaliacao,
    historicoClinico,
    achadosClinicos,
    diagnosticoFuncional,
    conclusao,
    condutas,
    planoTratamentoIA,
    objetivosCurtoPrazo,
    objetivosMedioPrazo,
  ]);

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

  const generateAutomaticSuggestion = async () => {
    if (generatingAi) return;
    setGeneratingAi(true);
    autoSuggestionAttemptedRef.current = true;
    try {
      const data = await getLaudoAiSuggestion(pacienteId);
      if (data) {
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
          stage: "LAUDO",
          suggestionType: "LAUDO_DRAFT",
          confidence,
          reason:
            data.reason ||
            (data.source === "ai"
              ? "Sugestão gerada por IA com base em anamnese e exames."
              : "Sugestão gerada por regras clínicas (fallback)."),
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
        if (!motivoAvaliacao.trim() && data.motivoAvaliacao) {
          setMotivoAvaliacao(data.motivoAvaliacao);
        }
        if (!historicoClinico.trim() && data.historicoClinico) {
          setHistoricoClinico(data.historicoClinico);
        }
        if (!achadosClinicos.trim() && data.achadosClinicos) {
          setAchadosClinicos(data.achadosClinicos);
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
        if (!conclusao.trim() && data.conclusao) {
          setConclusao(data.conclusao);
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
    motivoAvaliacao?: string;
    historicoClinico?: string;
    achadosClinicos?: string;
    diagnosticoFuncional?: string;
    objetivosCurtoPrazo?: string;
    objetivosMedioPrazo?: string;
    frequenciaSemanal?: string | number;
    duracaoSemanas?: string | number;
    conclusao?: string;
    condutas?: string;
    exameFisico?: string;
    planoTratamentoIA?: string;
    rascunhoProfissional?: string;
    observacoes?: string;
    criteriosAlta?: string;
  }) =>
    JSON.stringify({
      motivoAvaliacao: String(source.motivoAvaliacao || "").trim(),
      historicoClinico: String(source.historicoClinico || "").trim(),
      achadosClinicos: String(source.achadosClinicos || "").trim(),
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
      conclusao: String(source.conclusao || "").trim(),
      condutas: String(source.condutas || "").trim(),
      exameFisico: String(source.exameFisico || "").trim(),
      planoTratamentoIA: String(source.planoTratamentoIA || "").trim(),
      rascunhoProfissional: String(source.rascunhoProfissional || "").trim(),
      observacoes: String(source.observacoes || "").trim(),
      criteriosAlta: String(source.criteriosAlta || "").trim(),
    });

  const getSnapshot = () =>
    buildSnapshot({
      motivoAvaliacao,
      historicoClinico,
      achadosClinicos,
      diagnosticoFuncional,
      objetivosCurtoPrazo,
      objetivosMedioPrazo,
      frequenciaSemanal,
      duracaoSemanas,
      conclusao,
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
  const isValidatedWithoutPendingChanges =
    isValidated && !hasCriticalChangesAfterValidation;
  const hasConfirmedRequiredAiReview =
    !AI_REVIEW_REQUIRED || !aiSuggestionMeta || aiSuggestionConfirmed;
  const validationChecklistChecked =
    isValidatedWithoutPendingChanges ||
    (professionalValidationConfirmed && hasConfirmedRequiredAiReview);
  const canToggleValidationChecklist = !isValidatedWithoutPendingChanges;
  const hasReviewedLaudo =
    isValidated ||
    (initialSnapshot
      ? lastSavedSnapshot !== initialSnapshot
      : !!lastSavedSnapshot);
  const hasConfirmedAiReview =
    !AI_REVIEW_REQUIRED || !aiSuggestionMeta || aiSuggestionConfirmed;
  const isAutosaving = autosaveStatus === "saving";
  const canGenerateLaudo =
    !!laudoId &&
    !hasUnsavedChanges &&
    !isAutosaving &&
    hasReviewedLaudo &&
    hasConfirmedAiReview &&
    isValidatedWithoutPendingChanges;
  const pdfGateMessage =
    !laudoId || hasUnsavedChanges || isAutosaving
      ? t("clinical.messages.waitAutosaveBeforeGeneratePdf")
      : !hasConfirmedAiReview
        ? t("clinical.messages.confirmAiReviewBeforePdf")
        : !hasReviewedLaudo
          ? t("clinical.messages.reviewReportBeforePdf")
          : !isValidatedWithoutPendingChanges
            ? t("clinical.messages.reviewReportBeforePdf")
          : "";
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
      setMotivoAvaliacao(laudo.motivoAvaliacao || "");
      setHistoricoClinico(laudo.historicoClinico || "");
      setAchadosClinicos(laudo.achadosClinicos || "");
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
      setConclusao(laudo.conclusao || "");
      setCondutas(laudo.condutas || "");
      setExameFisico(laudo.exameFisico || "");
      setPlanoTratamentoIA(laudo.planoTratamentoIA || "");
      setRascunhoProfissional(laudo.rascunhoProfissional || "");
      setObservacoes(laudo.observacoes || "");
      setCriteriosAlta(laudo.criteriosAlta || "");
      setLaudoStatus(laudo.status || LaudoStatus.RASCUNHO_IA);
      setProfessionalValidationConfirmed(
        laudo.status === LaudoStatus.VALIDADO_PROFISSIONAL,
      );
      setValidadoEm(laudo.validadoEm || "");
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
        setAiSuggestionConfirmed(
          !AI_REVIEW_REQUIRED ||
            laudo.status === LaudoStatus.VALIDADO_PROFISSIONAL,
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

  const hasValidOptionalNumber = (value: string, min: number, max: number) => {
    if (!value.trim()) return true;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= min && numeric <= max;
  };

  const canAutosaveDraft = () =>
    hasAnamnese &&
    !generatingAi &&
    !!motivoAvaliacao.trim() &&
    !!achadosClinicos.trim() &&
    !!conclusao.trim() &&
    hasValidOptionalNumber(frequenciaSemanal, 1, 7) &&
    hasValidOptionalNumber(duracaoSemanas, 1, 52);

  const buildDraftPayload = (): LaudoDraftPayload => ({
    pacienteId,
    motivoAvaliacao: motivoAvaliacao.trim(),
    historicoClinico: historicoClinico.trim() || undefined,
    achadosClinicos: achadosClinicos.trim(),
    diagnosticoFuncional: diagnosticoFuncional.trim() || undefined,
    objetivosCurtoPrazo: objetivosCurtoPrazo.trim() || undefined,
    objetivosMedioPrazo: objetivosMedioPrazo.trim() || undefined,
    frequenciaSemanal: toOptionalNumber(frequenciaSemanal),
    duracaoSemanas: toOptionalNumber(duracaoSemanas),
    conclusao: conclusao.trim(),
    condutas: condutas.trim() || undefined,
    planoTratamentoIA: planoTratamentoIA.trim() || undefined,
    rascunhoProfissional: rascunhoProfissional.trim() || undefined,
    observacoes: observacoes.trim() || undefined,
    criteriosAlta: criteriosAlta.trim() || undefined,
    ...buildSuggestionMetaPayload(),
  });

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!motivoAvaliacao.trim()) {
      nextErrors.motivoAvaliacao = t(
        "clinical.validation.evaluationReasonRequired",
      );
    }
    if (!achadosClinicos.trim()) {
      nextErrors.achadosClinicos = t(
        "clinical.validation.clinicalFindingsRequired",
      );
    }
    if (!conclusao.trim()) {
      nextErrors.conclusao = t("clinical.validation.conclusionRequired");
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
    if (AI_REVIEW_REQUIRED && aiSuggestionMeta && !aiSuggestionConfirmed) {
      nextErrors.aiSuggestionConfirmation = t(
        "clinical.validation.aiSuggestionConfirmationRequired",
      );
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

  const persistLaudoDraft = async () => {
    const payload = buildDraftPayload();
    const snapshot = getSnapshot();
    const requiresRevalidation =
      isValidated && !!validatedSnapshot && validatedSnapshot !== snapshot;

    if (laudoId) {
      const { pacienteId: _pacienteId, ...updatePayload } = payload;
      const updated = await updateLaudo(laudoId, updatePayload);
      if (requiresRevalidation) {
        setLaudoStatus(LaudoStatus.RASCUNHO_IA);
        setProfessionalValidationConfirmed(false);
        setValidadoEm("");
        setValidatedSnapshot(null);
        await AsyncStorage.removeItem(getValidatedSnapshotKey(laudoId));
        await appendHistory(laudoId, "REVALIDACAO_PENDENTE");
        await trackEvent("laudo_revalidation_required", {
          laudoId,
          pacienteId,
          source: "autosave",
        });
        await recordAuditAction(
          "LAUDO_REVALIDATION_REQUIRED",
          {
            laudoId,
            pacienteId,
            source: "autosave",
          },
          usuario?.id,
        );
      } else {
        setLaudoStatus(updated.status || LaudoStatus.RASCUNHO_IA);
        setValidadoEm(updated.validadoEm || "");
      }
      setLastSavedSnapshot(snapshot);
      return { id: laudoId, snapshot };
    }

    const created = await createLaudo(payload);
    setLaudoId(created.id);
    setLaudoStatus(created.status || LaudoStatus.RASCUNHO_IA);
    setProfessionalValidationConfirmed(false);
    setValidadoEm(created.validadoEm || "");
    setLastSavedSnapshot(snapshot);
    return { id: created.id, snapshot };
  };

  const runAutosave = async () => {
    if (autosaveInFlightRef.current || !canAutosaveDraft()) return;
    const snapshotBeforeSave = getSnapshot();
    if (snapshotBeforeSave === lastSavedSnapshot) return;

    autosaveInFlightRef.current = true;
    setAutosaveStatus("saving");
    try {
      const saved = await persistLaudoDraft();
      if (!isMountedRef.current) return;
      const savedAt = new Date().toISOString();
      setLastAutosavedAt(savedAt);
      setAutosaveStatus("saved");
      await trackEvent("clinical_form_autosave_saved", {
        stage: "LAUDO",
        pacienteId,
        laudoId: saved.id,
        source: "LaudoFormScreen",
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

    if (!canAutosaveDraft()) {
      if (autosaveStatus === "pending" || autosaveStatus === "saving") {
        setAutosaveStatus("idle");
      }
      return;
    }

    const currentSnapshot = getSnapshot();
    if (currentSnapshot === lastSavedSnapshot) return;

    setAutosaveStatus("pending");
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave();
    }, LAUDO_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    motivoAvaliacao,
    historicoClinico,
    achadosClinicos,
    diagnosticoFuncional,
    objetivosCurtoPrazo,
    objetivosMedioPrazo,
    frequenciaSemanal,
    duracaoSemanas,
    conclusao,
    condutas,
    planoTratamentoIA,
    rascunhoProfissional,
    observacoes,
    criteriosAlta,
    aiSuggestionMeta,
    hasAnamnese,
    generatingAi,
    lastSavedSnapshot,
  ]);

  const performValidate = async () => {
    if (!validate()) {
      showToast({
        message: t("clinical.validation.reportBodyRequired"),
        type: "error",
      });
      return;
    }
    if (!laudoId) {
      showToast({
        message: t("clinical.messages.waitAutosaveBeforeValidation"),
        type: "error",
      });
      return;
    }
    if (hasUnsavedChanges || isAutosaving) {
      showToast({
        message: t("clinical.messages.waitAutosaveChangesBeforeValidation"),
        type: "info",
      });
      return;
    }
    if (isValidatedWithoutPendingChanges) {
      showToast({
        message: t("clinical.messages.reportAlreadyValidated"),
        type: "info",
      });
      return;
    }
    if (!validationChecklistChecked) {
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
      setProfessionalValidationConfirmed(true);
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

  const confirmAiSuggestionReview = () => {
    setAiSuggestionConfirmed(true);
    setErrors((prev) => ({ ...prev, aiSuggestionConfirmation: "" }));
    logClinicalAiSuggestion({
      stage: "LAUDO",
      suggestionType: "LAUDO_DRAFT_CONFIRMED",
      confidence: aiConfidence || "BAIXA",
      reason: "Sugestão de laudo revisada e confirmada por profissional.",
      evidenceFields: ["motivoAvaliacao", "achadosClinicos", "conclusao"],
      patientId: pacienteId,
    }).catch(() => undefined);
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
            setMotivoAvaliacao(template.motivoAvaliacao);
            setHistoricoClinico(template.historicoClinico);
            setAchadosClinicos(template.achadosClinicos);
            setDiagnosticoFuncional(template.diagnosticoFuncional);
            setObjetivosCurtoPrazo(template.objetivosCurtoPrazo);
            setObjetivosMedioPrazo(template.objetivosMedioPrazo);
            setFrequenciaSemanal(template.frequenciaSemanal);
            setDuracaoSemanas(template.duracaoSemanas);
            setConclusao(template.conclusao);
            setCondutas(template.condutas);
            setPlanoTratamentoIA(template.planoTratamentoIA);
            setCriteriosAlta(template.criteriosAlta);
            setErrors({});
          },
        },
      ],
    );
  };

  const openPdf = async () => {
    if (!canGenerateLaudo) {
      showToast({
        message:
          pdfGateMessage ||
          t("clinical.messages.waitAutosaveBeforeGeneratePdf"),
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
    const currentLaudoId = laudoId;
    if (!currentLaudoId) return;
    let webPopup: Window | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      webPopup = window.open("about:blank", "_blank");
    }

    setLoading(true);
    try {
      await openPdfUrl(currentLaudoId, webPopup);
    } catch (error: unknown) {
      if (webPopup && !webPopup.closed) {
        webPopup.close();
      }
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

  const openPdfUrl = async (id: string, webPopup?: Window | null) => {
    const endpoint = `/laudos/${id}/pdf-laudo`;
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
      pdfType: "laudo",
      consultedReferencesCount,
      totalSuggestedReferences,
      profile: referenceSuggestions?.profile ?? null,
    });
    await recordAuditAction(
      "LAUDO_PROFESSIONAL_PDF_OPENED",
      {
        pacienteId,
        laudoId: id,
        pdfType: "laudo",
        consultedReferencesCount,
        totalSuggestedReferences,
        profile: referenceSuggestions?.profile ?? null,
      },
      usuario?.id,
    );

    if (Platform.OS === "web") {
      const response = await api.get<Blob>(endpoint, {
        params,
        responseType: "blob",
        headers: { Authorization: authHeader },
      });
      openPdfBlobOnWeb(response.data, webPopup);
      return;
    }

    const absoluteUrl = resolveAbsoluteDownloadUrl(endpoint);
    const query = params?.consultedRefs
      ? `?consultedRefs=${encodeURIComponent(params.consultedRefs)}`
      : "";
    const localPathBase =
      FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!localPathBase) {
      throw new Error("no_local_storage_path");
    }
    const localUri = `${localPathBase}${Date.now()}-laudo.pdf`;
    await FileSystem.downloadAsync(`${absoluteUrl}${query}`, localUri, {
      headers: { Authorization: authHeader },
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle: t("clinical.actions.generateReportPdf"),
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
          <Text style={styles.errorText}>
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
          {t("clinical.messages.aiDraftReviewNotice")}
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
        {validadoEm ? (
          <Text style={styles.statusDate}>
            {t("clinical.messages.validatedAt")}{" "}
            {new Date(validadoEm).toLocaleString(dateLocale)}
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {VOICE_ENABLED && isRecording ? (
          <View style={styles.voiceBanner}>
            <Ionicons name="mic" size={14} color={COLORS.white} />
            <Text style={styles.voiceBannerText}>
              Gravando... {partial ? `"${partial}"` : ""}
            </Text>
          </View>
        ) : null}
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
                      dateLocale,
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
            {t("clinical.sections.reportBody")}
          </Text>
          <Text style={styles.templateHint}>
            {t("clinical.messages.reportBodyHint")}
          </Text>
          <Input
            label={t("clinical.labels.evaluationReason")}
            placeholder={t("clinical.placeholders.evaluationReason")}
            value={motivoAvaliacao}
            onChangeText={(text) => {
              setMotivoAvaliacao(text);
              if (errors.motivoAvaliacao) {
                setErrors((prev) => ({ ...prev, motivoAvaliacao: "" }));
              }
            }}
            error={errors.motivoAvaliacao}
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top" }}
            showCount
            maxLength={2500}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("motivoAvaliacao") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("motivoAvaliacao") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "motivoAvaliacao" && isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.clinicalHistory")}
            placeholder={t("clinical.placeholders.clinicalHistory")}
            value={historicoClinico}
            onChangeText={setHistoricoClinico}
            multiline
            numberOfLines={4}
            style={{ height: 120, textAlignVertical: "top" }}
            showCount
            maxLength={3500}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("historicoClinico") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("historicoClinico") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "historicoClinico" && isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.clinicalFindings")}
            placeholder={t("clinical.placeholders.clinicalFindings")}
            value={achadosClinicos}
            onChangeText={(text) => {
              setAchadosClinicos(text);
              if (errors.achadosClinicos) {
                setErrors((prev) => ({ ...prev, achadosClinicos: "" }));
              }
            }}
            error={errors.achadosClinicos}
            multiline
            numberOfLines={5}
            style={{ height: 140, textAlignVertical: "top" }}
            showCount
            maxLength={4500}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("achadosClinicos") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("achadosClinicos") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "achadosClinicos" && isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.functionalClinicalImpression")}
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
            style={{ height: 110, textAlignVertical: "top" }}
            showCount
            maxLength={2500}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("diagnosticoFuncional") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED
                ? () => toggleVoice("diagnosticoFuncional")
                : undefined
            }
            hint={
              VOICE_ENABLED &&
              activeField === "diagnosticoFuncional" &&
              isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.conclusion")}
            placeholder={t("clinical.placeholders.conclusion")}
            value={conclusao}
            onChangeText={(text) => {
              setConclusao(text);
              if (errors.conclusao) {
                setErrors((prev) => ({ ...prev, conclusao: "" }));
              }
            }}
            error={errors.conclusao}
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top" }}
            showCount
            maxLength={2500}
            rightIcon={VOICE_ENABLED ? getMicIcon("conclusao") : undefined}
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("conclusao") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "conclusao" && isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.conductRecommendations")}
            placeholder={t("clinical.placeholders.conductRecommendations")}
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
            style={{ height: 120, textAlignVertical: "top" }}
            showCount
            maxLength={5000}
            rightIcon={VOICE_ENABLED ? getMicIcon("condutas") : undefined}
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("condutas") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "condutas" && isRecording
                ? partial
                : undefined
            }
          />
          <Input
            label={t("clinical.labels.additionalNotes")}
            placeholder={t("clinical.placeholders.additionalNotes")}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            style={{ height: 90, textAlignVertical: "top" }}
            showCount
            maxLength={1500}
            rightIcon={VOICE_ENABLED ? getMicIcon("observacoes") : undefined}
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("observacoes") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "observacoes" && isRecording
                ? partial
                : undefined
            }
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
            rightIcon={
              VOICE_ENABLED ? getMicIcon("objetivosCurtoPrazo") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED
                ? () => toggleVoice("objetivosCurtoPrazo")
                : undefined
            }
            hint={
              VOICE_ENABLED &&
              activeField === "objetivosCurtoPrazo" &&
              isRecording
                ? partial
                : undefined
            }
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
            rightIcon={
              VOICE_ENABLED ? getMicIcon("objetivosMedioPrazo") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED
                ? () => toggleVoice("objetivosMedioPrazo")
                : undefined
            }
            hint={
              VOICE_ENABLED &&
              activeField === "objetivosMedioPrazo" &&
              isRecording
                ? partial
                : undefined
            }
          />
        </View>

        <View style={styles.section}>
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
            label={t("clinical.labels.aiTreatmentPlan")}
            placeholder={t("clinical.placeholders.phasedPlan")}
            value={planoTratamentoIA}
            onChangeText={setPlanoTratamentoIA}
            multiline
            numberOfLines={5}
            style={{ height: 120, textAlignVertical: "top" }}
            showCount
            maxLength={3000}
            rightIcon={
              VOICE_ENABLED ? getMicIcon("planoTratamentoIA") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("planoTratamentoIA") : undefined
            }
            hint={
              VOICE_ENABLED &&
              activeField === "planoTratamentoIA" &&
              isRecording
                ? partial
                : undefined
            }
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
            rightIcon={VOICE_ENABLED ? getMicIcon("criteriosAlta") : undefined}
            onRightIconPress={
              VOICE_ENABLED ? () => toggleVoice("criteriosAlta") : undefined
            }
            hint={
              VOICE_ENABLED && activeField === "criteriosAlta" && isRecording
                ? partial
                : undefined
            }
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
            rightIcon={
              VOICE_ENABLED ? getMicIcon("rascunhoProfissional") : undefined
            }
            onRightIconPress={
              VOICE_ENABLED
                ? () => toggleVoice("rascunhoProfissional")
                : undefined
            }
            hint={
              VOICE_ENABLED &&
              activeField === "rascunhoProfissional" &&
              isRecording
                ? partial
                : undefined
            }
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
                  {new Date(item.at).toLocaleString(dateLocale)}
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
                {t("clinical.messages.professionalValidationChecklistItem")}
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            title={
              isValidatedWithoutPendingChanges
                ? t("clinical.actions.reportValidated")
                : t("clinical.actions.validateAndApprove")
            }
            onPress={handleValidate}
            loading={loading}
            disabled={
              loading ||
              !laudoId ||
              hasUnsavedChanges ||
              isAutosaving ||
              isValidatedWithoutPendingChanges
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
                {pdfGateMessage}
              </Text>
            </View>
          ) : null}
          <Button
            title={t("clinical.actions.generateReportPdf")}
            onPress={openPdf}
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
  voiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + "12",
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  voiceBannerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
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
  autosaveStatusRow: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  autosaveStatusText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  autosaveStatusSaved: {
    color: COLORS.success,
  },
  autosaveStatusError: {
    color: COLORS.error,
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
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
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
  aiMetaChipInitial: {
    backgroundColor: COLORS.primary + "10",
    borderColor: COLORS.primary + "33",
    color: COLORS.primary,
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
