// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANAMNESE FORM SCREEN
// ==========================================

import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Button,
  Input,
  BodyMap,
  PainScale,
  useToast,
} from "../../components/ui";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { usePacienteStore } from "../../stores/pacienteStore";
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
  AreaAfetada,
  MotivoBusca,
  InicioProblema,
  TipoDor,
  MecanismoLesao,
  Anamnese,
  FenotipoDorEvidencias,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { parseJsonObject } from "../../utils/safeJson";
import { useLanguage } from "../../i18n/LanguageProvider";
import { trackEvent } from "../../services";
import {
  appendUniqueClinicalText,
  inferQuickAnamneseVoiceInsight,
  mergePresetText,
  uniqueVoiceValues,
} from "../../utils/anamneseVoice";

type AnamneseFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AnamneseForm">;
  route: RouteProp<RootStackParamList, "AnamneseForm">;
};

type IconName = keyof typeof Ionicons.glyphMap;
const QUICK_ANAMNESE_DICTATION_FIELD = "__quick_anamnese_dictation__";

const removeLocalPainIntensity = (areas: AreaAfetada[] = []): AreaAfetada[] =>
  areas.map((area) => ({
    regiao: area.regiao,
    lado: area.lado,
    vista: area.vista,
    observacao: area.observacao,
  }));

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SelectOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const TRATAMENTOS = [
  "Medicamentos",
  "Cirurgia",
  "Fisioterapia",
  "Terapia manual",
  "Exercícios terapêuticos",
  "Fortalecimento",
  "Alongamentos",
  "Pilates clínico",
  "Outros",
];

const HUMORES_PREDOMINANTES = [
  "Calmo(a)",
  "Ansioso(a)",
  "Irritável",
  "Triste",
  "Oscilando",
  "Bem disposto(a)",
];

const HORAS_SONO_PRESETS = ["<5h", "5-6h", "6-7h", "7-8h", "8h+"];
const FREQ_ATIVIDADE_PRESETS = [
  "1-2x/semana",
  "3x/semana",
  "4-5x/semana",
  "Diária",
];
const HORA_INTENSIFICA_PRESETS = [
  "Ao acordar",
  "Manhã",
  "Tarde",
  "Noite",
  "Fim do dia",
  "Após esforço",
  "Após trabalho",
];
const FATOR_ALIVIO_PRESETS = [
  "Repouso",
  "Calor",
  "Alongamento",
  "Medicamento",
  "Massagem",
  "Mudança de posição",
  "Movimento leve",
];
const FATORES_PIORA_PRESETS = [
  "Esforço físico",
  "Carga repetitiva",
  "Postura mantida",
  "Impacto",
  "Movimento brusco",
  "Sedentarismo",
  "Estresse",
];
const LIMITACOES_PRESETS = [
  "Sentar",
  "Caminhar",
  "Dormir",
  "Trabalhar",
  "Subir escadas",
  "Dirigir",
  "Agachar",
];
const ATIVIDADES_PIORAM_PRESETS = [
  "Levantar peso",
  "Ficar sentado",
  "Ficar em pé",
  "Caminhar",
  "Subir escadas",
  "Exercício",
  "Dirigir",
];
const META_PACIENTE_PRESETS = [
  "Reduzir dor",
  "Voltar a caminhar sem dor",
  "Dormir melhor",
  "Voltar ao trabalho com conforto",
  "Retomar exercícios físicos",
  "Melhorar mobilidade funcional",
];
const TIPO_DOR_PRESETS = [
  { label: "Mecânica", value: TipoDor.MECANICA },
  { label: "Inflamatória", value: TipoDor.INFLAMATORIA },
  { label: "Neuropática", value: TipoDor.NEUROPATICA },
  { label: "Mista", value: TipoDor.MISTA },
];

const FENOTIPO_DOR_QUESTIONS: Array<{
  key: string;
  label: string;
  group: "nociceptiva" | "neuropatica" | "nociplastica";
}> = [
  { key: "dorLocalizada", label: "Aponta exatamente onde doi", group: "nociceptiva" },
  { key: "pioraMovimentoEsforco", label: "Piora com movimento/esforco", group: "nociceptiva" },
  { key: "melhoraRepouso", label: "Melhora com repouso", group: "nociceptiva" },
  { key: "inicioAposEsforcoLesao", label: "Comecou apos esforco/lesao", group: "nociceptiva" },
  { key: "dorReproduzidaPalpacao", label: "Pressao/palpacao reproduz", group: "nociceptiva" },
  { key: "irradiacaoTrajeto", label: "Corre para braco/perna/mao/pe", group: "neuropatica" },
  { key: "choqueFormigamentoQueimacao", label: "Choque, formigamento ou queimacao", group: "neuropatica" },
  { key: "dormenciaAlteracaoToque", label: "Dormencia ou toque diferente", group: "neuropatica" },
  { key: "pioraPosicaoNeural", label: "Piora sentado, dobrando ou virando", group: "neuropatica" },
  { key: "dorMultirregionalMigratoria", label: "Dor muda de lugar ou varias regioes", group: "nociplastica" },
  { key: "dorDesproporcionalPersistente", label: "Dor desproporcional ou nao melhora", group: "nociplastica" },
  { key: "sonoRuimNaoReparador", label: "Sono ruim ou acorda cansado", group: "nociplastica" },
  { key: "cansacoFrequente", label: "Cansaco frequente", group: "nociplastica" },
  { key: "estresseElevado", label: "Estresse elevado", group: "nociplastica" },
  { key: "examesNormaisDorPersistente", label: "Exames normais e dor continua", group: "nociplastica" },
];
const RED_FLAGS_PRESETS = [
  "Febre",
  "Perda de peso inexplicada",
  "Historico de cancer",
  "Trauma grave",
  "Deficit neurologico",
];
const YELLOW_FLAGS_PRESETS = [
  "Medo de movimento",
  "Ansiedade",
  "Estresse",
  "Baixa adesão prévia",
];

const AREA_LABELS: Record<string, string> = {
  cabeca: "Cabeça",
  pescoco: "Pescoço",
  ombro: "Ombro",
  braco: "Braço",
  cotovelo: "Cotovelo",
  antebraco: "Antebraço",
  punho_mao: "Punho/Mão",
  coluna_cervical: "Coluna cervical",
  coluna_toracica: "Coluna torácica",
  coluna_lombar: "Coluna lombar",
  sacro: "Sacro",
  quadril: "Coxofemoral",
  coxofemoral: "Coxofemoral",
  gluteo: "Glúteo",
  coxa: "Coxa",
  posterior_coxa: "Posterior coxa",
  joelho: "Joelho",
  popliteo: "Poplíteo",
  tibial_anterior: "Tibial anterior",
  panturrilha: "Panturrilha",
  tornozelo_pe: "Tornozelo/Pé",
  torax: "Tórax",
  abdomen: "Abdômen",
};

const IRRADIATION_CHAINS: Record<string, string[]> = {
  pescoco: ["ombro", "braco", "cotovelo", "antebraco", "punho_mao"],
  coluna_cervical: ["ombro", "braco", "cotovelo", "antebraco", "punho_mao"],
  ombro: ["braco", "cotovelo", "antebraco", "punho_mao"],
  braco: ["cotovelo", "antebraco", "punho_mao"],
  cotovelo: ["antebraco", "punho_mao"],
  antebraco: ["punho_mao"],
  coluna_lombar: ["sacro", "coxofemoral", "gluteo", "coxa", "posterior_coxa", "joelho", "popliteo", "tibial_anterior", "panturrilha", "tornozelo_pe"],
  sacro: ["gluteo", "coxofemoral", "coxa", "posterior_coxa", "joelho", "popliteo", "panturrilha", "tornozelo_pe"],
  quadril: ["coxa", "posterior_coxa", "joelho", "popliteo", "tibial_anterior", "panturrilha", "tornozelo_pe"],
  coxofemoral: ["coxa", "posterior_coxa", "joelho", "popliteo", "tibial_anterior", "panturrilha", "tornozelo_pe"],
  gluteo: ["posterior_coxa", "popliteo", "panturrilha", "tornozelo_pe"],
  coxa: ["joelho", "popliteo", "tibial_anterior", "panturrilha", "tornozelo_pe"],
  posterior_coxa: ["popliteo", "panturrilha", "tornozelo_pe"],
  joelho: ["tibial_anterior", "panturrilha", "tornozelo_pe"],
  popliteo: ["panturrilha", "tornozelo_pe"],
  tibial_anterior: ["tornozelo_pe"],
  panturrilha: ["tornozelo_pe"],
};

type LateralSide = Extract<AreaAfetada["lado"], "direito" | "esquerdo">;

const LATERAL_SIDES: LateralSide[] = ["direito", "esquerdo"];

const FEMININE_SIDE_LABEL_AREAS = new Set([
  "cabeca",
  "coluna_cervical",
  "coluna_toracica",
  "coluna_lombar",
  "coxa",
  "posterior_coxa",
  "panturrilha",
  "tibial_anterior",
]);

const formatSideLabel = (areaId: string, lado: LateralSide) => {
  const isFeminine = FEMININE_SIDE_LABEL_AREAS.has(areaId);
  if (lado === "direito") return isFeminine ? "direita" : "direito";
  return isFeminine ? "esquerda" : "esquerdo";
};

const formatAreaWithSide = (areaId: string, lado?: AreaAfetada["lado"]) => {
  const label = AREA_LABELS[areaId] || areaId;
  if (lado === "esquerdo" || lado === "direito") {
    return `${label} ${formatSideLabel(areaId, lado)}`;
  }
  if (lado === "ambos") return `${label} bilateral`;
  return label;
};

const getIrradiationSuggestionSides = (
  area: AreaAfetada,
  areas: AreaAfetada[],
  destinations: string[],
): LateralSide[] => {
  if (area.lado === "direito" || area.lado === "esquerdo") {
    return [area.lado];
  }

  const relatedRegions = new Set([area.regiao, ...destinations]);
  const selectedRelatedSides = LATERAL_SIDES.filter((side) =>
    areas.some(
      (candidate) =>
        candidate !== area &&
        candidate.lado === side &&
        relatedRegions.has(candidate.regiao),
    ),
  );

  return selectedRelatedSides.length > 0 ? selectedRelatedSides : LATERAL_SIDES;
};

const buildIrradiationSuggestions = (areas: AreaAfetada[]) => {
  const seen = new Set<string>();
  return areas.flatMap((area) => {
    const destinations = IRRADIATION_CHAINS[area.regiao] || [];
    const sides = getIrradiationSuggestionSides(area, areas, destinations);
    return destinations.flatMap((destination) =>
      sides
        .map((side) => {
          const value = `${formatAreaWithSide(area.regiao, side)} -> ${formatAreaWithSide(
            destination,
            side,
          )}`;
          if (seen.has(value)) return null;
          seen.add(value);
          return value;
        })
        .filter(Boolean),
    ) as string[];
  });
};

