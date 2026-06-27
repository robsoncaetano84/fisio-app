import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Input, useToast } from "../../components/ui";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import { api } from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import {
  getLocalizedExerciseSearchText,
  getLocalizedExerciseText,
} from "../../utils/exerciseTranslations";
import {
  Exercicio,
  ExercicioImageProductionBrief,
  ExercicioImageProductionBriefsResponse,
  ExercicioImageQueueItem,
  ExercicioImageQueueResponse,
  ExercicioImageQueueStatus,
  ExercicioMidia,
  RootStackParamList,
} from "../../types";
import {
  EXERCISE_IMAGE_OPTIONS,
  ExerciseImageType,
  ExerciseVisual,
  normalizeExerciseImageType,
} from "../../components/clinical/ExerciseVisual";

type Props = NativeStackScreenProps<RootStackParamList, "AdminExercises">;

type ExerciseStatus = Exercicio["status"];
type MediaClinicalReviewStatus = NonNullable<
  ExercicioMidia["revisaoClinicaStatus"]
>;
type ReviewStatusFilter = MediaClinicalReviewStatus | "TODAS" | "ACAO";
type QueueStatusFilter = ExercicioImageQueueStatus | "TODOS";
type FormImageKey = ExerciseImageType | "";

const STATUS_OPTIONS: Array<{ value: ExerciseStatus; label: string }> = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

const REVIEW_STATUS_OPTIONS: Array<{
  value: MediaClinicalReviewStatus;
  label: string;
}> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REGENERAR_IMAGEM", label: "Regenerar imagem" },
  { value: "AJUSTAR_TEXTO", label: "Ajustar texto" },
  { value: "REMOVER_DO_CATALOGO", label: "Remover do catalogo" },
];

const REVIEW_ACTION_STATUSES: MediaClinicalReviewStatus[] = [
  "REGENERAR_IMAGEM",
  "AJUSTAR_TEXTO",
  "REMOVER_DO_CATALOGO",
];

const QUEUE_STATUS_OPTIONS: Array<{
  value: ExercicioImageQueueStatus;
  label: string;
}> = [
  { value: "SEM_IMAGEM", label: "Sem imagem" },
  { value: "SEM_MIDIA_PRINCIPAL", label: "Sem midia" },
  { value: "IMAGEM_PENDENTE_REVISAO", label: "Revisao pendente" },
  { value: "REGENERAR_IMAGEM", label: "Regenerar" },
  { value: "AJUSTAR_TEXTO", label: "Ajustar texto" },
  { value: "REMOVER_DO_CATALOGO", label: "Remover" },
];

const QUEUE_STATUS_LABELS = QUEUE_STATUS_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<ExercicioImageQueueStatus, string>,
);

const emptyForm = {
  nome: "",
  slug: "",
  regiaoCorporal: "",
  categoria: "",
  nivel: "INICIANTE",
  objetivo: "",
  descricao: "",
  instrucoesPadrao: "",
  cuidados: "",
  contraindicacoes: "",
  imagemKey: "" as FormImageKey,
  tagsText: "",
  status: "RASCUNHO" as ExerciseStatus,
  revisaoClinicaObservacao: "",
};

function getPrimaryMedia(
  item?: Exercicio | null,
  imageKey?: string | null,
): ExercicioMidia | null {
  if (imageKey !== undefined && !imageKey) return null;
  const midias = item?.midias || [];
  const targetKey = imageKey || item?.imagemKey;
  return (
    midias.find((midia) => midia.ativo && midia.assetKey === targetKey) ||
    midias.find((midia) => midia.ativo) ||
    null
  );
}

function getReviewStatus(item?: Exercicio | null): MediaClinicalReviewStatus {
  return getPrimaryMedia(item)?.revisaoClinicaStatus || "PENDENTE";
}

function getMediaImageUrl(media?: ExercicioMidia | null) {
  return media?.thumbnailUrl || media?.imageUrl || media?.sourceUrl || null;
}

