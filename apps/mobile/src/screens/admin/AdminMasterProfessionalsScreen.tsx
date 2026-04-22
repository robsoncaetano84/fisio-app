import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import { useToast } from "../../components/ui";
import { parseApiError } from "../../utils/apiErrors";
import {
  getCrmAdminProfessionalsPaged,
  updateCrmAdminProfessional,
  type CrmAdminProfessional,
} from "../../services/crm";
import { RootStackParamList } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminProfessionals">;

export function AdminMasterProfessionalsScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CrmAdminProfessional[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    especialidade: "",
    registroProf: "",
    ativo: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCrmAdminProfessionalsPaged({
        q: query || undefined,
        includeSensitive: true,
        sensitiveReason: "gestao master de profissionais",
        page: 1,
        limit: 100,
      });
      setItems(response.items || []);
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || "Falha ao carregar profissionais." });
    } finally {
      setLoading(false);
    }
  }, [query, showToast]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedId && items[0]) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      nome: selected.nome || "",
      email: selected.email || "",
      especialidade: selected.especialidade || "",
      registroProf: selected.registroProf || "",
      ativo: !!selected.ativo,
    });
  }, [selected]);

  const save = useCallback(async () => {
    if (!selected) return;
    if (!form.nome.trim()) {
      showToast({ type: "error", message: "Informe o nome." });
      return;
    }
    if (!form.email.trim()) {
      showToast({ type: "error", message: "Informe o e-mail." });
      return;
    }
    setSaving(true);
    try {
      await updateCrmAdminProfessional(
        selected.id,
        {
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          especialidade: form.especialidade.trim(),
          registroProf: form.registroProf.trim(),
          ativo: form.ativo,
        },
        {
          includeSensitive: true,
          sensitiveReason: "edicao cadastro profissional master",
        },
      );
      showToast({ type: "success", message: "Profissional atualizado." });
      await load();
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  }, [form, load, selected, showToast]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Gestao de profissionais</Text>
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("AdminCrm")}>
            <Text style={styles.linkBtnText}>Abrir CRM</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome, email ou especialidade"
          style={styles.search}
          autoCapitalize="none"
          onSubmitEditing={() => load().catch(() => undefined)}
        />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.split}>
            <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.row, selectedId === item.id && styles.rowSelected]}
                  onPress={() => setSelectedId(item.id)}
                >
                  <Text style={styles.rowTitle}>{item.nome}</Text>
                  <Text style={styles.rowSub}>{item.email}</Text>
                  <Text style={styles.rowSub}>
                    {item.especialidade || "Sem especialidade"} - {item.ativo ? "Ativo" : "Inativo"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.formPane}>
              {selected ? (
                <>
                  <Text style={styles.formTitle}>Editar profissional</Text>
                  <TextInput
                    style={styles.input}
                    value={form.nome}
                    onChangeText={(v) => setForm((p) => ({ ...p, nome: v }))}
                    placeholder="Nome"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                    placeholder="E-mail"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.especialidade}
                    onChangeText={(v) => setForm((p) => ({ ...p, especialidade: v }))}
                    placeholder="Especialidade"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.registroProf}
                    onChangeText={(v) => setForm((p) => ({ ...p, registroProf: v }))}
                    placeholder="Registro profissional"
                  />
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggle, form.ativo && styles.toggleActive]}
                      onPress={() => setForm((p) => ({ ...p, ativo: true }))}
                    >
                      <Text style={[styles.toggleText, form.ativo && styles.toggleTextActive]}>Ativo</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggle, !form.ativo && styles.toggleActive]}
                      onPress={() => setForm((p) => ({ ...p, ativo: false }))}
                    >
                      <Text style={[styles.toggleText, !form.ativo && styles.toggleTextActive]}>Inativo</Text>
                    </Pressable>
                  </View>
                  <Pressable style={styles.saveBtn} onPress={() => save().catch(() => undefined)}>
                    <Text style={styles.saveBtnText}>{saving ? "Salvando..." : "Salvar alteracoes"}</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.empty}>Selecione um profissional.</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.base, gap: SPACING.base },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: FONTS.sizes.xl, fontWeight: "800", color: COLORS.textPrimary },
  linkBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  linkBtnText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 12 },
  search: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  split: { flex: 1, flexDirection: "row", gap: SPACING.base },
  listPane: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray100 },
  listContent: { padding: SPACING.sm, gap: SPACING.xs },
  formPane: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray100, padding: SPACING.sm, gap: SPACING.xs },
  row: { borderWidth: 1, borderColor: COLORS.gray100, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, backgroundColor: "#FBFCFE" },
  rowSelected: { borderColor: COLORS.primary + "66", backgroundColor: COLORS.primary + "0D" },
  rowTitle: { color: COLORS.textPrimary, fontWeight: "700" },
  rowSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  formTitle: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray100, borderRadius: 10, backgroundColor: "#FBFCFE", paddingHorizontal: 10, paddingVertical: 8 },
  toggleRow: { flexDirection: "row", gap: SPACING.xs, marginTop: 4 },
  toggle: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.white },
  toggleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  toggleText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 12 },
  toggleTextActive: { color: COLORS.primary },
  saveBtn: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  saveBtnText: { color: COLORS.white, fontWeight: "700" },
  empty: { color: COLORS.textSecondary, fontSize: 13 },
});


