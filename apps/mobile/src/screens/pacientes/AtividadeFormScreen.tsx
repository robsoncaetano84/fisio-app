// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADE FORM SCREEN
// ==========================================
import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, useToast } from "../../components/ui";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { RootStackParamList } from "../../types";
import { api } from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { Atividade, Exercicio } from "../../types";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  EXERCISE_IMAGE_OPTIONS,
  ExerciseImageType,
  ExerciseVisual,
  inferExerciseImageType,
  isValidExerciseImageUrl,
  normalizeExerciseImageType,
} from "../../components/clinical/ExerciseVisual";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AtividadeForm">;
  route: RouteProp<RootStackParamList, "AtividadeForm">;
};

const DAYS = [
  { value: 1, label: "D1" },
  { value: 2, label: "D2" },
  { value: 3, label: "D3" },
  { value: 4, label: "D4" },
  { value: 5, label: "D5" },
  { value: 6, label: "D6" },
  { value: 7, label: "D7" },
];

const maskDateBr = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const toApiDateFromBr = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const d = Number(dd);
  const m = Number(mm);
  const y = Number(yyyy);
  const local = new Date(y, m - 1, d);
  if (
    local.getFullYear() !== y ||
    local.getMonth() !== m - 1 ||
    local.getDate() !== d
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
};

const toBrDateFromApi = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
};

