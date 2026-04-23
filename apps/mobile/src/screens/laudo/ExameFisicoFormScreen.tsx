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
import { useAnamneseStore } from "../../stores/anamneseStore";
import { useLaudoStore } from "../../stores/laudoStore";
import {
  api,
  buildStructuredExameFromAnamnese,
  type ClinicalOrchestratorNextActionResponse,
  enrichStructuredExameWithClinicalLogic,
  getClinicalOrchestratorNextAction,
  parseStructuredExame,
  renderStructuredExameToText,
  serializeStructuredExame,
  trackEvent,
  updateRedFlagAnswer,
} from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import {
  CLINICAL_REGION_LABELS,
  inferClinicalRegionsFromHints,
  mapClinicalChainCodeToLabel,
  resolveRelevantClinicalRegions,
  shouldShowChainField,
} from "../../utils/clinicalRegionContext";
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from "../../constants/theme";
import { RootStackParamList } from "../../types";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  DorClassificacaoPrincipal,
  DorClassificationSuggestion,
  DorSubtipoClinico,
  ExameFisicoStructured,
  inferDorClassificationFromAnamnese,
  RedFlagKey,
  RegionalTestGroup,
  TestResult,
} from "../../services/physicalExamModel";

type ExameFisicoFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExameFisicoForm">;
  route: RouteProp<RootStackParamList, "ExameFisicoForm">;
};

const DOR_PRINCIPAL_OPTIONS: DorClassificacaoPrincipal[] = [
  "NOCICEPTIVA",
  "NEUROPATICA",
  "NOCIPLASTICA",
  "INFLAMATORIA",
  "VISCERAL",
];

const DOR_SUBTIPO_OPTIONS: DorSubtipoClinico[] = [
  "MECANICA",
  "DISCAL",
  "NEURAL",
  "REFERIDA",
  "INFLAMATORIA",
  "MIOFASCIAL",
  "FACETARIA",
  "NAO_MECANICA",
];

const PRIORIDADE_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["prioridade"][] = [
  "BAIXA",
  "MEDIA",
  "ALTA",
  "ENCAMINHAMENTO_IMEDIATO",
];

const CONFIANCA_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["confiancaHipotese"][] = [
  "BAIXA",
  "MODERADA",
  "ALTA",
];

const SCORING_PROFILE_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["perfilScoring"][] = [
  "GERAL",
  "COLUNA",
  "MEMBRO_INFERIOR",
  "MEMBRO_SUPERIOR",
  "ESPORTIVO",
];

const RED_FLAG_LABELS: Record<RedFlagKey, string> = {
  CAUDA_EQUINA: "Cauda equina",
  FRATURA: "Fratura",
  INFECCAO: "Infecção",
  ONCOLOGICO: "Oncológico",
  NAO_MECANICA: "Dor não mecânica",
  DEFICIT_NEURO_PROGRESSIVO: "Déficit neuro progressivo",
  VASCULAR: "Vascular",
};

const TEST_RESULT_OPTIONS: Array<{ label: string; value: TestResult }> = [
  { label: "NAO_TESTADO", value: "NAO_TESTADO" },
  { label: "Negativo", value: "NEGATIVO" },
  { label: "Positivo", value: "POSITIVO" },
];

type ExamPreset = {
  id: string;
  label: string;
  regions: RegionalTestGroup["regiao"][];
};

const EXAM_PRESETS: ExamPreset[] = [
  { id: "COLUNA", label: "Coluna", regions: ["CERVICAL", "TORACICA", "LOMBAR", "SACROILIACA"] },
  { id: "MMII", label: "Membro inferior", regions: ["QUADRIL", "JOELHO", "TORNOZELO_PE"] },
  { id: "MMSS", label: "Membro superior", regions: ["OMBRO", "COTOVELO", "PUNHO_MAO"] },
  { id: "ESPORTIVO", label: "Esportivo", regions: ["LOMBAR", "QUADRIL", "JOELHO", "TORNOZELO_PE"] },
];

const TIPO_LESAO_OPTIONS = [
  "Mecanica",
  "Inflamatoria",
  "Neural",
  "Mista",
];

const CADEIA_OPTIONS = [
  "Cadeia axial superior",
  "Cadeia lombo-pelvica",
  "Cadeia de membro inferior",
  "Cadeia de membro superior",
  "Cadeia funcional global",
];

const CONDUTA_PRESETS = {
  tecnicaManual: [
    "Mobilizacao articular",
    "Tecnicas de tecido mole",
    "Manipulacao de baixa amplitude",
    "Sem tecnica manual no momento",
  ],
  ajusteArticular: [
    "Ajuste segmentar cervical",
    "Ajuste segmentar toracico",
    "Ajuste segmentar lombo-pelvico",
    "Nao indicado no momento",
  ],
  exercicio: [
    "Controle motor",
    "Estabilidade lombo-pelvica",
    "Fortalecimento progressivo",
    "Mobilidade funcional",
  ],
  miofascial: [
    "Liberacao de pontos gatilho",
    "Liberacao de cadeia posterior",
    "Liberacao de cadeia anterior",
    "Nao indicado no momento",
  ],
  progressao: [
    "Progressao por dor e funcao",
    "Progressao por tolerancia a carga",
    "Progressao por controle motor",
    "Manter fase atual",
  ],
};

