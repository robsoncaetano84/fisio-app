import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  AppState,
  Image,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, useToast } from "../../components/ui";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useLaudoStore } from "../../stores/laudoStore";
import {
  api,
  buildStructuredExameFromAnamnese,
  type ExameFisicoDorSuggestionResponse,
  type ClinicalOrchestratorNextActionResponse,
  enrichStructuredExameWithClinicalLogic,
  getExameFisicoDorSuggestion,
  getClinicalOrchestratorNextAction,
  logClinicalAiSuggestion,
  parseStructuredExame,
  recordAuditAction,
  renderStructuredExameToText,
  serializeStructuredExame,
  trackEvent,
  updateRedFlagAnswer,
} from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { parseJsonObject } from "../../utils/safeJson";
import {
  CLINICAL_REGION_LABELS,
  inferClinicalRegionsFromHints,
  mapClinicalChainCodeToLabel,
  resolveRelevantClinicalRegions,
} from "../../utils/clinicalRegionContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { RootStackParamList } from "../../types";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  DorClassificationSuggestion,
  ExameFisicoStructured,
  inferDorClassificationFromAnamnese,
  RedFlagKey,
  RegionalTestGroup,
  TestResult,
} from "../../services/physicalExamModel";
import { CONFIDENCE_RULES } from "../../services/physicalExamScoring";
import {
  buildHipomobilidadeSummary,
  getNestedStringValue,
  prettyEnum,
  prettyEvidenceField,
  resolveInputSuggestionPresentation,
  sanitizeExamForForm,
  setNestedStringValue,
  type HipomobilidadeSegmentarField,
} from "./ExameFisicoFormScreen.utils";
import {
  CADEIA_OPTIONS,
  CONFIANCA_OPTIONS,
  DOR_PRINCIPAL_OPTIONS,
  DOR_SUBTIPO_OPTIONS,
  EXAM_PRESETS,
  PRIORIDADE_OPTIONS,
  RED_FLAG_LABELS,
  SCORING_PROFILE_OPTIONS,
  TEST_RESULT_OPTIONS,
  TIPO_LESAO_OPTIONS,
  type ExamPreset,
} from "./ExameFisicoFormScreen.constants";
import {
  hasRelevantPosturalAdamsFinding,
  validatePosturalAssessment,
} from "./ExameFisicoFormScreen.postural";

type ExameFisicoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExameFisicoForm">;
  route: RouteProp<RootStackParamList, "ExameFisicoForm">;
};
type IconName = keyof typeof Ionicons.glyphMap;
type RegisteredExameFisicoResponse = {
  id: string;
  laudoId?: string | null;
  exameFisico?: string | null;
};

type EvidenceStrengthLabel = "Alta" | "Moderada" | "Baixa";

const POSTURAL_EXAM_IMAGES = {
  frontalMasculino: require("../../../assets/postural-exam/matriz-masculino-frontal.png"),
  frontalFeminino: require("../../../assets/postural-exam/matriz-feminino-frontal.png"),
  sagitalMasculino: require("../../../assets/postural-exam/matriz-masculino-perfil-esquerdo.png"),
  sagitalFeminino: require("../../../assets/postural-exam/matriz-feminino-perfil-esquerdo.png"),
  adamsMasculino: require("../../../assets/postural-exam/matriz-masculino-adams.png"),
  adamsFeminino: require("../../../assets/postural-exam/matriz-feminino-adams.png"),
};

type PosturalFrontalField = keyof ExameFisicoStructured["observacao"]["avaliacaoPostural"]["planoFrontalItens"];
type PosturalSagitalField = keyof ExameFisicoStructured["observacao"]["avaliacaoPostural"]["planoSagitalItens"];

const DEFAULT_POSTURAL_FRONTAL_ITEMS: ExameFisicoStructured["observacao"]["avaliacaoPostural"]["planoFrontalItens"] = {
  cabeca: "Nao avaliado",
  ombros: "Nao avaliado",
  escapulas: "Nao avaliado",
  pelve: "Nao avaliado",
  joelhos: "Nao avaliado",
  pes: "Nao avaliado",
};

const DEFAULT_POSTURAL_SAGITAL_ITEMS: ExameFisicoStructured["observacao"]["avaliacaoPostural"]["planoSagitalItens"] = {
  cabeca: "Nao avaliado",
  cifoseToracica: "Nao avaliado",
  lordoseLombar: "Nao avaliado",
  pelve: "Nao avaliado",
  joelhos: "Nao avaliado",
  apoioPlantar: "Nao avaliado",
};

const DEFAULT_POSTURAL_ADAMS: ExameFisicoStructured["observacao"]["avaliacaoPostural"]["adams"] = {
  resultado: "Nao avaliado",
  regiao: "Nao avaliado",
  intensidade: "Nao avaliado",
  atrGraus: "",
};

const POSTURAL_FRONTAL_OPTIONS = [
  "Nao avaliado",
  "Normal",
  "Direita mais alta/desviada",
  "Esquerda mais alta/desviada",
];

const POSTURAL_FRONTAL_ITEMS: Array<{
  field: PosturalFrontalField;
  label: string;
}> = [
  { field: "cabeca", label: "Cabeça" },
  { field: "ombros", label: "Ombros" },
  { field: "escapulas", label: "Escápulas" },
  { field: "pelve", label: "Pelve" },
  { field: "joelhos", label: "Joelhos" },
  { field: "pes", label: "Pés/apoio" },
];

const POSTURAL_SAGITAL_ITEMS: Array<{
  field: PosturalSagitalField;
  label: string;
  options: string[];
}> = [
  {
    field: "cabeca",
    label: "Cabeça",
    options: ["Nao avaliado", "Normal", "Anteriorizada", "Retraida"],
  },
  {
    field: "cifoseToracica",
    label: "Cifose torácica",
    options: ["Nao avaliado", "Normal", "Aumentada", "Reduzida"],
  },
  {
    field: "lordoseLombar",
    label: "Lordose lombar",
    options: ["Nao avaliado", "Normal", "Aumentada", "Reduzida"],
  },
  {
    field: "pelve",
    label: "Pelve",
    options: ["Nao avaliado", "Neutra", "Anteversao", "Retroversao"],
  },
  {
    field: "joelhos",
    label: "Joelhos",
    options: ["Nao avaliado", "Normal", "Hiperextensao", "Flexo"],
  },
  {
    field: "apoioPlantar",
    label: "Apoio plantar",
    options: ["Nao avaliado", "Normal", "Anteriorizado", "Posteriorizado"],
  },
];

const ADAMS_RESULT_OPTIONS = [
  "Nao avaliado",
  "Normal",
  "Assimetria a direita",
  "Assimetria a esquerda",
  "Inconclusivo",
];
const ADAMS_REGION_OPTIONS = [
  "Nao avaliado",
  "Toracica",
  "Lombar",
  "Toracolombar",
];
const POSTURAL_INTENSITY_OPTIONS = [
  "Nao avaliado",
  "Discreta",
  "Moderada",
  "Importante",
];

const getEvidenceStrengthLabel = (score: number): EvidenceStrengthLabel => {
  if (score >= CONFIDENCE_RULES.highScore) return "Alta";
  if (score >= CONFIDENCE_RULES.moderateScore) return "Moderada";
  return "Baixa";
};