export function AnamneseFormScreen({
  navigation,
  route,
}: AnamneseFormScreenProps) {
  const { t } = useLanguage();
  const VOICE_ENABLED = FEATURE_FLAGS.speechToText;
  const { pacienteId, anamneseId, selfMode, pacienteNome } = route.params;
  const isSelfMode = selfMode === true;
  const { getPacienteById } = usePacienteStore();
  const {
    createAnamnese,
    getAnamneseById,
    fetchAnamnesesByPaciente,
    fetchMyLatestAnamnese,
    createMyAnamnese,
  } = useAnamneseStore();
  const { showToast } = useToast();
  const paciente = isSelfMode
    ? {
        id: pacienteId,
        nomeCompleto: pacienteNome || t("home.user"),
      }
    : getPacienteById(pacienteId);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (isSelfMode) {
      navigation.navigate("PacienteHome");
      return;
    }

    if (paciente) {
      navigation.navigate("PacienteDetails", { pacienteId });
      return;
    }

    navigation.navigate("PacientesList");
  };

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAnamneseId, setCurrentAnamneseId] = useState<
    string | undefined
  >(anamneseId);
  const isViewingRecordedAnamnese = !!currentAnamneseId;

  const [motivoBusca, setMotivoBusca] = useState<MotivoBusca | null>(null);
  const [areasAfetadas, setAreasAfetadas] = useState<AreaAfetada[]>([]);
  const [intensidadeDor, setIntensidadeDor] = useState(0);

  const [descricaoSintomas, setDescricaoSintomas] = useState("");
  const [tempoProblema, setTempoProblema] = useState("");
  const [horaIntensifica, setHoraIntensifica] = useState("");
  const [inicioProblema, setInicioProblema] = useState<InicioProblema | null>(
    null,
  );
  const [eventoEspecifico, setEventoEspecifico] = useState("");
  const [fatorAlivio, setFatorAlivio] = useState("");
  const [mecanismoLesao, setMecanismoLesao] =
    useState<MecanismoLesao | null>(null);
  const [fatoresPiora, setFatoresPiora] = useState("");

  const [dorRepouso, setDorRepouso] = useState<boolean | null>(null);
  const [dorNoturna, setDorNoturna] = useState<boolean | null>(null);
  const [irradiacao, setIrradiacao] = useState<boolean | null>(null);
  const [localIrradiacao, setLocalIrradiacao] = useState("");
  const [tipoDor, setTipoDor] = useState<TipoDor | null>(null);
  const [fenotipoDorEvidencias, setFenotipoDorEvidencias] =
    useState<FenotipoDorEvidencias>({});
  const [sinaisSensibilizacaoCentral, setSinaisSensibilizacaoCentral] =
    useState("");
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [yellowFlags, setYellowFlags] = useState<string[]>([]);

  const [problemaAnterior, setProblemaAnterior] = useState<boolean | null>(
    null,
  );
  const [quandoProblemaAnterior, setQuandoProblemaAnterior] = useState("");
  const [tratamentosAnteriores, setTratamentosAnteriores] = useState<string[]>(
    [],
  );
  const [lesoesPrevias, setLesoesPrevias] = useState("");
  const [usoMedicamentos, setUsoMedicamentos] = useState("");
  const [limitacoesFuncionais, setLimitacoesFuncionais] = useState("");
  const [atividadesQuePioram, setAtividadesQuePioram] = useState("");
  const [metaPrincipalPaciente, setMetaPrincipalPaciente] = useState("");
  const [horasSonoMedia, setHorasSonoMedia] = useState("");
  const [qualidadeSono, setQualidadeSono] = useState(0);
  const [nivelEstresse, setNivelEstresse] = useState(0);
  const [humoresPredominantes, setHumoresPredominantes] = useState<string[]>(
    [],
  );
  const [energiaDiaria, setEnergiaDiaria] = useState(0);
  const [atividadeFisicaRegular, setAtividadeFisicaRegular] = useState<
    boolean | null
  >(null);
  const [frequenciaAtividadeFisica, setFrequenciaAtividadeFisica] =
    useState("");
  const [apoioEmocional, setApoioEmocional] = useState(0);
  const [observacoesEstiloVida, setObservacoesEstiloVida] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [lastQuickVoiceSummary, setLastQuickVoiceSummary] = useState<
    string | null
  >(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasPersistedAnamnese, setHasPersistedAnamnese] = useState(false);
  const [lastPersistedSavedAt, setLastPersistedSavedAt] = useState<string | null>(
    null,
  );
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [stepsContainerWidth, setStepsContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const didSaveRef = useRef(false);
  const currentStepRef = useRef(0);
  const stageOpenedAtRef = useRef<number>(Date.now());

  const draftKey = isSelfMode
    ? `draft:anamnese:self:${pacienteId}:${currentAnamneseId || "new"}`
    : `draft:anamnese:${pacienteId}:${currentAnamneseId || "new"}`;
  const draftTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const irradiationSuggestions = buildIrradiationSuggestions(areasAfetadas);

  const inferTipoDorFromFenotipo = (evidencias: FenotipoDorEvidencias) => {
    const score = FENOTIPO_DOR_QUESTIONS.reduce(
      (acc, item) => {
        if (evidencias[item.key]) acc[item.group] += 1;
        return acc;
      },
      { nociceptiva: 0, neuropatica: 0, nociplastica: 0 },
    );
    if (score.neuropatica >= 2 && score.neuropatica >= score.nociceptiva) {
      return TipoDor.NEUROPATICA;
    }
    if (score.nociplastica >= 3) return TipoDor.MISTA;
    if (score.nociceptiva >= 2) return TipoDor.MECANICA;
    return null;
  };

  const toggleFenotipoDorEvidence = (key: string) => {
    setFenotipoDorEvidencias((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const inferred = inferTipoDorFromFenotipo(next);
      if (inferred) setTipoDor(inferred);
      return next;
    });

    const willEnable = !fenotipoDorEvidencias[key];
    if (!willEnable) return;
    if (key === "irradiacaoTrajeto") setIrradiacao(true);
    if (key === "sonoRuimNaoReparador" && qualidadeSono === 0) {
      setQualidadeSono(4);
    }
    if (key === "cansacoFrequente" && energiaDiaria === 0) {
      setEnergiaDiaria(4);
    }
    if (key === "estresseElevado" && nivelEstresse < 7) {
      setNivelEstresse(7);
    }
  };

  const steps: Array<{ title: string; icon: IconName }> = [
    { title: "Queixa principal", icon: "body-outline" },
    { title: "Descrição", icon: "document-text-outline" },
    { title: "Histórico", icon: "time-outline" },
    { title: "Estilo de vida", icon: "heart-outline" },
  ];
  const isCompactStepper = stepsContainerWidth > 0 && stepsContainerWidth < 560;

  const handleStepsLayout = (event: LayoutChangeEvent) => {
    setStepsContainerWidth(event.nativeEvent.layout.width);
  };

  const appendText = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter((prev) => (prev ? `${prev} ${value}` : value));
  };

  const parsePresetValues = (value: string) =>
    value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const togglePresetInText = (currentValue: string, preset: string) => {
    const values = parsePresetValues(currentValue);

    if (values.includes(preset)) {
      return values.filter((item) => item !== preset).join(", ");
    }

    return [...values, preset].join(", ");
  };

  const toggleIrradiationSuggestion = (suggestion: string) => {
    setIrradiacao(true);
    setLocalIrradiacao((current) => togglePresetInText(current, suggestion));
    if (errors.localIrradiacao) {
      setErrors((prev) => ({ ...prev, localIrradiacao: "" }));
    }
  };

  const mergeVoiceArea = (current: AreaAfetada[], nextArea?: AreaAfetada) => {
    if (!nextArea) return current;

    const exists = current.some(
      (area) =>
        area.regiao === nextArea.regiao &&
        (area.lado || "") === (nextArea.lado || ""),
    );

    if (exists) {
      return current.map((area) => {
        if (
          area.regiao !== nextArea.regiao ||
          (area.lado || "") !== (nextArea.lado || "")
        ) {
          return area;
        }

        return {
          ...area,
          observacao: appendUniqueClinicalText(
            area.observacao || "",
            nextArea.observacao || "",
          ),
        };
      });
    }

    return [...current, nextArea];
  };

  const clearQuickVoiceErrors = (fields: string[]) => {
    if (!fields.length) return;

    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = "";
      });
      return next;
    });
  };

  const applyQuickAnamneseVoiceInsight = (text: string) => {
    const insight = inferQuickAnamneseVoiceInsight(text);
    const touchedErrorFields = new Set<string>(["descricaoSintomas"]);

    if (insight.motivoBusca) {
      setMotivoBusca(insight.motivoBusca);
      touchedErrorFields.add("motivoBusca");
    }

    setDescricaoSintomas((current) =>
      appendUniqueClinicalText(current, insight.descricaoSintomas || text),
    );

    if (insight.area) {
      setAreasAfetadas((current) => mergeVoiceArea(current, insight.area));
      touchedErrorFields.add("areasAfetadas");
    }

    if (typeof insight.intensidadeDor === "number") {
      setIntensidadeDor(insight.intensidadeDor);
      touchedErrorFields.add("intensidadeDor");
    }

    if (insight.tempoProblema) {
      setTempoProblema((current) =>
        appendUniqueClinicalText(current, insight.tempoProblema || ""),
      );
      touchedErrorFields.add("tempoProblema");
    }

    if (insight.horaIntensifica.length) {
      setHoraIntensifica((current) =>
        mergePresetText(current, insight.horaIntensifica),
      );
      touchedErrorFields.add("horaIntensifica");
    }

    if (insight.inicioProblema) {
      setInicioProblema((current) => current || insight.inicioProblema || null);
      touchedErrorFields.add("inicioProblema");
    }

    if (insight.eventoEspecifico) {
      setEventoEspecifico((current) =>
        appendUniqueClinicalText(current, insight.eventoEspecifico || ""),
      );
    }

    if (insight.fatorAlivio.length) {
      setFatorAlivio((current) => mergePresetText(current, insight.fatorAlivio));
      touchedErrorFields.add("fatorAlivio");
    }

    if (insight.mecanismoLesao) {
      setMecanismoLesao((current) => current || insight.mecanismoLesao || null);
      touchedErrorFields.add("mecanismoLesao");
    }

    if (insight.fatoresPiora.length) {
      setFatoresPiora((current) =>
        mergePresetText(current, insight.fatoresPiora),
      );
      touchedErrorFields.add("fatoresPiora");
    }

    if (typeof insight.dorRepouso === "boolean") {
      setDorRepouso((current) => current ?? insight.dorRepouso ?? null);
    }

    if (typeof insight.dorNoturna === "boolean") {
      setDorNoturna((current) => current ?? insight.dorNoturna ?? null);
    }

    if (typeof insight.irradiacao === "boolean") {
      setIrradiacao(insight.irradiacao);
      if (insight.localIrradiacao) {
        setLocalIrradiacao((current) =>
          appendUniqueClinicalText(current, insight.localIrradiacao || ""),
        );
        touchedErrorFields.add("localIrradiacao");
      }
    }

    if (insight.tipoDor) {
      setTipoDor((current) => current || insight.tipoDor || null);
    }

    if (insight.limitacoesFuncionais.length) {
      setLimitacoesFuncionais((current) =>
        mergePresetText(current, insight.limitacoesFuncionais),
      );
    }

    if (insight.atividadesQuePioram.length) {
      setAtividadesQuePioram((current) =>
        mergePresetText(current, insight.atividadesQuePioram),
      );
    }

    if (insight.metaPrincipalPaciente) {
      setMetaPrincipalPaciente((current) =>
        appendUniqueClinicalText(current, insight.metaPrincipalPaciente || ""),
      );
    }

    if (insight.redFlags.length) {
      setRedFlags((current) =>
        uniqueVoiceValues([...current, ...insight.redFlags]),
      );
    }

    if (insight.yellowFlags.length) {
      setYellowFlags((current) =>
        uniqueVoiceValues([...current, ...insight.yellowFlags]),
      );
    }

    clearQuickVoiceErrors([...touchedErrorFields]);
    setLastQuickVoiceSummary(
      `Preenchido por voz: ${insight.appliedFields.join(", ") || "descrição"}.`,
    );
    showToast({
      message: "Anamnese preenchida com ditado rápido.",
      type: "success",
    });
  };

  const { isRecording, partial, start, stop } = useSpeechToText({
    enabled: VOICE_ENABLED,
    onResult: (text) => {
      if (!activeField) return;

      if (activeField === QUICK_ANAMNESE_DICTATION_FIELD) {
        applyQuickAnamneseVoiceInsight(text);
        setActiveField(null);
        return;
      }

      switch (activeField) {
        case "descricaoSintomas":
          appendText(setDescricaoSintomas, text);
          break;
        case "tempoProblema":
          appendText(setTempoProblema, text);
          break;
        case "horaIntensifica":
          appendText(setHoraIntensifica, text);
          break;
        case "eventoEspecifico":
          appendText(setEventoEspecifico, text);
          break;
        case "fatorAlivio":
          appendText(setFatorAlivio, text);
          break;
        case "fatoresPiora":
          appendText(setFatoresPiora, text);
          break;
        case "localIrradiacao":
          appendText(setLocalIrradiacao, text);
          break;
        case "sinaisSensibilizacaoCentral":
          appendText(setSinaisSensibilizacaoCentral, text);
          break;
        case "quandoProblemaAnterior":
          appendText(setQuandoProblemaAnterior, text);
          break;
        case "lesoesPrevias":
          appendText(setLesoesPrevias, text);
          break;
        case "usoMedicamentos":
          appendText(setUsoMedicamentos, text);
          break;
        case "limitacoesFuncionais":
          appendText(setLimitacoesFuncionais, text);
          break;
        case "atividadesQuePioram":
          appendText(setAtividadesQuePioram, text);
          break;
        case "metaPrincipalPaciente":
          appendText(setMetaPrincipalPaciente, text);
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

  const applyAnamneseToForm = (anamnese: Anamnese) => {
    setCurrentAnamneseId(anamnese.id);
    setLastPersistedSavedAt(anamnese.updatedAt || anamnese.createdAt || null);
    setMotivoBusca(anamnese.motivoBusca);
    setAreasAfetadas(removeLocalPainIntensity(anamnese.areasAfetadas || []));
    setIntensidadeDor(anamnese.intensidadeDor || 0);
    setDescricaoSintomas(anamnese.descricaoSintomas || "");
    setTempoProblema(anamnese.tempoProblema || "");
    setHoraIntensifica(anamnese.horaIntensifica || "");
    setInicioProblema(anamnese.inicioProblema || null);
    setEventoEspecifico(anamnese.eventoEspecifico || "");
    setFatorAlivio(anamnese.fatorAlivio || "");
    setMecanismoLesao(anamnese.mecanismoLesao || null);
    setFatoresPiora(anamnese.fatoresPiora || "");
    setDorRepouso(
      typeof anamnese.dorRepouso === "boolean" ? anamnese.dorRepouso : null,
    );
    setDorNoturna(
      typeof anamnese.dorNoturna === "boolean" ? anamnese.dorNoturna : null,
    );
    setIrradiacao(
      typeof anamnese.irradiacao === "boolean" ? anamnese.irradiacao : null,
    );
    setLocalIrradiacao(anamnese.localIrradiacao || "");
    setTipoDor(anamnese.tipoDor || null);
    setFenotipoDorEvidencias(anamnese.fenotipoDorEvidencias || {});
    setSinaisSensibilizacaoCentral(anamnese.sinaisSensibilizacaoCentral || "");
    setRedFlags(anamnese.redFlags || []);
    setYellowFlags(anamnese.yellowFlags || []);
    setProblemaAnterior(
      typeof anamnese.problemaAnterior === "boolean"
        ? anamnese.problemaAnterior
        : false,
    );
    setQuandoProblemaAnterior(anamnese.quandoProblemaAnterior || "");
    setTratamentosAnteriores(anamnese.tratamentosAnteriores || []);
    setLesoesPrevias(anamnese.lesoesPrevias || "");
    setUsoMedicamentos(anamnese.usoMedicamentos || "");
    setLimitacoesFuncionais(anamnese.limitacoesFuncionais || "");
    setAtividadesQuePioram(anamnese.atividadesQuePioram || "");
    setMetaPrincipalPaciente(anamnese.metaPrincipalPaciente || "");
    setHorasSonoMedia(anamnese.horasSonoMedia || "");
    setQualidadeSono(anamnese.qualidadeSono || 0);
    setNivelEstresse(anamnese.nivelEstresse || 0);
    setHumoresPredominantes(
      anamnese.humorPredominante
        ? parsePresetValues(anamnese.humorPredominante)
        : [],
    );
    setEnergiaDiaria(anamnese.energiaDiaria || 0);
    setAtividadeFisicaRegular(
      typeof anamnese.atividadeFisicaRegular === "boolean"
        ? anamnese.atividadeFisicaRegular
        : null,
    );
    setFrequenciaAtividadeFisica(anamnese.frequenciaAtividadeFisica || "");
    setApoioEmocional(anamnese.apoioEmocional || 0);
    setObservacoesEstiloVida(anamnese.observacoesEstiloVida || "");
  };

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
    let mounted = true;

    const loadExistingAnamnese = async () => {
      if (currentAnamneseId) {
        let anamnese = getAnamneseById(currentAnamneseId);
        if (!anamnese && !isSelfMode) {
          await fetchAnamnesesByPaciente(pacienteId).catch(() => undefined);
          anamnese = getAnamneseById(currentAnamneseId);
        }
        if (anamnese && mounted) {
          applyAnamneseToForm(anamnese);
          setHasPersistedAnamnese(true);
        } else if (mounted) {
          setHasPersistedAnamnese(false);
        }
        setDraftLoaded(true);
        return;
      }

      if (isSelfMode) {
        try {
          const latest = await fetchMyLatestAnamnese();
          if (latest && mounted) {
            applyAnamneseToForm(latest);
            setHasPersistedAnamnese(true);
          } else if (mounted) {
            setHasPersistedAnamnese(false);
          }
        } catch {
          // ignore latest load errors; screen remains usable for new submission
          if (mounted) {
            setHasPersistedAnamnese(false);
          }
        } finally {
          if (mounted) {
            setDraftLoaded(true);
          }
        }
        return;
      }

      try {
        await fetchAnamnesesByPaciente(pacienteId);
        const latest = [...useAnamneseStore.getState().anamneses]
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt || 0).getTime() -
              new Date(a.updatedAt || a.createdAt || 0).getTime(),
          )[0];
        if (latest && mounted) {
          applyAnamneseToForm(latest);
          setHasPersistedAnamnese(true);
        } else if (mounted) {
          setHasPersistedAnamnese(false);
        }
      } catch {
        if (mounted) {
          setHasPersistedAnamnese(false);
        }
      } finally {
        if (mounted) {
          setDraftLoaded(true);
        }
      }
    };

    loadExistingAnamnese();

    return () => {
      mounted = false;
    };
  }, [
    currentAnamneseId,
    fetchAnamnesesByPaciente,
    fetchMyLatestAnamnese,
    getAnamneseById,
    isSelfMode,
    pacienteId,
  ]);

  useEffect(() => {
    const loadDraft = async () => {
      if (hasPersistedAnamnese) {
        setDraftLoaded(true);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (!raw) {
          setDraftLoaded(true);
          return;
        }
        const draft = parseJsonObject<{
          motivoBusca?: MotivoBusca | null;
          areasAfetadas?: AreaAfetada[];
          intensidadeDor?: number;
          descricaoSintomas?: string;
          tempoProblema?: string;
          horaIntensifica?: string;
          inicioProblema?: InicioProblema | null;
          eventoEspecifico?: string;
          fatorAlivio?: string;
          mecanismoLesao?: MecanismoLesao | null;
          fatoresPiora?: string;
          dorRepouso?: boolean | null;
          dorNoturna?: boolean | null;
          irradiacao?: boolean | null;
          localIrradiacao?: string;
          tipoDor?: TipoDor | null;
          fenotipoDorEvidencias?: FenotipoDorEvidencias;
          sinaisSensibilizacaoCentral?: string;
          problemaAnterior?: boolean | null;
          quandoProblemaAnterior?: string;
          tratamentosAnteriores?: string[];
          lesoesPrevias?: string;
          usoMedicamentos?: string;
          limitacoesFuncionais?: string;
          atividadesQuePioram?: string;
          metaPrincipalPaciente?: string;
          horasSonoMedia?: string;
          qualidadeSono?: number;
          nivelEstresse?: number;
          humorPredominante?: string;
          humoresPredominantes?: string[];
          energiaDiaria?: number;
          atividadeFisicaRegular?: boolean | null;
          frequenciaAtividadeFisica?: string;
          apoioEmocional?: number;
          observacoesEstiloVida?: string;
          currentStep?: number;
          lastEditedAt?: string;
        }>(raw);
        if (!draft) return;

        if (draft.motivoBusca !== undefined) setMotivoBusca(draft.motivoBusca);
        if (draft.areasAfetadas) {
          setAreasAfetadas(removeLocalPainIntensity(draft.areasAfetadas));
        }
        if (typeof draft.intensidadeDor === "number")
          setIntensidadeDor(draft.intensidadeDor);
        if (draft.descricaoSintomas)
          setDescricaoSintomas(draft.descricaoSintomas);
        if (draft.tempoProblema) setTempoProblema(draft.tempoProblema);
        if (draft.horaIntensifica) setHoraIntensifica(draft.horaIntensifica);
        if (draft.inicioProblema !== undefined)
          setInicioProblema(draft.inicioProblema ?? null);
        if (draft.eventoEspecifico) setEventoEspecifico(draft.eventoEspecifico);
        if (draft.fatorAlivio) setFatorAlivio(draft.fatorAlivio);
        if (draft.mecanismoLesao !== undefined)
          setMecanismoLesao(draft.mecanismoLesao ?? null);
        if (draft.fatoresPiora) setFatoresPiora(draft.fatoresPiora);
        if (draft.dorRepouso !== undefined)
          setDorRepouso(draft.dorRepouso ?? null);
        if (draft.dorNoturna !== undefined)
          setDorNoturna(draft.dorNoturna ?? null);
        if (draft.irradiacao !== undefined)
          setIrradiacao(draft.irradiacao ?? null);
        if (draft.localIrradiacao) setLocalIrradiacao(draft.localIrradiacao);
        if (draft.tipoDor !== undefined) setTipoDor(draft.tipoDor ?? null);
        if (draft.fenotipoDorEvidencias)
          setFenotipoDorEvidencias(draft.fenotipoDorEvidencias);
        if (draft.sinaisSensibilizacaoCentral)
          setSinaisSensibilizacaoCentral(draft.sinaisSensibilizacaoCentral);
        if (draft.problemaAnterior !== undefined)
          setProblemaAnterior(draft.problemaAnterior);
        if (draft.quandoProblemaAnterior)
          setQuandoProblemaAnterior(draft.quandoProblemaAnterior);
        if (draft.tratamentosAnteriores)
          setTratamentosAnteriores(draft.tratamentosAnteriores);
        if (draft.lesoesPrevias) setLesoesPrevias(draft.lesoesPrevias);
        if (draft.usoMedicamentos) setUsoMedicamentos(draft.usoMedicamentos);
        if (draft.limitacoesFuncionais)
          setLimitacoesFuncionais(draft.limitacoesFuncionais);
        if (draft.atividadesQuePioram)
          setAtividadesQuePioram(draft.atividadesQuePioram);
        if (draft.metaPrincipalPaciente)
          setMetaPrincipalPaciente(draft.metaPrincipalPaciente);
        if (draft.horasSonoMedia) setHorasSonoMedia(draft.horasSonoMedia);
        if (typeof draft.qualidadeSono === "number")
          setQualidadeSono(draft.qualidadeSono);
        if (typeof draft.nivelEstresse === "number")
          setNivelEstresse(draft.nivelEstresse);
        if (Array.isArray(draft.humoresPredominantes)) {
          setHumoresPredominantes(draft.humoresPredominantes);
        } else if (draft.humorPredominante) {
          setHumoresPredominantes(parsePresetValues(draft.humorPredominante));
        }
        if (typeof draft.energiaDiaria === "number")
          setEnergiaDiaria(draft.energiaDiaria);
        if (draft.atividadeFisicaRegular !== undefined)
          setAtividadeFisicaRegular(draft.atividadeFisicaRegular);
        if (draft.frequenciaAtividadeFisica)
          setFrequenciaAtividadeFisica(draft.frequenciaAtividadeFisica);
        if (typeof draft.apoioEmocional === "number")
          setApoioEmocional(draft.apoioEmocional);
        if (draft.observacoesEstiloVida)
          setObservacoesEstiloVida(draft.observacoesEstiloVida);
        if (typeof draft.currentStep === "number")
          setCurrentStep(draft.currentStep);
        if (draft.lastEditedAt) {
          setLastDraftSavedAt(draft.lastEditedAt);
        }
      } catch {
        // ignore draft load errors
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [currentAnamneseId, draftKey, hasPersistedAnamnese, pacienteId]);

  useEffect(() => {
    if (!draftLoaded) return;
    const buildDraftPayload = () => ({
      lastEditedAt: new Date().toISOString(),
      motivoBusca,
      areasAfetadas,
      intensidadeDor,
      descricaoSintomas,
      tempoProblema,
      horaIntensifica,
      inicioProblema,
      eventoEspecifico,
      fatorAlivio,
      mecanismoLesao,
      fatoresPiora,
      dorRepouso,
      dorNoturna,
      irradiacao,
      localIrradiacao,
      tipoDor,
      fenotipoDorEvidencias,
      sinaisSensibilizacaoCentral,
      problemaAnterior,
      quandoProblemaAnterior,
      tratamentosAnteriores,
      lesoesPrevias,
      usoMedicamentos,
      limitacoesFuncionais,
      atividadesQuePioram,
      metaPrincipalPaciente,
      horasSonoMedia,
      qualidadeSono,
      nivelEstresse,
      humorPredominante: humoresPredominantes.join(", "),
      humoresPredominantes,
      energiaDiaria,
      atividadeFisicaRegular,
      frequenciaAtividadeFisica,
      apoioEmocional,
      observacoesEstiloVida,
      currentStep,
    });
    const persistDraft = (reason: string) => {
      const draft = buildDraftPayload();
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "ANAMNESE",
            pacienteId,
            isEditing: !!currentAnamneseId,
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
    motivoBusca,
    areasAfetadas,
    intensidadeDor,
    descricaoSintomas,
    tempoProblema,
    horaIntensifica,
    inicioProblema,
    eventoEspecifico,
    fatorAlivio,
    mecanismoLesao,
    fatoresPiora,
    dorRepouso,
    dorNoturna,
    irradiacao,
    localIrradiacao,
    tipoDor,
    fenotipoDorEvidencias,
    sinaisSensibilizacaoCentral,
    problemaAnterior,
    quandoProblemaAnterior,
    tratamentosAnteriores,
    lesoesPrevias,
    usoMedicamentos,
    limitacoesFuncionais,
    atividadesQuePioram,
    metaPrincipalPaciente,
    horasSonoMedia,
    qualidadeSono,
    nivelEstresse,
    humoresPredominantes,
    energiaDiaria,
    atividadeFisicaRegular,
    frequenciaAtividadeFisica,
    apoioEmocional,
    observacoesEstiloVida,
    currentStep,
    draftKey,
  ]);

  useEffect(() => {
    if (!draftLoaded) return;
    const buildDraftPayload = () => ({
      lastEditedAt: new Date().toISOString(),
      motivoBusca,
      areasAfetadas,
      intensidadeDor,
      descricaoSintomas,
      tempoProblema,
      horaIntensifica,
      inicioProblema,
      eventoEspecifico,
      fatorAlivio,
      mecanismoLesao,
      fatoresPiora,
      dorRepouso,
      dorNoturna,
      irradiacao,
      localIrradiacao,
      tipoDor,
      fenotipoDorEvidencias,
      sinaisSensibilizacaoCentral,
      problemaAnterior,
      quandoProblemaAnterior,
      tratamentosAnteriores,
      lesoesPrevias,
      usoMedicamentos,
      limitacoesFuncionais,
      atividadesQuePioram,
      metaPrincipalPaciente,
      horasSonoMedia,
      qualidadeSono,
      nivelEstresse,
      humorPredominante: humoresPredominantes.join(", "),
      humoresPredominantes,
      energiaDiaria,
      atividadeFisicaRegular,
      frequenciaAtividadeFisica,
      apoioEmocional,
      observacoesEstiloVida,
      currentStep,
    });
    const persistDraftNow = (reason: string) => {
      const draft = buildDraftPayload();
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "ANAMNESE",
            pacienteId,
            isEditing: !!currentAnamneseId,
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
    motivoBusca,
    areasAfetadas,
    intensidadeDor,
    descricaoSintomas,
    tempoProblema,
    horaIntensifica,
    inicioProblema,
    eventoEspecifico,
    fatorAlivio,
    mecanismoLesao,
    fatoresPiora,
    dorRepouso,
    dorNoturna,
    irradiacao,
    localIrradiacao,
    tipoDor,
    fenotipoDorEvidencias,
    sinaisSensibilizacaoCentral,
    problemaAnterior,
    quandoProblemaAnterior,
    tratamentosAnteriores,
    lesoesPrevias,
    usoMedicamentos,
    limitacoesFuncionais,
    atividadesQuePioram,
    metaPrincipalPaciente,
    horasSonoMedia,
    qualidadeSono,
    nivelEstresse,
    humoresPredominantes,
    energiaDiaria,
    atividadeFisicaRegular,
    frequenciaAtividadeFisica,
    apoioEmocional,
    observacoesEstiloVida,
    currentStep,
    draftKey,
    pacienteId,
    currentAnamneseId,
    navigation,
  ]);

  const toggleTratamento = (tratamento: string) => {
    if (tratamentosAnteriores.includes(tratamento)) {
      setTratamentosAnteriores(
        tratamentosAnteriores.filter((t) => t !== tratamento),
      );
    } else {
      setTratamentosAnteriores([...tratamentosAnteriores, tratamento]);
    }
  };

  const validateStep = (step: number): boolean => {
    const nextErrors: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!motivoBusca) {
          nextErrors.motivoBusca = "Selecione o motivo da busca";
        }
        if (
          motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
          areasAfetadas.length === 0
        ) {
          nextErrors.areasAfetadas = "Selecione pelo menos uma área afetada";
        }
        if (
          motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
          intensidadeDor === 0
        ) {
          nextErrors.intensidadeDor = "Informe a intensidade da dor";
        }
        break;
      case 1:
        if (!inicioProblema) {
          nextErrors.inicioProblema = "Informe como começou o problema";
        }
        if (
          motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
          !mecanismoLesao
        ) {
          nextErrors.mecanismoLesao =
            "Selecione o mecanismo provável da lesão";
        }
        if (
          motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
          !String(fatorAlivio || "").trim()
        ) {
          nextErrors.fatorAlivio = "Informe pelo menos um fator de melhora/alívio";
        }
        if (
          motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
          !String(fatoresPiora || "").trim()
        ) {
          nextErrors.fatoresPiora = "Informe pelo menos um fator de piora/agravo";
        }
        if (irradiacao === true && !String(localIrradiacao || "").trim()) {
          nextErrors.localIrradiacao =
            "Informe ou selecione o trajeto da dor irradiada";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      motivoBusca: nextErrors.motivoBusca || "",
      areasAfetadas: nextErrors.areasAfetadas || "",
      intensidadeDor: nextErrors.intensidadeDor || "",
      inicioProblema: nextErrors.inicioProblema || "",
      mecanismoLesao: nextErrors.mecanismoLesao || "",
      fatorAlivio: nextErrors.fatorAlivio || "",
      fatoresPiora: nextErrors.fatoresPiora || "",
      localIrradiacao: nextErrors.localIrradiacao || "",
    }));
    return Object.keys(nextErrors).length === 0;
  };

  const toggleHumorPredominante = (humor: string) => {
    setHumoresPredominantes((prev) => {
      if (prev.includes(humor)) {
        return prev.filter((item) => item !== humor);
      }
      return [...prev, humor];
    });
  };

  const getValidationFieldsForStep = (step: number): string[] => {
    const fields: string[] = [];
    if (step === 0) {
      if (!motivoBusca) fields.push("motivoBusca");
      if (motivoBusca === MotivoBusca.SINTOMA_EXISTENTE && areasAfetadas.length === 0) {
        fields.push("areasAfetadas");
      }
      if (motivoBusca === MotivoBusca.SINTOMA_EXISTENTE && intensidadeDor === 0) {
        fields.push("intensidadeDor");
      }
    }
    if (step === 1 && !inicioProblema) {
      fields.push("inicioProblema");
    }
    if (
      step === 1 &&
      motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
      !mecanismoLesao
    ) {
      fields.push("mecanismoLesao");
    }
    if (
      step === 1 &&
      motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
      !String(fatorAlivio || "").trim()
    ) {
      fields.push("fatorAlivio");
    }
    if (
      step === 1 &&
      motivoBusca === MotivoBusca.SINTOMA_EXISTENTE &&
      !String(fatoresPiora || "").trim()
    ) {
      fields.push("fatoresPiora");
    }
    if (
      step === 1 &&
      irradiacao === true &&
      !String(localIrradiacao || "").trim()
    ) {
      fields.push("localIrradiacao");
    }
    return fields;
  };

  const getFirstInvalidStep = (): number | null => {
    for (let step = 0; step < steps.length; step += 1) {
      if (!validateStep(step)) return step;
    }
    return null;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  const goToStep = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    for (let step = currentStep; step < targetStep; step += 1) {
      if (!validateStep(step)) {
        return;
      }
    }
    setCurrentStep(targetStep);
  };
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentStep]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    stageOpenedAtRef.current = Date.now();
    trackEvent("session_started", {
      stage: "ANAMNESE",
      pacienteId,
      source: "AnamneseFormScreen",
      mode: isSelfMode ? "PATIENT_SELF" : "PROFESSIONAL",
      isEditing: !!currentAnamneseId,
    }).catch(() => undefined);

    trackEvent("clinical_flow_stage_opened", {
      stage: "ANAMNESE",
      pacienteId,
      source: "AnamneseFormScreen",
      mode: isSelfMode ? "PATIENT_SELF" : "PROFESSIONAL",
      isEditing: !!currentAnamneseId,
    }).catch(() => undefined);

    return () => {
      if (didSaveRef.current) return;
      trackEvent("clinical_flow_stage_abandoned", {
        stage: "ANAMNESE",
        pacienteId,
        source: "AnamneseFormScreen",
        mode: isSelfMode ? "PATIENT_SELF" : "PROFESSIONAL",
        isEditing: !!currentAnamneseId,
        step: currentStepRef.current,
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
    };
  }, [currentAnamneseId, isSelfMode, pacienteId]);

  const navigateAfterSave = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (isSelfMode) {
      navigation.navigate("PacienteHome");
      return;
    }
    navigation.navigate("PacienteDetails", { pacienteId });
  };

  const handleSave = async () => {
    setHasAttemptedSave(true);
    const firstInvalidStep = getFirstInvalidStep();
    if (firstInvalidStep !== null) {
      const failedFields = getValidationFieldsForStep(firstInvalidStep);
      if (currentStep !== firstInvalidStep) {
        setCurrentStep(firstInvalidStep);
        showToast({
          message:
            firstInvalidStep === 0
              ? "Preencha os campos obrigatórios da Queixa principal."
              : "Preencha os campos obrigatórios da etapa Descrição.",
          type: "error",
        });
      }
      trackEvent("clinical_form_validation_error", {
        stage: "ANAMNESE",
        pacienteId,
        step: firstInvalidStep,
        fields: failedFields,
      }).catch(() => undefined);
      return;
    }
    setLoading(true);

    try {
      const payload = {
        pacienteId,
        motivoBusca: motivoBusca!,
        areasAfetadas: removeLocalPainIntensity(areasAfetadas),
        intensidadeDor,
        descricaoSintomas,
        tempoProblema,
        horaIntensifica,
        inicioProblema: inicioProblema || undefined,
        eventoEspecifico,
        fatorAlivio,
        mecanismoLesao: mecanismoLesao || undefined,
        fatoresPiora,
        dorRepouso: dorRepouso ?? undefined,
        dorNoturna: dorNoturna ?? undefined,
        irradiacao: irradiacao ?? undefined,
        localIrradiacao,
        tipoDor: tipoDor || undefined,
        fenotipoDorEvidencias,
        sinaisSensibilizacaoCentral,
        problemaAnterior: problemaAnterior || false,
        quandoProblemaAnterior,
        tratamentosAnteriores,
        lesoesPrevias,
        usoMedicamentos,
        limitacoesFuncionais,
        atividadesQuePioram,
        metaPrincipalPaciente,
        horasSonoMedia,
        qualidadeSono: qualidadeSono || undefined,
        nivelEstresse: nivelEstresse || undefined,
        humorPredominante: humoresPredominantes.join(", "),
        energiaDiaria: energiaDiaria || undefined,
        atividadeFisicaRegular: atividadeFisicaRegular ?? undefined,
        frequenciaAtividadeFisica,
        apoioEmocional: apoioEmocional || undefined,
        observacoesEstiloVida,
      };

      let savedAnamnese: Anamnese | null = null;
      if (isSelfMode) {
        const { pacienteId: _, ...selfPayload } = payload;
        const created = await createMyAnamnese(selfPayload);
        setCurrentAnamneseId(created.id);
        savedAnamnese = created;
      } else {
        const created = await createAnamnese(payload);
        savedAnamnese = created;
        setCurrentAnamneseId(created.id);
        await AsyncStorage.setItem(
          "onboarding:professional:first_anamnese_done",
          "1",
        );
      }
      if (savedAnamnese) {
        setCurrentAnamneseId(savedAnamnese.id);
        setLastPersistedSavedAt(
          savedAnamnese.updatedAt || savedAnamnese.createdAt || null,
        );
      }
      await AsyncStorage.removeItem(draftKey);
      setLastDraftSavedAt(null);
      showToast({
        message: currentAnamneseId
          ? "Nova anamnese registrada. A anterior foi preservada no histórico."
          : "Anamnese salva com sucesso.",
        type: "success",
      });
      trackEvent("session_completed", {
        stage: "ANAMNESE",
        pacienteId,
        source: "AnamneseFormScreen",
        mode: isSelfMode ? "PATIENT_SELF" : "PROFESSIONAL",
        isEditing: !!currentAnamneseId,
        step: currentStep,
        durationMs: Math.max(0, Date.now() - stageOpenedAtRef.current),
      }).catch(() => undefined);
      didSaveRef.current = true;
      navigateAfterSave();
    } catch (error: unknown) {
      const { message, fieldErrors: rawFieldErrors } = parseApiError(error);
      const fieldErrors = { ...rawFieldErrors } as Record<string, string>;

      const backendMissingFieldsMatch = String(message || "").match(
        /Campos obrigatorios ausentes para motivo SINTOMA_EXISTENTE:\s*(.+)$/i,
      );
      if (backendMissingFieldsMatch?.[1]) {
        const missing = backendMissingFieldsMatch[1]
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (missing.includes("mecanismoLesao")) {
          fieldErrors.mecanismoLesao =
            "Selecione o mecanismo provável da lesão.";
        }
        if (missing.includes("fatorAlivio")) {
          fieldErrors.fatorAlivio =
            "Informe pelo menos um fator de melhora/alívio.";
        }
        if (missing.includes("fatoresPiora")) {
          fieldErrors.fatoresPiora =
            "Informe pelo menos um fator de piora/agravo.";
        }
        if (missing.includes("inicioProblema")) {
          fieldErrors.inicioProblema = "Informe como começou o problema.";
        }
      }

      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        const shouldGoToStep1 =
          !!fieldErrors.inicioProblema ||
          !!fieldErrors.mecanismoLesao ||
          !!fieldErrors.fatorAlivio ||
          !!fieldErrors.fatoresPiora;
        if (shouldGoToStep1 && currentStep !== 1) {
          setCurrentStep(1);
        }
        showToast({
          message:
            "Faltam campos obrigatórios na etapa Descrição. Revise para continuar.",
          type: "error",
        });
      } else {
        showToast({ message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = async () => {
    Alert.alert(
      t("clinical.actions.clearDraft"),
      t("clinical.messages.clearDraftConfirm"),
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
            setMotivoBusca(null);
            setAreasAfetadas([]);
            setIntensidadeDor(0);
            setDescricaoSintomas("");
            setTempoProblema("");
            setHoraIntensifica("");
            setInicioProblema(null);
            setEventoEspecifico("");
            setFatorAlivio("");
            setMecanismoLesao(null);
            setFatoresPiora("");
            setDorRepouso(null);
            setDorNoturna(null);
            setIrradiacao(null);
            setLocalIrradiacao("");
            setTipoDor(null);
            setSinaisSensibilizacaoCentral("");
            setProblemaAnterior(null);
            setQuandoProblemaAnterior("");
            setTratamentosAnteriores([]);
            setLesoesPrevias("");
            setUsoMedicamentos("");
            setLimitacoesFuncionais("");
            setAtividadesQuePioram("");
            setMetaPrincipalPaciente("");
            setHorasSonoMedia("");
            setQualidadeSono(0);
            setNivelEstresse(0);
            setHumoresPredominantes([]);
            setEnergiaDiaria(0);
            setAtividadeFisicaRegular(null);
            setFrequenciaAtividadeFisica("");
            setApoioEmocional(0);
            setObservacoesEstiloVida("");
            setCurrentStep(0);
            setErrors({});
            setLastQuickVoiceSummary(null);
            setHasAttemptedSave(false);
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!hasAttemptedSave) return;
    validateStep(currentStep);
  }, [
    hasAttemptedSave,
    currentStep,
    motivoBusca,
    areasAfetadas,
    intensidadeDor,
    inicioProblema,
  ]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {VOICE_ENABLED && (
              <FormSection title="Ditado rápido">
                <View style={styles.quickVoiceCard}>
                  <View style={styles.quickVoiceHeader}>
                    <View style={styles.quickVoiceIconBox}>
                      <Ionicons
                        name="sparkles-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.quickVoiceTextGroup}>
                      <Text style={styles.quickVoiceTitle}>
                        Queixa completa em uma fala
                      </Text>
                      <Text style={styles.quickVoiceHint}>
                        Ex.: dor forte no joelho direito há 2 semanas, 8/10,
                        piora em escadas e melhora com repouso.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.quickVoiceButton,
                      activeField === QUICK_ANAMNESE_DICTATION_FIELD &&
                        isRecording &&
                        styles.quickVoiceButtonRecording,
                    ]}
                    onPress={() => toggleVoice(QUICK_ANAMNESE_DICTATION_FIELD)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={getMicIcon(QUICK_ANAMNESE_DICTATION_FIELD)}
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.quickVoiceButtonText}>
                      {activeField === QUICK_ANAMNESE_DICTATION_FIELD &&
                      isRecording
                        ? "Parar ditado"
                        : "Ditar queixa"}
                    </Text>
                  </TouchableOpacity>

                  {activeField === QUICK_ANAMNESE_DICTATION_FIELD &&
                    isRecording &&
                    partial && (
                      <Text style={styles.quickVoicePartial}>{partial}</Text>
                    )}

                  {lastQuickVoiceSummary && (
                    <Text style={styles.quickVoiceSummary}>
                      {lastQuickVoiceSummary}
                    </Text>
                  )}
                </View>
              </FormSection>
            )}

            <FormSection title="Qual o motivo da busca pelo atendimento?">
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Sintoma existente"
                  selected={motivoBusca === MotivoBusca.SINTOMA_EXISTENTE}
                  onPress={() => {
                    setMotivoBusca(MotivoBusca.SINTOMA_EXISTENTE);
                    if (errors.motivoBusca) {
                      setErrors((prev) => ({ ...prev, motivoBusca: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Preventivo"
                  selected={motivoBusca === MotivoBusca.PREVENTIVO}
                  onPress={() => {
                    setMotivoBusca(MotivoBusca.PREVENTIVO);
                    if (errors.motivoBusca || errors.areasAfetadas || errors.intensidadeDor) {
                      setErrors((prev) => ({
                        ...prev,
                        motivoBusca: "",
                        areasAfetadas: "",
                        intensidadeDor: "",
                      }));
                    }
                  }}
                />
              </View>
              {errors.motivoBusca && (
                <Text style={styles.errorText}>{errors.motivoBusca}</Text>
              )}
            </FormSection>

            {motivoBusca === MotivoBusca.SINTOMA_EXISTENTE && (
              <>
                <FormSection title="Áreas Afetadas">
                  <BodyMap
                    selectedAreas={areasAfetadas}
                    sexo={(paciente as { sexo?: string } | undefined)?.sexo}
                    onAreasChange={(nextAreas) => {
                      setAreasAfetadas(removeLocalPainIntensity(nextAreas));
                      if (errors.areasAfetadas) {
                        setErrors((prev) => ({ ...prev, areasAfetadas: "" }));
                      }
                    }}
                  />
                  {errors.areasAfetadas && (
                    <Text style={styles.errorText}>{errors.areasAfetadas}</Text>
                  )}
                </FormSection>

                <FormSection title="Intensidade da dor principal">
                  <Text style={styles.hintText}>
                    Se houver mais de uma área, informe a intensidade da dor
                    principal ou mais forte. Diferencie as demais áreas na
                    descrição dos sintomas.
                  </Text>
                  <PainScale
                    value={intensidadeDor}
                    onChange={(value) => {
                      setIntensidadeDor(value);
                      if (errors.intensidadeDor) {
                        setErrors((prev) => ({ ...prev, intensidadeDor: "" }));
                      }
                    }}
                  />
                  {errors.intensidadeDor && (
                    <Text style={styles.errorText}>
                      {errors.intensidadeDor}
                    </Text>
                  )}
                </FormSection>
              </>
            )}
          </>
        );

      case 1:
        return (
          <>
            <FormSection title="Descreva os sintomas principais">
              <Input
                placeholder="Descreva o que voce sente. Se marcou mais de uma área, informe qual é a principal e se a intensidade muda entre elas."
                value={descricaoSintomas}
                onChangeText={(text) => {
                  setDescricaoSintomas(text);
                  if (errors.descricaoSintomas) {
                    setErrors((prev) => ({ ...prev, descricaoSintomas: "" }));
                  }
                }}
                error={errors.descricaoSintomas}
                showCount
                showClear
                maxLength={2000}
                onClear={() => setDescricaoSintomas("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("descricaoSintomas") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("descricaoSintomas")
                    : undefined
                }
                hint={
                  activeField === "descricaoSintomas" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top" }}
              />
            </FormSection>

            <FormSection title="Há quanto tempo sente esse problema?">
              <Input
                placeholder="Ex: 3 meses, 2 anos..."
                value={tempoProblema}
                onChangeText={(text) => {
                  setTempoProblema(text);
                  if (errors.tempoProblema) {
                    setErrors((prev) => ({ ...prev, tempoProblema: "" }));
                  }
                }}
                error={errors.tempoProblema}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("tempoProblema") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED ? () => toggleVoice("tempoProblema") : undefined
                }
                hint={
                  activeField === "tempoProblema" && isRecording
                    ? partial
                    : undefined
                }
                leftIcon="calendar-outline"
              />
            </FormSection>

            <FormSection title="Em que período do dia os sintomas pioram?">
              <View style={styles.optionsGrid}>
                {HORA_INTENSIFICA_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(horaIntensifica).includes(
                      preset,
                    )}
                    onPress={() =>
                      setHoraIntensifica(
                        togglePresetInText(horaIntensifica, preset),
                      )
                    }
                  />
                ))}
              </View>
              <Input
                placeholder="Ex: Pela manhã, à noite, após trabalho..."
                value={horaIntensifica}
                onChangeText={(text) => {
                  setHoraIntensifica(text);
                  if (errors.horaIntensifica) {
                    setErrors((prev) => ({ ...prev, horaIntensifica: "" }));
                  }
                }}
                error={errors.horaIntensifica}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("horaIntensifica") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("horaIntensifica")
                    : undefined
                }
                hint={
                  activeField === "horaIntensifica" && isRecording
                    ? partial
                    : undefined
                }
                leftIcon="time-outline"
                containerStyle={{ marginTop: SPACING.sm }}
              />
            </FormSection>

            <FormSection title="Início da dor / sintomas">
              <View style={styles.optionsGrid}>
                <SelectOption
                  label="Insidioso"
                  selected={inicioProblema === InicioProblema.GRADUAL}
                  onPress={() => {
                    setInicioProblema(InicioProblema.GRADUAL);
                    if (errors.inicioProblema) {
                      setErrors((prev) => ({ ...prev, inicioProblema: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Agudo"
                  selected={inicioProblema === InicioProblema.REPENTINO}
                  onPress={() => {
                    setInicioProblema(InicioProblema.REPENTINO);
                    if (errors.inicioProblema) {
                      setErrors((prev) => ({ ...prev, inicioProblema: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Após evento específico"
                  selected={inicioProblema === InicioProblema.APOS_EVENTO}
                  onPress={() => {
                    setInicioProblema(InicioProblema.APOS_EVENTO);
                    if (errors.inicioProblema) {
                      setErrors((prev) => ({ ...prev, inicioProblema: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Não sabe"
                  selected={inicioProblema === InicioProblema.NAO_SABE}
                  onPress={() => {
                    setInicioProblema(InicioProblema.NAO_SABE);
                    if (errors.inicioProblema) {
                      setErrors((prev) => ({ ...prev, inicioProblema: "" }));
                    }
                  }}
                />
              </View>
              {errors.inicioProblema && (
                <Text style={styles.errorText}>{errors.inicioProblema}</Text>
              )}

              {inicioProblema === InicioProblema.APOS_EVENTO && (
                <Input
                  placeholder="Qual evento? (acidente, queda, esforço, movimento...)"
                  value={eventoEspecifico}
                  onChangeText={(text) => {
                    setEventoEspecifico(text);
                    if (errors.eventoEspecifico) {
                      setErrors((prev) => ({ ...prev, eventoEspecifico: "" }));
                    }
                  }}
                  error={errors.eventoEspecifico}
                  showCount
                  showClear
                  maxLength={2000}
                  onClear={() => setEventoEspecifico("")}
                  rightIcon={
                    VOICE_ENABLED ? getMicIcon("eventoEspecifico") : undefined
                  }
                  onRightIconPress={
                    VOICE_ENABLED
                      ? () => toggleVoice("eventoEspecifico")
                      : undefined
                  }
                  hint={
                    activeField === "eventoEspecifico" && isRecording
                      ? partial
                      : undefined
                  }
                  containerStyle={{ marginTop: SPACING.sm }}
                />
              )}
            </FormSection>

            <FormSection title="Fatores de melhora / alívio">
              <View style={styles.optionsGrid}>
                {FATOR_ALIVIO_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(fatorAlivio).includes(preset)}
                    onPress={() =>
                      setFatorAlivio(togglePresetInText(fatorAlivio, preset))
                    }
                  />
                ))}
              </View>
              <Input
                placeholder="Ex.: repouso, mudança de posição, calor, alongamento..."
                value={fatorAlivio}
                onChangeText={(text) => {
                  setFatorAlivio(text);
                  if (errors.fatorAlivio) {
                    setErrors((prev) => ({ ...prev, fatorAlivio: "" }));
                  }
                }}
                error={errors.fatorAlivio}
                showCount
                showClear
                maxLength={2000}
                onClear={() => setFatorAlivio("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("fatorAlivio") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED ? () => toggleVoice("fatorAlivio") : undefined
                }
                hint={
                  activeField === "fatorAlivio" && isRecording
                    ? partial
                    : undefined
                }
                leftIcon="medkit-outline"
                containerStyle={{ marginTop: SPACING.sm }}
              />
            </FormSection>

            <FormSection title="Mecanismo provável da lesão">
              <View style={styles.optionsGrid}>
                <SelectOption
                  label="Trauma"
                  selected={mecanismoLesao === MecanismoLesao.TRAUMA}
                  onPress={() => {
                    setMecanismoLesao(MecanismoLesao.TRAUMA);
                    if (errors.mecanismoLesao) {
                      setErrors((prev) => ({ ...prev, mecanismoLesao: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Sobrecarga"
                  selected={mecanismoLesao === MecanismoLesao.SOBRECARGA}
                  onPress={() => {
                    setMecanismoLesao(MecanismoLesao.SOBRECARGA);
                    if (errors.mecanismoLesao) {
                      setErrors((prev) => ({ ...prev, mecanismoLesao: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Misto"
                  selected={mecanismoLesao === MecanismoLesao.MISTO}
                  onPress={() => {
                    setMecanismoLesao(MecanismoLesao.MISTO);
                    if (errors.mecanismoLesao) {
                      setErrors((prev) => ({ ...prev, mecanismoLesao: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Não definido"
                  selected={mecanismoLesao === MecanismoLesao.NAO_DEFINIDO}
                  onPress={() => {
                    setMecanismoLesao(MecanismoLesao.NAO_DEFINIDO);
                    if (errors.mecanismoLesao) {
                      setErrors((prev) => ({ ...prev, mecanismoLesao: "" }));
                    }
                  }}
                />
              </View>
              {errors.mecanismoLesao ? (
                <Text style={styles.errorText}>{errors.mecanismoLesao}</Text>
              ) : null}
            </FormSection>

            <FormSection title="Fatores de piora / agravo">
              <View style={styles.optionsGrid}>
                {FATORES_PIORA_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(fatoresPiora).includes(preset)}
                    onPress={() =>
                      setFatoresPiora(togglePresetInText(fatoresPiora, preset))
                    }
                  />
                ))}
              </View>

              <Input
                placeholder="Quais fatores pioram? (ex.: carga repetitiva, postura mantida, impacto)"
                value={fatoresPiora}
                onChangeText={(text) => {
                  setFatoresPiora(text);
                  if (errors.fatoresPiora) {
                    setErrors((prev) => ({ ...prev, fatoresPiora: "" }));
                  }
                }}
                error={errors.fatoresPiora}
                showCount
                showClear
                maxLength={1000}
                onClear={() => setFatoresPiora("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("fatoresPiora") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED ? () => toggleVoice("fatoresPiora") : undefined
                }
                hint={
                  activeField === "fatoresPiora" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 90, textAlignVertical: "top" }}
                containerStyle={{ marginTop: SPACING.sm }}
              />
            </FormSection>

            <FormSection title="Dor irradiada e trajeto">
              <Text style={styles.subLabel}>
                A dor sai da área principal e caminha para outra região?
              </Text>
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Sim"
                  selected={irradiacao === true}
                  onPress={() => {
                    setIrradiacao(true);
                    if (errors.localIrradiacao) {
                      setErrors((prev) => ({ ...prev, localIrradiacao: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Não"
                  selected={irradiacao === false}
                  onPress={() => {
                    setIrradiacao(false);
                    setLocalIrradiacao("");
                    if (tipoDor === TipoDor.NEUROPATICA) {
                      setTipoDor(null);
                    }
                    if (errors.localIrradiacao) {
                      setErrors((prev) => ({ ...prev, localIrradiacao: "" }));
                    }
                  }}
                />
              </View>

              {irradiacao === true ? (
                <>
                  {irradiationSuggestions.length > 0 ? (
                    <>
                      <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
                        Trajetos sugeridos pelas áreas afetadas
                      </Text>
                      <View style={styles.optionsGrid}>
                        {irradiationSuggestions.map((suggestion) => (
                          <SelectOption
                            key={suggestion}
                            label={suggestion}
                            selected={parsePresetValues(localIrradiacao).includes(
                              suggestion,
                            )}
                            onPress={() => toggleIrradiationSuggestion(suggestion)}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.hintText, { marginTop: SPACING.sm }]}>
                      Selecione uma área afetada para sugerir o trajeto provável.
                    </Text>
                  )}

                  <Input
                    placeholder="Ex.: ombro direito -> braço/cotovelo/punho/mão direitos"
                    value={localIrradiacao}
                    onChangeText={(text) => {
                      setLocalIrradiacao(text);
                      if (text.trim()) {
                        setIrradiacao(true);
                      }
                      if (errors.localIrradiacao) {
                        setErrors((prev) => ({ ...prev, localIrradiacao: "" }));
                      }
                    }}
                    error={errors.localIrradiacao}
                    showCount
                    showClear
                    maxLength={1000}
                    onClear={() => setLocalIrradiacao("")}
                    rightIcon={
                      VOICE_ENABLED ? getMicIcon("localIrradiacao") : undefined
                    }
                    onRightIconPress={
                      VOICE_ENABLED
                        ? () => toggleVoice("localIrradiacao")
                        : undefined
                    }
                    hint={
                      activeField === "localIrradiacao" && isRecording
                        ? partial
                        : undefined
                    }
                    multiline
                    numberOfLines={3}
                    style={{ height: 90, textAlignVertical: "top" }}
                    containerStyle={{ marginTop: SPACING.sm }}
                  />
                </>
              ) : null}
            </FormSection>

            <FormSection title="Fenótipo de dor">
              <Text style={styles.subLabel}>Comportamento em repouso e à noite</Text>
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Dor em repouso"
                  selected={dorRepouso === true}
                  onPress={() => setDorRepouso(dorRepouso === true ? null : true)}
                />
                <SelectOption
                  label="Sem dor em repouso"
                  selected={dorRepouso === false}
                  onPress={() => setDorRepouso(dorRepouso === false ? null : false)}
                />
                <SelectOption
                  label="Dor noturna"
                  selected={dorNoturna === true}
                  onPress={() => setDorNoturna(dorNoturna === true ? null : true)}
                />
                <SelectOption
                  label="Sem dor noturna"
                  selected={dorNoturna === false}
                  onPress={() => setDorNoturna(dorNoturna === false ? null : false)}
                />
              </View>

              {renderFenotipoQuestionGroup("nociceptiva", "Mecanico / nociceptivo")}
              {renderFenotipoQuestionGroup("neuropatica", "Neural / neuropatico")}
              {renderFenotipoQuestionGroup("nociplastica", "Modulacao central / nociplastico")}

              <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
                Tipo provavel para o agente clinico
              </Text>
              <View style={styles.optionsGrid}>
                {TIPO_DOR_PRESETS.map((option) => (
                  <SelectOption
                    key={option.value}
                    label={option.label}
                    selected={tipoDor === option.value}
                    onPress={() =>
                      setTipoDor(tipoDor === option.value ? null : option.value)
                    }
                  />
                ))}
              </View>
            </FormSection>
          </>
        );

      case 2:
        return (
          <>
            <FormSection title="Já teve episódios parecidos antes?">
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Sim"
                  selected={problemaAnterior === true}
                  onPress={() => setProblemaAnterior(true)}
                />
                <SelectOption
                  label="Não"
                  selected={problemaAnterior === false}
                  onPress={() => setProblemaAnterior(false)}
                />
              </View>

              {problemaAnterior && (
                <Input
                  placeholder="Quando foi e como evoluiu? Ex.: há 2 anos, melhorou em 3 semanas, voltou após corrida."
                  value={quandoProblemaAnterior}
                  onChangeText={(text) => {
                    setQuandoProblemaAnterior(text);
                    if (errors.quandoProblemaAnterior) {
                      setErrors((prev) => ({
                        ...prev,
                        quandoProblemaAnterior: "",
                      }));
                    }
                  }}
                  error={errors.quandoProblemaAnterior}
                  rightIcon={
                    VOICE_ENABLED
                      ? getMicIcon("quandoProblemaAnterior")
                      : undefined
                  }
                  onRightIconPress={
                    VOICE_ENABLED
                      ? () => toggleVoice("quandoProblemaAnterior")
                      : undefined
                  }
                  hint={
                    activeField === "quandoProblemaAnterior" && isRecording
                      ? partial
                      : undefined
                  }
                  containerStyle={{ marginTop: SPACING.sm }}
                />
              )}
            </FormSection>

            <FormSection title="Tratamentos já realizados para esta queixa">
              <Text style={styles.hintText}>
                Marque somente os tratamentos feitos para este episódio ou para
                episódios parecidos. Detalhes como datas e resposta podem ficar
                no campo anterior.
              </Text>
              <View style={styles.optionsGrid}>
                {TRATAMENTOS.map((tratamento) => (
                  <SelectOption
                    key={tratamento}
                    label={tratamento}
                    selected={tratamentosAnteriores.includes(tratamento)}
                    onPress={() => toggleTratamento(tratamento)}
                  />
                ))}
              </View>
            </FormSection>

            <FormSection title="Funcionalidade e objetivos">
              <Text style={styles.subLabel}>
                Limitações funcionais mais comuns
              </Text>
              <View style={styles.optionsGrid}>
                {LIMITACOES_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(limitacoesFuncionais).includes(
                      preset,
                    )}
                    onPress={() =>
                      setLimitacoesFuncionais(
                        togglePresetInText(limitacoesFuncionais, preset),
                      )
                    }
                  />
                ))}
              </View>

              <Input
                placeholder="Quais atividades do dia a dia estão limitadas? (ex.: sentar, caminhar, trabalhar, dormir)"
                value={limitacoesFuncionais}
                onChangeText={(text) => {
                  setLimitacoesFuncionais(text);
                  if (errors.limitacoesFuncionais) {
                    setErrors((prev) => ({
                      ...prev,
                      limitacoesFuncionais: "",
                    }));
                  }
                }}
                error={errors.limitacoesFuncionais}
                showCount
                showClear
                maxLength={1000}
                onClear={() => setLimitacoesFuncionais("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("limitacoesFuncionais") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("limitacoesFuncionais")
                    : undefined
                }
                hint={
                  activeField === "limitacoesFuncionais" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 90, textAlignVertical: "top" }}
                containerStyle={{ marginTop: SPACING.md }}
              />

              <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
                Atividades que pioram
              </Text>
              <View style={styles.optionsGrid}>
                {ATIVIDADES_PIORAM_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(atividadesQuePioram).includes(
                      preset,
                    )}
                    onPress={() =>
                      setAtividadesQuePioram(
                        togglePresetInText(atividadesQuePioram, preset),
                      )
                    }
                  />
                ))}
              </View>

              <Input
                placeholder="Quais movimentos ou situações pioram os sintomas? (ex.: levantar peso, ficar muito tempo sentado)"
                value={atividadesQuePioram}
                onChangeText={(text) => {
                  setAtividadesQuePioram(text);
                  if (errors.atividadesQuePioram) {
                    setErrors((prev) => ({ ...prev, atividadesQuePioram: "" }));
                  }
                }}
                error={errors.atividadesQuePioram}
                showCount
                showClear
                maxLength={1000}
                onClear={() => setAtividadesQuePioram("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("atividadesQuePioram") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("atividadesQuePioram")
                    : undefined
                }
                hint={
                  activeField === "atividadesQuePioram" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 90, textAlignVertical: "top" }}
                containerStyle={{ marginTop: SPACING.sm }}
              />

              <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
                Metas mais comuns do tratamento
              </Text>
              <View style={styles.optionsGrid}>
                {META_PACIENTE_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={parsePresetValues(metaPrincipalPaciente).includes(
                      preset,
                    )}
                    onPress={() =>
                      setMetaPrincipalPaciente(
                        togglePresetInText(metaPrincipalPaciente, preset),
                      )
                    }
                  />
                ))}
              </View>

              <Input
                placeholder="Qual é a principal meta do paciente com o tratamento? (ex.: voltar a caminhar sem dor)"
                value={metaPrincipalPaciente}
                onChangeText={(text) => {
                  setMetaPrincipalPaciente(text);
                  if (errors.metaPrincipalPaciente) {
                    setErrors((prev) => ({
                      ...prev,
                      metaPrincipalPaciente: "",
                    }));
                  }
                }}
                error={errors.metaPrincipalPaciente}
                showCount
                showClear
                maxLength={1000}
                onClear={() => setMetaPrincipalPaciente("")}
                rightIcon={
                  VOICE_ENABLED
                    ? getMicIcon("metaPrincipalPaciente")
                    : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("metaPrincipalPaciente")
                    : undefined
                }
                hint={
                  activeField === "metaPrincipalPaciente" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 90, textAlignVertical: "top" }}
                containerStyle={{ marginTop: SPACING.sm }}
              />
            </FormSection>

            <FormSection title="Lesões prévias">
              <Input
                placeholder="Lesões anteriores, lado afetado, tempo de recuperação e recorrência"
                value={lesoesPrevias}
                onChangeText={setLesoesPrevias}
                showCount
                showClear
                maxLength={2000}
                onClear={() => setLesoesPrevias("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("lesoesPrevias") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED ? () => toggleVoice("lesoesPrevias") : undefined
                }
                hint={
                  activeField === "lesoesPrevias" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top" }}
              />
            </FormSection>

            <FormSection title="Uso de medicamentos">
              <Input
                placeholder="Medicamentos em uso, dose/frequência e efeito nos sintomas"
                value={usoMedicamentos}
                onChangeText={setUsoMedicamentos}
                showCount
                showClear
                maxLength={2000}
                onClear={() => setUsoMedicamentos("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("usoMedicamentos") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("usoMedicamentos")
                    : undefined
                }
                hint={
                  activeField === "usoMedicamentos" && isRecording
                    ? partial
                    : undefined
                }
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top" }}
              />
            </FormSection>
          </>
        );

      case 3: {
        const resumoEmocional = getResumoEmocional();
        const resumoClinicoPremium = getResumoClinicoPremium();
        return (
          <>
            <FormSection title="Sono e recuperação">
              <Text style={styles.subLabel}>Horas médias de sono</Text>
              <View style={[styles.optionsGrid, { marginTop: SPACING.sm }]}>
                {HORAS_SONO_PRESETS.map((preset) => (
                  <SelectOption
                    key={preset}
                    label={preset}
                    selected={horasSonoMedia === preset}
                    onPress={() => setHorasSonoMedia(preset)}
                  />
                ))}
              </View>

              <View style={{ marginTop: SPACING.md }}>
                <PainScale
                  value={qualidadeSono}
                  onChange={setQualidadeSono}
                  mode="wellness"
                  title="Qualidade do sono (0-10)"
                  subtitle="Selecione o nível de qualidade do sono de 0 a 10"
                  highlightTitle
                  labelResolver={(score) => {
                    if (score <= 1) return "Péssima";
                    if (score <= 3) return "Ruim";
                    if (score <= 5) return "Regular";
                    if (score <= 7) return "Boa";
                    return "Excelente";
                  }}
                />
              </View>
            </FormSection>

            <FormSection title="Disposição e apoio emocional">
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={styles.subLabel}>
                  Disposição no dia a dia (0-10)
                </Text>
                <PainScale
                  value={energiaDiaria}
                  onChange={setEnergiaDiaria}
                  mode="wellness"
                  title="Nível de Disposição"
                  subtitle="Selecione o nível de disposição no dia a dia de 0 a 10"
                  labelResolver={(score) => {
                    if (score <= 2) return "Muito baixa";
                    if (score <= 5) return "Baixa";
                    if (score <= 7) return "Regular";
                    if (score <= 9) return "Boa";
                    return "Excelente";
                  }}
                />
              </View>

              <View style={{ marginTop: SPACING.md }}>
                <Text style={styles.subLabel}>
                  Apoio emocional/social percebido (0-10)
                </Text>
                <PainScale
                  value={apoioEmocional}
                  onChange={setApoioEmocional}
                  mode="wellness"
                  title="Apoio Emocional/Social"
                  subtitle="Selecione a percepção de apoio emocional/social de 0 a 10"
                  labelResolver={(score) => {
                    if (score <= 2) return "Muito baixo";
                    if (score <= 5) return "Baixo";
                    if (score <= 7) return "Moderado";
                    if (score <= 9) return "Bom";
                    return "Excelente";
                  }}
                />
              </View>
            </FormSection>

            <FormSection title="Estresse percebido">
              <Text style={styles.subLabel}>Nível de estresse (0-10)</Text>
              <PainScale
                value={nivelEstresse}
                onChange={setNivelEstresse}
                title="Nível de Estresse"
                subtitle="Selecione o nível de estresse de 0 a 10"
                labelResolver={(score) => {
                  if (score <= 2) return "Baixo";
                  if (score <= 5) return "Moderado";
                  if (score <= 8) return "Alto";
                  return "Muito alto";
                }}
              />
            </FormSection>

            <Text style={styles.subLabel}>Humores predominantes</Text>
            <View style={styles.optionsGrid}>
              {HUMORES_PREDOMINANTES.map((humor) => (
                <SelectOption
                  key={humor}
                  label={humor}
                  selected={humoresPredominantes.includes(humor)}
                  onPress={() => toggleHumorPredominante(humor)}
                />
              ))}
            </View>

            <FormSection title="Estilo de vida e rotina ">
              <Text style={styles.subLabel}>
                Pratica atividade física regularmente?
              </Text>
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Sim"
                  selected={atividadeFisicaRegular === true}
                  onPress={() => setAtividadeFisicaRegular(true)}
                />
                <SelectOption
                  label="Não"
                  selected={atividadeFisicaRegular === false}
                  onPress={() => setAtividadeFisicaRegular(false)}
                />
              </View>

              {atividadeFisicaRegular === true && (
                <>
                  <Input
                    placeholder="Frequência (ex.: 3x/semana, caminhada diária)"
                    value={frequenciaAtividadeFisica}
                    onChangeText={setFrequenciaAtividadeFisica}
                    leftIcon="fitness-outline"
                    containerStyle={{ marginTop: SPACING.sm }}
                  />
                  <View style={[styles.optionsGrid, { marginTop: SPACING.sm }]}>
                    {FREQ_ATIVIDADE_PRESETS.map((preset) => (
                      <SelectOption
                        key={preset}
                        label={preset}
                        selected={frequenciaAtividadeFisica === preset}
                        onPress={() => setFrequenciaAtividadeFisica(preset)}
                      />
                    ))}
                  </View>
                </>
              )}

              <Input
                placeholder="Observações de estilo de vida/estado emocional"
                value={observacoesEstiloVida}
                onChangeText={setObservacoesEstiloVida}
                multiline
                numberOfLines={4}
                showCount
                maxLength={2000}
                showClear
                onClear={() => setObservacoesEstiloVida("")}
                style={{ height: 100, textAlignVertical: "top" }}
                containerStyle={{ marginTop: SPACING.md }}
              />
            </FormSection>

            <FormSection title="Resumo rápido (MVP)">
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  {resumoEmocional.status}
                </Text>
                <View style={styles.summaryChipRow}>
                  <View
                    style={[
                      styles.summaryChip,
                      resumoEmocional.tone === "good"
                        ? styles.summaryChipGood
                        : resumoEmocional.tone === "warn"
                          ? styles.summaryChipWarn
                          : styles.summaryChipRisk,
                    ]}
                  >
                    <Text style={styles.summaryChipText}>
                      {resumoEmocional.label}
                    </Text>
                  </View>
                  {horasSonoMedia ? (
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>
                        Sono: {horasSonoMedia}
                      </Text>
                    </View>
                  ) : null}
                  {humoresPredominantes.length > 0 ? (
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>
                        Humor: {humoresPredominantes.join(", ")}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>
                      Tipo: {resumoClinicoPremium.tipo}
                    </Text>
                  </View>
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>
                      Risco: {resumoClinicoPremium.risco}
                    </Text>
                  </View>
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>
                      Complexidade: {resumoClinicoPremium.complexidade}
                    </Text>
                  </View>
                </View>
                <Text style={styles.summaryDescription}>
                  Resumo de apoio para decisão clínica. Use junto com o contexto
                  geral do paciente.
                </Text>
              </View>
            </FormSection>
          </>
        );
      }

      default:
        return null;
    }
  };

  const getResumoClinicoPremium = () => {
    const risco =
      redFlags.length > 0
        ? "Alto"
        : yellowFlags.length >= 2
          ? "Moderado"
          : "Baixo";
    const complexidade =
      (tipoDor === TipoDor.MISTA ? 1 : 0) +
      (irradiacao ? 1 : 0) +
      (sinaisSensibilizacaoCentral.trim() ? 1 : 0) +
      (yellowFlags.length >= 2 ? 1 : 0);

    return {
      tipo: tipoDor
        ? TIPO_DOR_PRESETS.find((item) => item.value === tipoDor)?.label ||
          tipoDor
        : "Não definido",
      risco,
      complexidade:
        complexidade >= 3 ? "Alta" : complexidade >= 1 ? "Moderada" : "Baixa",
    };
  };

  const getResumoEmocional = () => {
    const score =
      (10 - nivelEstresse) * 0.4 + energiaDiaria * 0.3 + apoioEmocional * 0.3;
    if (score >= 7.5) {
      return {
        label: "Baixo risco",
        tone: "good" as const,
        status: "Equilíbrio emocional favorável",
      };
    }
    if (score >= 5) {
      return {
        label: "Atenção",
        tone: "warn" as const,
        status: "Atenção ao estado emocional",
      };
    }
    return {
      label: "Maior atenção",
      tone: "risk" as const,
      status: "Sinais de vulnerabilidade emocional",
    };
  };

  const renderFenotipoQuestionGroup = (
    group: "nociceptiva" | "neuropatica" | "nociplastica",
    title: string,
  ) => (
    <View style={styles.questionGroup}>
      <Text style={styles.subLabel}>{title}</Text>
      <View style={styles.optionsGrid}>
        {FENOTIPO_DOR_QUESTIONS.filter((item) => item.group === group).map(
          (item) => (
            <SelectOption
              key={item.key}
              label={item.label}
              selected={fenotipoDorEvidencias[item.key] === true}
              onPress={() => toggleFenotipoDorEvidence(item.key)}
            />
          ),
        )}
      </View>
    </View>
  );

  if (!paciente && !isSelfMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Paciente não encontrado</Text>
          <Button title="Voltar" onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.patientHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {paciente?.nomeCompleto.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={styles.patientName}>{paciente?.nomeCompleto}</Text>
          <Text style={styles.patientInfo}>
            {currentAnamneseId
              ? "Visualizar Anamnese"
              : isSelfMode
                ? "Minha Anamnese"
                : "Nova Anamnese"}
          </Text>
          {lastPersistedSavedAt ? (
            <Text style={styles.patientInfo}>
              Última salva: {new Date(lastPersistedSavedAt).toLocaleString("pt-BR")}
            </Text>
          ) : null}
          {lastDraftSavedAt ? (
            <Text style={styles.patientInfo}>
              Rascunho local: {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {currentAnamneseId ? (
            <TouchableOpacity
              style={styles.newVersionButton}
              onPress={() => navigation.navigate("AnamneseForm", { pacienteId })}
            >
              <Ionicons name="add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.newVersionButtonText}>Nova</Text>
            </TouchableOpacity>
          ) : null}
          {!isViewingRecordedAnamnese ? (
            <TouchableOpacity
              style={styles.draftButton}
              onPress={handleClearDraft}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.white} />
              <Text style={styles.draftButtonText}>Limpar rascunho</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.stepsContainer,
          isCompactStepper && styles.stepsContainerCompact,
        ]}
        onLayout={handleStepsLayout}
      >
        {isCompactStepper ? (
          <>
            <View style={styles.compactStepsTrack}>
              {steps.map((step, index) => (
                <React.Fragment key={step.title}>
                  <TouchableOpacity
                    style={styles.compactStepButton}
                    onPress={() => goToStep(index)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={"Ir para etapa: " + step.title}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        index <= currentStep && styles.stepCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={16}
                        color={
                          index <= currentStep ? COLORS.white : COLORS.gray400
                        }
                      />
                    </View>
                  </TouchableOpacity>
                  {index < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        index < currentStep && styles.stepLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.compactStepLabel} numberOfLines={1}>
              Etapa {currentStep + 1} de {steps.length}:{" "}
              {steps[currentStep]?.title}
            </Text>
          </>
        ) : (
          steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <TouchableOpacity
                style={[
                  styles.stepButton,
                  index === currentStep && styles.stepButtonCurrent,
                ]}
                onPress={() => goToStep(index)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={"Ir para etapa: " + step.title}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.stepCircle,
                    index <= currentStep && styles.stepCircleActive,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={index <= currentStep ? COLORS.white : COLORS.gray400}
                  />
                </View>
                <Text
                  style={[
                    styles.stepText,
                    index <= currentStep && styles.stepTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    index < currentStep && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))
        )}
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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <Button
            title="Anterior"
            onPress={prevStep}
            variant="outline"
            style={styles.navButton}
          />
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            title="Próximo"
            onPress={nextStep}
            style={[
              styles.navButton,
              currentStep === 0 && styles.navButtonFull,
            ]}
          />
        ) : isViewingRecordedAnamnese ? (
          <Button
            title={isSelfMode ? "Voltar ao início" : "Voltar ao paciente"}
            onPress={handleBack}
            variant="outline"
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Salvar"
            onPress={handleSave}
            loading={loading}
            style={styles.navButton}
          />
        )}
      </View>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  patientAvatarText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "bold",
    color: COLORS.white,
  },
  patientName: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  patientInfo: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  headerActions: {
    marginLeft: "auto",
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
  stepsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    ...SHADOWS.sm,
  },
  stepsContainerCompact: {
    flexDirection: "column",
    gap: SPACING.xs,
  },
  compactStepsTrack: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  compactStepButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  compactStepLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  stepButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  stepButtonCurrent: {
    backgroundColor: COLORS.gray100,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
  stepTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray200,
    marginHorizontal: SPACING.xs,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
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
  scrollContent: {
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
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  hintText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  quickVoiceCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  quickVoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  quickVoiceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
  },
  quickVoiceTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  quickVoiceTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickVoiceHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  quickVoiceButton: {
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  quickVoiceButtonRecording: {
    backgroundColor: COLORS.error,
  },
  quickVoiceButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  quickVoicePartial: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  quickVoiceSummary: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  questionGroup: {
    marginTop: SPACING.md,
  },
  option: {
    maxWidth: "100%",
    flexShrink: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  summaryCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  summaryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  summaryChip: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  summaryChipGood: {
    borderColor: COLORS.success,
    backgroundColor: "#EAF8F1",
  },
  summaryChipWarn: {
    borderColor: COLORS.warning,
    backgroundColor: "#FFF7E7",
  },
  summaryChipRisk: {
    borderColor: COLORS.error,
    backgroundColor: "#FDECEC",
  },
  summaryChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  summaryDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  navigationButtons: {
    flexDirection: "row",
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  navButton: {
    flex: 1,
  },
  navButtonFull: {
    flex: 1,
  },
});
