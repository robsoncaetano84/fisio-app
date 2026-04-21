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
  parseStructuredExame,
  renderStructuredExameToText,
  serializeStructuredExame,
  trackEvent,
  updateRedFlagAnswer,
} from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from "../../constants/theme";
import { RootStackParamList } from "../../types";
import {
  DorClassificacaoPrincipal,
  DorSubtipoClinico,
  ExameFisicoStructured,
  RedFlagKey,
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

const RED_FLAG_LABELS: Record<RedFlagKey, string> = {
  CAUDA_EQUINA: "Cauda equina",
  FRATURA: "Fratura",
  INFECCAO: "Infecção",
  ONCOLOGICO: "Oncológico",
  NAO_MECANICA: "Dor não mecânica",
  DEFICIT_NEURO_PROGRESSIVO: "Déficit neuro progressivo",
  VASCULAR: "Vascular",
};

const prettyEnum = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

export function ExameFisicoFormScreen({ route, navigation }: ExameFisicoFormScreenProps) {
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

  const generateSuggestion = async (force = false) => {
    if (generating) return;
    setGenerating(true);
    try {
      await fetchAnamnesesByPaciente(pacienteId);
      const latest = getLatestAnamnese();
      const next = buildStructuredExameFromAnamnese(latest);
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

      const laudo = await fetchLaudoByPaciente(pacienteId, false).catch(() => null);
      if (!active) return;

      if (laudo?.id) {
        setLaudoId(laudo.id);
        const structured = parseStructuredExame(laudo.exameFisico);
        if (structured) {
          setExam(structured);
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
  }, [draftKey, fetchLaudoByPaciente, fetchPacientes, paciente, pacienteId]);

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

  const validateForm = () => {
    if (!exam) return false;
    const nextErrors: Record<string, string> = {};

    if (!exam.movimento.reproduzDor.trim()) {
      nextErrors.movimentoReproduzDor = "Informe qual movimento reproduz a dor.";
    }
    if (!exam.cruzamentoFinal.hipotesePrincipal.trim()) {
      nextErrors.hipotesePrincipal = "Hipótese principal é obrigatória.";
    }
    if (!exam.cruzamentoFinal.condutaDirecionada.trim()) {
      nextErrors.conduta = "Direção de conduta é obrigatória.";
    }

    if (exam.redFlags.criticalTriggered) {
      if (!String(exam.redFlags.referralDestination || "").trim()) {
        nextErrors.referralDestination = "Informe o destino de encaminhamento.";
      }
      if (!String(exam.redFlags.referralReason || "").trim()) {
        nextErrors.referralReason = "Descreva o motivo clínico do encaminhamento.";
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
      const diagnostico = effectiveExam.cruzamentoFinal.hipotesePrincipal.trim() || "Diagnóstico funcional em elaboração.";
      const condutas = effectiveExam.cruzamentoFinal.condutaDirecionada.trim() || "Conduta terapêuutica em elaboração.";

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
          <Text style={styles.blockTitle}>Classificação de dor</Text>
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
          <Text style={styles.blockTitle}>Triagem de red flags</Text>
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
          <Text style={styles.blockTitle}>Observação e movimento</Text>
          <Input label="Postura" value={exam.observacao.postura} onChangeText={(v) => setField("observacao.postura", v)} />
          <Input label="Assimetria" value={exam.observacao.assimetria} onChangeText={(v) => setField("observacao.assimetria", v)} />
          <Input label="Proteção" value={exam.observacao.protecao} onChangeText={(v) => setField("observacao.protecao", v)} />
          <Input label="Padrão de movimento" value={exam.observacao.padraoMovimento} onChangeText={(v) => setField("observacao.padraoMovimento", v)} />

          <Input label="Movimento ativo" value={exam.movimento.ativo} onChangeText={(v) => setField("movimento.ativo", v)} />
          <Input label="Movimento passivo" value={exam.movimento.passivo} onChangeText={(v) => setField("movimento.passivo", v)} />
          <Input label="Movimento resistido" value={exam.movimento.resistido} onChangeText={(v) => setField("movimento.resistido", v)} />
          <Input
            label="Qual movimento reproduz a dor?"
            value={exam.movimento.reproduzDor}
            onChangeText={(v) => setField("movimento.reproduzDor", v)}
            error={errors.movimentoReproduzDor}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Padrão de dor e palpação</Text>
          <Input label="Local" value={exam.padraoDor.local} onChangeText={(v) => setField("padraoDor.local", v)} />
          <Input label="Irradiada" value={exam.padraoDor.irradiada} onChangeText={(v) => setField("padraoDor.irradiada", v)} />
          <Input label="Comportamento" value={exam.padraoDor.comportamento} onChangeText={(v) => setField("padraoDor.comportamento", v)} />

          <Input label="Palpação muscular" value={exam.palpacao.muscular} onChangeText={(v) => setField("palpacao.muscular", v)} />
          <Input label="Palpação articular" value={exam.palpacao.articular} onChangeText={(v) => setField("palpacao.articular", v)} />
          <Input label="Pontos de gatilho" value={exam.palpacao.pontosGatilho} onChangeText={(v) => setField("palpacao.pontosGatilho", v)} />
          <Input label="Palpação dinâmica vertebral" value={exam.palpacao.dinamicaVertebral} onChangeText={(v) => setField("palpacao.dinamicaVertebral", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Testes e cadeia cinética</Text>
          <Input label="Testes biomecânicos" value={exam.testes.biomecanicos} onChangeText={(v) => setField("testes.biomecanicos", v)} />
          <Input label="Testes ortopédicos" value={exam.testes.ortopedicos} onChangeText={(v) => setField("testes.ortopedicos", v)} />
          <Input label="Neurológico (dermátomo, miótomo, reflexos)" value={exam.testes.neurologicos} onChangeText={(v) => setField("testes.neurologicos", v)} />
          <Input label="Exame de imagem" value={exam.testes.imagem} onChangeText={(v) => setField("testes.imagem", v)} />

          <Input label="Quadril" value={exam.cadeiaCinetica.quadril} onChangeText={(v) => setField("cadeiaCinetica.quadril", v)} />
          <Input label="Pelve" value={exam.cadeiaCinetica.pelve} onChangeText={(v) => setField("cadeiaCinetica.pelve", v)} />
          <Input label="Coluna torácica" value={exam.cadeiaCinetica.colunaToracica} onChangeText={(v) => setField("cadeiaCinetica.colunaToracica", v)} />
          <Input label="Pé" value={exam.cadeiaCinetica.pe} onChangeText={(v) => setField("cadeiaCinetica.pe", v)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.blockTitle}>Cruzamento final</Text>
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
          <Text style={styles.blockTitle}>Prévia clínica</Text>
          <Input value={renderStructuredExameToText(exam)} multiline numberOfLines={12} editable={false} style={{ height: 300, textAlignVertical: "top" }} />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => generateSuggestion(true)}
              disabled={generating}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipText}>{generating ? "Gerando..." : "Regerar por anamnese"}</Text>
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
              <Text style={styles.actionChipText}>Limpar rascunho</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={exam.redFlags.criticalTriggered ? "Salvar triagem e encaminhar" : "Salvar Exame físico"}
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
});