const normalizeErrorMessage = (message: string) =>
  String(message || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeTestName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getRegionalTestDescription = (
  testName: string,
  regionTitle: string,
): string => {
  const name = normalizeTestName(testName);
  if (name.includes("sharp purser")) {
    return "Triagem de instabilidade atlantoaxial; use com cautela clínica.";
  }
  if (name.includes("dekleyn")) {
    return "Triagem vascular cervical antes de posições provocativas.";
  }
  if (
    name.includes("spurling") ||
    (name.includes("distra") && name.includes("cervical")) ||
    (name.includes("compress") && name.includes("cervical")) ||
    name.includes("jackson")
  ) {
    return "Provocação/alívio radicular cervical.";
  }
  if (name.includes("roos") || name.includes("adson")) {
    return "Triagem de desfiladeiro torácico.";
  }
  if (
    name.includes("expans") ||
    name.includes("mobilidade segmentar") ||
    (name.includes("rota") && name.includes("tor")) ||
    name.includes("inclinacao lateral") ||
    name.includes("inclina")
  ) {
    return "Mobilidade torácica e reprodução de sintomas.";
  }
  if (name.includes("schepelmann")) {
    return "Diferencia dor intercostal/pleural na inclinação lateral.";
  }
  if (name.includes("lasegue") || name.includes("slump")) {
    return "Triagem de tensão neural e irradiação.";
  }
  if (name.includes("schober")) return "Mobilidade lombar em flexão.";
  if (name.includes("kemp") || name.includes("extensao lombar")) {
    return "Provocação facetária/extensão lombar.";
  }
  if (name.includes("instabilidade lombar")) {
    return "Controle segmentar lombar sob carga.";
  }
  if (name.includes("elevacao bilateral") || name.includes("eleva")) {
    return "Força abdominal e controle lombo-pélvico.";
  }
  if (name.includes("faber") || name.includes("fadir")) {
    return "Provocação coxofemoral e sacroilíaca.";
  }
  if (
    name.includes("gaenslen") ||
    (name.includes("compress") && name.includes("pelv")) ||
    (name.includes("distra") && name.includes("pelv")) ||
    name.includes("thigh thrust") ||
    name.includes("sacral thrust")
  ) {
    return "Provocação sacroilíaca; correlacione com testes em cluster.";
  }
  if (name.includes("thomas") || name.includes("ely")) {
    return "Flexibilidade de cadeia anterior do quadril/coxa.";
  }
  if (name.includes("ober")) {
    return "Flexibilidade do trato iliotibial e controle lateral do quadril.";
  }
  if (name.includes("trendelenburg")) {
    return "Controle abdutor do quadril e estabilidade pélvica.";
  }
  if (name.includes("log roll")) {
    return "Irritabilidade intra-articular coxofemoral.";
  }
  if (name.includes("lachman") || name.includes("gaveta")) {
    return "Estabilidade ligamentar.";
  }
  if (name.includes("pivot shift")) {
    return "Instabilidade rotatória do joelho.";
  }
  if (name.includes("mcmurray") || name.includes("apley")) {
    return "Triagem meniscal/articular.";
  }
  if (name.includes("estresse em valgo") || name.includes("estresse em varo")) {
    return "Estabilidade colateral sob estresse.";
  }
  if (name.includes("clarke")) {
    return "Provocação patelofemoral.";
  }
  if (
    name.includes("gaveta anterior do tornozelo") ||
    name.includes("inclinacao talar") ||
    (name.includes("inclina") && name.includes("talar")) ||
    name.includes("kleiger") ||
    (name.includes("compress") && name.includes("fib"))
  ) {
    return "Estabilidade ligamentar/sindesmose do tornozelo.";
  }
  if (name.includes("thompson")) {
    return "Integridade do tendão de Aquiles.";
  }
  if (name.includes("windlass") || name.includes("navicular drop")) {
    return "Arco plantar, fáscia plantar e controle do pé.";
  }
  if (name.includes("neer") || name.includes("hawkins")) {
    return "Provocação subacromial/ombro.";
  }
  if (
    name.includes("jobe") ||
    name.includes("drop arm") ||
    name.includes("lift-off") ||
    name.includes("belly press")
  ) {
    return "Função do manguito rotador.";
  }
  if (name.includes("speed") || name.includes("yergason")) {
    return "Provocação do tendão da cabeça longa do bíceps.";
  }
  if (name.includes("apprehension") || name.includes("relocation")) {
    return "Instabilidade anterior do ombro.";
  }
  if (name.includes("cozen") || name.includes("mill")) {
    return "Provocação de epicondilalgia lateral.";
  }
  if (name.includes("golfer")) {
    return "Provocação de epicondilalgia medial.";
  }
  if (name.includes("phalen") || name.includes("tinel")) {
    return "Triagem neural periférica.";
  }
  if (name.includes("finkelstein")) {
    return "Provocação de tenossinovite de De Quervain.";
  }
  if (name.includes("compressao do carpo")) {
    return "Triagem compressiva do túnel do carpo.";
  }
  if (name.includes("watson")) {
    return "Estabilidade escafolunar.";
  }
  return `Use se houver hipótese ou sintoma em ${regionTitle.toLowerCase()}.`;
};

export function ExameFisicoFormScreen({
  route,
  navigation,
}: ExameFisicoFormScreenProps) {
  const { t, language } = useLanguage();
  const AI_REVIEW_REQUIRED = FEATURE_FLAGS.requireAiSuggestionConfirmation;
  const VOICE_ENABLED = FEATURE_FLAGS.speechToText;
  const { pacienteId } = route.params;
  const { showToast } = useToast();
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const { fetchLaudoByPaciente } = useLaudoStore();

  const paciente = getPacienteById(pacienteId);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [exam, setExam] = useState<ExameFisicoStructured | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [recordedExamLocked, setRecordedExamLocked] = useState(false);
  const [persistedExamText, setPersistedExamText] = useState<string | null>(
    null,
  );
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [orchestratorNextAction, setOrchestratorNextAction] =
    useState<ClinicalOrchestratorNextActionResponse | null>(null);
  const [serverDorSuggestion, setServerDorSuggestion] =
    useState<ExameFisicoDorSuggestionResponse | null>(null);
  const [classificationConfirmed, setClassificationConfirmed] = useState(true);
  const [professionalValidationConfirmed, setProfessionalValidationConfirmed] =
    useState(false);
  const [validatedExamSnapshot, setValidatedExamSnapshot] = useState<
    string | null
  >(null);
  const [examValidatedAt, setExamValidatedAt] = useState<string | null>(null);
  const lastAutoDorSuggestionKeyRef = useRef<string | null>(null);
  const didSaveRef = useRef(false);
  const stageOpenedAtRef = useRef<number>(Date.now());

  const draftKey = `draft:exame-fisico-structured:${pacienteId}`;
  const validatedExamSnapshotKey = `exame-fisico:validated-snapshot:v1:${pacienteId}`;
  const hasAnamnese = anamneses.some((item) => item.pacienteId === pacienteId);
  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const getLatestAnamnese = useMemo(
    () => () => {
      const anamneseList = useAnamneseStore
        .getState()
        .anamneses.filter((item) => item.pacienteId === pacienteId);
      if (!anamneseList.length) return undefined;
      return [...anamneseList].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    },
    [pacienteId],
  );
  const latestAnamnese = useMemo(
    () => getLatestAnamnese(),
    [getLatestAnamnese, anamneses],
  );
  const dorSuggestion: DorClassificationSuggestion = useMemo(
    () => inferDorClassificationFromAnamnese(latestAnamnese),
    [latestAnamnese],
  );
  const effectiveDorSuggestion = useMemo(
    () =>
      serverDorSuggestion
        ? {
            principal: serverDorSuggestion.dorPrincipal,
            subtipo: serverDorSuggestion.dorSubtipo,
            confidence: serverDorSuggestion.confidence,
            reason: serverDorSuggestion.reason,
            evidenceFields: serverDorSuggestion.evidenceFields || [],
            protocolVersion: serverDorSuggestion.protocolVersion || null,
            protocolName: serverDorSuggestion.protocolName || null,
          }
        : {
            ...dorSuggestion,
            protocolVersion: null,
            protocolName: null,
          },
    [dorSuggestion, serverDorSuggestion],
  );
  const dorSuggestionBaseLabel = useMemo(() => {
    if (effectiveDorSuggestion.confidence === "ALTA") return "robusta";
    if (effectiveDorSuggestion.confidence === "MODERADA") return "parcial";
    return "inicial";
  }, [effectiveDorSuggestion.confidence]);

  const appendFieldValue = (currentValue: string, incomingText: string) => {
    const left = String(currentValue || "").trim();
    const right = String(incomingText || "").trim();
    if (!left) return right;
    if (!right) return left;
    return `${left} ${right}`.trim();
  };

  useEffect(() => {
    if (!exam) return;
    if (!effectiveDorSuggestion.principal || !effectiveDorSuggestion.subtipo)
      return;
    const hasCurrentClassification = !!exam.dorPrincipal || !!exam.dorSubtipo;
    const canApplyAutomaticSuggestion =
      !hasCurrentClassification || exam.source === "rule-based";
    if (!canApplyAutomaticSuggestion) return;

    const suggestionKey = [
      effectiveDorSuggestion.principal,
      effectiveDorSuggestion.subtipo,
      effectiveDorSuggestion.confidence,
      effectiveDorSuggestion.protocolVersion || "",
    ].join(":");
    const isSameSuggestion =
      exam.source === "rule-based" &&
      exam.dorPrincipal === effectiveDorSuggestion.principal &&
      exam.dorSubtipo === effectiveDorSuggestion.subtipo;
    if (isSameSuggestion && lastAutoDorSuggestionKeyRef.current === suggestionKey)
      return;

    lastAutoDorSuggestionKeyRef.current = suggestionKey;
    setExam((prev) =>
      prev
        ? {
            ...prev,
            source: "rule-based",
            dorPrincipal: effectiveDorSuggestion.principal,
            dorSubtipo: effectiveDorSuggestion.subtipo,
          }
        : prev,
    );
    setClassificationConfirmed(!AI_REVIEW_REQUIRED);
    setErrors((prev) => ({ ...prev, classificationConfirmation: "" }));

    logClinicalAiSuggestion({
      stage: "EXAME_FISICO",
      suggestionType: "DOR_CLASSIFICATION_AUTO",
      confidence: effectiveDorSuggestion.confidence,
      reason: `${effectiveDorSuggestion.reason} (aplicação automática inicial)`,
      evidenceFields: effectiveDorSuggestion.evidenceFields,
      patientId: pacienteId,
    }).catch(() => undefined);
  }, [
    AI_REVIEW_REQUIRED,
    effectiveDorSuggestion,
    exam,
    pacienteId,
  ]);

  const orchestratorFocusedRegions = useMemo(() => {
    const hints = [
      ...(orchestratorNextAction?.context?.regioesPrioritarias || []),
      ...(orchestratorNextAction?.context?.regioesRelacionadas || []),
    ];
    return inferClinicalRegionsFromHints(hints);
  }, [orchestratorNextAction]);
  const relevantRegions = useMemo(() => {
    const fromAnamnese = resolveRelevantClinicalRegions(latestAnamnese);
    return Array.from(
      new Set([...orchestratorFocusedRegions, ...fromAnamnese]),
    );
  }, [latestAnamnese, orchestratorFocusedRegions]);
  const relevantRegionSet = useMemo(
    () => new Set(relevantRegions),
    [relevantRegions],
  );
  const cadeiaProvavel = useMemo(() => {
    return mapClinicalChainCodeToLabel(
      orchestratorNextAction?.context?.cadeiaProvavel,
    );
  }, [orchestratorNextAction]);
  const visibleRegionalGroups = useMemo(() => {
    if (!exam) return [];
    if (showAllRegions || !relevantRegionSet.size) return exam.avaliacaoRegioes;
    return exam.avaliacaoRegioes.filter((group) =>
      relevantRegionSet.has(group.regiao),
    );
  }, [exam, relevantRegionSet, showAllRegions]);
  const regionalProgress = useMemo(() => {
    if (!visibleRegionalGroups.length)
      return { tested: 0, total: 0, pending: 0 };
    const total = visibleRegionalGroups.reduce(
      (acc, group) => acc + group.testes.length,
      0,
    );
    const tested = visibleRegionalGroups.reduce(
      (acc, group) =>
        acc +
        group.testes.filter((test) => test.resultado !== "NAO_TESTADO").length,
      0,
    );
    return { tested, total, pending: Math.max(total - tested, 0) };
  }, [visibleRegionalGroups]);
  const currentExamSnapshot = exam ? serializeStructuredExame(exam) : "";
  const hasConfirmedRequiredClassification =
    !AI_REVIEW_REQUIRED || exam?.source !== "rule-based" || classificationConfirmed;
  const isExamValidatedWithoutPendingChanges =
    !!validatedExamSnapshot && validatedExamSnapshot === currentExamSnapshot;
  const hasExamChangesAfterValidation =
    !!validatedExamSnapshot && validatedExamSnapshot !== currentExamSnapshot;
  const validationChecklistChecked =
    isExamValidatedWithoutPendingChanges ||
    (professionalValidationConfirmed && hasConfirmedRequiredClassification);
  const canToggleValidationChecklist =
    !recordedExamLocked && !isExamValidatedWithoutPendingChanges;
  const canSavePhysicalExam =
    recordedExamLocked || isExamValidatedWithoutPendingChanges;

  const generateSuggestion = async (force = false) => {
    if (generating) return;
    setGenerating(true);
    try {
      await fetchAnamnesesByPaciente(pacienteId);
      const latest = getLatestAnamnese();
      const next = enrichStructuredExameWithClinicalLogic(
        buildStructuredExameFromAnamnese(latest),
        latest,
        { overwrite: true },
      );
      setExam((prev) => (force || !prev ? sanitizeExamForForm(next) : prev));
      setErrors({});
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      let loadedExam: ExameFisicoStructured | null = null;
      let hasPersistedExam = false;
      if (!paciente) {
        await fetchPacientes(true).catch(() => undefined);
      }
      await fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
      const latestAnamnese = getLatestAnamnese();

      const laudo = await fetchLaudoByPaciente(pacienteId, false).catch(
        () => null,
      );
      const registeredExam = await api
        .get<RegisteredExameFisicoResponse | null>("/laudos/exame-fisico", {
          params: { pacienteId },
        })
        .then((response) => response.data || null)
        .catch(() => null);
      if (!active) return;

      if (laudo?.id || registeredExam?.laudoId) {
        setLaudoId(registeredExam?.laudoId || laudo?.id || null);
      }

      const persistedExamTextValue = String(
        registeredExam?.exameFisico || laudo?.exameFisico || "",
      ).trim();
      hasPersistedExam =
        !!registeredExam?.id || !!persistedExamTextValue;
      setRecordedExamLocked(hasPersistedExam);
      let persistedExamPreviewText = hasPersistedExam
        ? persistedExamTextValue
        : null;

      if (hasPersistedExam) {
        const structured = parseStructuredExame(persistedExamTextValue);
        if (structured) {
          loadedExam = enrichStructuredExameWithClinicalLogic(
            structured,
            latestAnamnese,
            {
              overwrite: false,
            },
          );
          const sanitizedExam = sanitizeExamForForm(loadedExam);
          persistedExamPreviewText = renderStructuredExameToText(sanitizedExam);
          setExam(sanitizedExam);
        } else {
          loadedExam = enrichStructuredExameWithClinicalLogic(
            buildStructuredExameFromAnamnese(latestAnamnese),
            latestAnamnese,
            {
              overwrite: false,
            },
          );
          setExam(sanitizeExamForForm(loadedExam));
        }
      }
      setPersistedExamText(persistedExamPreviewText);

      try {
        const rawDraft = await AsyncStorage.getItem(draftKey);
        if (rawDraft && !hasPersistedExam) {
          const parsed = parseJsonObject<{
            exam?: ExameFisicoStructured;
            lastEditedAt?: string;
          }>(rawDraft);
          if (!loadedExam && parsed?.exam) {
            loadedExam = enrichStructuredExameWithClinicalLogic(
              parsed.exam,
              latestAnamnese,
              {
                overwrite: false,
              },
            );
            setExam(sanitizeExamForForm(loadedExam));
          }
          if (parsed?.lastEditedAt) setLastDraftSavedAt(parsed.lastEditedAt);
        }
      } catch {
        // ignore draft parse
      } finally {
        setDraftLoaded(true);
      }

      if (active && loadedExam) {
        const loadedSnapshot = serializeStructuredExame(
          sanitizeExamForForm(loadedExam),
        );
        const validatedRaw = await AsyncStorage.getItem(
          validatedExamSnapshotKey,
        ).catch(() => null);
        if (validatedRaw) {
          try {
            const parsed = parseJsonObject<{
              snapshot?: string;
              validatedAt?: string;
            }>(validatedRaw);
            if (parsed?.snapshot) {
              setValidatedExamSnapshot(parsed.snapshot);
              setExamValidatedAt(parsed.validatedAt || null);
              setProfessionalValidationConfirmed(
                parsed.snapshot === loadedSnapshot,
              );
            }
          } catch {
            // ignore invalid local validation snapshot
          }
        }
      }

      if (!loadedExam && !hasPersistedExam) {
        await generateSuggestion(true);
      }
      if (active) {
        setBootstrapping(false);
      }
    };

    load()
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setBootstrapping(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    draftKey,
    fetchLaudoByPaciente,
    fetchPacientes,
    fetchAnamnesesByPaciente,
    getLatestAnamnese,
    paciente,
    pacienteId,
    validatedExamSnapshotKey,
  ]);

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
    getExameFisicoDorSuggestion(pacienteId)
      .then((response) => {
        if (!active) return;
        setServerDorSuggestion(response);
      })
      .catch(() => {
        if (!active) return;
        setServerDorSuggestion(null);
      });
    return () => {
      active = false;
    };
  }, [pacienteId, latestAnamnese?.id]);

  useEffect(() => {
    if (!draftLoaded || !exam || recordedExamLocked) return;
    const persistDraft = (reason: string) => {
      const payload = {
        exam,
        lastEditedAt: new Date().toISOString(),
      };
      AsyncStorage.setItem(draftKey, JSON.stringify(payload))
        .then(() => {
          setLastDraftSavedAt(payload.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "EXAME_FISICO",
            pacienteId,
            isEditing: !!laudoId,
            reason,
          }).catch(() => undefined);
        })
        .catch(() => undefined);
    };

    const timer = setTimeout(() => {
      persistDraft("debounced");
    }, 800);
    return () => clearTimeout(timer);
  }, [draftLoaded, draftKey, exam, laudoId, pacienteId, recordedExamLocked]);

  useEffect(() => {
    if (!draftLoaded || !exam || recordedExamLocked) return;
    const persistDraftNow = (reason: string) => {
      const payload = {
        exam,
        lastEditedAt: new Date().toISOString(),
      };
      AsyncStorage.setItem(draftKey, JSON.stringify(payload))
        .then(() => {
          setLastDraftSavedAt(payload.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "EXAME_FISICO",
            pacienteId,
            isEditing: !!laudoId,
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
    draftKey,
    exam,
    laudoId,
    navigation,
    pacienteId,
    recordedExamLocked,
  ]);

  useEffect(() => {
    stageOpenedAtRef.current = Date.now();
    trackEvent("session_started", {
      stage: "EXAME_FISICO",
      pacienteId,
      source: "ExameFisicoFormScreen",
      isEditing: !!laudoId,
    }).catch(() => undefined);

    trackEvent("clinical_flow_stage_opened", {
      stage: "EXAME_FISICO",
      pacienteId,
      source: "ExameFisicoFormScreen",
    }).catch(() => undefined);

    return () => {
      if (didSaveRef.current) return;
      trackEvent("clinical_flow_stage_abandoned", {
        stage: "EXAME_FISICO",
        pacienteId,
        source: "ExameFisicoFormScreen",
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
    };
  }, [laudoId, pacienteId]);

  const setField = (path: string, value: string) => {
    if (!exam) return;
    setExam(setNestedStringValue(exam, path, value));
    if (path === "movimento.reproduzDor" && errors.movimentoReproduzDor) {
      setErrors((prev) => ({ ...prev, movimentoReproduzDor: "" }));
    }
    if (
      path === "cruzamentoFinal.hipotesePrincipal" &&
      errors.hipotesePrincipal
    ) {
      setErrors((prev) => ({ ...prev, hipotesePrincipal: "" }));
    }
    if (path === "cruzamentoFinal.condutaDirecionada" && errors.conduta) {
      setErrors((prev) => ({ ...prev, conduta: "" }));
    }
    if (path === "redFlags.referralDestination" && errors.referralDestination) {
      setErrors((prev) => ({ ...prev, referralDestination: "" }));
    }
    if (path === "redFlags.referralReason" && errors.referralReason) {
      setErrors((prev) => ({ ...prev, referralReason: "" }));
    }
    if (path.startsWith("observacao.avaliacaoPostural")) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.posturalAdamsRegion;
        delete next.posturalAdamsAtr;
        delete next.posturalAdamsDescription;
        return next;
      });
    }
  };

  const setHipomobilidadeSegmentarField = (
    field: HipomobilidadeSegmentarField,
    value: string,
  ) => {
    if (!exam) return;
    const hipomobilidadeSegmentar = {
      ...exam.palpacao.hipomobilidadeSegmentar,
      [field]: value,
    };
    setExam({
      ...exam,
      palpacao: {
        ...exam.palpacao,
        hipomobilidadeSegmentar,
        hipomobilidadeArticular: buildHipomobilidadeSummary(
          hipomobilidadeSegmentar,
        ),
      },
    });
  };

  const { isRecording, partial, start, stop } = useSpeechToText({
    enabled: VOICE_ENABLED,
    onResult: (text) => {
      if (!exam || !activeField) return;
      const currentValue = getNestedStringValue(exam, activeField);
      setField(activeField, appendFieldValue(String(currentValue || ""), text));
    },
    onError: (message) => {
      showToast({ type: "error", message });
      setActiveField(null);
    },
  });

  const getMicIcon = (field: string): IconName =>
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

  const getVoiceInputProps = (
    field: string,
  ): {
    rightIcon?: IconName;
    onRightIconPress?: () => void;
    hint?: string;
  } =>
    VOICE_ENABLED
      ? {
          rightIcon: getMicIcon(field),
          onRightIconPress: () => {
            void toggleVoice(field);
          },
          hint: activeField === field && isRecording ? partial : undefined,
        }
      : {};

  const toggleRedFlag = (key: RedFlagKey, positive: boolean) => {
    if (!exam) return;
    setExam(updateRedFlagAnswer(exam, key, positive));
    if (!positive) {
      setErrors((prev) => ({
        ...prev,
        referralDestination: "",
        referralReason: "",
      }));
    }
  };

  const setRegionalTestResult = (
    regiao: RegionalTestGroup["regiao"],
    testeNome: string,
    resultado: TestResult,
  ) => {
    if (!exam) return;
    const avaliacaoRegioes = exam.avaliacaoRegioes.map((grupo) => {
      if (grupo.regiao !== regiao) return grupo;
      return {
        ...grupo,
        testes: grupo.testes.map((teste) =>
          teste.nome === testeNome
            ? {
                ...teste,
                resultado,
                selecionado: teste.selecionado || resultado !== "NAO_TESTADO",
              }
            : teste,
        ),
      };
    });
    const latest = getLatestAnamnese();
    const nextExam = { ...exam, avaliacaoRegioes };
    if (resultado !== "NAO_TESTADO" && errors.avaliacaoRegioes) {
      setErrors((prev) => ({ ...prev, avaliacaoRegioes: "" }));
    }
    setExam(
      enrichStructuredExameWithClinicalLogic(nextExam, latest, {
        overwrite: false,
        recalculateDecision: true,
      }),
    );
  };

  const setRegionalTestSelected = (
    regiao: RegionalTestGroup["regiao"],
    testeNome: string,
    selected: boolean,
  ) => {
    if (!exam) return;
    const avaliacaoRegioes = exam.avaliacaoRegioes.map((grupo) => {
      if (grupo.regiao !== regiao) return grupo;
      return {
        ...grupo,
        testes: grupo.testes.map((teste) => {
          if (teste.nome !== testeNome) return teste;
          if (!selected && teste.resultado !== "NAO_TESTADO") {
            return { ...teste, selecionado: true };
          }
          return { ...teste, selecionado: selected };
        }),
      };
    });
    const latest = getLatestAnamnese();
    setExam(
      enrichStructuredExameWithClinicalLogic(
        { ...exam, avaliacaoRegioes },
        latest,
        { overwrite: false, recalculateDecision: true },
      ),
    );
  };

  const setRegionalAdm = (regiao: RegionalTestGroup["regiao"], adm: string) => {
    if (!exam) return;
    const avaliacaoRegioes = exam.avaliacaoRegioes.map((grupo) =>
      grupo.regiao === regiao ? { ...grupo, adm } : grupo,
    );
    const latest = getLatestAnamnese();
    setExam(
      enrichStructuredExameWithClinicalLogic(
        { ...exam, avaliacaoRegioes },
        latest,
        { overwrite: false, recalculateDecision: true },
      ),
    );
  };

  const applyRegionBasicPreset = (regiao: RegionalTestGroup["regiao"]) => {
    if (!exam) return;
    const avaliacaoRegioes = exam.avaliacaoRegioes.map((grupo) => {
      if (grupo.regiao !== regiao) return grupo;
      return {
        ...grupo,
        testes: grupo.testes.map((teste) => ({ ...teste, selecionado: true })),
      };
    });
    const latest = getLatestAnamnese();
    setExam(
      enrichStructuredExameWithClinicalLogic(
        { ...exam, avaliacaoRegioes },
        latest,
        { overwrite: false, recalculateDecision: true },
      ),
    );
  };

  const applyExamPreset = (preset: ExamPreset) => {
    if (!exam) return;
    const regions = new Set(preset.regions);
    const avaliacaoRegioes = exam.avaliacaoRegioes.map((grupo) => {
      if (!regions.has(grupo.regiao)) return grupo;
      return {
        ...grupo,
        testes: grupo.testes.map((teste) => ({ ...teste, selecionado: true })),
      };
    });
    const latest = getLatestAnamnese();
    setExam(
      enrichStructuredExameWithClinicalLogic(
        { ...exam, avaliacaoRegioes },
        latest,
        { overwrite: false, recalculateDecision: true },
      ),
    );
  };

  const validateForm = () => {
    if (!exam) return false;
    const nextErrors: Record<string, string> = {};

    if (!exam.movimento.reproduzDor.trim()) {
      nextErrors.movimentoReproduzDor = t(
        "clinical.validation.movementPainReproductionRequired",
      );
    }
    if (!exam.cruzamentoFinal.hipotesePrincipal.trim()) {
      nextErrors.hipotesePrincipal = t(
        "clinical.validation.primaryHypothesisRequired",
      );
    }
    if (!exam.cruzamentoFinal.condutaDirecionada.trim()) {
      nextErrors.conduta = t("clinical.validation.condutaDirectionRequired");
    }
    const hasAtLeastOneRegionalResult = exam.avaliacaoRegioes.some((grupo) =>
      grupo.testes.some((teste) => teste.resultado !== "NAO_TESTADO"),
    );
    if (!hasAtLeastOneRegionalResult) {
      nextErrors.avaliacaoRegioes = t(
        "clinical.validation.atLeastOneRegionalTestRequired",
      );
    }
    validatePosturalAssessment(exam.observacao.avaliacaoPostural).forEach(
      (issue) => {
        nextErrors[issue.field] = t(issue.messageKey);
      },
    );
    if (exam.redFlags.criticalTriggered) {
      if (!String(exam.redFlags.referralDestination || "").trim()) {
        nextErrors.referralDestination = t(
          "clinical.validation.referralDestinationRequired",
        );
      }
      if (!String(exam.redFlags.referralReason || "").trim()) {
        nextErrors.referralReason = t(
          "clinical.validation.referralReasonRequired",
        );
      }
    }
    if (
      AI_REVIEW_REQUIRED &&
      exam.source === "rule-based" &&
      !classificationConfirmed
    ) {
      nextErrors.classificationConfirmation =
        "Confirme a classificação sugerida por IA antes de salvar.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getValidationFields = (
    source: ExameFisicoStructured | null,
  ): string[] => {
    if (!source) return ["exam"];
    const fields: string[] = [];
    if (!source.movimento.reproduzDor.trim())
      fields.push("movimentoReproduzDor");
    if (!source.cruzamentoFinal.hipotesePrincipal.trim())
      fields.push("hipotesePrincipal");
    if (!source.cruzamentoFinal.condutaDirecionada.trim())
      fields.push("conduta");
    const hasAtLeastOneRegionalResult = source.avaliacaoRegioes.some((grupo) =>
      grupo.testes.some((teste) => teste.resultado !== "NAO_TESTADO"),
    );
    if (!hasAtLeastOneRegionalResult) fields.push("avaliacaoRegioes");
    validatePosturalAssessment(
      source.observacao.avaliacaoPostural,
    ).forEach((issue) => fields.push(issue.field));
    if (source.redFlags.criticalTriggered) {
      if (!String(source.redFlags.referralDestination || "").trim()) {
        fields.push("referralDestination");
      }
      if (!String(source.redFlags.referralReason || "").trim()) {
        fields.push("referralReason");
      }
    }
    if (
      AI_REVIEW_REQUIRED &&
      source.source === "rule-based" &&
      !classificationConfirmed
    ) {
      fields.push("classificationConfirmation");
    }
    return fields;
  };
  const validationFieldLabels: Record<string, string> = {
    movimentoReproduzDor: "Dor reproduzida no movimento",
    hipotesePrincipal: "Hipótese principal",
    conduta: "Direção de conduta",
    avaliacaoRegioes: "Ao menos um teste regional",
    posturalAdamsRegion: "Teste de Adams - região",
    posturalAdamsAtr: "Teste de Adams - ATR",
    posturalAdamsDescription: "Teste de Adams - descrição",
    referralDestination: "Destino de encaminhamento",
    referralReason: "Justificativa do encaminhamento",
    classificationConfirmation: "Classificação de dor",
  };
  const pendingValidationLabels = Object.keys(errors)
    .map((field) => validationFieldLabels[field])
    .filter(Boolean);

  const handleSave = async () => {
    if (recordedExamLocked) {
      showToast({
        type: "info",
        message: "Exame fisico registrado nao pode ser editado.",
      });
      navigation.goBack();
      return;
    }

    setHasAttemptedSave(true);
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", {
        stage: "EXAME_FISICO",
        reason: "MISSING_ANAMNESE",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: "Preencha a anamnese antes do exame físico.",
      });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!exam || !validateForm()) {
      const failedFields = getValidationFields(exam);
      trackEvent("clinical_flow_blocked", {
        stage: "EXAME_FISICO",
        reason: "MISSING_REQUIRED_FIELDS",
        pacienteId,
      }).catch(() => undefined);
      trackEvent("clinical_form_validation_error", {
        stage: "EXAME_FISICO",
        pacienteId,
        fields: failedFields,
      }).catch(() => undefined);
      showToast({
        type: "error",
        message: "Revise os campos obrigatórios para salvar.",
      });
      return;
    }
    if (!isExamValidatedWithoutPendingChanges) {
      trackEvent("clinical_flow_blocked", {
        stage: "EXAME_FISICO",
        reason: hasExamChangesAfterValidation
          ? "PENDING_PROFESSIONAL_REVALIDATION"
          : "PENDING_PROFESSIONAL_VALIDATION",
        pacienteId,
      }).catch(() => undefined);
      showToast({
        type: "info",
        message: hasExamChangesAfterValidation
          ? t("clinical.messages.physicalExamRevalidationPending")
          : t("clinical.messages.validatePhysicalExamBeforeSave"),
      });
      return;
    }

    setLoading(true);
    try {
      const effectiveExam: ExameFisicoStructured = exam.redFlags
        .criticalTriggered
        ? {
            ...exam,
            cruzamentoFinal: {
              ...exam.cruzamentoFinal,
              prioridade: "ENCAMINHAMENTO_IMEDIATO",
            },
          }
        : exam;

      const exameFisicoTexto = renderStructuredExameToText(effectiveExam).trim();
      const diagnostico =
        effectiveExam.diagnosticoFuncionalIa.disfuncaoPrincipal.trim() ||
        effectiveExam.cruzamentoFinal.hipotesePrincipal.trim() ||
        "Diagnóstico funcional em elaboração.";

      const condutaParts = [
        effectiveExam.cruzamentoFinal.condutaDirecionada,
        `Técnica manual: ${effectiveExam.condutaIa.tecnicaManualIndicada}`,
        `Ajuste articular: ${effectiveExam.condutaIa.ajusteArticular}`,
        `Exercício corretivo: ${effectiveExam.condutaIa.exercicioCorretivo}`,
        `Liberação miofascial: ${effectiveExam.condutaIa.liberacaoMiofascial}`,
        `Progressão esportiva: ${effectiveExam.condutaIa.progressaoEsportiva}`,
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join("\n");
      const condutas = condutaParts || "Conduta terapêutica em elaboração.";

      await api.post("/laudos/exame-fisico", {
        pacienteId,
        exameFisico: exameFisicoTexto,
        diagnosticoFuncional: diagnostico,
        condutas,
      });

      await AsyncStorage.removeItem(draftKey).catch(() => undefined);
      setLastDraftSavedAt(null);

      if (effectiveExam.redFlags.criticalTriggered) {
        showToast({
          type: "success",
          message:
            "Triagem crítica salva. Fluxo clínico deve seguir para encaminhamento imediato.",
        });
      } else {
        showToast({
          type: "success",
          message: "Exame físico salvo com sucesso.",
        });
      }
      trackEvent("session_completed", {
        stage: "EXAME_FISICO",
        pacienteId,
        source: "ExameFisicoFormScreen",
        isEditing: !!laudoId,
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
      if (
        effectiveDorSuggestion.principal &&
        effectiveDorSuggestion.subtipo &&
        effectiveExam.dorPrincipal &&
        effectiveExam.dorSubtipo &&
        (effectiveExam.dorPrincipal !== effectiveDorSuggestion.principal ||
          effectiveExam.dorSubtipo !== effectiveDorSuggestion.subtipo)
      ) {
        logClinicalAiSuggestion({
          stage: "EXAME_FISICO",
          suggestionType: "DOR_CLASSIFICATION_DISAGREED",
          confidence: effectiveDorSuggestion.confidence,
          reason: `Profissional divergiu da sugestao IA. Sugerido: ${prettyEnum(
            effectiveDorSuggestion.principal,
          )}/${prettyEnum(effectiveDorSuggestion.subtipo)}. Selecionado: ${prettyEnum(
            effectiveExam.dorPrincipal,
          )}/${prettyEnum(effectiveExam.dorSubtipo)}.`,
          evidenceFields: effectiveDorSuggestion.evidenceFields,
          patientId: pacienteId,
        }).catch(() => undefined);
      }
      didSaveRef.current = true;
      navigation.goBack();
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      if (
        normalizeErrorMessage(message).includes("exame fisico ja registrado")
      ) {
        setRecordedExamLocked(true);
        await AsyncStorage.removeItem(draftKey).catch(() => undefined);
        setLastDraftSavedAt(null);
        showToast({
          type: "info",
          message: "Exame físico já registrado. O registro inicial está bloqueado.",
        });
        navigation.goBack();
        setLoading(false);
        return;
      }

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          showToast({
            type: "error",
            message:
              status === 403
                ? "Sem permissão para editar este exame físico."
                : "Paciente ou laudo não encontrado.",
          });
          navigation.goBack();
          setLoading(false);
          return;
        }
      }
      showToast({
        type: "error",
        message: message || "Não foi possível salvar o exame físico.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmClassificationReview = (showSuccessToast = true) => {
    setClassificationConfirmed(true);
    setExam((prev) => (prev ? { ...prev, source: "manual" } : prev));
    setErrors((prev) => ({ ...prev, classificationConfirmation: "" }));
    logClinicalAiSuggestion({
      stage: "EXAME_FISICO",
      suggestionType: "DOR_CLASSIFICATION_CONFIRMED",
      confidence: effectiveDorSuggestion.confidence,
      reason: "Classificação sugerida revisada e confirmada por profissional.",
      evidenceFields: effectiveDorSuggestion.evidenceFields,
      patientId: pacienteId,
    }).catch(() => undefined);
    if (showSuccessToast) {
      showToast({
        type: "success",
        message: "Classificação confirmada pelo profissional.",
      });
    }
  };

  const handleConfirmClassification = () => {
    confirmClassificationReview(true);
  };

  const handleToggleProfessionalValidationChecklist = () => {
    if (!canToggleValidationChecklist) return;
    const nextChecked = !validationChecklistChecked;
    setProfessionalValidationConfirmed(nextChecked);
    if (nextChecked) {
      if (
        AI_REVIEW_REQUIRED &&
        exam?.source === "rule-based" &&
        !classificationConfirmed
      ) {
        confirmClassificationReview(false);
      }
      return;
    }
    if (AI_REVIEW_REQUIRED && exam?.source === "rule-based") {
      setClassificationConfirmed(false);
    }
  };

  const handleValidatePhysicalExam = async () => {
    setHasAttemptedSave(true);
    if (!hasAnamnese) {
      showToast({
        type: "error",
        message: "Preencha a anamnese antes do exame físico.",
      });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!exam || !validateForm()) {
      showToast({
        type: "error",
        message: t("clinical.messages.reviewHighlightedFields"),
      });
      return;
    }
    if (isExamValidatedWithoutPendingChanges) {
      showToast({
        type: "info",
        message: t("clinical.messages.physicalExamAlreadyValidated"),
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
      setValidatedExamSnapshot(currentExamSnapshot);
      setExamValidatedAt(validatedAt);
      setProfessionalValidationConfirmed(true);
      await AsyncStorage.setItem(
        validatedExamSnapshotKey,
        JSON.stringify({
          snapshot: currentExamSnapshot,
          validatedAt,
        }),
      );
      trackEvent("exame_fisico_validated", {
        pacienteId,
      }).catch(() => undefined);
      recordAuditAction("EXAME_FISICO_VALIDATED", {
        pacienteId,
        professionalValidationConfirmed: true,
      }).catch(() => undefined);
      showToast({
        type: "success",
        message: t("clinical.messages.physicalExamValidatedSuccessfully"),
      });
    } catch (error: unknown) {
      const { message } = parseApiError(error);
      showToast({
        type: "error",
        message: message || t("clinical.messages.physicalExamValidationError"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAttemptedSave || !exam) return;
    validateForm();
  }, [hasAttemptedSave, exam, classificationConfirmed]);

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Carregando exame físico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paciente || !exam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Paciente não encontrado.</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const redFlagCount = exam.redFlags.answers.filter(
    (item) => item.positive,
  ).length;
  const patientSex = String(paciente.sexo || "").toUpperCase();
  const isFemalePatient = patientSex === "FEMININO";
  const posturalFrontalImageSource = isFemalePatient
    ? POSTURAL_EXAM_IMAGES.frontalFeminino
    : POSTURAL_EXAM_IMAGES.frontalMasculino;
  const posturalSagitalImageSource = isFemalePatient
    ? POSTURAL_EXAM_IMAGES.sagitalFeminino
    : POSTURAL_EXAM_IMAGES.sagitalMasculino;
  const posturalAdamsImageSource = isFemalePatient
    ? POSTURAL_EXAM_IMAGES.adamsFeminino
    : POSTURAL_EXAM_IMAGES.adamsMasculino;
  const posturalPlanoFrontalInput = resolveInputSuggestionPresentation(
    "observacao.avaliacaoPostural.planoFrontal",
    "Achados no plano frontal",
    exam.observacao.avaliacaoPostural?.planoFrontal,
  );
  const posturalPlanoSagitalInput = resolveInputSuggestionPresentation(
    "observacao.avaliacaoPostural.planoSagital",
    "Achados no plano sagital",
    exam.observacao.avaliacaoPostural?.planoSagital,
  );
  const posturalAdamsInput = resolveInputSuggestionPresentation(
    "observacao.avaliacaoPostural.testeAdams",
    "Achados no Teste de Adams",
    exam.observacao.avaliacaoPostural?.testeAdams,
  );
  const avaliacaoPostural = exam.observacao.avaliacaoPostural;
  const planoFrontalItens = {
    ...DEFAULT_POSTURAL_FRONTAL_ITEMS,
    ...(avaliacaoPostural?.planoFrontalItens || {}),
  };
  const planoSagitalItens = {
    ...DEFAULT_POSTURAL_SAGITAL_ITEMS,
    ...(avaliacaoPostural?.planoSagitalItens || {}),
  };
  const adamsAssessment = {
    ...DEFAULT_POSTURAL_ADAMS,
    ...(avaliacaoPostural?.adams || {}),
  };
  const posturalAssessmentForValidation: ExameFisicoStructured["observacao"][
    "avaliacaoPostural"
  ] = {
    planoFrontal: avaliacaoPostural?.planoFrontal || "",
    planoSagital: avaliacaoPostural?.planoSagital || "",
    testeAdams: avaliacaoPostural?.testeAdams || "",
    planoFrontalItens,
    planoSagitalItens,
    adams: adamsAssessment,
  };
  const hasAdamsClinicalAlert = hasRelevantPosturalAdamsFinding(
    posturalAssessmentForValidation,
  );
  const hasPosturalValidationError =
    !!errors.posturalAdamsRegion ||
    !!errors.posturalAdamsAtr ||
    !!errors.posturalAdamsDescription;
  const renderPosturalOptions = (
    options: string[],
    selectedValue: string,
    fieldPath: string,
  ) => (
    <View style={styles.posturalOptionRow}>
      {options.map((option) => {
        const selected = selectedValue === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.posturalOptionChip,
              selected && styles.posturalOptionChipSelected,
            ]}
            onPress={() => setField(fieldPath, option)}
          >
            <Text
              style={[
                styles.posturalOptionText,
                selected && styles.posturalOptionTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  const observacaoPadraoInput = resolveInputSuggestionPresentation(
    "observacao.padraoMovimento",
    "Padrão de movimento",
    exam.observacao.padraoMovimento,
  );
  const movimentoAtivoInput = resolveInputSuggestionPresentation(
    "movimento.ativo",
    "Movimento ativo",
    exam.movimento.ativo,
  );
  const movimentoPassivoInput = resolveInputSuggestionPresentation(
    "movimento.passivo",
    "Movimento passivo",
    exam.movimento.passivo,
  );
  const movimentoResistidoInput = resolveInputSuggestionPresentation(
    "movimento.resistido",
    "Movimento resistido",
    exam.movimento.resistido,
  );
  const movimentoReproduzDorInput = resolveInputSuggestionPresentation(
    "movimento.reproduzDor",
    "Qual movimento reproduz a dor?",
    exam.movimento.reproduzDor,
  );
  const palpacaoPontosDolorososInput = resolveInputSuggestionPresentation(
    "palpacao.pontosDolorosos",
    "Pontos dolorosos",
    exam.palpacao.pontosDolorosos,
  );
  const palpacaoMuscularInput = resolveInputSuggestionPresentation(
    "palpacao.muscular",
    "Palpação muscular",
    exam.palpacao.muscular,
  );
  const palpacaoArticularInput = resolveInputSuggestionPresentation(
    "palpacao.articular",
    "Palpação articular",
    exam.palpacao.articular,
  );
  const palpacaoDinamicaInput = resolveInputSuggestionPresentation(
    "palpacao.dinamicaVertebral",
    "Palpação dinâmica vertebral",
    exam.palpacao.dinamicaVertebral,
  );
  const evidenceStrengthLabel = getEvidenceStrengthLabel(
    exam.cruzamentoFinal.scoreEvidencia,
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {VOICE_ENABLED && activeField && isRecording ? (
          <View style={styles.voiceBanner}>
            <Ionicons name="mic-outline" size={16} color={COLORS.primary} />
            <Text style={styles.voiceBannerText}>
              Gravando... {partial ? `"${partial}"` : ""}
            </Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.title}>Exame físico orientado por decisão</Text>
          <Text style={styles.subtitle}>
            Etapas: observação, movimento, palpação, testes funcionais,
            avaliação por regiões e cruzamento final.
          </Text>
          {lastDraftSavedAt ? (
            <Text style={styles.draftInfo}>
              Última edição:{" "}
              {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}
            </Text>
          ) : null}
        </View>

        {hasAttemptedSave && pendingValidationLabels.length > 0 ? (
          <View style={styles.validationSummary}>
            <Text style={styles.validationSummaryTitle}>Campos pendentes</Text>
            <Text style={styles.validationSummaryText}>
              {pendingValidationLabels.join(", ")}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.section,
            errors.classificationConfirmation && styles.sectionWithError,
          ]}
        >
          <Text style={styles.blockTitle}>Classificacao de dor</Text>
          <View style={styles.classificationStatusRow}>
            <View
              style={[
                styles.classificationStatusChip,
                exam.source === "rule-based"
                  ? styles.classificationStatusChipSuggested
                  : styles.classificationStatusChipConfirmed,
              ]}
            >
              <Text
                style={[
                  styles.classificationStatusChipText,
                  exam.source === "rule-based"
                    ? styles.classificationStatusChipTextSuggested
                    : styles.classificationStatusChipTextConfirmed,
                ]}
              >
                {exam.source === "rule-based"
                  ? "Sugerido por IA"
                  : "Confirmado pelo profissional"}
              </Text>
            </View>
            {AI_REVIEW_REQUIRED && exam.source === "rule-based" ? (
              <TouchableOpacity
                style={styles.classificationConfirmButton}
                onPress={handleConfirmClassification}
              >
                <Text style={styles.classificationConfirmButtonText}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.classificationSuggestionCard}>
            <View style={styles.classificationSuggestionHeader}>
              <Text style={styles.classificationSuggestionLabel}>
                Sugestão da anamnese
              </Text>
            </View>
            <Text style={styles.classificationSuggestionText}>
              {effectiveDorSuggestion.principal &&
              effectiveDorSuggestion.subtipo
                ? `${prettyEnum(effectiveDorSuggestion.principal)} / ${prettyEnum(effectiveDorSuggestion.subtipo)}`
                : "Sem inferência segura"}
            </Text>
            <Text style={styles.classificationConfidenceText}>
              Base da sugestão: {dorSuggestionBaseLabel}
            </Text>
            {effectiveDorSuggestion.confidence === "BAIXA" ? (
              <Text style={styles.classificationLowConfidenceText}>
                Base inicial: revise manualmente antes de confirmar.
              </Text>
            ) : null}
            {effectiveDorSuggestion.evidenceFields.length > 0 ? (
              <View style={styles.classificationEvidenceGroup}>
                <Text style={styles.classificationEvidenceLabel}>
                  Evidências
                </Text>
                <View style={styles.classificationEvidenceChips}>
                  {effectiveDorSuggestion.evidenceFields.map((field) => (
                    <View key={field} style={styles.classificationEvidenceChip}>
                      <Text style={styles.classificationEvidenceChipText}>
                        {prettyEvidenceField(field)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {effectiveDorSuggestion.protocolVersion ? (
              <Text style={styles.classificationEvidenceText}>
                Protocolo: {effectiveDorSuggestion.protocolName || "Ativo"} v
                {effectiveDorSuggestion.protocolVersion}
              </Text>
            ) : null}
          </View>
          <View style={styles.optionsRow}>
            {DOR_PRINCIPAL_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.dorPrincipal === item && styles.chipSelected,
                ]}
                onPress={() => {
                  setExam({ ...exam, source: "manual", dorPrincipal: item });
                  setClassificationConfirmed(true);
                  setErrors((prev) => ({
                    ...prev,
                    classificationConfirmation: "",
                  }));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.dorPrincipal === item && styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.optionsRow}>
            {DOR_SUBTIPO_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.dorSubtipo === item && styles.chipSelected,
                ]}
                onPress={() => {
                  setExam({ ...exam, source: "manual", dorSubtipo: item });
                  setClassificationConfirmed(true);
                  setErrors((prev) => ({
                    ...prev,
                    classificationConfirmation: "",
                  }));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.dorSubtipo === item && styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.section,
            (errors.referralDestination || errors.referralReason) &&
              styles.sectionWithError,
          ]}
        >
          <Text style={styles.blockTitle}>Triagem de sinais de alerta</Text>
          <Text style={styles.subtitle}>
            Bloco obrigatório. Se crítico, o fluxo clínico deve ser interrompido
            para encaminhamento.
          </Text>
          {exam.redFlags.answers.map((item) => (
            <View key={item.key} style={styles.flagRow}>
              <View style={styles.flagHeader}>
                <Text style={styles.flagName}>{RED_FLAG_LABELS[item.key]}</Text>
                <Text style={styles.flagQuestion}>{item.question}</Text>
              </View>
              <View style={styles.flagActions}>
                <TouchableOpacity
                  style={[
                    styles.flagButton,
                    !item.positive && styles.flagButtonActiveSafe,
                  ]}
                  onPress={() => toggleRedFlag(item.key, false)}
                >
                  <Text style={styles.flagButtonText}>Não</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.flagButton,
                    item.positive && styles.flagButtonActiveAlert,
                  ]}
                  onPress={() => toggleRedFlag(item.key, true)}
                >
                  <Text style={styles.flagButtonText}>Sim</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={styles.statusText}>
            Red flags positivas: {redFlagCount}
          </Text>
          {exam.redFlags.criticalTriggered ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>ALERTA CRÍTICO</Text>
              <Text style={styles.alertText}>
                Encaminhamento imediato é obrigatório antes de seguir com
                conduta terapêutica.
              </Text>
              <Input
                label="Destino de encaminhamento"
                value={exam.redFlags.referralDestination || ""}
                onChangeText={(value) =>
                  setExam({
                    ...exam,
                    redFlags: {
                      ...exam.redFlags,
                      referralDestination: value,
                      referralRequired: true,
                    },
                  })
                }
                placeholder="Ex.: Pronto atendimento / ortopedia"
                error={errors.referralDestination}
              />
              <Input
                label="Justificativa clínica"
                value={exam.redFlags.referralReason || ""}
                onChangeText={(value) =>
                  setExam({
                    ...exam,
                    redFlags: {
                      ...exam.redFlags,
                      referralReason: value,
                      referralRequired: true,
                    },
                  })
                }
                placeholder="Descreva sinais e motivo do encaminhamento"
                multiline
                numberOfLines={4}
                {...getVoiceInputProps("redFlags.referralReason")}
                error={errors.referralReason}
              />
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.section,
            (errors.movimentoReproduzDor || hasPosturalValidationError) &&
              styles.sectionWithError,
          ]}
        >
          <Text style={styles.blockTitle}>Observacao e movimento</Text>
          <View style={styles.posturalExamGrid}>
            <View style={styles.posturalExamCard}>
              <Text style={styles.posturalExamTitle}>
                Avaliação postural no plano frontal
              </Text>
              <View style={styles.posturalExamImageFrame}>
                <Image
                  source={posturalFrontalImageSource}
                  resizeMode="contain"
                  style={styles.posturalExamImage}
                />
              </View>
              <Text style={styles.posturalExamHint}>
                Observe alinhamento de cabeça, ombros, escápulas, pelve,
                joelhos, tornozelos e apoio dos pés.
              </Text>
              <View style={styles.posturalChecklist}>
                {POSTURAL_FRONTAL_ITEMS.map((item) => (
                  <View key={item.field} style={styles.posturalChecklistItem}>
                    <Text style={styles.posturalChecklistLabel}>
                      {item.label}
                    </Text>
                    {renderPosturalOptions(
                      POSTURAL_FRONTAL_OPTIONS,
                      planoFrontalItens[item.field],
                      `observacao.avaliacaoPostural.planoFrontalItens.${item.field}`,
                    )}
                  </View>
                ))}
              </View>
              <Input
                label={posturalPlanoFrontalInput.label}
                value={posturalPlanoFrontalInput.value}
                onChangeText={(v) =>
                  setField("observacao.avaliacaoPostural.planoFrontal", v)
                }
                multiline
                numberOfLines={3}
                style={{ minHeight: 86, textAlignVertical: "top" }}
                {...getVoiceInputProps(
                  "observacao.avaliacaoPostural.planoFrontal",
                )}
              />
            </View>

            <View style={styles.posturalExamCard}>
              <Text style={styles.posturalExamTitle}>
                Avaliação postural no plano sagital
              </Text>
              <View style={styles.posturalExamImageFrame}>
                <Image
                  source={posturalSagitalImageSource}
                  resizeMode="contain"
                  style={styles.posturalExamImage}
                />
              </View>
              <Text style={styles.posturalExamHint}>
                Observe anteriorização da cabeça, curvas da coluna, pelve,
                joelhos e distribuição do apoio.
              </Text>
              <View style={styles.posturalChecklist}>
                {POSTURAL_SAGITAL_ITEMS.map((item) => (
                  <View key={item.field} style={styles.posturalChecklistItem}>
                    <Text style={styles.posturalChecklistLabel}>
                      {item.label}
                    </Text>
                    {renderPosturalOptions(
                      item.options,
                      planoSagitalItens[item.field],
                      `observacao.avaliacaoPostural.planoSagitalItens.${item.field}`,
                    )}
                  </View>
                ))}
              </View>
              <Input
                label={posturalPlanoSagitalInput.label}
                value={posturalPlanoSagitalInput.value}
                onChangeText={(v) =>
                  setField("observacao.avaliacaoPostural.planoSagital", v)
                }
                multiline
                numberOfLines={3}
                style={{ minHeight: 86, textAlignVertical: "top" }}
                {...getVoiceInputProps(
                  "observacao.avaliacaoPostural.planoSagital",
                )}
              />
            </View>

            <View style={styles.posturalExamCard}>
              <Text style={styles.posturalExamTitle}>Teste de Adams</Text>
              <View style={styles.posturalExamImageFrame}>
                <Image
                  source={posturalAdamsImageSource}
                  resizeMode="contain"
                  style={styles.posturalExamImage}
                />
              </View>
              <Text style={styles.posturalExamHint}>
                Observe flexão anterior do tronco, giba costal/lombar,
                rotação vertebral e assimetria entre hemitórax.
              </Text>
              <View style={styles.posturalChecklist}>
                <View style={styles.posturalChecklistItem}>
                  <Text style={styles.posturalChecklistLabel}>Resultado</Text>
                  {renderPosturalOptions(
                    ADAMS_RESULT_OPTIONS,
                    adamsAssessment.resultado,
                    "observacao.avaliacaoPostural.adams.resultado",
                  )}
                </View>
                <View style={styles.posturalChecklistItem}>
                  <Text style={styles.posturalChecklistLabel}>Região</Text>
                  {renderPosturalOptions(
                    ADAMS_REGION_OPTIONS,
                    adamsAssessment.regiao,
                    "observacao.avaliacaoPostural.adams.regiao",
                  )}
                  {errors.posturalAdamsRegion ? (
                    <Text style={styles.posturalErrorText}>
                      {errors.posturalAdamsRegion}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.posturalChecklistItem}>
                  <Text style={styles.posturalChecklistLabel}>
                    Intensidade do desnível
                  </Text>
                  {renderPosturalOptions(
                    POSTURAL_INTENSITY_OPTIONS,
                    adamsAssessment.intensidade,
                    "observacao.avaliacaoPostural.adams.intensidade",
                  )}
                </View>
                <Input
                  label="ATR / escoliômetro (graus)"
                  value={adamsAssessment.atrGraus}
                  onChangeText={(v) =>
                    setField("observacao.avaliacaoPostural.adams.atrGraus", v)
                  }
                  keyboardType="numeric"
                  placeholder="Ex.: 4"
                  error={errors.posturalAdamsAtr}
                />
                {hasAdamsClinicalAlert ? (
                  <View style={styles.posturalAlertBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={COLORS.warning}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.posturalAlertTitle}>
                        Achado relevante no Adams
                      </Text>
                      <Text style={styles.posturalAlertText}>
                        Registrar lado, região e ATR. Se o achado for
                        consistente ou ATR ≥ 5°, considerar acompanhamento
                        clínico e avaliação complementar conforme contexto.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Input
                label={posturalAdamsInput.label}
                value={posturalAdamsInput.value}
                onChangeText={(v) =>
                  setField("observacao.avaliacaoPostural.testeAdams", v)
                }
                multiline
                numberOfLines={3}
                style={{ minHeight: 86, textAlignVertical: "top" }}
                {...getVoiceInputProps(
                  "observacao.avaliacaoPostural.testeAdams",
                )}
                error={errors.posturalAdamsDescription}
              />
            </View>
          </View>
          <Input
            label={observacaoPadraoInput.label}
            value={observacaoPadraoInput.value}
            onChangeText={(v) => setField("observacao.padraoMovimento", v)}
            {...getVoiceInputProps("observacao.padraoMovimento")}
          />
          <Input
            label="Edema"
            value={exam.observacao.edema}
            onChangeText={(v) => setField("observacao.edema", v)}
          />
          <Input
            label="Atrofia muscular"
            value={exam.observacao.atrofiaMuscular}
            onChangeText={(v) => setField("observacao.atrofiaMuscular", v)}
          />
          <Input
            label="Alterações de marcha"
            value={exam.observacao.marcha}
            onChangeText={(v) => setField("observacao.marcha", v)}
          />

          <Input
            label={movimentoAtivoInput.label}
            value={movimentoAtivoInput.value}
            onChangeText={(v) => setField("movimento.ativo", v)}
            {...getVoiceInputProps("movimento.ativo")}
          />
          <Input
            label={movimentoPassivoInput.label}
            value={movimentoPassivoInput.value}
            onChangeText={(v) => setField("movimento.passivo", v)}
            {...getVoiceInputProps("movimento.passivo")}
          />
          <Input
            label={movimentoResistidoInput.label}
            value={movimentoResistidoInput.value}
            onChangeText={(v) => setField("movimento.resistido", v)}
            {...getVoiceInputProps("movimento.resistido")}
          />
          <Input
            label={movimentoReproduzDorInput.label}
            value={movimentoReproduzDorInput.value}
            onChangeText={(v) => setField("movimento.reproduzDor", v)}
            {...getVoiceInputProps("movimento.reproduzDor")}
            error={errors.movimentoReproduzDor}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Padrao de dor e palpacao</Text>
          <Input
            label="Local"
            value={exam.padraoDor.local}
            onChangeText={(v) => setField("padraoDor.local", v)}
          />
          <Input
            label="Irradiada"
            value={exam.padraoDor.irradiada}
            onChangeText={(v) => setField("padraoDor.irradiada", v)}
          />

          <Input
            label={palpacaoPontosDolorososInput.label}
            value={palpacaoPontosDolorososInput.value}
            onChangeText={(v) => setField("palpacao.pontosDolorosos", v)}
            {...getVoiceInputProps("palpacao.pontosDolorosos")}
            placeholder="Descreva os pontos dolorosos identificados"
          />
          <Input
            label={palpacaoMuscularInput.label}
            value={palpacaoMuscularInput.value}
            onChangeText={(v) => setField("palpacao.muscular", v)}
            {...getVoiceInputProps("palpacao.muscular")}
          />
          <Input
            label={palpacaoArticularInput.label}
            value={palpacaoArticularInput.value}
            onChangeText={(v) => setField("palpacao.articular", v)}
            {...getVoiceInputProps("palpacao.articular")}
          />
          <Input
            label="Temperatura local"
            value={exam.palpacao.temperatura}
            onChangeText={(v) => setField("palpacao.temperatura", v)}
          />
          <Input
            label="Tônus muscular"
            value={exam.palpacao.tonusMuscular}
            onChangeText={(v) => setField("palpacao.tonusMuscular", v)}
            placeholder="Descreva o tônus muscular observado"
          />
          <Input
            label="Hipomobilidade cervical (C1-C7)"
            value={exam.palpacao.hipomobilidadeSegmentar.cervical}
            onChangeText={(v) => setHipomobilidadeSegmentarField("cervical", v)}
            placeholder="Ex.: C3-C4 e C5-C6 hipomóveis"
          />
          <Input
            label="Hipomobilidade torácica (T1-T12)"
            value={exam.palpacao.hipomobilidadeSegmentar.toracica}
            onChangeText={(v) => setHipomobilidadeSegmentarField("toracica", v)}
            placeholder="Ex.: T4-T6 hipomóveis"
          />
          <Input
            label="Hipomobilidade lombar (L1-L5)"
            value={exam.palpacao.hipomobilidadeSegmentar.lombar}
            onChangeText={(v) => setHipomobilidadeSegmentarField("lombar", v)}
            placeholder="Ex.: L4-L5 com rigidez segmentar"
          />
          <Input
            label={palpacaoDinamicaInput.label}
            value={palpacaoDinamicaInput.value}
            onChangeText={(v) => setField("palpacao.dinamicaVertebral", v)}
            {...getVoiceInputProps("palpacao.dinamicaVertebral")}
          />
          <Input
            label="Sacro (base posterior D/E)"
            value={exam.palpacao.hipomobilidadeSegmentar.sacro}
            onChangeText={(v) => setHipomobilidadeSegmentarField("sacro", v)}
            placeholder="Ex.: Base sacral posterior direita"
          />
          <Input
            label="Ilíaco direito (posterior/anterior)"
            value={exam.palpacao.hipomobilidadeSegmentar.iliacoDireito}
            onChangeText={(v) =>
              setHipomobilidadeSegmentarField("iliacoDireito", v)
            }
            placeholder="Ex.: Ilíaco D em posterioridade"
          />
          <Input
            label="Ilíaco esquerdo (posterior/anterior)"
            value={exam.palpacao.hipomobilidadeSegmentar.iliacoEsquerdo}
            onChangeText={(v) =>
              setHipomobilidadeSegmentarField("iliacoEsquerdo", v)
            }
            placeholder="Ex.: Ilíaco E em anterioridade"
          />
          <Input
            label="Resumo da hipomobilidade articular"
            value={exam.palpacao.hipomobilidadeArticular}
            editable={false}
            multiline
            numberOfLines={3}
            placeholder="Será montado automaticamente conforme os segmentos preenchidos"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Testes funcionais (esportivo)</Text>
          <Input
            label="Agachamento"
            value={exam.testesFuncionais.agachamento}
            onChangeText={(v) => setField("testesFuncionais.agachamento", v)}
          />
          <Input
            label="Agachamento unilateral"
            value={exam.testesFuncionais.agachamentoUnilateral}
            onChangeText={(v) =>
              setField("testesFuncionais.agachamentoUnilateral", v)
            }
          />
          <Input
            label="Salto"
            value={exam.testesFuncionais.salto}
            onChangeText={(v) => setField("testesFuncionais.salto", v)}
          />
          <Input
            label="Corrida (se aplicável)"
            value={exam.testesFuncionais.corrida}
            onChangeText={(v) => setField("testesFuncionais.corrida", v)}
          />
          <Input
            label="Teste de estabilidade"
            value={exam.testesFuncionais.estabilidade}
            onChangeText={(v) => setField("testesFuncionais.estabilidade", v)}
          />
          <Input
            label="Controle motor"
            value={exam.testesFuncionais.controleMotor}
            onChangeText={(v) => setField("testesFuncionais.controleMotor", v)}
          />
        </View>

        <View
          style={[
            styles.section,
            errors.avaliacaoRegioes && styles.sectionWithError,
          ]}
        >
          <Text style={styles.blockTitle}>
            Avaliacao por regioes (marque o resultado de cada teste)
          </Text>
          {orchestratorNextAction?.blocked ? (
            <View
              style={[
                styles.orchestratorNoticeCard,
                styles.orchestratorBlockedCard,
              ]}
            >
              <Text style={styles.orchestratorNoticeTitle}>
                Fluxo com bloqueio clínico detectado
              </Text>
              <Text style={styles.orchestratorNoticeText}>
                {orchestratorNextAction.blockers[0]?.message ||
                  "Revise os bloqueios antes de concluir o exame físico."}
              </Text>
            </View>
          ) : null}
          {!orchestratorNextAction?.blocked &&
          orchestratorNextAction?.alerts?.length ? (
            <View style={styles.orchestratorNoticeCard}>
              <Text style={styles.orchestratorNoticeTitle}>
                Alerta do orquestrador
              </Text>
              <Text style={styles.orchestratorNoticeText}>
                {orchestratorNextAction.alerts[0]?.message}
              </Text>
            </View>
          ) : null}
          {relevantRegions.length ? (
            <View style={styles.contextHeaderRow}>
              <Text style={styles.contextHintText}>
                Foco clínico:{" "}
                {relevantRegions
                  .map((r) => CLINICAL_REGION_LABELS[r])
                  .join(", ")}
                {cadeiaProvavel ? ` â€¢ ${cadeiaProvavel}` : ""}
              </Text>
              <TouchableOpacity
                style={styles.contextToggleChip}
                onPress={() => setShowAllRegions((prev) => !prev)}
              >
                <Text style={styles.contextToggleChipText}>
                  {showAllRegions ? "Ver foco" : "Mostrar todas"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={styles.regionProgressText}>
            Progresso: {regionalProgress.tested}/{regionalProgress.total}{" "}
            testados â€¢ {regionalProgress.pending} pendente(s)
          </Text>
          <Text style={styles.sectionHint}>
            A tela sugere a região principal pela anamnese. Use "Mostrar todas"
            para avaliar outras regiões somente quando houver hipótese clínica.
          </Text>
          <View style={styles.presetRow}>
            {EXAM_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetChip}
                onPress={() => applyExamPreset(preset)}
              >
                <Text style={styles.presetChipText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {visibleRegionalGroups.map((grupo) => {
            const testedCount = grupo.testes.filter(
              (teste) => teste.resultado !== "NAO_TESTADO",
            ).length;
            const pendingCount = Math.max(grupo.testes.length - testedCount, 0);
            const hasPending = pendingCount > 0;
            return (
              <View
                key={grupo.regiao}
                style={[
                  styles.regionCard,
                  testedCount === 0 && styles.regionCardPending,
                  errors.avaliacaoRegioes &&
                    testedCount === 0 &&
                    styles.regionCardValidationMissing,
                ]}
              >
                <View style={styles.regionTitleRow}>
                  <Text style={styles.regionTitle}>{grupo.titulo}</Text>
                  <View style={styles.regionHeaderActions}>
                    <Text
                      style={[
                        styles.regionStatusChip,
                        hasPending
                          ? styles.regionStatusChipPending
                          : styles.regionStatusChipDone,
                      ]}
                    >
                      {hasPending
                        ? `${pendingCount} não testado(s)`
                        : "Região testada"}
                    </Text>
                    <TouchableOpacity
                      style={styles.regionApplyChip}
                      onPress={() => applyRegionBasicPreset(grupo.regiao)}
                    >
                      <Text style={styles.regionApplyChipText}>
                        Aplicar bateria basica
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Input
                  label={`ADM - ${grupo.titulo}`}
                  value={grupo.adm}
                  onChangeText={(value) => setRegionalAdm(grupo.regiao, value)}
                  multiline
                  numberOfLines={2}
                  placeholder="Registre amplitude de movimento objetiva da articulacao/regiao"
                />
                {grupo.testes.map((teste) => (
                  <View
                    key={`${grupo.regiao}-${teste.nome}`}
                    style={[
                      styles.regionTestRow,
                      teste.selecionado && styles.regionTestRowSelected,
                    ]}
                  >
                    <View style={styles.regionTestHeader}>
                      <View style={styles.regionTestCopy}>
                        <Text style={styles.regionTestName}>{teste.nome}</Text>
                        <Text style={styles.regionTestDescription}>
                          {getRegionalTestDescription(teste.nome, grupo.titulo)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.regionSuggestToggle,
                          teste.selecionado &&
                            styles.regionSuggestToggleSelected,
                        ]}
                        onPress={() =>
                          setRegionalTestSelected(
                            grupo.regiao,
                            teste.nome,
                            !teste.selecionado,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.regionSuggestToggleText,
                            teste.selecionado &&
                              styles.regionSuggestToggleTextSelected,
                          ]}
                        >
                          {teste.selecionado ? "No protocolo" : "Adicionar"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.regionTestOptions}>
                      {TEST_RESULT_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={`${grupo.regiao}-${teste.nome}-${option.value}`}
                          style={[
                            styles.regionOption,
                            teste.resultado === option.value &&
                              styles.regionOptionSelected,
                          ]}
                          onPress={() =>
                            setRegionalTestResult(
                              grupo.regiao,
                              teste.nome,
                              option.value,
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.regionOptionText,
                              teste.resultado === option.value &&
                                styles.regionOptionTextSelected,
                            ]}
                          >
                            {option.label === "NAO_TESTADO"
                              ? t("clinical.status.notTested")
                              : option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
          {errors.avaliacaoRegioes ? (
            <Text style={styles.validationErrorText}>
              {errors.avaliacaoRegioes}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.section,
            (errors.hipotesePrincipal || errors.conduta) &&
              styles.sectionWithError,
          ]}
        >
          <Text style={styles.blockTitle}>Integracao clinica final</Text>
          <Input
            label="Hipótese principal"
            value={exam.cruzamentoFinal.hipotesePrincipal}
            onChangeText={(v) =>
              setField("cruzamentoFinal.hipotesePrincipal", v)
            }
            error={errors.hipotesePrincipal}
            multiline
            numberOfLines={3}
            style={{ minHeight: 84, textAlignVertical: "top" }}
          />
          <Input
            label="Hipóteses secundárias"
            value={exam.cruzamentoFinal.hipotesesSecundarias}
            onChangeText={(v) =>
              setField("cruzamentoFinal.hipotesesSecundarias", v)
            }
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("cruzamentoFinal.hipotesesSecundarias")}
          />
          <Input
            label="Inconsistências"
            value={exam.cruzamentoFinal.inconsistencias}
            onChangeText={(v) => setField("cruzamentoFinal.inconsistencias", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("cruzamentoFinal.inconsistencias")}
          />
          <Input
            label="Direção de conduta"
            value={exam.cruzamentoFinal.condutaDirecionada}
            onChangeText={(v) =>
              setField("cruzamentoFinal.condutaDirecionada", v)
            }
            multiline
            numberOfLines={4}
            {...getVoiceInputProps("cruzamentoFinal.condutaDirecionada")}
            error={errors.conduta}
          />

          <Text style={styles.label}>Prioridade clínica</Text>
          <View style={styles.optionsRow}>
            {PRIORIDADE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.cruzamentoFinal.prioridade === item &&
                    styles.chipSelected,
                ]}
                onPress={() =>
                  setExam({
                    ...exam,
                    cruzamentoFinal: {
                      ...exam.cruzamentoFinal,
                      prioridade: item,
                    },
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.cruzamentoFinal.prioridade === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>
            Raciocinio clinico (IA + profissional)
          </Text>
          <Input
            label="Origem provável da dor"
            value={exam.raciocinioClinico.origemProvavelDor}
            onChangeText={(v) =>
              setField("raciocinioClinico.origemProvavelDor", v)
            }
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("raciocinioClinico.origemProvavelDor")}
          />
          <Input
            label="Estrutura envolvida"
            value={exam.raciocinioClinico.estruturaEnvolvida}
            onChangeText={(v) =>
              setField("raciocinioClinico.estruturaEnvolvida", v)
            }
          />
          <Input
            label="Tipo de lesão (mecânica/inflamatória/neural)"
            value={exam.raciocinioClinico.tipoLesao}
            onChangeText={(v) => setField("raciocinioClinico.tipoLesao", v)}
          />
          <View style={styles.optionsRow}>
            {TIPO_LESAO_OPTIONS.map((item) => (
              <TouchableOpacity
                key={`tipo-lesao-${item}`}
                style={[
                  styles.chip,
                  exam.raciocinioClinico.tipoLesao === item &&
                    styles.chipSelected,
                ]}
                onPress={() => setField("raciocinioClinico.tipoLesao", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.raciocinioClinico.tipoLesao === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Fator biomecânico associado"
            value={exam.raciocinioClinico.fatorBiomecanicoAssociado}
            onChangeText={(v) =>
              setField("raciocinioClinico.fatorBiomecanicoAssociado", v)
            }
            multiline
            numberOfLines={3}
            {...getVoiceInputProps(
              "raciocinioClinico.fatorBiomecanicoAssociado",
            )}
          />
          <Input
            label="Relação com atividade/gesto"
            value={exam.raciocinioClinico.relacaoComEsporte}
            onChangeText={(v) =>
              setField("raciocinioClinico.relacaoComEsporte", v)
            }
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("raciocinioClinico.relacaoComEsporte")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Diagnostico funcional</Text>
          <Input
            label="Disfunção principal"
            value={exam.diagnosticoFuncionalIa.disfuncaoPrincipal}
            onChangeText={(v) =>
              setField("diagnosticoFuncionalIa.disfuncaoPrincipal", v)
            }
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("diagnosticoFuncionalIa.disfuncaoPrincipal")}
          />
          <Input
            label="Cadeia envolvida"
            value={exam.diagnosticoFuncionalIa.cadeiaEnvolvida}
            onChangeText={(v) =>
              setField("diagnosticoFuncionalIa.cadeiaEnvolvida", v)
            }
          />
          <View style={styles.optionsRow}>
            {CADEIA_OPTIONS.map((item) => (
              <TouchableOpacity
                key={`cadeia-${item}`}
                style={[
                  styles.chip,
                  exam.diagnosticoFuncionalIa.cadeiaEnvolvida === item &&
                    styles.chipSelected,
                ]}
                onPress={() =>
                  setField("diagnosticoFuncionalIa.cadeiaEnvolvida", item)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.diagnosticoFuncionalIa.cadeiaEnvolvida === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>
            {t("clinical.sections.targetedTherapeuticConduct")}
          </Text>
          <Input
            label="Técnica manual indicada"
            value={exam.condutaIa.tecnicaManualIndicada}
            onChangeText={(v) => setField("condutaIa.tecnicaManualIndicada", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("condutaIa.tecnicaManualIndicada")}
          />
          <Input
            label="Ajuste articular"
            value={exam.condutaIa.ajusteArticular}
            onChangeText={(v) => setField("condutaIa.ajusteArticular", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("condutaIa.ajusteArticular")}
          />
          <Input
            label="Exercício corretivo"
            value={exam.condutaIa.exercicioCorretivo}
            onChangeText={(v) => setField("condutaIa.exercicioCorretivo", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("condutaIa.exercicioCorretivo")}
          />
          <Input
            label="Liberação miofascial"
            value={exam.condutaIa.liberacaoMiofascial}
            onChangeText={(v) => setField("condutaIa.liberacaoMiofascial", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("condutaIa.liberacaoMiofascial")}
          />
          <Input
            label="Progressão esportiva"
            value={exam.condutaIa.progressaoEsportiva}
            onChangeText={(v) => setField("condutaIa.progressaoEsportiva", v)}
            multiline
            numberOfLines={3}
            {...getVoiceInputProps("condutaIa.progressaoEsportiva")}
          />

          <Text style={styles.label}>Sustentação da hipótese</Text>
          <Text style={styles.subtitle}>
            Calculada pelos testes positivos/sugeridos e passível de ajuste
            clínico manual.
          </Text>
          <View style={styles.optionsRow}>
            {CONFIANCA_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.cruzamentoFinal.confiancaHipotese === item &&
                    styles.chipSelected,
                ]}
                onPress={() =>
                  setExam({
                    ...exam,
                    cruzamentoFinal: {
                      ...exam.cruzamentoFinal,
                      confiancaHipotese: item,
                    },
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.cruzamentoFinal.confiancaHipotese === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.evidenceScoreCard}>
            <View style={styles.evidenceScoreHeader}>
              <Text style={styles.evidenceScoreLabel}>
                Força da evidência clínica
              </Text>
              <View
                style={[
                  styles.evidenceStrengthBadge,
                  evidenceStrengthLabel === "Alta" &&
                    styles.evidenceStrengthBadgeHigh,
                  evidenceStrengthLabel === "Moderada" &&
                    styles.evidenceStrengthBadgeModerate,
                  evidenceStrengthLabel === "Baixa" &&
                    styles.evidenceStrengthBadgeLow,
                ]}
              >
                <Text
                  style={[
                    styles.evidenceStrengthText,
                    evidenceStrengthLabel === "Alta" &&
                      styles.evidenceStrengthTextHigh,
                    evidenceStrengthLabel === "Moderada" &&
                      styles.evidenceStrengthTextModerate,
                    evidenceStrengthLabel === "Baixa" &&
                      styles.evidenceStrengthTextLow,
                  ]}
                >
                  {evidenceStrengthLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.evidenceScoreTechnical}>
              Score técnico: {exam.cruzamentoFinal.scoreEvidencia} pontos
            </Text>
            <Text style={styles.evidenceScoreHint}>
              Calculado por testes positivos, achados funcionais e perfil de
              scoring. Não representa porcentagem.
            </Text>
          </View>
          <Text style={styles.label}>Perfil de cálculo da evidência</Text>
          <Text style={styles.subtitle}>
            Define quais regiões e testes pesam mais no score. Use "Geral" se
            não quiser priorizar coluna, membro inferior, membro superior ou
            esporte.
          </Text>
          <View style={styles.optionsRow}>
            {SCORING_PROFILE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.cruzamentoFinal.perfilScoring === item &&
                    styles.chipSelected,
                ]}
                onPress={() => {
                  const latest = getLatestAnamnese();
                  const nextExam = {
                    ...exam,
                    cruzamentoFinal: {
                      ...exam.cruzamentoFinal,
                      perfilScoring: item,
                    },
                  };
                  setExam(
                    enrichStructuredExameWithClinicalLogic(nextExam, latest, {
                      overwrite: false,
                      recalculateDecision: true,
                    }),
                  );
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.cruzamentoFinal.perfilScoring === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.classificationConfirmation ? (
            <Text style={styles.validationErrorText}>
              {errors.classificationConfirmation}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>
            {t("clinical.sections.clinicalPreview")}
          </Text>
          <Input
            value={
              recordedExamLocked && persistedExamText
                ? persistedExamText
                : renderStructuredExameToText(exam)
            }
            multiline
            numberOfLines={12}
            editable={false}
            style={{ height: 300, textAlignVertical: "top" }}
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => generateSuggestion(true)}
              disabled={generating}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipText}>
                {generating
                  ? t("clinical.status.generating")
                  : t("clinical.actions.regenerateFromAnamnesis")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => {
                const latest = getLatestAnamnese();
                setExam((prev) =>
                  prev
                    ? enrichStructuredExameWithClinicalLogic(prev, latest, {
                        overwrite: false,
                        recalculateDecision: true,
                      })
                    : prev,
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipText}>
                {t("clinical.actions.recalculateReasoning")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => {
                AsyncStorage.removeItem(draftKey).catch(() => undefined);
                setLastDraftSavedAt(null);
                setErrors({});
                setHasAttemptedSave(false);
                generateSuggestion(true).catch(() => undefined);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipText}>
                {t("clinical.actions.clearDraft")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!recordedExamLocked ? (
          <>
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
                  {t(
                    "clinical.messages.physicalExamProfessionalValidationChecklistItem",
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            <Button
              title={
                isExamValidatedWithoutPendingChanges
                  ? t("clinical.actions.physicalExamValidated")
                  : t("clinical.actions.validateAndApprove")
              }
              onPress={handleValidatePhysicalExam}
              loading={loading}
              disabled={loading || isExamValidatedWithoutPendingChanges}
              icon={
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={COLORS.white}
                />
              }
            />
            {!isExamValidatedWithoutPendingChanges ? (
              <View style={styles.referencesValidateHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLORS.warning}
                />
                <Text style={styles.referencesValidateHintText}>
                  {hasExamChangesAfterValidation
                    ? t("clinical.messages.physicalExamRevalidationPending")
                    : t("clinical.messages.validatePhysicalExamBeforeSave")}
                </Text>
              </View>
            ) : null}
            {examValidatedAt ? (
              <Text style={styles.draftInfo}>
                {t("clinical.messages.validatedAt")}{" "}
                {new Date(examValidatedAt).toLocaleString(dateLocale)}
              </Text>
            ) : null}
          </>
        ) : null}
        <Button
          title={
            recordedExamLocked
              ? "Voltar ao paciente"
              : exam.redFlags.criticalTriggered
                ? t("clinical.actions.saveTriageAndRefer")
                : t("clinical.actions.savePhysicalExam")
          }
          onPress={handleSave}
          loading={loading}
          disabled={!recordedExamLocked && (loading || !canSavePhysicalExam)}
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
    paddingBottom: 120,
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
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  sectionWithError: {
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}06`,
  },
  validationSummary: {
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}08`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.base,
  },
  validationSummaryTitle: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 4,
  },
  validationSummaryText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  draftInfo: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  blockTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: SPACING.xs,
  },
  evidenceScoreCard: {
    borderWidth: 1,
    borderColor: `${COLORS.primary}33`,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  evidenceScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  evidenceScoreLabel: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  evidenceStrengthBadge: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  evidenceStrengthBadgeHigh: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}14`,
  },
  evidenceStrengthBadgeModerate: {
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}14`,
  },
  evidenceStrengthBadgeLow: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}10`,
  },
  evidenceStrengthText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  evidenceStrengthTextHigh: {
    color: COLORS.primary,
  },
  evidenceStrengthTextModerate: {
    color: COLORS.warning,
  },
  evidenceStrengthTextLow: {
    color: COLORS.error,
  },
  evidenceScoreTechnical: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  evidenceScoreHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  flagRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  flagHeader: {
    marginBottom: SPACING.sm,
  },
  flagName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  flagQuestion: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  flagActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  flagButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  flagButtonActiveSafe: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "18",
  },
  flagButtonActiveAlert: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "18",
  },
  flagButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  alertBox: {
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "12",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  alertTitle: {
    color: COLORS.error,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  alertText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + "15",
  },
  actionChipDisabled: {
    opacity: 0.55,
  },
  actionChipText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONTS.sizes.xs,
  },
  posturalExamGrid: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  posturalExamCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
  },
  posturalExamTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  posturalExamImageFrame: {
    width: "100%",
    height: 220,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  posturalExamImage: {
    width: "100%",
    height: "100%",
  },
  posturalExamHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  posturalChecklist: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  posturalChecklistItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray50,
    padding: SPACING.xs,
  },
  posturalChecklistLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: 6,
  },
  posturalOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  posturalOptionChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  posturalOptionChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  posturalOptionText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  posturalOptionTextSelected: {
    color: COLORS.white,
  },
  posturalAlertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.warning + "55",
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.warning + "12",
    padding: SPACING.xs,
  },
  posturalAlertTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginBottom: 2,
  },
  posturalAlertText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
  },
  posturalErrorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
    marginTop: 6,
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
  footer: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.base,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  regionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  regionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  regionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  regionHeaderActions: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  regionApplyChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}10`,
  },
  regionApplyChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  sectionHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  classificationSuggestionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 6,
  },
  classificationSuggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  classificationSuggestionLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "700",
    flex: 1,
  },
  classificationSuggestionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  classificationConfidenceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  classificationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  classificationStatusChip: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  classificationStatusChipSuggested: {
    borderColor: `${COLORS.warning}88`,
    backgroundColor: `${COLORS.warning}15`,
  },
  classificationStatusChipConfirmed: {
    borderColor: `${COLORS.primary}88`,
    backgroundColor: `${COLORS.primary}12`,
  },
  classificationStatusChipText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  classificationStatusChipTextSuggested: {
    color: COLORS.warning,
  },
  classificationStatusChipTextConfirmed: {
    color: COLORS.primary,
  },
  classificationConfirmButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  classificationConfirmButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  classificationLowConfidenceText: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.warning,
    fontWeight: "600",
  },
  classificationEvidenceGroup: {
    marginTop: 2,
    gap: 4,
  },
  classificationEvidenceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  classificationEvidenceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  classificationEvidenceChip: {
    borderWidth: 1,
    borderColor: `${COLORS.primary}33`,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  classificationEvidenceChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  classificationEvidenceText: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  orchestratorNoticeCard: {
    borderWidth: 1,
    borderColor: `${COLORS.warning}66`,
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  orchestratorBlockedCard: {
    borderColor: `${COLORS.error}66`,
    backgroundColor: `${COLORS.error}10`,
  },
  orchestratorNoticeTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orchestratorNoticeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  contextHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  contextHintText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  contextToggleChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}10`,
  },
  contextToggleChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  regionProgressText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: `${COLORS.primary}12`,
  },
  presetChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  regionStatusChip: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  regionStatusChipPending: {
    color: COLORS.warning,
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}14`,
  },
  regionStatusChipDone: {
    color: COLORS.primary,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}14`,
  },
  regionCardPending: {
    borderColor: `${COLORS.warning}80`,
    backgroundColor: `${COLORS.warning}08`,
  },
  regionCardValidationMissing: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}08`,
  },
  regionTestRow: {
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  regionTestRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  regionTestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  regionTestCopy: {
    flex: 1,
    minWidth: 0,
  },
  regionSuggestToggle: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  regionSuggestToggleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  regionSuggestToggleText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  regionSuggestToggleTextSelected: {
    color: COLORS.white,
  },
  regionTestName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  regionTestDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 6,
  },
  regionTestOptions: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  regionOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  regionOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  regionOptionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  regionOptionTextSelected: {
    color: COLORS.white,
  },
  validationErrorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
    fontWeight: "600",
  },
});
