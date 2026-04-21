// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANAMNESE FORM SCREEN
// ==========================================

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  Anamnese,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";
import { trackEvent } from "../../services";

type AnamneseFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AnamneseForm">;
  route: RouteProp<RootStackParamList, "AnamneseForm">;
};

type IconName = keyof typeof Ionicons.glyphMap;

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
    updateAnamnese,
    getAnamneseById,
    fetchMyLatestAnamnese,
    createMyAnamnese,
    updateMyAnamnese,
  } = useAnamneseStore();
  const { showToast } = useToast();
  const paciente = isSelfMode
    ? {
        id: pacienteId,
        nomeCompleto: pacienteNome || t("home.user"),
      }
    : getPacienteById(pacienteId);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAnamneseId, setCurrentAnamneseId] = useState<
    string | undefined
  >(anamneseId);

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

  const [dorRepouso, setDorRepouso] = useState<boolean | null>(null);
  const [dorNoturna, setDorNoturna] = useState<boolean | null>(null);
  const [irradiacao, setIrradiacao] = useState<boolean | null>(null);
  const [localIrradiacao, setLocalIrradiacao] = useState("");
  const [tipoDor, setTipoDor] = useState<TipoDor | null>(null);
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
  const [historicoFamiliar, setHistoricoFamiliar] = useState("");
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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
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

  const steps: Array<{ title: string; icon: IconName }> = [
    { title: "Queixa principal", icon: "body-outline" },
    { title: "Descrição", icon: "document-text-outline" },
    { title: "Histórico", icon: "time-outline" },
    { title: "Estilo de vida", icon: "heart-outline" },
  ];

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
  const { isRecording, partial, start, stop } = useSpeechToText({
    enabled: VOICE_ENABLED,
    onResult: (text) => {
      if (!activeField) return;
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
        case "quandoProblemaAnterior":
          appendText(setQuandoProblemaAnterior, text);
          break;
        case "historicoFamiliar":
          appendText(setHistoricoFamiliar, text);
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
    setMotivoBusca(anamnese.motivoBusca);
    setAreasAfetadas(anamnese.areasAfetadas || []);
    setIntensidadeDor(anamnese.intensidadeDor || 0);
    setDescricaoSintomas(anamnese.descricaoSintomas || "");
    setTempoProblema(anamnese.tempoProblema || "");
    setHoraIntensifica(anamnese.horaIntensifica || "");
    setInicioProblema(anamnese.inicioProblema || null);
    setEventoEspecifico(anamnese.eventoEspecifico || "");
    setFatorAlivio(anamnese.fatorAlivio || "");
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
    setHistoricoFamiliar(anamnese.historicoFamiliar || "");
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
        const anamnese = getAnamneseById(currentAnamneseId);
        if (anamnese && mounted) {
          applyAnamneseToForm(anamnese);
        }
        setDraftLoaded(true);
        return;
      }

      if (isSelfMode) {
        try {
          const latest = await fetchMyLatestAnamnese();
          if (latest && mounted) {
            applyAnamneseToForm(latest);
          }
        } catch {
          // ignore latest load errors; screen remains usable for new submission
        } finally {
          if (mounted) {
            setDraftLoaded(true);
          }
        }
        return;
      }

      setDraftLoaded(false);
    };

    loadExistingAnamnese();

    return () => {
      mounted = false;
    };
  }, [currentAnamneseId, fetchMyLatestAnamnese, getAnamneseById, isSelfMode]);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (!raw) {
          setDraftLoaded(true);
          return;
        }
        const draft = JSON.parse(raw) as {
          motivoBusca?: MotivoBusca | null;
          areasAfetadas?: AreaAfetada[];
          intensidadeDor?: number;
          descricaoSintomas?: string;
          tempoProblema?: string;
          horaIntensifica?: string;
          inicioProblema?: InicioProblema | null;
          eventoEspecifico?: string;
          fatorAlivio?: string;
          problemaAnterior?: boolean | null;
          quandoProblemaAnterior?: string;
          tratamentosAnteriores?: string[];
          historicoFamiliar?: string;
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
        };

        if (draft.motivoBusca !== undefined) setMotivoBusca(draft.motivoBusca);
        if (draft.areasAfetadas) setAreasAfetadas(draft.areasAfetadas);
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
        if (draft.problemaAnterior !== undefined)
          setProblemaAnterior(draft.problemaAnterior);
        if (draft.quandoProblemaAnterior)
          setQuandoProblemaAnterior(draft.quandoProblemaAnterior);
        if (draft.tratamentosAnteriores)
          setTratamentosAnteriores(draft.tratamentosAnteriores);
        if (draft.historicoFamiliar)
          setHistoricoFamiliar(draft.historicoFamiliar);
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
  }, [currentAnamneseId, draftKey, pacienteId]);

  useEffect(() => {
    if (!draftLoaded) return;
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      const draft = {
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
        problemaAnterior,
        quandoProblemaAnterior,
        tratamentosAnteriores,
        historicoFamiliar,
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
      };
      AsyncStorage.setItem(draftKey, JSON.stringify(draft))
        .then(() => {
          setLastDraftSavedAt(draft.lastEditedAt);
          trackEvent("clinical_form_autosave_saved", {
            stage: "ANAMNESE",
            pacienteId,
            isEditing: !!currentAnamneseId,
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
    motivoBusca,
    areasAfetadas,
    intensidadeDor,
    descricaoSintomas,
    tempoProblema,
    horaIntensifica,
    inicioProblema,
    eventoEspecifico,
    fatorAlivio,
    problemaAnterior,
    quandoProblemaAnterior,
    tratamentosAnteriores,
    historicoFamiliar,
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
    return fields;
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
    if (!validateStep(currentStep)) {
      const failedFields = getValidationFieldsForStep(currentStep);
      trackEvent("clinical_form_validation_error", {
        stage: "ANAMNESE",
        pacienteId,
        step: currentStep,
        fields: failedFields,
      }).catch(() => undefined);
      return;
    }
    setLoading(true);

    try {
      const payload = {
        pacienteId,
        motivoBusca: motivoBusca!,
        areasAfetadas,
        intensidadeDor,
        descricaoSintomas,
        tempoProblema,
        horaIntensifica,
        inicioProblema: inicioProblema || undefined,
        eventoEspecifico,
        fatorAlivio,
        problemaAnterior: problemaAnterior || false,
        quandoProblemaAnterior,
        tratamentosAnteriores,
        historicoFamiliar,
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

      if (isSelfMode) {
        const { pacienteId: _, ...selfPayload } = payload;
        if (currentAnamneseId) {
          await updateMyAnamnese(currentAnamneseId, selfPayload);
        } else {
          const created = await createMyAnamnese(selfPayload);
          setCurrentAnamneseId(created.id);
        }
      } else if (currentAnamneseId) {
        const { pacienteId: _, ...updatePayload } = payload;
        await updateAnamnese(currentAnamneseId, updatePayload);
      } else {
        await createAnamnese(payload);
        await AsyncStorage.setItem(
          "onboarding:professional:first_anamnese_done",
          "1",
        );
      }
      await AsyncStorage.removeItem(draftKey);
      setLastDraftSavedAt(null);
      showToast({
        message: "Anamnese salva com sucesso.",
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
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
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
            setProblemaAnterior(null);
            setQuandoProblemaAnterior("");
            setTratamentosAnteriores([]);
            setHistoricoFamiliar("");
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
                    onAreasChange={(nextAreas) => {
                      setAreasAfetadas(nextAreas);
                      if (errors.areasAfetadas) {
                        setErrors((prev) => ({ ...prev, areasAfetadas: "" }));
                      }
                    }}
                  />
                  {errors.areasAfetadas && (
                    <Text style={styles.errorText}>{errors.areasAfetadas}</Text>
                  )}
                </FormSection>

                <FormSection title={t("clinical.labels.intensity")}>
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
                placeholder="Descreva o que voce sente..."
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

            <FormSection title="Como os sintomas começaram?">
              <View style={styles.optionsGrid}>
                <SelectOption
                  label="Gradual"
                  selected={inicioProblema === InicioProblema.GRADUAL}
                  onPress={() => {
                    setInicioProblema(InicioProblema.GRADUAL);
                    if (errors.inicioProblema) {
                      setErrors((prev) => ({ ...prev, inicioProblema: "" }));
                    }
                  }}
                />
                <SelectOption
                  label="Repentino"
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

            <FormSection title="O que melhora ou alivia os sintomas?">
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
          </>
        );

      case 2:
        return (
          <>
            <FormSection title="Já teve sintomas parecidos antes?">
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
                  placeholder="Quando foi? Houve tratamento?"
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

            <FormSection title="Já realizou tratamento para esta queixa?">
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

            <FormSection title="Histórico familiar relacionado">
              <Input
                placeholder="Alguém na família tem sintomas/diagnósticos semelhantes?"
                value={historicoFamiliar}
                onChangeText={(text) => {
                  setHistoricoFamiliar(text);
                  if (errors.historicoFamiliar) {
                    setErrors((prev) => ({ ...prev, historicoFamiliar: "" }));
                  }
                }}
                error={errors.historicoFamiliar}
                showCount
                showClear
                maxLength={2000}
                onClear={() => setHistoricoFamiliar("")}
                rightIcon={
                  VOICE_ENABLED ? getMicIcon("historicoFamiliar") : undefined
                }
                onRightIconPress={
                  VOICE_ENABLED
                    ? () => toggleVoice("historicoFamiliar")
                    : undefined
                }
                hint={
                  activeField === "historicoFamiliar" && isRecording
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

  if (!paciente && !isSelfMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Paciente não encontrado</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
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
              ? "Editar Anamnese"
              : isSelfMode
                ? "Minha Anamnese"
                : "Nova Anamnese"}
          </Text>
          {lastDraftSavedAt ? (
            <Text style={styles.patientInfo}>
              Última edição: {new Date(lastDraftSavedAt).toLocaleString("pt-BR")}
            </Text>
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

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
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
        ))}
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
        ) : (
          <Button
            title={anamneseId ? "Salvar Alterações" : "Salvar"}
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
  draftButton: {
    marginLeft: "auto",
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
  optionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  option: {
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






