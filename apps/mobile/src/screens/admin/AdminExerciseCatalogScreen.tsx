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
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Input, useToast } from "../../components/ui";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SPACING,
} from "../../constants/theme";
import { api } from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { Exercicio, RootStackParamList } from "../../types";
import {
  EXERCISE_IMAGE_OPTIONS,
  ExerciseImageType,
  ExerciseVisual,
  normalizeExerciseImageType,
} from "../../components/clinical/ExerciseVisual";

type Props = NativeStackScreenProps<RootStackParamList, "AdminExercises">;

type ExerciseStatus = Exercicio["status"];

const STATUS_OPTIONS: Array<{ value: ExerciseStatus; label: string }> = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

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
  imagemKey: "MOBILIDADE_GERAL" as ExerciseImageType,
  tagsText: "",
  status: "RASCUNHO" as ExerciseStatus,
};

export function AdminExerciseCatalogScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [items, setItems] = useState<Exercicio[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | "TODOS">(
    "TODOS",
  );
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

  React.useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "TODOS" && item.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      return [
        item.nome,
        item.slug,
        item.regiaoCorporal,
        item.categoria,
        item.nivel,
        item.objetivo,
        item.descricao,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, statusFilter]);

  const updateForm = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (item: Exercicio) => {
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
      imagemKey: normalizeExerciseImageType(item.imagemKey),
      tagsText: (item.tags || []).join(", "),
      status: item.status || "RASCUNHO",
    });
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
    imagemKey: form.imagemKey,
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
        message: "Preencha nome, região, categoria, nível, objetivo e instruções.",
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
      await loadCatalog();
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
      await loadCatalog();
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
      await loadCatalog();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setRestoringId(null);
    }
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
              <Button title="Novo" variant="outline" size="sm" onPress={resetForm} />
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
              <ExerciseVisual imageType={form.imagemKey} title={form.nome} />
              <Text style={styles.sectionLabel}>Ilustração própria</Text>
              <View style={styles.chipGrid}>
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
              onPress={() => loadCatalog().catch(() => undefined)}
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
              {filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.exerciseRow,
                    editingId === item.id && styles.exerciseRowActive,
                  ]}
                  onPress={() => startEdit(item)}
                >
                  <ExerciseVisual
                    imageType={item.imagemKey}
                    title={item.nome}
                    compact
                  />
                  <View style={styles.exerciseMeta}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseName}>{item.nome}</Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text style={styles.exerciseInfo}>
                      {item.regiaoCorporal.replace(/_/g, " ")} •{" "}
                      {item.categoria.replace(/_/g, " ")} • {item.nivel}
                    </Text>
                    <Text style={styles.exerciseObjective} numberOfLines={2}>
                      {item.objetivo}
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
              ))}
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
  formPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
});
