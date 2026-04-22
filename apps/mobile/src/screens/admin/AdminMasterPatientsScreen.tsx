import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import { useToast } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { parseApiError } from "../../utils/apiErrors";
import {
  getCrmAdminPatientsPaged,
  updateCrmAdminPatient,
  type CrmAdminPatient,
} from "../../services/crm";
import { RootStackParamList } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminPatients">;

export function AdminMasterPatientsScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CrmAdminPatient[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState({
    nomeCompleto: "",
    cpf: "",
    profissao: "",
    contatoEmail: "",
    contatoWhatsapp: "",
    enderecoCidade: "",
    enderecoUf: "",
    ativo: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCrmAdminPatientsPaged({
        q: query || undefined,
        includeSensitive: true,
        sensitiveReason: "gestao master de pacientes",
        page: 1,
        limit: 100,
      });
      setItems(response.items || []);
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || t("errors.loadFailed") });
    } finally {
      setLoading(false);
    }
  }, [query, showToast, t]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
  }, [items, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      nomeCompleto: selected.nomeCompleto || "",
      cpf: String(selected.cpf || "").replace(/\D/g, ""),
      profissao: selected.profissao || "",
      contatoEmail: selected.contatoEmail || "",
      contatoWhatsapp: String(selected.contatoWhatsapp || "").replace(/\D/g, ""),
      enderecoCidade: selected.enderecoCidade || "",
      enderecoUf: (selected.enderecoUf || "").toUpperCase(),
      ativo: !!selected.ativo,
    });
  }, [selected]);

  const save = useCallback(async () => {
    if (!selected) return;
    if (!form.nomeCompleto.trim()) {
      showToast({ type: "error", message: t("errors.required") });
      return;
    }
    setSaving(true);
    try {
      await updateCrmAdminPatient(
        selected.id,
        {
          nomeCompleto: form.nomeCompleto.trim(),
          cpf: form.cpf.replace(/\D/g, "") || undefined,
          profissao: form.profissao.trim() || undefined,
          contatoEmail: form.contatoEmail.trim() || undefined,
          contatoWhatsapp: form.contatoWhatsapp.replace(/\D/g, "") || undefined,
          enderecoCidade: form.enderecoCidade.trim() || undefined,
          enderecoUf: form.enderecoUf.trim().toUpperCase() || undefined,
          ativo: form.ativo,
        },
        {
          includeSensitive: true,
          sensitiveReason: "edicao cadastro paciente master",
        },
      );
      showToast({ type: "success", message: t("crm.actions.saveChanges") });
      await load();
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({ type: "error", message: parsed.message || t("errors.saveFailed") });
    } finally {
      setSaving(false);
    }
  }, [form, load, selected, showToast, t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("crm.sections.patients")}</Text>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("AdminCrm")}
            accessibilityRole="button"
            accessibilityLabel="CRM"
            hitSlop={8}
          >
            <Text style={styles.linkBtnText}>CRM</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("crm.filters.globalSearch")}
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedId === item.id }}
                >
                  <Text style={styles.rowTitle}>{item.nomeCompleto}</Text>
                  <Text style={styles.rowSub}>{item.contatoEmail || t("crm.common.noData")}</Text>
                  <Text style={styles.rowSub}>
                    {item.profissionalNome || t("crm.common.noData")} - {item.ativo ? t("crm.labels.active") : "Inativo"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.formPane}>
              {selected ? (
                <>
                  <Text style={styles.formTitle}>{t("crm.actions.editPatient")}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.nomeCompleto}
                    onChangeText={(v) => setForm((p) => ({ ...p, nomeCompleto: v }))}
                    placeholder={t("crm.placeholders.fullName")}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.cpf}
                    onChangeText={(v) => setForm((p) => ({ ...p, cpf: v.replace(/\D/g, "").slice(0, 11) }))}
                    placeholder={t("crm.placeholders.cpf11")}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.profissao}
                    onChangeText={(v) => setForm((p) => ({ ...p, profissao: v }))}
                    placeholder={t("crm.placeholders.profession")}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.contatoEmail}
                    onChangeText={(v) => setForm((p) => ({ ...p, contatoEmail: v }))}
                    placeholder={t("crm.placeholders.email")}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.contatoWhatsapp}
                    onChangeText={(v) => setForm((p) => ({ ...p, contatoWhatsapp: v.replace(/\D/g, "").slice(0, 11) }))}
                    placeholder={t("crm.placeholders.whatsapp")}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    value={form.enderecoCidade}
                    onChangeText={(v) => setForm((p) => ({ ...p, enderecoCidade: v }))}
                    placeholder={t("crm.placeholders.city")}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.enderecoUf}
                    onChangeText={(v) =>
                      setForm((p) => ({
                        ...p,
                        enderecoUf: v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2),
                      }))
                    }
                    placeholder={t("crm.placeholders.uf")}
                  />
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggle, form.ativo && styles.toggleActive]}
                      onPress={() => setForm((p) => ({ ...p, ativo: true }))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: form.ativo }}
                    >
                      <Text style={[styles.toggleText, form.ativo && styles.toggleTextActive]}>{t("crm.labels.active")}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggle, !form.ativo && styles.toggleActive]}
                      onPress={() => setForm((p) => ({ ...p, ativo: false }))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !form.ativo }}
                    >
                      <Text style={[styles.toggleText, !form.ativo && styles.toggleTextActive]}>Inativo</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={() => save().catch(() => undefined)}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: saving, busy: saving }}
                  >
                    <Text style={styles.saveBtnText}>{saving ? t("crm.actions.saving") : t("crm.actions.saveChanges")}</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.empty}>{t("crm.messages.selectPatient")}</Text>
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
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontWeight: "700" },
  empty: { color: COLORS.textSecondary, fontSize: 13 },
});