export function AdminExerciseCatalogScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [reviewingStatus, setReviewingStatus] =
    useState<MediaClinicalReviewStatus | null>(null);
  const [items, setItems] = useState<Exercicio[]>([]);
  const [imageQueue, setImageQueue] =
    useState<ExercicioImageQueueResponse | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [imageBrief, setImageBrief] =
    useState<ExercicioImageProductionBrief | null>(null);
  const [imageBriefLoading, setImageBriefLoading] = useState(false);
  const [imageBriefsBatch, setImageBriefsBatch] =
    useState<ExercicioImageProductionBriefsResponse | null>(null);
  const [imageBriefsBatchLoading, setImageBriefsBatchLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | "TODOS">(
    "TODOS",
  );
  const [reviewFilter, setReviewFilter] = useState<ReviewStatusFilter>("TODAS");
  const [queueStatusFilter, setQueueStatusFilter] =
    useState<QueueStatusFilter>("TODOS");
  const [form, setForm] = useState(emptyForm);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const response = await api.get<Exercicio[]>("/exercicios", {
        params: { includeDrafts: "true" },
      });
      setItems(response.data || []);
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadImageQueue = async () => {
    try {
      setQueueLoading(true);
      const response = await api.get<ExercicioImageQueueResponse>(
        "/exercicios/admin/fila-imagens",
        {
          params: { limit: "300" },
        },
      );
      setImageQueue(response.data || null);
      setImageBriefsBatch(null);
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setQueueLoading(false);
    }
  };

  const refreshCatalogAndQueue = async () => {
    await Promise.all([loadCatalog(), loadImageQueue()]);
  };

  React.useEffect(() => {
    refreshCatalogAndQueue().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    setImageBriefsBatch(null);
  }, [queueStatusFilter, search]);

  const reviewSummary = useMemo(() => {
    const initial = {
      total: items.length,
      acao: 0,
      PENDENTE: 0,
      APROVADA: 0,
      REGENERAR_IMAGEM: 0,
      AJUSTAR_TEXTO: 0,
      REMOVER_DO_CATALOGO: 0,
    };

    return items.reduce((summary, item) => {
      const status = getReviewStatus(item);
      summary[status] += 1;
      if (REVIEW_ACTION_STATUSES.includes(status)) {
        summary.acao += 1;
      }
      return summary;
    }, initial);
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "TODOS" && item.status !== statusFilter) {
        return false;
      }
      const reviewStatus = getReviewStatus(item);
      if (
        reviewFilter === "ACAO" &&
        !REVIEW_ACTION_STATUSES.includes(reviewStatus)
      ) {
        return false;
      }
      if (
        reviewFilter !== "TODAS" &&
        reviewFilter !== "ACAO" &&
        reviewStatus !== reviewFilter
      ) {
        return false;
      }
      if (!term) return true;
      return getLocalizedExerciseSearchText(item, language).includes(term);
    });
  }, [items, search, statusFilter, reviewFilter, language]);

  const filteredQueueItems = useMemo(() => {
    const queueItems = imageQueue?.items || [];
    const term = search.trim().toLowerCase();
    return queueItems.filter((item) => {
      if (
        queueStatusFilter !== "TODOS" &&
        item.filaStatus !== queueStatusFilter
      ) {
        return false;
      }
      if (!term) return true;
      return [
        getLocalizedExerciseSearchText(
          {
            ...item,
            objetivo: "",
            descricao: "",
            instrucoesPadrao: "",
            cuidados: "",
            contraindicacoes: "",
          },
          language,
        ),
        item.imagemKey,
      ]
        .filter(Boolean)
        .join(" ")
        .includes(term);
    });
  }, [imageQueue, queueStatusFilter, search, language]);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) || null,
    [editingId, items],
  );

  const editingPrimaryMedia = useMemo(
    () => getPrimaryMedia(editingItem, form.imagemKey),
    [editingItem, form.imagemKey],
  );

  const updateForm = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadImageBrief = async (id: string) => {
    try {
      setImageBriefLoading(true);
      const response = await api.get<ExercicioImageProductionBrief>(
        `/exercicios/admin/${id}/brief-imagem`,
      );
      setImageBrief(response.data || null);
    } catch (error) {
      setImageBrief(null);
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setImageBriefLoading(false);
    }
  };

  const loadImageBriefsBatch = async () => {
    try {
      setImageBriefsBatchLoading(true);
      const params: Record<string, string> = { limit: "10" };
      if (queueStatusFilter !== "TODOS") {
        params.filaStatus = queueStatusFilter;
      }
      const term = search.trim();
      if (term) {
        params.q = term;
      }
      const response = await api.get<ExercicioImageProductionBriefsResponse>(
        "/exercicios/admin/briefs-imagens",
        { params },
      );
      setImageBriefsBatch(response.data || null);
    } catch (error) {
      setImageBriefsBatch(null);
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setImageBriefsBatchLoading(false);
    }
  };

  const copyTextToClipboard = async (text: string, successMessage: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast({ message: successMessage, type: "success" });
    } catch {
      showToast({
        message: "Nao foi possivel copiar para a area de transferencia",
        type: "error",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageBrief(null);
  };

  const startEdit = (item: Exercicio) => {
    const primaryMedia = getPrimaryMedia(item);
    setEditingId(item.id);
    setForm({
      nome: item.nome || "",
      slug: item.slug || "",
      regiaoCorporal: item.regiaoCorporal || "",
      categoria: item.categoria || "",
      nivel: item.nivel || "INICIANTE",
      objetivo: item.objetivo || "",
      descricao: item.descricao || "",
      instrucoesPadrao: item.instrucoesPadrao || "",
      cuidados: item.cuidados || "",
      contraindicacoes: item.contraindicacoes || "",
      imagemKey: item.imagemKey
        ? normalizeExerciseImageType(item.imagemKey)
        : "",
      tagsText: (item.tags || []).join(", "),
      status: item.status || "RASCUNHO",
      revisaoClinicaObservacao: primaryMedia?.revisaoClinicaObservacao || "",
    });
    const isInImageQueue = (imageQueue?.items || []).some(
      (queueItem) => queueItem.id === item.id,
    );
    if (isInImageQueue) {
      void loadImageBrief(item.id);
    } else {
      setImageBrief(null);
    }
  };

  const buildPayload = () => ({
    nome: form.nome.trim(),
    slug: form.slug.trim() || undefined,
    regiaoCorporal: form.regiaoCorporal.trim(),
    categoria: form.categoria.trim(),
    nivel: form.nivel.trim(),
    objetivo: form.objetivo.trim(),
    descricao: form.descricao.trim() || undefined,
    instrucoesPadrao: form.instrucoesPadrao.trim(),
    cuidados: form.cuidados.trim() || undefined,
    contraindicacoes: form.contraindicacoes.trim() || undefined,
    imagemKey: form.imagemKey || null,
    tags: form.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: form.status,
  });

  const handleSave = async () => {
    const payload = buildPayload();
    if (
      !payload.nome ||
      !payload.regiaoCorporal ||
      !payload.categoria ||
      !payload.nivel ||
      !payload.objetivo ||
      !payload.instrucoesPadrao
    ) {
      showToast({
        message:
          "Preencha nome, região, categoria, nível, objetivo e instruções.",
        type: "error",
      });
      return;
    }
    if (payload.status === "APROVADO" && !payload.imagemKey) {
      showToast({
        message: "Associe uma imagem propria antes de aprovar o exercicio.",
        type: "error",
      });
      return;
    }
    if (
      payload.status === "APROVADO" &&
      editingPrimaryMedia?.revisaoClinicaStatus !== "APROVADA"
    ) {
      showToast({
        message: "Aprove clinicamente a imagem antes de aprovar o exercicio.",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await api.patch(`/exercicios/${editingId}`, payload);
        showToast({ message: "Exercício atualizado", type: "success" });
      } else {
        await api.post("/exercicios", payload);
        showToast({ message: "Exercício criado", type: "success" });
      }
      resetForm();
      await refreshCatalogAndQueue();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmArchive = (item: Exercicio) => {
    Alert.alert(
      "Arquivar exercício",
      `Deseja arquivar "${item.nome}"? Ele deixa de aparecer para prescrição.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Arquivar",
          style: "destructive",
          onPress: () => handleArchive(item),
        },
      ],
    );
  };

  const handleArchive = async (item: Exercicio) => {
    try {
      setArchivingId(item.id);
      await api.patch(`/exercicios/${item.id}/arquivar`);
      showToast({ message: "Exercício arquivado", type: "success" });
      if (editingId === item.id) resetForm();
      await refreshCatalogAndQueue();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setArchivingId(null);
    }
  };

  const confirmRestore = (item: Exercicio) => {
    Alert.alert(
      "Restaurar exercicio",
      `Deseja restaurar "${item.nome}" como rascunho para revisao?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: () => handleRestore(item),
        },
      ],
    );
  };

  const handleRestore = async (item: Exercicio) => {
    try {
      setRestoringId(item.id);
      await api.patch(`/exercicios/${item.id}`, { status: "RASCUNHO" });
      showToast({
        message: "Exercicio restaurado como rascunho",
        type: "success",
      });
      if (editingId === item.id) resetForm();
      await refreshCatalogAndQueue();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setRestoringId(null);
    }
  };

  const handleClinicalReview = async (status: MediaClinicalReviewStatus) => {
    if (!editingId) return;

    try {
      setReviewingStatus(status);
      await api.patch(`/exercicios/${editingId}/revisao-clinica-imagem`, {
        status,
        observacao: form.revisaoClinicaObservacao.trim() || undefined,
      });
      showToast({
        message: "Revisao clinica da imagem atualizada",
        type: "success",
      });
      await refreshCatalogAndQueue();
      if (status === "APROVADA") {
        setImageBrief(null);
      } else {
        await loadImageBrief(editingId);
      }
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setReviewingStatus(null);
    }
  };

  const startEditFromQueue = (item: ExercicioImageQueueItem) => {
    const catalogItem = items.find(
      (catalogExercise) => catalogExercise.id === item.id,
    );
    if (!catalogItem) {
      showToast({
        message: "Atualize o catalogo antes de editar este item",
        type: "error",
      });
      return;
    }
    startEdit(catalogItem);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Catálogo de exercícios</Text>
            <Text style={styles.subtitle}>
              Base própria Synap com ilustrações, instruções e revisão clínica.
            </Text>
          </View>
          <Button
            title="Voltar"
            variant="ghost"
            size="sm"
            onPress={() => navigation.goBack()}
            icon={
              <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            }
          />
        </View>

        <View style={styles.toolbar}>
          <Input
            label="Buscar"
            value={search}
            onChangeText={setSearch}
            placeholder="Nome, região, objetivo ou tag"
            containerStyle={styles.searchInput}
            autoCapitalize="none"
          />
          <View style={styles.statusRow}>
            <FilterChip
              label="Todos"
              active={statusFilter === "TODOS"}
              onPress={() => setStatusFilter("TODOS")}
            />
            {STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={statusFilter === option.value}
                onPress={() => setStatusFilter(option.value)}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Revisao clinica</Text>
          <View style={styles.statusRow}>
            <FilterChip
              label={`Todas (${reviewSummary.total})`}
              active={reviewFilter === "TODAS"}
              onPress={() => setReviewFilter("TODAS")}
            />
            <FilterChip
              label={`Pendentes (${reviewSummary.PENDENTE})`}
              active={reviewFilter === "PENDENTE"}
              onPress={() => setReviewFilter("PENDENTE")}
            />
            <FilterChip
              label={`Aprovadas (${reviewSummary.APROVADA})`}
              active={reviewFilter === "APROVADA"}
              onPress={() => setReviewFilter("APROVADA")}
            />
            <FilterChip
              label={`Acao (${reviewSummary.acao})`}
              active={reviewFilter === "ACAO"}
              onPress={() => setReviewFilter("ACAO")}
            />
          </View>
        </View>

        <View style={styles.queuePanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Fila de imagens</Text>
              <Text style={styles.panelSubtitle}>
                {queueLoading
                  ? "Carregando fila..."
                  : `${filteredQueueItems.length} de ${imageQueue?.total || 0} itens precisam de acao`}
              </Text>
            </View>
            <View style={styles.panelHeaderActions}>
              <Button
                title="Briefs"
                variant="outline"
                size="sm"
                onPress={() => loadImageBriefsBatch().catch(() => undefined)}
                loading={imageBriefsBatchLoading}
                icon={
                  <Ionicons
                    name="document-text-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                }
              />
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => refreshCatalogAndQueue().catch(() => undefined)}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.statusRow}>
            <FilterChip
              label={`Todos (${imageQueue?.total || 0})`}
              active={queueStatusFilter === "TODOS"}
              onPress={() => setQueueStatusFilter("TODOS")}
            />
            {QUEUE_STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={`${option.label} (${imageQueue?.resumo?.[option.value] || 0})`}
                active={queueStatusFilter === option.value}
                onPress={() => setQueueStatusFilter(option.value)}
              />
            ))}
          </View>
          {imageBriefsBatch ? (
            <View style={styles.batchBriefPanel}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.sectionLabel}>
                    Pacote de producao de imagens
                  </Text>
                  <Text style={styles.panelSubtitle}>
                    {imageBriefsBatch.items.length} de {imageBriefsBatch.total}{" "}
                    briefs carregados
                  </Text>
                  <Text style={styles.batchFilterText}>
                    Busca: {imageBriefsBatch.appliedFilters.q || "todas"} -
                    Status:{" "}
                    {imageBriefsBatch.appliedFilters.filaStatus || "TODOS"}
                  </Text>
                </View>
                {imageBriefsBatch.items[0] ? (
                  <QueueBadge
                    status={
                      queueStatusFilter === "TODOS"
                        ? imageBriefsBatch.items[0].exercicio.filaStatus
                        : queueStatusFilter
                    }
                  />
                ) : null}
              </View>
              {imageBriefsBatch.items.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nenhum brief encontrado para o filtro atual.
                </Text>
              ) : (
                <>
                  <View style={styles.batchBriefItem}>
                    <View style={styles.briefActionHeader}>
                      <Text style={styles.briefLabel}>
                        Ficha consolidada do pacote
                      </Text>
                      <Button
                        title="Copiar"
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          copyTextToClipboard(
                            imageBriefsBatch.productionMarkdownBatch,
                            "Pacote de briefs copiado",
                          ).catch(() => undefined)
                        }
                        icon={
                          <Ionicons
                            name="copy-outline"
                            size={15}
                            color={COLORS.primary}
                          />
                        }
                      />
                    </View>
                    <Text style={styles.briefPrompt} selectable>
                      {imageBriefsBatch.productionMarkdownBatch}
                    </Text>
                  </View>
                  {imageBriefsBatch.items.map((brief) => (
                    <Pressable
                      key={brief.exercicio.id}
                      style={styles.batchBriefItem}
                      onPress={() => startEditFromQueue(brief.exercicio)}
                    >
                      <View style={styles.exerciseTitleRow}>
                        <Text style={styles.exerciseName}>
                          {brief.exercicio.nome}
                        </Text>
                        <QueueBadge status={brief.exercicio.filaStatus} />
                        <Ionicons
                          name="open-outline"
                          size={16}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={styles.briefMetaRow}>
                        <View style={styles.briefMetaItem}>
                          <Text style={styles.briefLabel}>Chave</Text>
                          <Text style={styles.briefValue} selectable>
                            {brief.imageKeySuggestion}
                          </Text>
                        </View>
                        <View style={styles.briefMetaItem}>
                          <Text style={styles.briefLabel}>Arquivo</Text>
                          <Text style={styles.briefValue} selectable>
                            {brief.assetFileNameSuggestion}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.briefLabel}>Caminho do asset</Text>
                      <Text style={styles.briefText} selectable>
                        {brief.assetPathSuggestion}
                      </Text>
                      <Text style={styles.briefLabel}>Texto do paciente</Text>
                      <Text style={styles.briefText} selectable>
                        {brief.descricaoPaciente}
                      </Text>
                      <Text style={styles.briefLabel}>Checklist tecnico</Text>
                      {brief.implementationChecklist.map((item) => (
                        <Text key={item} style={styles.briefChecklistItem}>
                          {item}
                        </Text>
                      ))}
                      <Text style={styles.briefLabel}>Prompt base</Text>
                      <Text style={styles.briefPrompt} selectable>
                        {brief.promptBase}
                      </Text>
                      <Text style={styles.briefLabel}>Ficha completa</Text>
                      <Text style={styles.briefPrompt} selectable>
                        {brief.productionMarkdown}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          ) : null}
          {queueLoading ? (
            <Text style={styles.emptyText}>Carregando fila de imagens...</Text>
          ) : filteredQueueItems.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum item pendente nesta fila.
            </Text>
          ) : (
            <View style={styles.queueList}>
              {filteredQueueItems.slice(0, 30).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.queueRow}
                  onPress={() => startEditFromQueue(item)}
                >
                  <View style={styles.queuePriority}>
                    <Text style={styles.queuePriorityText}>
                      {item.prioridade}
                    </Text>
                  </View>
                  <View style={styles.queueMeta}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseName}>{item.nome}</Text>
                      <QueueBadge status={item.filaStatus} />
                      <StatusBadge status={item.exercicioStatus} />
                    </View>
                    <Text style={styles.exerciseInfo}>
                      {item.regiaoCorporal.replace(/_/g, " ")} -{" "}
                      {item.categoria.replace(/_/g, " ")} - {item.nivel}
                    </Text>
                    <Text style={styles.exerciseTags} numberOfLines={1}>
                      {(item.tags || []).join(", ") || "sem tags"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.gray500}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>
                {editingId ? "Editar exercício" : "Novo exercício"}
              </Text>
              <Text style={styles.panelSubtitle}>
                Use apenas assets próprios ou aprovados para uso interno.
              </Text>
            </View>
            {editingId ? (
              <Button
                title="Novo"
                variant="outline"
                size="sm"
                onPress={resetForm}
              />
            ) : null}
          </View>

          <View style={styles.formGrid}>
            <View style={styles.formMain}>
              <Input
                label="Nome"
                value={form.nome}
                onChangeText={(value) => updateForm("nome", value)}
                placeholder="Ex.: Ponte curta"
                maxLength={140}
                showCount
              />
              <View style={styles.row}>
                <Input
                  label="Slug"
                  value={form.slug}
                  onChangeText={(value) => updateForm("slug", value)}
                  placeholder="opcional"
                  autoCapitalize="none"
                  containerStyle={styles.rowField}
                  maxLength={160}
                />
                <Input
                  label="Região"
                  value={form.regiaoCorporal}
                  onChangeText={(value) => updateForm("regiaoCorporal", value)}
                  placeholder="LOMBAR"
                  autoCapitalize="characters"
                  containerStyle={styles.rowField}
                  maxLength={80}
                />
              </View>
              <View style={styles.row}>
                <Input
                  label="Categoria"
                  value={form.categoria}
                  onChangeText={(value) => updateForm("categoria", value)}
                  placeholder="MOBILIDADE"
                  autoCapitalize="characters"
                  containerStyle={styles.rowField}
                  maxLength={80}
                />
                <Input
                  label="Nível"
                  value={form.nivel}
                  onChangeText={(value) => updateForm("nivel", value)}
                  placeholder="INICIANTE"
                  autoCapitalize="characters"
                  containerStyle={styles.rowField}
                  maxLength={40}
                />
              </View>
              <Input
                label="Objetivo"
                value={form.objetivo}
                onChangeText={(value) => updateForm("objetivo", value)}
                placeholder="Objetivo clínico do exercício"
                multiline
                maxLength={1000}
                showCount
              />
              <Input
                label="Descrição"
                value={form.descricao}
                onChangeText={(value) => updateForm("descricao", value)}
                placeholder="Resumo técnico do movimento"
                multiline
                maxLength={1500}
                showCount
              />
              <Input
                label="Instruções padrão"
                value={form.instrucoesPadrao}
                onChangeText={(value) => updateForm("instrucoesPadrao", value)}
                placeholder="Passos, dose inicial e critérios de interrupção"
                multiline
                maxLength={2000}
                showCount
              />
              <View style={styles.row}>
                <Input
                  label="Cuidados"
                  value={form.cuidados}
                  onChangeText={(value) => updateForm("cuidados", value)}
                  multiline
                  containerStyle={styles.rowField}
                  maxLength={1200}
                />
                <Input
                  label="Contraindicações"
                  value={form.contraindicacoes}
                  onChangeText={(value) =>
                    updateForm("contraindicacoes", value)
                  }
                  multiline
                  containerStyle={styles.rowField}
                  maxLength={1200}
                />
              </View>
              <Input
                label="Tags"
                value={form.tagsText}
                onChangeText={(value) => updateForm("tagsText", value)}
                placeholder="lombar, mobilidade, controle_motor"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.visualColumn}>
              <AdminExerciseVisual
                imageType={form.imagemKey}
                media={editingPrimaryMedia}
                title={form.nome}
              />
              <Text style={styles.sectionLabel}>Ilustração própria</Text>
              <View style={styles.chipGrid}>
                <FilterChip
                  label="Sem imagem"
                  active={!form.imagemKey}
                  onPress={() => updateForm("imagemKey", "")}
                />
                {EXERCISE_IMAGE_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={form.imagemKey === option.value}
                    onPress={() => updateForm("imagemKey", option.value)}
                  />
                ))}
              </View>
              <Text style={styles.sectionLabel}>Status</Text>
              <View style={styles.chipGrid}>
                {STATUS_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={form.status === option.value}
                    onPress={() => updateForm("status", option.value)}
                  />
                ))}
              </View>
              {editingId ? (
                form.imagemKey ? (
                  <View style={styles.reviewPanel}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.sectionLabel}>
                        Revisao clinica da imagem
                      </Text>
                      <ReviewBadge
                        status={editingPrimaryMedia?.revisaoClinicaStatus}
                      />
                    </View>
                    <Input
                      label="Observacao da revisao"
                      value={form.revisaoClinicaObservacao}
                      onChangeText={(value) =>
                        updateForm("revisaoClinicaObservacao", value)
                      }
                      placeholder="Ex.: movimento claro para paciente"
                      multiline
                      maxLength={2000}
                      showCount
                    />
                    <View style={styles.chipGrid}>
                      {REVIEW_STATUS_OPTIONS.map((option) => (
                        <FilterChip
                          key={option.value}
                          label={
                            reviewingStatus === option.value
                              ? "Salvando..."
                              : option.label
                          }
                          active={
                            (editingPrimaryMedia?.revisaoClinicaStatus ||
                              "PENDENTE") === option.value
                          }
                          onPress={() => handleClinicalReview(option.value)}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.reviewPanel}>
                    <Text style={styles.sectionLabel}>
                      Revisao clinica da imagem
                    </Text>
                    <Text style={styles.emptyText}>
                      Associe uma imagem propria antes de revisar ou aprovar.
                    </Text>
                  </View>
                )
              ) : null}
              {editingId ? (
                <View style={styles.briefPanel}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.sectionLabel}>Brief de imagem</Text>
                    {imageBrief ? (
                      <Button
                        title="Copiar"
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          copyTextToClipboard(
                            imageBrief.productionMarkdown,
                            "Brief de imagem copiado",
                          ).catch(() => undefined)
                        }
                        icon={
                          <Ionicons
                            name="copy-outline"
                            size={15}
                            color={COLORS.primary}
                          />
                        }
                      />
                    ) : imageBriefLoading ? (
                      <Text style={styles.briefLoading}>Carregando...</Text>
                    ) : null}
                  </View>
                  {imageBrief ? (
                    <>
                      <View style={styles.briefMetaRow}>
                        <View style={styles.briefMetaItem}>
                          <Text style={styles.briefLabel}>Chave</Text>
                          <Text style={styles.briefValue} selectable>
                            {imageBrief.imageKeySuggestion}
                          </Text>
                        </View>
                        <View style={styles.briefMetaItem}>
                          <Text style={styles.briefLabel}>Arquivo</Text>
                          <Text style={styles.briefValue} selectable>
                            {imageBrief.assetFileNameSuggestion}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.briefLabel}>Caminho do asset</Text>
                      <Text style={styles.briefText} selectable>
                        {imageBrief.assetPathSuggestion}
                      </Text>
                      <Text style={styles.briefLabel}>Objetivo visual</Text>
                      <Text style={styles.briefText}>
                        {imageBrief.objetivoImagem}
                      </Text>
                      <Text style={styles.briefLabel}>Texto do paciente</Text>
                      <Text style={styles.briefText} selectable>
                        {imageBrief.descricaoPaciente}
                      </Text>
                      <Text style={styles.briefLabel}>
                        Orientacao profissional
                      </Text>
                      <Text style={styles.briefText} selectable>
                        {imageBrief.orientacaoProfissional}
                      </Text>
                      <Text style={styles.briefLabel}>Acessibilidade</Text>
                      <Text style={styles.briefText} selectable>
                        {imageBrief.accessibilityLabel}
                      </Text>
                      <Text style={styles.briefLabel}>Prompt base</Text>
                      <Text style={styles.briefPrompt} selectable>
                        {imageBrief.promptBase}
                      </Text>
                      <Text style={styles.briefLabel}>Ficha completa</Text>
                      <Text style={styles.briefPrompt} selectable>
                        {imageBrief.productionMarkdown}
                      </Text>
                      <Text style={styles.briefLabel}>Checklist tecnico</Text>
                      {imageBrief.implementationChecklist.map((item) => (
                        <Text key={item} style={styles.briefChecklistItem}>
                          {item}
                        </Text>
                      ))}
                      <Text style={styles.briefLabel}>Checklist clinico</Text>
                      {imageBrief.checklistRevisao.map((item) => (
                        <Text key={item} style={styles.briefChecklistItem}>
                          {item}
                        </Text>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.emptyText}>
                      Brief disponivel quando o exercicio estiver na fila de
                      imagens.
                    </Text>
                  )}
                </View>
              ) : null}
              <View style={styles.actions}>
                <Button
                  title={editingId ? "Salvar alterações" : "Criar exercício"}
                  onPress={handleSave}
                  loading={saving}
                  fullWidth
                />
                {editingId ? (
                  <Button
                    title="Cancelar edição"
                    onPress={resetForm}
                    variant="ghost"
                    fullWidth
                  />
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.listPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Exercícios cadastrados</Text>
              <Text style={styles.panelSubtitle}>
                {loading
                  ? "Carregando catálogo..."
                  : `${filteredItems.length} de ${items.length} exibidos`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => refreshCatalogAndQueue().catch(() => undefined)}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={styles.emptyText}>Carregando catálogo...</Text>
          ) : filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>
          ) : (
            <View style={styles.exerciseList}>
              {filteredItems.map((item) => {
                const localized = getLocalizedExerciseText(item, language);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.exerciseRow,
                      editingId === item.id && styles.exerciseRowActive,
                    ]}
                    onPress={() => startEdit(item)}
                  >
                    <AdminExerciseVisual
                      imageType={item.imagemKey}
                      media={getPrimaryMedia(item)}
                      title={localized.nome}
                      compact
                    />
                    <View style={styles.exerciseMeta}>
                      <View style={styles.exerciseTitleRow}>
                        <Text style={styles.exerciseName}>
                          {localized.nome}
                        </Text>
                        <StatusBadge status={item.status} />
                        <ReviewBadge
                          status={getPrimaryMedia(item)?.revisaoClinicaStatus}
                        />
                      </View>
                      <Text style={styles.exerciseInfo}>
                        {item.regiaoCorporal.replace(/_/g, " ")} •{" "}
                        {item.categoria.replace(/_/g, " ")} • {item.nivel}
                      </Text>
                      <Text style={styles.exerciseObjective} numberOfLines={2}>
                        {localized.objetivo}
                      </Text>
                      <Text style={styles.exerciseTags} numberOfLines={1}>
                        {(item.tags || []).join(", ") || "sem tags"}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => startEdit(item)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      {item.status !== "ARQUIVADO" && item.ativo ? (
                        <TouchableOpacity
                          style={[styles.iconButton, styles.iconButtonDanger]}
                          onPress={() => confirmArchive(item)}
                          disabled={archivingId === item.id}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="archive-outline"
                            size={18}
                            color={COLORS.error}
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, styles.iconButtonSuccess]}
                          onPress={() => confirmRestore(item)}
                          disabled={restoringId === item.id}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="refresh-outline"
                            size={18}
                            color={COLORS.success}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AdminExerciseVisual({
  imageType,
  media,
  title,
  compact,
}: {
  imageType?: string | null;
  media?: ExercicioMidia | null;
  title?: string | null;
  compact?: boolean;
}) {
  if (imageType) {
    return (
      <ExerciseVisual
        imageType={imageType}
        imageUrl={getMediaImageUrl(media)}
        cacheKey={imageType}
        title={title}
        compact={compact}
      />
    );
  }

  return (
    <View style={[styles.noImageFrame, compact && styles.noImageFrameCompact]}>
      <Ionicons
        name="image-outline"
        size={compact ? 20 : 34}
        color={COLORS.gray500}
      />
      {!compact ? (
        <>
          <Text style={styles.noImageTitle}>Imagem pendente</Text>
          <Text style={styles.noImageSubtitle}>
            Crie um asset proprio antes de aprovar
          </Text>
        </>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: ExerciseStatus }) {
  const isApproved = status === "APROVADO";
  const isArchived = status === "ARQUIVADO";
  return (
    <View
      style={[
        styles.statusBadge,
        isApproved && styles.statusBadgeApproved,
        isArchived && styles.statusBadgeArchived,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          isApproved && styles.statusBadgeTextApproved,
          isArchived && styles.statusBadgeTextArchived,
        ]}
      >
        {STATUS_OPTIONS.find((item) => item.value === status)?.label || status}
      </Text>
    </View>
  );
}

function ReviewBadge({
  status,
}: {
  status?: MediaClinicalReviewStatus | null;
}) {
  const value = status || "PENDENTE";
  const label =
    REVIEW_STATUS_OPTIONS.find((item) => item.value === value)?.label || value;
  const isApproved = value === "APROVADA";
  const requiresAction =
    value === "REGENERAR_IMAGEM" ||
    value === "AJUSTAR_TEXTO" ||
    value === "REMOVER_DO_CATALOGO";

  return (
    <View
      style={[
        styles.reviewBadge,
        isApproved && styles.reviewBadgeApproved,
        requiresAction && styles.reviewBadgeAction,
      ]}
    >
      <Text
        style={[
          styles.reviewBadgeText,
          isApproved && styles.reviewBadgeTextApproved,
          requiresAction && styles.reviewBadgeTextAction,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function QueueBadge({ status }: { status: ExercicioImageQueueStatus }) {
  const isCritical = status === "SEM_IMAGEM" || status === "REGENERAR_IMAGEM";
  const isText = status === "AJUSTAR_TEXTO";

  return (
    <View
      style={[
        styles.queueBadge,
        isCritical && styles.queueBadgeCritical,
        isText && styles.queueBadgeTextOnly,
      ]}
    >
      <Text
        style={[
          styles.queueBadgeText,
          isCritical && styles.queueBadgeTextCritical,
          isText && styles.queueBadgeTextOnlyLabel,
        ]}
      >
        {QUEUE_STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  toolbar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  filterLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  formPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  queuePanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  listPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  panelHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: SPACING.xs,
  },
  panelTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "800",
  },
  panelSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 2,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.lg,
  },
  formMain: {
    flex: 1,
    minWidth: 280,
  },
  visualColumn: {
    width: 320,
    maxWidth: "100%",
    gap: SPACING.sm,
  },
  noImageFrame: {
    width: "100%",
    height: 172,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
  },
  noImageFrameCompact: {
    width: 74,
    height: 74,
    padding: SPACING.xs,
  },
  noImageTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  noImageSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  rowField: {
    flex: 1,
    minWidth: 160,
  },
  sectionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  chipTextActive: {
    color: COLORS.white,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  reviewPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.gray50,
  },
  briefPanel: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  batchBriefPanel: {
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + "08",
  },
  batchBriefItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  batchFilterText: {
    color: COLORS.gray600,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginTop: 2,
  },
  briefLoading: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  briefActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  briefMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  briefMetaItem: {
    flex: 1,
    minWidth: 132,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.gray50,
  },
  briefLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
    marginTop: 2,
  },
  briefValue: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
    marginTop: 2,
  },
  briefText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
  },
  briefPrompt: {
    color: COLORS.gray700,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.gray50,
  },
  briefChecklistItem: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 17,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  queueList: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  queueRow: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.gray50,
  },
  queuePriority: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "14",
  },
  queuePriorityText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "900",
  },
  queueMeta: {
    flex: 1,
    minWidth: 160,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  exerciseList: {
    gap: SPACING.sm,
  },
  exerciseRow: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  exerciseRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  exerciseMeta: {
    flex: 1,
    minWidth: 160,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  exerciseName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
  },
  exerciseInfo: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    marginTop: 3,
  },
  exerciseObjective: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 16,
    marginTop: 3,
  },
  exerciseTags: {
    color: COLORS.gray600,
    fontSize: FONTS.sizes.xs,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "66",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDanger: {
    borderColor: COLORS.error + "66",
  },
  iconButtonSuccess: {
    borderColor: COLORS.success + "66",
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.warning + "1F",
  },
  statusBadgeApproved: {
    backgroundColor: COLORS.success + "1F",
  },
  statusBadgeArchived: {
    backgroundColor: COLORS.gray300,
  },
  statusBadgeText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
  },
  statusBadgeTextApproved: {
    color: COLORS.success,
  },
  statusBadgeTextArchived: {
    color: COLORS.gray700,
  },
  reviewBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.warning + "1F",
  },
  reviewBadgeApproved: {
    backgroundColor: COLORS.success + "1F",
  },
  reviewBadgeAction: {
    backgroundColor: COLORS.error + "1F",
  },
  reviewBadgeText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
  },
  reviewBadgeTextApproved: {
    color: COLORS.success,
  },
  reviewBadgeTextAction: {
    color: COLORS.error,
  },
  queueBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.primary + "14",
  },
  queueBadgeCritical: {
    backgroundColor: COLORS.error + "1F",
  },
  queueBadgeTextOnly: {
    backgroundColor: COLORS.warning + "1F",
  },
  queueBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "800",
  },
  queueBadgeTextCritical: {
    color: COLORS.error,
  },
  queueBadgeTextOnlyLabel: {
    color: COLORS.warning,
  },
});