export function AtividadeFormScreen({ navigation, route }: Props) {
  const { pacienteId, pacienteNome } = route.params;
  const { showToast } = useToast();
  const { fetchPacientes } = usePacienteStore();
  const { t } = useLanguage();

  const [titulo, setTitulo] = useState("");
  const [exercicioId, setExercicioId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [instrucoesExecucao, setInstrucoesExecucao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [imagemTipo, setImagemTipo] =
    useState<ExerciseImageType>("MOBILIDADE_GERAL");
  const [referenciasBibliograficas, setReferenciasBibliograficas] =
    useState("");
  const [aceiteProfissional, setAceiteProfissional] = useState(false);
  const [diaPrescricao, setDiaPrescricao] = useState<number>(1);
  const [ordemNoDia, setOrdemNoDia] = useState("1");
  const [dataLimite, setDataLimite] = useState("");
  const [repetirSemanal, setRepetirSemanal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAtividades, setLoadingAtividades] = useState(true);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loadingExercicios, setLoadingExercicios] = useState(true);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseRegionFilter, setExerciseRegionFilter] = useState<
    string | "ALL"
  >("ALL");
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [editingAtividadeId, setEditingAtividadeId] = useState<string | null>(
    null,
  );
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<Atividade | null>(
    null,
  );
  const [duplicateDia, setDuplicateDia] = useState<number>(1);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDia, setFilterDia] = useState<number | "ALL" | "NONE">("ALL");
  const [generatingAi, setGeneratingAi] = useState(false);
  const autoSuggestionAttemptedRef = useRef(false);
  const draftChangeVersionRef = useRef(0);

  const markDraftChanged = () => {
    draftChangeVersionRef.current += 1;
  };

  const canSave = useMemo(() => {
    return (
      !!titulo.trim() &&
      !!instrucoesExecucao.trim() &&
      !!aceiteProfissional &&
      !saving
    );
  }, [titulo, instrucoesExecucao, aceiteProfissional, saving]);

  const atividadesFiltradas = useMemo(() => {
    if (filterDia === "ALL") return atividades;
    if (filterDia === "NONE") {
      return atividades.filter((item) => !item.diaPrescricao);
    }
    return atividades.filter((item) => item.diaPrescricao === filterDia);
  }, [atividades, filterDia]);

  const exerciseRegions = useMemo(() => {
    return Array.from(
      new Set(exercicios.map((item) => item.regiaoCorporal).filter(Boolean)),
    ).sort();
  }, [exercicios]);

  const exerciciosFiltrados = useMemo(() => {
    const search = exerciseSearch.trim().toLowerCase();
    return exercicios
      .filter((item) =>
        exerciseRegionFilter === "ALL"
          ? true
          : item.regiaoCorporal === exerciseRegionFilter,
      )
      .filter((item) => {
        if (!search) return true;
        return [
          item.nome,
          item.objetivo,
          item.descricao,
          item.regiaoCorporal,
          item.categoria,
          item.nivel,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .slice(0, 12);
  }, [exerciseRegionFilter, exerciseSearch, exercicios]);

  const loadAtividades = async () => {
    try {
      setLoadingAtividades(true);
      const response = await api.get<Atividade[]>("/atividades", {
        params: { pacienteId },
      });
      setAtividades(response.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          await fetchPacientes(true).catch(() => undefined);
          showToast({
            message:
              status === 403
                ? "Sem permissão para prescrever atividade para este paciente"
                : "Paciente não encontrado para a sessão atual",
            type: "error",
          });
          navigation.goBack();
          return;
        }
      }
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setLoadingAtividades(false);
    }
  };

  const loadExercicios = async () => {
    try {
      setLoadingExercicios(true);
      const response = await api.get<Exercicio[]>("/exercicios");
      setExercicios(response.data || []);
    } catch {
      showToast({
        message: "Não foi possível carregar o catálogo de exercícios",
        type: "info",
      });
    } finally {
      setLoadingExercicios(false);
    }
  };

  const aplicarExercicio = (exercicio: Exercicio) => {
    markDraftChanged();
    setExercicioId(exercicio.id);
    setTitulo(exercicio.nome);
    setDescricao(
      [exercicio.objetivo, exercicio.descricao].filter(Boolean).join("\n\n"),
    );
    setInstrucoesExecucao(exercicio.instrucoesPadrao || "");
    setImagemUrl("");
    setImagemTipo(
      exercicio.imagemKey
        ? normalizeExerciseImageType(exercicio.imagemKey)
        : inferExerciseImageType(
            exercicio.nome,
            exercicio.objetivo,
            exercicio.descricao,
            exercicio.tags?.join(" "),
          ),
    );
    showToast({
      message: "Exercício do catálogo aplicado à prescrição",
      type: "success",
    });
  };

  const applyAutomaticSuggestion = (
    data: Partial<{
      titulo: string;
      descricao: string;
      instrucoesExecucao: string;
      imagemTipo: string;
      referencias: string[];
    }>,
  ) => {
    const tituloSugerido = String(data.titulo || "").trim();
    const descricaoOriginal = String(data.descricao || "").trim();
    const instrucoesSugeridas = String(data.instrucoesExecucao || "").trim();
    const imagemTipoSugerida = String(data.imagemTipo || "").trim();
    const referenciasArray = Array.isArray(data.referencias)
      ? data.referencias.map((item) => String(item).trim()).filter(Boolean)
      : [];

    let descricaoFinal = descricaoOriginal;
    let referenciasFinal = referenciasArray.join("\n");

    const marker = "Referencias:";
    const markerIndex = descricaoOriginal.indexOf(marker);
    if (markerIndex >= 0) {
      descricaoFinal = descricaoOriginal.slice(0, markerIndex).trim();
      if (!referenciasFinal) {
        referenciasFinal = descricaoOriginal
          .slice(markerIndex + marker.length)
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean)
          .join("\n");
      }
    }

    setExercicioId(null);
    setImagemUrl("");
    if (tituloSugerido) setTitulo(tituloSugerido);
    if (descricaoFinal) setDescricao(descricaoFinal);
    if (instrucoesSugeridas) setInstrucoesExecucao(instrucoesSugeridas);
    if (imagemTipoSugerida) {
      setImagemTipo(normalizeExerciseImageType(imagemTipoSugerida));
    } else if (tituloSugerido || descricaoFinal) {
      setImagemTipo(inferExerciseImageType(tituloSugerido, descricaoFinal));
    }
    if (referenciasFinal) setReferenciasBibliograficas(referenciasFinal);
  };

  const generateAutomaticSuggestion = async (silent = false) => {
    setGeneratingAi(true);
    autoSuggestionAttemptedRef.current = true;
    const draftVersionAtStart = draftChangeVersionRef.current;
    try {
      const response = await api.post<
        Partial<{
          titulo: string;
          descricao: string;
          instrucoesExecucao: string;
          imagemTipo: string;
          referencias: string[];
          source: "ai" | "rules";
        }>
      >("/atividades/sugestao-ia", {
        pacienteId,
      });
      if (response.data) {
        if (silent && draftChangeVersionRef.current !== draftVersionAtStart) {
          return;
        }
        applyAutomaticSuggestion(response.data);
        if (!silent) {
          showToast({
            message: "Rascunho de atividade gerado pela IA",
            type: "success",
          });
        }
      }
    } catch {
      if (!silent) {
        showToast({
          message: "Não foi possível gerar rascunho automático agora",
          type: "info",
        });
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  React.useEffect(() => {
    autoSuggestionAttemptedRef.current = false;
    draftChangeVersionRef.current = 0;
    loadAtividades().catch(() => undefined);
    loadExercicios().catch(() => undefined);
  }, [pacienteId]);

  React.useEffect(() => {
    if (loadingAtividades) return;
    if (editingAtividadeId) return;
    if (
      titulo.trim() ||
      descricao.trim() ||
      instrucoesExecucao.trim() ||
      referenciasBibliograficas.trim()
    )
      return;
    if (autoSuggestionAttemptedRef.current) return;
    generateAutomaticSuggestion(true).catch(() => undefined);
  }, [
    loadingAtividades,
    pacienteId,
    editingAtividadeId,
    titulo,
    descricao,
    instrucoesExecucao,
    referenciasBibliograficas,
  ]);

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      showToast({ message: "Informe o título da atividade", type: "error" });
      return;
    }

    if (!aceiteProfissional) {
      showToast({
        message: "Marque o aceite profissional para salvar a prescrição",
        type: "error",
      });
      return;
    }

    if (!instrucoesExecucao.trim()) {
      showToast({
        message: "Informe como o paciente deve realizar o exercício",
        type: "error",
      });
      return;
    }

    if (imagemUrl.trim() && !isValidExerciseImageUrl(imagemUrl)) {
      showToast({
        message:
          "Informe uma URL propria/interna iniciando com http:// ou https://",
        type: "error",
      });
      return;
    }

    const parsedOrder = Number.parseInt(ordemNoDia, 10);
    if (!Number.isFinite(parsedOrder) || parsedOrder < 1 || parsedOrder > 20) {
      showToast({
        message: "A ordem no dia deve estar entre 1 e 20",
        type: "error",
      });
      return;
    }

    const dataLimiteApi = dataLimite.trim() ? toApiDateFromBr(dataLimite) : "";
    if (dataLimite.trim() && !dataLimiteApi) {
      showToast({
        message: "Data limite inválida. Use o formato DD/MM/AAAA",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        pacienteId,
        exercicioId,
        titulo: titulo.trim(),
        descricao:
          [
            descricao.trim(),
            referenciasBibliograficas.trim()
              ? `Referencias: ${referenciasBibliograficas
                  .trim()
                  .split(/\r?\n/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .join(" | ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n") || undefined,
        instrucoesExecucao: instrucoesExecucao.trim(),
        imagemUrl: imagemUrl.trim() || "",
        imagemTipo,
        diaPrescricao,
        ordemNoDia: parsedOrder,
        repetirSemanal,
        aceiteProfissional,
        dataLimite: dataLimiteApi || undefined,
      };

      if (editingAtividadeId) {
        await api.patch(`/atividades/${editingAtividadeId}`, payload);
        showToast({
          message: "Prescrição atualizada com sucesso",
          type: "success",
        });
      } else {
        await api.post("/atividades", payload);
        showToast({ message: "Prescrição salva com sucesso", type: "success" });
      }
      navigation.goBack();
      return;
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const iniciarEdicao = (atividade: Atividade) => {
    const descricaoAtual = atividade.descricao || "";
    const marker = "\n\nReferencias: ";
    const markerIndex = descricaoAtual.lastIndexOf(marker);
    setEditingAtividadeId(atividade.id);
    setExercicioId(atividade.exercicioId || null);
    setTitulo(atividade.titulo || "");
    setDescricao(
      markerIndex >= 0 ? descricaoAtual.slice(0, markerIndex) : descricaoAtual,
    );
    setInstrucoesExecucao(atividade.instrucoesExecucao || "");
    setImagemUrl(atividade.imagemUrl || "");
    setImagemTipo(
      atividade.imagemTipo
        ? normalizeExerciseImageType(atividade.imagemTipo)
        : inferExerciseImageType(atividade.titulo, atividade.descricao),
    );
    setReferenciasBibliograficas(
      markerIndex >= 0
        ? descricaoAtual
            .slice(markerIndex + marker.length)
            .split(" | ")
            .map((item) => item.trim())
            .filter(Boolean)
            .join("\n")
        : "",
    );
    setDiaPrescricao(atividade.diaPrescricao || 1);
    setOrdemNoDia(String(atividade.ordemNoDia || 1));
    setDataLimite(
      atividade.dataLimite ? toBrDateFromApi(String(atividade.dataLimite)) : "",
    );
    setRepetirSemanal(atividade.repetirSemanal !== false);
    setAceiteProfissional(atividade.aceiteProfissional === true);
  };

  const cancelarEdicao = () => {
    markDraftChanged();
    setEditingAtividadeId(null);
    setExercicioId(null);
    setTitulo("");
    setDescricao("");
    setInstrucoesExecucao("");
    setImagemUrl("");
    setImagemTipo("MOBILIDADE_GERAL");
    setReferenciasBibliograficas("");
    setDiaPrescricao(1);
    setOrdemNoDia("1");
    setDataLimite("");
    setRepetirSemanal(true);
    setAceiteProfissional(false);
  };

  const confirmarInativacao = (atividade: Atividade) => {
    Alert.alert(
      "Inativar prescrição",
      `Deseja inativar "${atividade.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Inativar",
          style: "destructive",
          onPress: () => handleInativar(atividade.id),
        },
      ],
    );
  };

  const handleInativar = async (atividadeId: string) => {
    try {
      setInactivatingId(atividadeId);
      await api.patch(`/atividades/${atividadeId}/inativar`);
      showToast({ message: "Prescrição inativada", type: "success" });
      await loadAtividades();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setInactivatingId(null);
    }
  };

  const abrirDuplicacao = (atividade: Atividade) => {
    setDuplicateTarget(atividade);
    setDuplicateDia(atividade.diaPrescricao || 1);
    setDuplicateModalVisible(true);
  };

  const toggleSelected = (atividadeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(atividadeId)
        ? prev.filter((id) => id !== atividadeId)
        : [...prev, atividadeId],
    );
  };

  const handleDuplicar = async () => {
    if (!duplicateTarget) return;
    try {
      setDuplicatingId(duplicateTarget.id);
      await api.post(`/atividades/${duplicateTarget.id}/duplicar`, {
        diaPrescricao: duplicateDia,
      });
      showToast({ message: "Prescrição duplicada", type: "success" });
      setDuplicateModalVisible(false);
      setDuplicateTarget(null);
      await loadAtividades();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setDuplicatingId(null);
    }
  };

  const abrirDuplicacaoLote = () => {
    if (!selectedIds.length) {
      showToast({ message: "Selecione ao menos uma prescrição", type: "info" });
      return;
    }
    setDuplicateTarget(null);
    setDuplicateDia(1);
    setDuplicateModalVisible(true);
  };

  const handleDuplicarLote = async () => {
    if (!selectedIds.length) return;
    try {
      setDuplicatingId("__batch__");
      const response = await api.post<{ total: number }>(
        "/atividades/duplicar-lote",
        {
          atividadeIds: selectedIds,
          diaPrescricao: duplicateDia,
        },
      );
      showToast({
        message: `${response.data?.total || selectedIds.length} prescrições duplicadas`,
        type: "success",
      });
      setDuplicateModalVisible(false);
      setSelectedIds([]);
      setBatchMode(false);
      await loadAtividades();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {t("patientDetails.prescribeActivity")}
          </Text>
          <Text style={styles.subtitle}>
            {pacienteNome || "Paciente"} - plano semanal de atividades
          </Text>
          {editingAtividadeId ? (
            <View style={styles.editingBanner}>
              <Ionicons
                name="create-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.editingBannerText}>
                Editando prescrição selecionada
              </Text>
            </View>
          ) : null}
          <Button
            title="Gerar prescrição com IA"
            onPress={() => generateAutomaticSuggestion()}
            loading={generatingAi}
            disabled={saving || generatingAi}
            variant="outline"
            icon={
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={COLORS.primary}
              />
            }
            style={styles.aiButton}
          />

          <View style={styles.catalogPanel}>
            <View style={styles.catalogHeader}>
              <View style={styles.catalogTitleWrap}>
                <Text style={styles.catalogTitle}>Catálogo Synap</Text>
                <Text style={styles.catalogSubtitle}>
                  Selecione uma imagem e instrução própria revisada
                </Text>
              </View>
              {exercicioId ? (
                <TouchableOpacity
                  style={styles.clearExerciseButton}
                  onPress={() => {
                    markDraftChanged();
                    setExercicioId(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.clearExerciseText}>Desvincular</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Input
              label="Buscar exercício"
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholder="Ex.: lombar, joelho, mobilidade"
              autoCapitalize="none"
            />
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  exerciseRegionFilter === "ALL" && styles.filterChipActive,
                ]}
                onPress={() => setExerciseRegionFilter("ALL")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    exerciseRegionFilter === "ALL" &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {exerciseRegions.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.filterChip,
                    exerciseRegionFilter === region && styles.filterChipActive,
                  ]}
                  onPress={() => setExerciseRegionFilter(region)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      exerciseRegionFilter === region &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {region.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {loadingExercicios ? (
              <Text style={styles.emptyText}>Carregando catálogo...</Text>
            ) : exerciciosFiltrados.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhum exercício encontrado no catálogo.
              </Text>
            ) : (
              <View style={styles.exerciseCatalogList}>
                {exerciciosFiltrados.map((exercicio) => (
                  <TouchableOpacity
                    key={exercicio.id}
                    style={[
                      styles.exerciseCatalogItem,
                      exercicioId === exercicio.id &&
                        styles.exerciseCatalogItemActive,
                    ]}
                    onPress={() => aplicarExercicio(exercicio)}
                    activeOpacity={0.88}
                  >
                    <ExerciseVisual
                      imageType={exercicio.imagemKey}
                      title={exercicio.nome}
                      compact
                    />
                    <View style={styles.exerciseCatalogMeta}>
                      <Text style={styles.exerciseCatalogName}>
                        {exercicio.nome}
                      </Text>
                      <Text style={styles.exerciseCatalogInfo}>
                        {exercicio.regiaoCorporal.replace(/_/g, " ")} •{" "}
                        {exercicio.categoria.replace(/_/g, " ")} •{" "}
                        {exercicio.nivel}
                      </Text>
                      <Text style={styles.exerciseCatalogObjective} numberOfLines={2}>
                        {exercicio.objetivo}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        exercicioId === exercicio.id
                          ? "checkmark-circle"
                          : "add-circle-outline"
                      }
                      size={22}
                      color={
                        exercicioId === exercicio.id
                          ? COLORS.success
                          : COLORS.primary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Input
            label="Título da atividade"
            value={titulo}
            onChangeText={(value) => {
              markDraftChanged();
              setTitulo(value);
            }}
            placeholder="Ex.: Mobilidade lombar + alongamento"
            maxLength={140}
            showCount
          />

          <Input
            label="Descrição"
            value={descricao}
            onChangeText={(value) => {
              markDraftChanged();
              setDescricao(value);
            }}
            placeholder="Orientações detalhadas para o paciente"
            multiline
            maxLength={1000}
            showCount
          />

          <View style={styles.exerciseImagePanel}>
            <Text style={styles.exerciseImageTitle}>Imagem do exercício</Text>
            <ExerciseVisual
              imageUrl={imagemUrl}
              imageType={imagemTipo}
              title={titulo}
            />
            <Text style={styles.sectionLabel}>Ilustração orientativa</Text>
            <View style={styles.imageTypeGrid}>
              {EXERCISE_IMAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.imageTypeChip,
                    imagemTipo === option.value && styles.imageTypeChipActive,
                  ]}
                  onPress={() => {
                    markDraftChanged();
                    setImagemTipo(option.value);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.imageTypeChipText,
                      imagemTipo === option.value &&
                        styles.imageTypeChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              label="URL de imagem propria/interna (opcional)"
              value={imagemUrl}
              onChangeText={(value) => {
                markDraftChanged();
                setImagemUrl(value);
              }}
              placeholder="https://sua-base-de-imagens/..."
              autoCapitalize="none"
              keyboardType="url"
              maxLength={2048}
            />
          </View>

          <Input
            label="Como o paciente deve realizar"
            value={instrucoesExecucao}
            onChangeText={(value) => {
              markDraftChanged();
              setInstrucoesExecucao(value);
            }}
            placeholder="Passo a passo, dose, ritmo e sinais de alerta"
            multiline
            maxLength={1500}
            showCount
          />

          <View style={styles.referencesHighlight}>
            <Text style={styles.referencesHeader}>
              Referencias bibliograficas
            </Text>
            <Input
              label="Livros e artigos"
              value={referenciasBibliograficas}
              onChangeText={(value) => {
                markDraftChanged();
                setReferenciasBibliograficas(value);
              }}
              placeholder="Uma referencia por linha"
              multiline
              maxLength={1200}
              showCount
            />
          </View>

          <Text style={styles.sectionLabel}>Dia da prescrição</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayChip,
                  diaPrescricao === day.value && styles.dayChipActive,
                ]}
                onPress={() => setDiaPrescricao(day.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    diaPrescricao === day.value && styles.dayChipTextActive,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Input
                label="Ordem no dia"
                value={ordemNoDia}
                onChangeText={setOrdemNoDia}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>
            <View style={styles.rowField}>
              <Input
                label="Data limite"
                value={dataLimite}
                onChangeText={(text) => setDataLimite(maskDateBr(text))}
                placeholder="DD/MM/AAAA (opcional)"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setRepetirSemanal((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={repetirSemanal ? "checkbox" : "square-outline"}
              size={20}
              color={repetirSemanal ? COLORS.primary : COLORS.gray500}
            />
            <Text style={styles.toggleText}>Repetir semanalmente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptanceChecklist}
            onPress={() => setAceiteProfissional((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={aceiteProfissional ? "checkbox" : "square-outline"}
              size={20}
              color={aceiteProfissional ? COLORS.primary : COLORS.gray500}
            />
            <Text style={styles.acceptanceTitle}>
              Confirmo que revisei e aprovo esta prescrição profissional.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.listCard]}>
          <Text style={styles.titleSmall}>
            {t("clinical.labels.activePrescriptions")}
          </Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterDia === "ALL" && styles.filterChipActive,
              ]}
              onPress={() => setFilterDia("ALL")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterDia === "ALL" && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={`filter-${day.value}`}
                style={[
                  styles.filterChip,
                  filterDia === day.value && styles.filterChipActive,
                ]}
                onPress={() => setFilterDia(day.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterDia === day.value && styles.filterChipTextActive,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterDia === "NONE" && styles.filterChipActive,
              ]}
              onPress={() => setFilterDia("NONE")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterDia === "NONE" && styles.filterChipTextActive,
                ]}
              >
                Sem dia
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.batchHeader}>
            <TouchableOpacity
              style={[
                styles.batchButton,
                batchMode && styles.batchButtonActive,
              ]}
              onPress={() => {
                if (batchMode) {
                  setSelectedIds([]);
                }
                setBatchMode((prev) => !prev);
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={batchMode ? "checkbox-outline" : "copy-outline"}
                size={14}
                color={batchMode ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.batchButtonText,
                  batchMode && styles.batchButtonTextActive,
                ]}
              >
                {batchMode ? "Cancelar seleção" : "Selecionar para duplicar"}
              </Text>
            </TouchableOpacity>
            {batchMode ? (
              <TouchableOpacity
                style={styles.duplicarLoteButton}
                onPress={abrirDuplicacaoLote}
                activeOpacity={0.85}
              >
                <Text style={styles.duplicarLoteButtonText}>
                  Duplicar ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {loadingAtividades ? (
            <Text style={styles.emptyText}>Carregando prescrições...</Text>
          ) : atividadesFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma prescrição ativa.</Text>
          ) : (
            atividadesFiltradas.map((atividade) => (
              <View key={atividade.id} style={styles.itemRow}>
                {batchMode ? (
                  <TouchableOpacity
                    style={styles.checkboxArea}
                    onPress={() => toggleSelected(atividade.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={
                        selectedIds.includes(atividade.id)
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={20}
                      color={
                        selectedIds.includes(atividade.id)
                          ? COLORS.primary
                          : COLORS.gray500
                      }
                    />
                  </TouchableOpacity>
                ) : null}
                <ExerciseVisual
                  imageUrl={atividade.imagemUrl}
                  imageType={atividade.imagemTipo}
                  title={atividade.titulo}
                  compact
                />
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>
                    {atividade.ordemNoDia ? `${atividade.ordemNoDia}. ` : ""}
                    {atividade.titulo}
                  </Text>
                  <View
                    style={[
                      styles.acceptanceBadge,
                      atividade.aceiteProfissional
                        ? styles.acceptanceBadgeOk
                        : styles.acceptanceBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.acceptanceBadgeText,
                        atividade.aceiteProfissional
                          ? styles.acceptanceBadgeTextOk
                          : styles.acceptanceBadgeTextPending,
                      ]}
                    >
                      {atividade.aceiteProfissional ? "Aceita" : "Pendente"}
                    </Text>
                  </View>
                  <Text style={styles.itemInfo}>
                    {atividade.diaPrescricao
                      ? `Dia ${atividade.diaPrescricao}`
                      : "Sem dia semanal"}
                    {atividade.repetirSemanal ? " • semanal" : ""}
                  </Text>
                  {atividade.instrucoesExecucao ? (
                    <Text style={styles.itemInfo} numberOfLines={2}>
                      {atividade.instrucoesExecucao}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.editarButton}
                  onPress={() => iniciarEdicao(atividade)}
                  disabled={batchMode}
                  activeOpacity={0.85}
                >
                  <Text style={styles.editarButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.duplicarButton}
                  onPress={() => abrirDuplicacao(atividade)}
                  disabled={duplicatingId === atividade.id || batchMode}
                  activeOpacity={0.85}
                >
                  <Text style={styles.duplicarButtonText}>
                    {duplicatingId === atividade.id ? "..." : "Duplicar"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inativarButton}
                  onPress={() => confirmarInativacao(atividade)}
                  disabled={inactivatingId === atividade.id || batchMode}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inativarButtonText}>
                    {inactivatingId === atividade.id ? "..." : "Inativar"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
          <Button
            title={editingAtividadeId ? "Salvar Edição" : "Salvar Prescrição"}
            onPress={handleSalvar}
            loading={saving}
            disabled={!canSave || generatingAi}
          />
        </View>
        {editingAtividadeId ? (
          <View style={styles.actions}>
            <Button
              title="Cancelar Edição"
              onPress={cancelarEdicao}
              variant="ghost"
            />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={duplicateModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Duplicar prescrição</Text>
            <Text style={styles.modalSubtitle}>
              {duplicateTarget ? (
                <>
                  Escolha o dia para a cópia de{" "}
                  <Text style={styles.modalStrong}>
                    {duplicateTarget?.titulo || "-"}
                  </Text>
                </>
              ) : (
                <>
                  Escolha o dia para duplicar{" "}
                  <Text style={styles.modalStrong}>{selectedIds.length}</Text>{" "}
                  prescrições
                </>
              )}
            </Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={`dup-${day.value}`}
                  style={[
                    styles.dayChip,
                    duplicateDia === day.value && styles.dayChipActive,
                  ]}
                  onPress={() => setDuplicateDia(day.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      duplicateDia === day.value && styles.dayChipTextActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => {
                  setDuplicateModalVisible(false);
                  setDuplicateTarget(null);
                }}
              />
              <Button
                title="Confirmar"
                onPress={duplicateTarget ? handleDuplicar : handleDuplicarLote}
                loading={
                  duplicateTarget
                    ? duplicatingId === duplicateTarget?.id
                    : duplicatingId === "__batch__"
                }
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  listCard: {
    marginTop: SPACING.lg,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
  },
  editingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  editingBannerText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  referencesHighlight: {
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    backgroundColor: COLORS.primary + "08",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  referencesHeader: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  exerciseImagePanel: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  exerciseImageTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  imageTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  imageTypeChip: {
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  imageTypeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  imageTypeChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  imageTypeChipTextActive: {
    color: COLORS.white,
  },
  acceptanceChecklist: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  acceptanceTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  titleSmall: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  itemRow: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  checkboxArea: {
    marginRight: SPACING.xs,
  },
  itemMeta: {
    flex: 1,
    minWidth: 160,
  },
  acceptanceBadge: {
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginTop: 4,
  },
  acceptanceBadgeOk: {
    backgroundColor: COLORS.success + "1F",
  },
  acceptanceBadgePending: {
    backgroundColor: COLORS.warning + "1F",
  },
  acceptanceBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  acceptanceBadgeTextOk: {
    color: COLORS.success,
  },
  acceptanceBadgeTextPending: {
    color: COLORS.warning,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  itemInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  inativarButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  duplicarButton: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  duplicarButtonText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  editarButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  editarButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  inativarButtonText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  sectionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  dayChipTextActive: {
    color: COLORS.white,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  rowField: {
    flex: 1,
    minWidth: 150,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  toggleText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  aiButton: {
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  catalogPanel: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: "#F7FBFA",
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  catalogTitleWrap: {
    flex: 1,
  },
  catalogTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  catalogSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  clearExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  clearExerciseText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  exerciseCatalogList: {
    gap: SPACING.xs,
  },
  exerciseCatalogItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  exerciseCatalogItemActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "10",
  },
  exerciseCatalogMeta: {
    flex: 1,
  },
  exerciseCatalogName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  exerciseCatalogInfo: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginTop: 2,
  },
  exerciseCatalogObjective: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 15,
    marginTop: 3,
  },
  batchHeader: {
    marginBottom: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  batchButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  batchButtonActive: {
    backgroundColor: COLORS.primary,
  },
  batchButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  batchButtonTextActive: {
    color: COLORS.white,
  },
  duplicarLoteButton: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  duplicarLoteButtonText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    padding: SPACING.base,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.sm,
  },
  modalStrong: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  modalActions: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    gap: SPACING.sm,
  },
});