const prettyEnum = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

type HipomobilidadeSegmentarField =
  | "cervical"
  | "toracica"
  | "lombar"
  | "sacro"
  | "iliacoDireito"
  | "iliacoEsquerdo";

const buildHipomobilidadeSummary = (segmentar: {
  cervical?: string;
  toracica?: string;
  lombar?: string;
  sacro?: string;
  iliacoDireito?: string;
  iliacoEsquerdo?: string;
}) => {
  const safe = (value?: string) => {
    const text = String(value || "").trim();
    return text || "Nao informado";
  };
  return [
    `Cervical: ${safe(segmentar.cervical)}`,
    `Toracica: ${safe(segmentar.toracica)}`,
    `Lombar: ${safe(segmentar.lombar)}`,
    `Sacro: ${safe(segmentar.sacro)}`,
    `Iliaco D: ${safe(segmentar.iliacoDireito)}`,
    `Iliaco E: ${safe(segmentar.iliacoEsquerdo)}`,
  ].join(" | ");
};

export function ExameFisicoFormScreen({ route, navigation }: ExameFisicoFormScreenProps) {
  const { t } = useLanguage();
  const { pacienteId } = route.params;
  const { showToast } = useToast();
  const { getPacienteById, fetchPacientes } = usePacienteStore();
  const { fetchAnamnesesByPaciente, anamneses } = useAnamneseStore();
  const { fetchLaudoByPaciente, createLaudo } = useLaudoStore();

  const paciente = getPacienteById(pacienteId);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [exam, setExam] = useState<ExameFisicoStructured | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [orchestratorNextAction, setOrchestratorNextAction] =
    useState<ClinicalOrchestratorNextActionResponse | null>(null);
  const didSaveRef = useRef(false);
  const stageOpenedAtRef = useRef<number>(Date.now());

  const draftKey = `draft:exame-fisico-structured:${pacienteId}`;
  const hasAnamnese = anamneses.some((item) => item.pacienteId === pacienteId);
  const getLatestAnamnese = useMemo(
    () => () => {
      const anamneseList = useAnamneseStore
        .getState()
        .anamneses.filter((item) => item.pacienteId === pacienteId);
      if (!anamneseList.length) return undefined;
      return [...anamneseList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    },
    [pacienteId],
  );
  const latestAnamnese = useMemo(() => getLatestAnamnese(), [getLatestAnamnese, anamneses]);
  const dorSuggestion: DorClassificationSuggestion = useMemo(
    () => inferDorClassificationFromAnamnese(latestAnamnese),
    [latestAnamnese],
  );
  const orchestratorFocusedRegions = useMemo(() => {
    return inferClinicalRegionsFromHints(
      orchestratorNextAction?.context?.regioesPrioritarias || [],
    );
  }, [orchestratorNextAction]);
  const relevantRegions = useMemo(() => {
    const fromAnamnese = resolveRelevantClinicalRegions(latestAnamnese);
    return Array.from(new Set([...orchestratorFocusedRegions, ...fromAnamnese]));
  }, [latestAnamnese, orchestratorFocusedRegions]);
  const relevantRegionSet = useMemo(() => new Set(relevantRegions), [relevantRegions]);
  const cadeiaProvavel = useMemo(() => {
    return mapClinicalChainCodeToLabel(
      orchestratorNextAction?.context?.cadeiaProvavel,
    );
  }, [orchestratorNextAction]);
  const visibleRegionalGroups = useMemo(() => {
    if (!exam) return [];
    if (showAllRegions || !relevantRegionSet.size) return exam.avaliacaoRegioes;
    return exam.avaliacaoRegioes.filter((group) => relevantRegionSet.has(group.regiao));
  }, [exam, relevantRegionSet, showAllRegions]);
  const regionalProgress = useMemo(() => {
    if (!visibleRegionalGroups.length) return { tested: 0, total: 0, pending: 0 };
    const total = visibleRegionalGroups.reduce(
      (acc, group) => acc + group.testes.length,
      0,
    );
    const tested = visibleRegionalGroups.reduce(
      (acc, group) =>
        acc + group.testes.filter((test) => test.resultado !== "NAO_TESTADO").length,
      0,
    );
    return { tested, total, pending: Math.max(total - tested, 0) };
  }, [visibleRegionalGroups]);

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
      setExam((prev) => (force || !prev ? next : prev));
      setErrors({});
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
      const latestAnamnese = getLatestAnamnese();

      const laudo = await fetchLaudoByPaciente(pacienteId, false).catch(() => null);
      if (!active) return;

      if (laudo?.id) {
        setLaudoId(laudo.id);
        const structured = parseStructuredExame(laudo.exameFisico);
        if (structured) {
          setExam(
            enrichStructuredExameWithClinicalLogic(structured, latestAnamnese, {
              overwrite: false,
            }),
          );
        }
      }

      try {
        const rawDraft = await AsyncStorage.getItem(draftKey);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft) as {
            exam?: ExameFisicoStructured;
            lastEditedAt?: string;
          };
          if (!exam && parsed.exam) {
            setExam(parsed.exam);
          }
          if (parsed.lastEditedAt) setLastDraftSavedAt(parsed.lastEditedAt);
        }
      } catch {
        // ignore draft parse
      } finally {
        setDraftLoaded(true);
      }

      if (!exam) {
        await generateSuggestion(true);
      }
    };

    load().catch(() => undefined);
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
    if (!draftLoaded || !exam) return;
    const timer = setTimeout(() => {
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
          }).catch(() => undefined);
        })
        .catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [draftLoaded, draftKey, exam]);

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
    const next = { ...exam } as any;
    const segments = path.split(".");
    let current = next;
    for (let i = 0; i < segments.length - 1; i++) current = current[segments[i]];
    current[segments[segments.length - 1]] = value;
    setExam(next);
    if (path === "movimento.reproduzDor" && errors.movimentoReproduzDor) {
      setErrors((prev) => ({ ...prev, movimentoReproduzDor: "" }));
    }
    if (path === "cruzamentoFinal.hipotesePrincipal" && errors.hipotesePrincipal) {
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
    if (
      path.startsWith("neurologico.") &&
      errors.neurologicoDetalhado
    ) {
      setErrors((prev) => ({ ...prev, neurologicoDetalhado: "" }));
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
      nextErrors.hipotesePrincipal = t("clinical.validation.primaryHypothesisRequired");
    }
    if (!exam.cruzamentoFinal.condutaDirecionada.trim()) {
      nextErrors.conduta = t("clinical.validation.condutaDirectionRequired");
    }
    const neuralMode = String(exam.raciocinioClinico.tipoLesao || "")
      .toLowerCase()
      .includes("neural");
    if (neuralMode) {
      const hasDetailedNeuro =
        String(exam.neurologico.forca || "").trim() ||
        String(exam.neurologico.sensibilidade || "").trim() ||
        String(exam.neurologico.reflexos || "").trim() ||
        String(exam.neurologico.dermatomos || "").trim() ||
        String(exam.neurologico.miotomos || "").trim();
      if (!hasDetailedNeuro) {
        nextErrors.neurologicoDetalhado = t(
          "clinical.validation.neuralDetailedRequired",
        );
      }
    }
    const hasAtLeastOneRegionalResult = exam.avaliacaoRegioes.some((grupo) =>
      grupo.testes.some((teste) => teste.resultado !== "NAO_TESTADO"),
    );
    if (!hasAtLeastOneRegionalResult) {
      nextErrors.avaliacaoRegioes = t(
        "clinical.validation.atLeastOneRegionalTestRequired",
      );
    }

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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getValidationFields = (source: ExameFisicoStructured | null): string[] => {
    if (!source) return ["exam"];
    const fields: string[] = [];
    if (!source.movimento.reproduzDor.trim()) fields.push("movimentoReproduzDor");
    if (!source.cruzamentoFinal.hipotesePrincipal.trim()) fields.push("hipotesePrincipal");
    if (!source.cruzamentoFinal.condutaDirecionada.trim()) fields.push("conduta");
    const neuralMode = String(source.raciocinioClinico.tipoLesao || "")
      .toLowerCase()
      .includes("neural");
    if (neuralMode) {
      const hasDetailedNeuro =
        String(source.neurologico.forca || "").trim() ||
        String(source.neurologico.sensibilidade || "").trim() ||
        String(source.neurologico.reflexos || "").trim() ||
        String(source.neurologico.dermatomos || "").trim() ||
        String(source.neurologico.miotomos || "").trim();
      if (!hasDetailedNeuro) fields.push("neurologicoDetalhado");
    }
    const hasAtLeastOneRegionalResult = source.avaliacaoRegioes.some((grupo) =>
      grupo.testes.some((teste) => teste.resultado !== "NAO_TESTADO"),
    );
    if (!hasAtLeastOneRegionalResult) fields.push("avaliacaoRegioes");
    if (source.redFlags.criticalTriggered) {
      if (!String(source.redFlags.referralDestination || "").trim()) {
        fields.push("referralDestination");
      }
      if (!String(source.redFlags.referralReason || "").trim()) {
        fields.push("referralReason");
      }
    }
    return fields;
  };

  const handleSave = async () => {
    setHasAttemptedSave(true);
    if (!hasAnamnese) {
      trackEvent("clinical_flow_blocked", { stage: "EXAME_FISICO", reason: "MISSING_ANAMNESE", pacienteId }).catch(() => undefined);
      showToast({ type: "error", message: "Preencha a anamnese antes do exame físico." });
      navigation.navigate("AnamneseForm", { pacienteId });
      return;
    }
    if (!exam || !validateForm()) {
      const failedFields = getValidationFields(exam);
      trackEvent("clinical_flow_blocked", { stage: "EXAME_FISICO", reason: "MISSING_REQUIRED_FIELDS", pacienteId }).catch(() => undefined);
      trackEvent("clinical_form_validation_error", {
        stage: "EXAME_FISICO",
        pacienteId,
        fields: failedFields,
      }).catch(() => undefined);
      showToast({ type: "error", message: "Revise os campos obrigatórios para salvar." });
      return;
    }

    setLoading(true);
    try {
      const effectiveExam: ExameFisicoStructured = exam.redFlags.criticalTriggered
        ? {
            ...exam,
            cruzamentoFinal: {
              ...exam.cruzamentoFinal,
              prioridade: "ENCAMINHAMENTO_IMEDIATO",
            },
          }
        : exam;

      const exameSerialized = serializeStructuredExame(effectiveExam);
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

      if (laudoId) {
        await api.patch(`/laudos/${laudoId}`, {
          exameFisico: exameSerialized,
          diagnosticoFuncional: diagnostico,
          condutas,
        });
      } else {
        const created = await createLaudo({
          pacienteId,
          diagnosticoFuncional: diagnostico,
          condutas,
          exameFisico: exameSerialized,
        });
        setLaudoId(created.id);
      }

      await AsyncStorage.removeItem(draftKey).catch(() => undefined);
      setLastDraftSavedAt(null);

      if (effectiveExam.redFlags.criticalTriggered) {
        showToast({
          type: "success",
          message: "Triagem crítica salva. Fluxo clínico deve seguir para encaminhamento imediato.",
        });
      } else {
        showToast({ type: "success", message: "Exame físico salvo com sucesso." });
      }
      trackEvent("session_completed", {
        stage: "EXAME_FISICO",
        pacienteId,
        source: "ExameFisicoFormScreen",
        isEditing: !!laudoId,
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
      didSaveRef.current = true;
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
                ? "Sem permissão para editar este exame físico."
                : "Paciente ou laudo não encontrado.",
          });
          navigation.goBack();
          setLoading(false);
          return;
        }
      }
      showToast({ type: "error", message: message || "Não foi possível salvar o exame físico." });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDorSuggestion = () => {
    if (!exam) return;
    if (!dorSuggestion.principal || !dorSuggestion.subtipo) {
      showToast({
        type: "error",
        message: "Nao foi possivel sugerir classificacao de dor com os dados atuais da anamnese.",
      });
      return;
    }
    setExam({
      ...exam,
      dorPrincipal: dorSuggestion.principal,
      dorSubtipo: dorSuggestion.subtipo,
    });
    showToast({
      type: "success",
      message: `Sugestao aplicada (${dorSuggestion.confidence.toLowerCase()}): ${dorSuggestion.reason}`,
    });
  };

  useEffect(() => {
    if (!hasAttemptedSave || !exam) return;
    validateForm();
  }, [hasAttemptedSave, exam]);

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

  const redFlagCount = exam.redFlags.answers.filter((item) => item.positive).length;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Exame físico orientado por decisão</Text>
          <Text style={styles.subtitle}>
            Etapas: observação, movimento, palpação, testes, cadeia cinética e cruzamento final.
          </Text>
          {lastDraftSavedAt ? (
            <Text style={styles.draftInfo}>Última edição: {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Classificacao de dor</Text>
          <View style={styles.classificationSuggestionRow}>
            <Text style={styles.classificationSuggestionText}>
              Sugestao da anamnese:{" "}
              {dorSuggestion.principal && dorSuggestion.subtipo
                ? `${prettyEnum(dorSuggestion.principal)} / ${prettyEnum(dorSuggestion.subtipo)} (${dorSuggestion.confidence.toLowerCase()})`
                : "sem inferencia segura"}
            </Text>
            <TouchableOpacity
              style={styles.classificationSuggestionButton}
              onPress={handleApplyDorSuggestion}
            >
              <Text style={styles.classificationSuggestionButtonText}>Sugerir por IA</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {DOR_PRINCIPAL_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, exam.dorPrincipal === item && styles.chipSelected]}
                onPress={() => setExam({ ...exam, dorPrincipal: item })}
              >
                <Text style={[styles.chipText, exam.dorPrincipal === item && styles.chipTextSelected]}>
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.optionsRow}>
            {DOR_SUBTIPO_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, exam.dorSubtipo === item && styles.chipSelected]}
                onPress={() => setExam({ ...exam, dorSubtipo: item })}
              >
                <Text style={[styles.chipText, exam.dorSubtipo === item && styles.chipTextSelected]}>
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Triagem de sinais de alerta</Text>
          <Text style={styles.subtitle}>Bloco obrigatório. Se crítico, o fluxo clínico deve ser interrompido para encaminhamento.</Text>
          {exam.redFlags.answers.map((item) => (
            <View key={item.key} style={styles.flagRow}>
              <View style={styles.flagHeader}>
                <Text style={styles.flagName}>{RED_FLAG_LABELS[item.key]}</Text>
                <Text style={styles.flagQuestion}>{item.question}</Text>
              </View>
              <View style={styles.flagActions}>
                <TouchableOpacity
                  style={[styles.flagButton, !item.positive && styles.flagButtonActiveSafe]}
                  onPress={() => toggleRedFlag(item.key, false)}
                >
                  <Text style={styles.flagButtonText}>Não</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.flagButton, item.positive && styles.flagButtonActiveAlert]}
                  onPress={() => toggleRedFlag(item.key, true)}
                >
                  <Text style={styles.flagButtonText}>Sim</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={styles.statusText}>Red flags positivas: {redFlagCount}</Text>
          {exam.redFlags.criticalTriggered ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>ALERTA CRÍTICO</Text>
              <Text style={styles.alertText}>Encaminhamento imediato é obrigatório antes de seguir com conduta terapêutica.</Text>
              <Input
                label="Destino de encaminhamento"
                value={exam.redFlags.referralDestination || ""}
                onChangeText={(value) =>
                  setExam({
                    ...exam,
                    redFlags: { ...exam.redFlags, referralDestination: value, referralRequired: true },
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
                    redFlags: { ...exam.redFlags, referralReason: value, referralRequired: true },
                  })
                }
                placeholder="Descreva sinais e motivo do encaminhamento"
                multiline
                numberOfLines={4}
                error={errors.referralReason}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Observacao e movimento</Text>
          <Input label="Postura" value={exam.observacao.postura} onChangeText={(v) => setField("observacao.postura", v)} />
          <Input label="Assimetria" value={exam.observacao.assimetria} onChangeText={(v) => setField("observacao.assimetria", v)} />
          <Input label="Proteção" value={exam.observacao.protecao} onChangeText={(v) => setField("observacao.protecao", v)} />
          <Input label="Padrão de movimento" value={exam.observacao.padraoMovimento} onChangeText={(v) => setField("observacao.padraoMovimento", v)} />
          <Input label="Edema" value={exam.observacao.edema} onChangeText={(v) => setField("observacao.edema", v)} />
          <Input label="Atrofia muscular" value={exam.observacao.atrofiaMuscular} onChangeText={(v) => setField("observacao.atrofiaMuscular", v)} />
          <Input label="Alterações de marcha" value={exam.observacao.marcha} onChangeText={(v) => setField("observacao.marcha", v)} />

          <Input label="Movimento ativo" value={exam.movimento.ativo} onChangeText={(v) => setField("movimento.ativo", v)} />
          <Input label="Movimento passivo" value={exam.movimento.passivo} onChangeText={(v) => setField("movimento.passivo", v)} />
          <Input label="Movimento resistido" value={exam.movimento.resistido} onChangeText={(v) => setField("movimento.resistido", v)} />
          <Input
            label="Qual movimento reproduz a dor?"
            value={exam.movimento.reproduzDor}
            onChangeText={(v) => setField("movimento.reproduzDor", v)}
            error={errors.movimentoReproduzDor}
          />
          <Input
            label="Qualidade do movimento"
            value={exam.movimento.qualidadeMovimento}
            onChangeText={(v) => setField("movimento.qualidadeMovimento", v)}
          />
          <Input
            label="Compensações"
            value={exam.movimento.compensacoes}
            onChangeText={(v) => setField("movimento.compensacoes", v)}
          />
          <Input
            label="Dor no movimento"
            value={exam.movimento.dorNoMovimento}
            onChangeText={(v) => setField("movimento.dorNoMovimento", v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Padrao de dor e palpacao</Text>
          <Input label="Local" value={exam.padraoDor.local} onChangeText={(v) => setField("padraoDor.local", v)} />
          <Input label="Irradiada" value={exam.padraoDor.irradiada} onChangeText={(v) => setField("padraoDor.irradiada", v)} />
          <Input label="Comportamento" value={exam.padraoDor.comportamento} onChangeText={(v) => setField("padraoDor.comportamento", v)} />

          <Input label="Pontos dolorosos" value={exam.palpacao.pontosDolorosos} onChangeText={(v) => setField("palpacao.pontosDolorosos", v)} />
          <Input label="Palpação muscular" value={exam.palpacao.muscular} onChangeText={(v) => setField("palpacao.muscular", v)} />
          <Input label="Palpação articular" value={exam.palpacao.articular} onChangeText={(v) => setField("palpacao.articular", v)} />
          <Input label="Pontos de gatilho" value={exam.palpacao.pontosGatilho} onChangeText={(v) => setField("palpacao.pontosGatilho", v)} />
          <Input label="Palpação dinâmica vertebral" value={exam.palpacao.dinamicaVertebral} onChangeText={(v) => setField("palpacao.dinamicaVertebral", v)} />
          <Input label="Temperatura local" value={exam.palpacao.temperatura} onChangeText={(v) => setField("palpacao.temperatura", v)} />
          <Input label="Tônus muscular" value={exam.palpacao.tonusMuscular} onChangeText={(v) => setField("palpacao.tonusMuscular", v)} />
          <Input label="Estruturas específicas" value={exam.palpacao.estruturasEspecificas} onChangeText={(v) => setField("palpacao.estruturasEspecificas", v)} />
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
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Testes e cadeia cinetica</Text>
          <Input label="Testes biomecânicos" value={exam.testes.biomecanicos} onChangeText={(v) => setField("testes.biomecanicos", v)} />
          <Input label="Testes ortopédicos" value={exam.testes.ortopedicos} onChangeText={(v) => setField("testes.ortopedicos", v)} />
          <Input label="Neurológico (dermátomo, miótomo, reflexos)" value={exam.testes.neurologicos} onChangeText={(v) => setField("testes.neurologicos", v)} />
          <Input label="Exame de imagem" value={exam.testes.imagem} onChangeText={(v) => setField("testes.imagem", v)} />

          <Text style={styles.label}>Bloco neurológico detalhado</Text>
          <Input label="Força" value={exam.neurologico.forca} onChangeText={(v) => setField("neurologico.forca", v)} />
          <Input label="Sensibilidade" value={exam.neurologico.sensibilidade} onChangeText={(v) => setField("neurologico.sensibilidade", v)} />
          <Input label="Reflexos" value={exam.neurologico.reflexos} onChangeText={(v) => setField("neurologico.reflexos", v)} />
          <Input label="Dermátomos" value={exam.neurologico.dermatomos} onChangeText={(v) => setField("neurologico.dermatomos", v)} />
          <Input label="Miótomos" value={exam.neurologico.miotomos} onChangeText={(v) => setField("neurologico.miotomos", v)} />
          {errors.neurologicoDetalhado ? (
            <Text style={styles.validationErrorText}>{errors.neurologicoDetalhado}</Text>
          ) : null}

          {shouldShowChainField("quadril", relevantRegions) ? (
            <Input label="Quadril" value={exam.cadeiaCinetica.quadril} onChangeText={(v) => setField("cadeiaCinetica.quadril", v)} />
          ) : null}
          {shouldShowChainField("pelve", relevantRegions) ? (
            <Input label="Pelve" value={exam.cadeiaCinetica.pelve} onChangeText={(v) => setField("cadeiaCinetica.pelve", v)} />
          ) : null}
          {shouldShowChainField("colunaToracica", relevantRegions) ? (
            <Input label="Coluna torácica" value={exam.cadeiaCinetica.colunaToracica} onChangeText={(v) => setField("cadeiaCinetica.colunaToracica", v)} />
          ) : null}
          {shouldShowChainField("pe", relevantRegions) ? (
            <Input label="Pé" value={exam.cadeiaCinetica.pe} onChangeText={(v) => setField("cadeiaCinetica.pe", v)} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Testes funcionais (esportivo)</Text>
          <Input label="Agachamento" value={exam.testesFuncionais.agachamento} onChangeText={(v) => setField("testesFuncionais.agachamento", v)} />
          <Input label="Agachamento unilateral" value={exam.testesFuncionais.agachamentoUnilateral} onChangeText={(v) => setField("testesFuncionais.agachamentoUnilateral", v)} />
          <Input label="Salto" value={exam.testesFuncionais.salto} onChangeText={(v) => setField("testesFuncionais.salto", v)} />
          <Input label="Corrida (se aplicável)" value={exam.testesFuncionais.corrida} onChangeText={(v) => setField("testesFuncionais.corrida", v)} />
          <Input label="Teste de estabilidade" value={exam.testesFuncionais.estabilidade} onChangeText={(v) => setField("testesFuncionais.estabilidade", v)} />
          <Input label="Controle motor" value={exam.testesFuncionais.controleMotor} onChangeText={(v) => setField("testesFuncionais.controleMotor", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Avaliacao por regioes (marque o resultado de cada teste)</Text>
          {orchestratorNextAction?.blocked ? (
            <View style={[styles.orchestratorNoticeCard, styles.orchestratorBlockedCard]}>
              <Text style={styles.orchestratorNoticeTitle}>
                Fluxo com bloqueio clínico detectado
              </Text>
              <Text style={styles.orchestratorNoticeText}>
                {orchestratorNextAction.blockers[0]?.message ||
                  "Revise os bloqueios antes de concluir o exame físico."}
              </Text>
            </View>
          ) : null}
          {!orchestratorNextAction?.blocked && orchestratorNextAction?.alerts?.length ? (
            <View style={styles.orchestratorNoticeCard}>
              <Text style={styles.orchestratorNoticeTitle}>Alerta do orquestrador</Text>
              <Text style={styles.orchestratorNoticeText}>
                {orchestratorNextAction.alerts[0]?.message}
              </Text>
            </View>
          ) : null}
          {relevantRegions.length ? (
            <View style={styles.contextHeaderRow}>
              <Text style={styles.contextHintText}>
                Foco clínico: {relevantRegions.map((r) => CLINICAL_REGION_LABELS[r]).join(", ")}
                {cadeiaProvavel ? ` • ${cadeiaProvavel}` : ""}
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
            Progresso: {regionalProgress.tested}/{regionalProgress.total} testados •{" "}
            {regionalProgress.pending} pendente(s)
          </Text>
          <Text style={styles.sectionHint}>
            Atalhos: aplique uma bateria sugerida e depois marque positivo/negativo.
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
              ]}
            >
              <View style={styles.regionTitleRow}>
                <Text style={styles.regionTitle}>{grupo.titulo}</Text>
                <View style={styles.regionHeaderActions}>
                  <Text
                    style={[
                      styles.regionStatusChip,
                      hasPending ? styles.regionStatusChipPending : styles.regionStatusChipDone,
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
                    <Text style={styles.regionApplyChipText}>Aplicar bateria basica</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {grupo.testes.map((teste) => (
                <View
                  key={`${grupo.regiao}-${teste.nome}`}
                  style={[
                    styles.regionTestRow,
                    teste.selecionado && styles.regionTestRowSelected,
                  ]}
                >
                  <View style={styles.regionTestHeader}>
                    <Text style={styles.regionTestName}>{teste.nome}</Text>
                    <TouchableOpacity
                      style={[
                        styles.regionSuggestToggle,
                        teste.selecionado && styles.regionSuggestToggleSelected,
                      ]}
                      onPress={() =>
                        setRegionalTestSelected(grupo.regiao, teste.nome, !teste.selecionado)
                      }
                    >
                      <Text
                        style={[
                          styles.regionSuggestToggleText,
                          teste.selecionado && styles.regionSuggestToggleTextSelected,
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
                          teste.resultado === option.value && styles.regionOptionSelected,
                        ]}
                        onPress={() =>
                          setRegionalTestResult(grupo.regiao, teste.nome, option.value)
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
          )})}
          {errors.avaliacaoRegioes ? (
            <Text style={styles.validationErrorText}>{errors.avaliacaoRegioes}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Integracao clinica final</Text>
          <Input
            label="Hipótese principal"
            value={exam.cruzamentoFinal.hipotesePrincipal}
            onChangeText={(v) => setField("cruzamentoFinal.hipotesePrincipal", v)}
            error={errors.hipotesePrincipal}
          />
          <Input
            label="Hipóteses secundárias"
            value={exam.cruzamentoFinal.hipotesesSecundarias}
            onChangeText={(v) => setField("cruzamentoFinal.hipotesesSecundarias", v)}
            multiline
            numberOfLines={3}
          />
          <Input
            label="Inconsistências"
            value={exam.cruzamentoFinal.inconsistencias}
            onChangeText={(v) => setField("cruzamentoFinal.inconsistencias", v)}
            multiline
            numberOfLines={3}
          />
          <Input
            label="Direção de conduta"
            value={exam.cruzamentoFinal.condutaDirecionada}
            onChangeText={(v) => setField("cruzamentoFinal.condutaDirecionada", v)}
            multiline
            numberOfLines={4}
            error={errors.conduta}
          />

          <Text style={styles.label}>Prioridade clínica</Text>
          <View style={styles.optionsRow}>
            {PRIORIDADE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, exam.cruzamentoFinal.prioridade === item && styles.chipSelected]}
                onPress={() =>
                  setExam({
                    ...exam,
                    cruzamentoFinal: { ...exam.cruzamentoFinal, prioridade: item },
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.cruzamentoFinal.prioridade === item && styles.chipTextSelected,
                  ]}
                >
                  {prettyEnum(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Raciocinio clinico (IA + profissional)</Text>
          <Input
            label="Origem provável da dor"
            value={exam.raciocinioClinico.origemProvavelDor}
            onChangeText={(v) => setField("raciocinioClinico.origemProvavelDor", v)}
            multiline
            numberOfLines={3}
          />
          <Input
            label="Estrutura envolvida"
            value={exam.raciocinioClinico.estruturaEnvolvida}
            onChangeText={(v) => setField("raciocinioClinico.estruturaEnvolvida", v)}
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
                  exam.raciocinioClinico.tipoLesao === item && styles.chipSelected,
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
          />
          <Input
            label="Relação com esporte"
            value={exam.raciocinioClinico.relacaoComEsporte}
            onChangeText={(v) => setField("raciocinioClinico.relacaoComEsporte", v)}
            multiline
            numberOfLines={3}
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
          />
          <Input
            label="Cadeia envolvida"
            value={exam.diagnosticoFuncionalIa.cadeiaEnvolvida}
            onChangeText={(v) => setField("diagnosticoFuncionalIa.cadeiaEnvolvida", v)}
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
                onPress={() => setField("diagnosticoFuncionalIa.cadeiaEnvolvida", item)}
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
          <Input
            label="Compensações"
            value={exam.diagnosticoFuncionalIa.compensacoes}
            onChangeText={(v) => setField("diagnosticoFuncionalIa.compensacoes", v)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>{t("clinical.sections.targetedTherapeuticConduct")}</Text>
          <Input
            label="Técnica manual indicada"
            value={exam.condutaIa.tecnicaManualIndicada}
            onChangeText={(v) => setField("condutaIa.tecnicaManualIndicada", v)}
            multiline
            numberOfLines={3}
          />
          <View style={styles.optionsRow}>
            {CONDUTA_PRESETS.tecnicaManual.map((item) => (
              <TouchableOpacity
                key={`conduta-tm-${item}`}
                style={[
                  styles.chip,
                  exam.condutaIa.tecnicaManualIndicada === item &&
                    styles.chipSelected,
                ]}
                onPress={() => setField("condutaIa.tecnicaManualIndicada", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.condutaIa.tecnicaManualIndicada === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Ajuste articular"
            value={exam.condutaIa.ajusteArticular}
            onChangeText={(v) => setField("condutaIa.ajusteArticular", v)}
            multiline
            numberOfLines={3}
          />
          <View style={styles.optionsRow}>
            {CONDUTA_PRESETS.ajusteArticular.map((item) => (
              <TouchableOpacity
                key={`conduta-aj-${item}`}
                style={[
                  styles.chip,
                  exam.condutaIa.ajusteArticular === item && styles.chipSelected,
                ]}
                onPress={() => setField("condutaIa.ajusteArticular", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.condutaIa.ajusteArticular === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Exercício corretivo"
            value={exam.condutaIa.exercicioCorretivo}
            onChangeText={(v) => setField("condutaIa.exercicioCorretivo", v)}
            multiline
            numberOfLines={3}
          />
          <View style={styles.optionsRow}>
            {CONDUTA_PRESETS.exercicio.map((item) => (
              <TouchableOpacity
                key={`conduta-ex-${item}`}
                style={[
                  styles.chip,
                  exam.condutaIa.exercicioCorretivo === item &&
                    styles.chipSelected,
                ]}
                onPress={() => setField("condutaIa.exercicioCorretivo", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.condutaIa.exercicioCorretivo === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Liberação miofascial"
            value={exam.condutaIa.liberacaoMiofascial}
            onChangeText={(v) => setField("condutaIa.liberacaoMiofascial", v)}
            multiline
            numberOfLines={3}
          />
          <View style={styles.optionsRow}>
            {CONDUTA_PRESETS.miofascial.map((item) => (
              <TouchableOpacity
                key={`conduta-mi-${item}`}
                style={[
                  styles.chip,
                  exam.condutaIa.liberacaoMiofascial === item &&
                    styles.chipSelected,
                ]}
                onPress={() => setField("condutaIa.liberacaoMiofascial", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.condutaIa.liberacaoMiofascial === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Progressão esportiva"
            value={exam.condutaIa.progressaoEsportiva}
            onChangeText={(v) => setField("condutaIa.progressaoEsportiva", v)}
            multiline
            numberOfLines={3}
          />
          <View style={styles.optionsRow}>
            {CONDUTA_PRESETS.progressao.map((item) => (
              <TouchableOpacity
                key={`conduta-pr-${item}`}
                style={[
                  styles.chip,
                  exam.condutaIa.progressaoEsportiva === item &&
                    styles.chipSelected,
                ]}
                onPress={() => setField("condutaIa.progressaoEsportiva", item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    exam.condutaIa.progressaoEsportiva === item &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Confiança da hipótese</Text>
          <Text style={styles.subtitle}>
            Calculada pelos testes positivos/sugeridos e passível de ajuste clínico manual.
          </Text>
          <View style={styles.optionsRow}>
            {CONFIANCA_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.cruzamentoFinal.confiancaHipotese === item && styles.chipSelected,
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
          <Text style={styles.statusText}>
            Score de evidência: {exam.cruzamentoFinal.scoreEvidencia}
          </Text>
          <Text style={styles.label}>Perfil de scoring</Text>
          <View style={styles.optionsRow}>
            {SCORING_PROFILE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  exam.cruzamentoFinal.perfilScoring === item && styles.chipSelected,
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
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>{t("clinical.sections.clinicalPreview")}</Text>
          <Input value={renderStructuredExameToText(exam)} multiline numberOfLines={12} editable={false} style={{ height: 300, textAlignVertical: "top" }} />
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
              <Text style={styles.actionChipText}>{t("clinical.actions.clearDraft")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            exam.redFlags.criticalTriggered
              ? t("clinical.actions.saveTriageAndRefer")
              : t("clinical.actions.savePhysicalExam")
          }
          onPress={handleSave}
          loading={loading}
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
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
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
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + "15",
  },
  actionChipText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONTS.sizes.xs,
  },
  footer: {
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
  classificationSuggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  classificationSuggestionText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  classificationSuggestionButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  classificationSuggestionButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
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
    marginBottom: 6,
    fontWeight: "600",
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






