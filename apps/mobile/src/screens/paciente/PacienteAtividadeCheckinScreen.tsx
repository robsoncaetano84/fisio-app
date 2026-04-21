// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE ATIVIDADE CHECKIN SCREEN
// ==========================================
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import {
  DificuldadeExecucao,
  MelhoriaSessao,
  RootStackParamList,
} from "../../types";
import {
  api,
  enqueueOfflineCheckin,
  registerConcludedCheckin,
  trackEvent,
} from "../../services";
import { isLikelyNetworkError, parseApiError } from "../../utils/apiErrors";
import { useAuthStore } from "../../stores/authStore";
import { useLanguage } from "../../i18n/LanguageProvider";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "PacienteAtividadeCheckin"
  >;
  route: RouteProp<RootStackParamList, "PacienteAtividadeCheckin">;
};

const DIFICULDADES: DificuldadeExecucao[] = [
  DificuldadeExecucao.FACIL,
  DificuldadeExecucao.MEDIO,
  DificuldadeExecucao.DIFICIL,
];

const MELHORIA_OPCOES: Array<{ value: MelhoriaSessao; label: string }> = [
  { value: MelhoriaSessao.MELHOROU, label: "Melhorou" },
  { value: MelhoriaSessao.MANTEVE, label: "Manteve" },
  { value: MelhoriaSessao.PIOROU, label: "Piorou" },
];

const NAO_EXECUTOU_MOTIVOS = [
  "Sem tempo",
  "Dor alta no dia",
  "Esqueci",
  "Não entendi o exercício",
  "Sem ambiente adequado",
] as const;

export function PacienteAtividadeCheckinScreen({ navigation, route }: Props) {
  const { atividadeId, titulo } = route.params;
  const usuarioId = useAuthStore((state) => state.usuario?.id);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [concluiu, setConcluiu] = useState(true);
  const [dorAntes, setDorAntes] = useState("5");
  const [dorDepois, setDorDepois] = useState("3");
  const [tempoMinutos, setTempoMinutos] = useState("20");
  const [dificuldade, setDificuldade] = useState<DificuldadeExecucao>(
    DificuldadeExecucao.MEDIO,
  );
  const [melhoriaSessao, setMelhoriaSessao] = useState<MelhoriaSessao | "">("");
  const [melhoriaDescricao, setMelhoriaDescricao] = useState("");
  const [motivoCategoria, setMotivoCategoria] = useState<string>("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");
  const [feedbackLivre, setFeedbackLivre] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toIntOrNull = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!concluiu) {
      if (!motivoCategoria && !motivoNaoExecucao.trim()) {
        next.motivoNaoExecucao = "Informe o motivo quando não concluir a atividade";
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    const dorAntesInt = toIntOrNull(dorAntes);
    const dorDepoisInt = toIntOrNull(dorDepois);
    const tempoInt = toIntOrNull(tempoMinutos);

    if (dorAntesInt === null || dorAntesInt < 0 || dorAntesInt > 10) {
      next.dorAntes = "Informe um valor entre 0 e 10";
    }

    if (dorDepoisInt === null || dorDepoisInt < 0 || dorDepoisInt > 10) {
      next.dorDepois = "Informe um valor entre 0 e 10";
    }

    if (tempoInt === null || tempoInt < 1 || tempoInt > 300) {
      next.tempoMinutos = "Informe um valor entre 1 e 300 minutos";
    }

    if (!melhoriaSessao) {
      next.melhoriaSessao = "Selecione como foi sua melhoria durante a sessão";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const motivoComposto = !concluiu
      ? [motivoCategoria, motivoNaoExecucao.trim()].filter(Boolean).join(" - ")
      : null;

    return {
      concluiu,
      dorAntes: concluiu ? toIntOrNull(dorAntes) : null,
      dorDepois: concluiu ? toIntOrNull(dorDepois) : null,
      tempoMinutos: concluiu ? toIntOrNull(tempoMinutos) : null,
      dificuldade: concluiu ? dificuldade : null,
      melhoriaSessao: concluiu ? melhoriaSessao || null : null,
      melhoriaDescricao: concluiu ? melhoriaDescricao.trim() || null : null,
      motivoNaoExecucao: motivoComposto,
      feedbackLivre: feedbackLivre.trim() || null,
    };
  };

  const handleSalvar = async () => {
    if (!validate()) {
      showToast({ message: "Revise os campos obrigatórios", type: "error" });
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      await api.post(`/atividades/${atividadeId}/checkins`, payload);

      if (concluiu) {
        if (usuarioId) {
          await registerConcludedCheckin(usuarioId);
        }
        await trackEvent("checkin_submitted", {
          atividadeId,
          origem: "paciente",
          modo: "completo",
          melhoriaSessao,
        });

        const dorAntesInt = toIntOrNull(dorAntes);
        const dorDepoisInt = toIntOrNull(dorDepois);
        if (dorAntesInt !== null && dorDepoisInt !== null) {
          const delta = dorAntesInt - dorDepoisInt;
          if (delta > 0) {
            showToast({
              message: `${t("patient.checkinGreat")} ${t("patient.checkinPainReduced", {
                value: delta,
              })}`,
              type: "success",
            });
          } else if (delta === 0) {
            showToast({
              message: `${t("patient.checkinGreat")} ${t("patient.checkinPainStable")}`,
              type: "success",
            });
          } else {
            showToast({
              message: t("patient.checkinPainIncreased"),
              type: "info",
            });
          }
        } else {
          showToast({ message: "Check-in registrado com sucesso", type: "success" });
        }
      } else {
        await trackEvent("patient_checkin_not_completed", {
          atividadeId,
          motivoCategoria: motivoCategoria || null,
          origem: "paciente",
        });
        showToast({ message: "Check-in registrado com sucesso", type: "success" });
      }
      navigation.goBack();
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        await enqueueOfflineCheckin(atividadeId, buildPayload());
        showToast({
          message:
            "Sem conexão. Check-in salvo offline e será sincronizado automaticamente.",
          type: "info",
        });
        navigation.goBack();
        return;
      }
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCheckin = async () => {
    try {
      setSaving(true);
      const payload = {
        concluiu: true,
        dorAntes: null,
        dorDepois: null,
        tempoMinutos: null,
        dificuldade: null,
        melhoriaSessao: MelhoriaSessao.MANTEVE,
        melhoriaDescricao: "Check-in rápido sem detalhamento.",
        motivoNaoExecucao: null,
        feedbackLivre: null,
      };

      await api.post(`/atividades/${atividadeId}/checkins`, payload);
      if (usuarioId) {
        await registerConcludedCheckin(usuarioId);
      }
      await trackEvent("patient_quick_checkin_submitted", {
        atividadeId,
        origem: "paciente",
      });
      showToast({ message: "Check-in rápido registrado", type: "success" });
      navigation.goBack();
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        await enqueueOfflineCheckin(atividadeId, {
          concluiu: true,
          dorAntes: null,
          dorDepois: null,
          tempoMinutos: null,
          dificuldade: null,
          melhoriaSessao: MelhoriaSessao.MANTEVE,
          melhoriaDescricao: "Check-in rápido sem detalhamento.",
          motivoNaoExecucao: null,
          feedbackLivre: null,
        });
        showToast({
          message: "Sem conexão. Check-in rápido salvo offline para sincronização.",
          type: "info",
        });
        navigation.goBack();
        return;
      }
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Check-in da sessão</Text>
          <Text style={styles.subtitle}>{titulo}</Text>

          <Button
            title="Check-in rápido (1 toque)"
            onPress={handleQuickCheckin}
            variant="outline"
            disabled={saving}
            style={styles.quickCheckinButton}
          />

          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setConcluiu(true)}
              style={[styles.toggle, concluiu && styles.toggleActive]}
            >
              <Ionicons
                name={concluiu ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={concluiu ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.toggleText, concluiu && styles.toggleTextActive]}>
                Concluí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConcluiu(false)}
              style={[styles.toggle, !concluiu && styles.toggleActive]}
            >
              <Ionicons
                name={!concluiu ? "close-circle" : "ellipse-outline"}
                size={16}
                color={!concluiu ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.toggleText, !concluiu && styles.toggleTextActive]}>
                Não concluí
              </Text>
            </TouchableOpacity>
          </View>

          {concluiu ? (
            <>
              <View style={styles.inlineRow}>
                <View style={styles.flex}>
                  <Input
                    label="Dor antes (0-10)"
                    value={dorAntes}
                    onChangeText={(value) => {
                      setDorAntes(value);
                      if (errors.dorAntes) {
                        setErrors((prev) => ({ ...prev, dorAntes: "" }));
                      }
                    }}
                    keyboardType="number-pad"
                    error={errors.dorAntes}
                  />
                </View>
                <View style={styles.inlineSpacer} />
                <View style={styles.flex}>
                  <Input
                    label="Dor depois (0-10)"
                    value={dorDepois}
                    onChangeText={(value) => {
                      setDorDepois(value);
                      if (errors.dorDepois) {
                        setErrors((prev) => ({ ...prev, dorDepois: "" }));
                      }
                    }}
                    keyboardType="number-pad"
                    error={errors.dorDepois}
                  />
                </View>
              </View>

              <Input
                label="Tempo (min)"
                value={tempoMinutos}
                onChangeText={(value) => {
                  setTempoMinutos(value);
                  if (errors.tempoMinutos) {
                    setErrors((prev) => ({ ...prev, tempoMinutos: "" }));
                  }
                }}
                keyboardType="number-pad"
                error={errors.tempoMinutos}
              />

              <Text style={styles.label}>Dificuldade</Text>
              <View style={styles.optionRow}>
                {DIFICULDADES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setDificuldade(item)}
                    style={[
                      styles.optionPill,
                      dificuldade === item && styles.optionPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        dificuldade === item && styles.optionPillTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Melhoria percebida na sessão</Text>
              <View style={styles.optionRow}>
                {MELHORIA_OPCOES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => {
                      setMelhoriaSessao(item.value);
                      if (errors.melhoriaSessao) {
                        setErrors((prev) => ({ ...prev, melhoriaSessao: "" }));
                      }
                    }}
                    style={[
                      styles.optionPill,
                      melhoriaSessao === item.value && styles.optionPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        melhoriaSessao === item.value && styles.optionPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.melhoriaSessao ? (
                <Text style={styles.validationError}>{errors.melhoriaSessao}</Text>
              ) : null}

              <Input
                label="Detalhe da melhoria (opcional)"
                value={melhoriaDescricao}
                onChangeText={setMelhoriaDescricao}
                multiline
                maxLength={1500}
                showCount
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Motivo principal</Text>
              <View style={styles.optionRow}>
                {NAO_EXECUTOU_MOTIVOS.map((motivo) => (
                  <TouchableOpacity
                    key={motivo}
                    onPress={() => {
                      setMotivoCategoria(motivo);
                      if (errors.motivoNaoExecucao) {
                        setErrors((prev) => ({ ...prev, motivoNaoExecucao: "" }));
                      }
                    }}
                    style={[
                      styles.optionPill,
                      motivoCategoria === motivo && styles.optionPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        motivoCategoria === motivo && styles.optionPillTextActive,
                      ]}
                    >
                      {motivo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label="Detalhe (opcional)"
                value={motivoNaoExecucao}
                onChangeText={(value) => {
                  setMotivoNaoExecucao(value);
                  if (errors.motivoNaoExecucao) {
                    setErrors((prev) => ({ ...prev, motivoNaoExecucao: "" }));
                  }
                }}
                multiline
                maxLength={600}
                showCount
                error={errors.motivoNaoExecucao}
              />
            </>
          )}

          <Input
            label="Feedback livre"
            value={feedbackLivre}
            onChangeText={setFeedbackLivre}
            multiline
            maxLength={1500}
            showCount
          />
        </View>

        <View style={styles.actions}>
          <Button title="Cancelar" onPress={() => navigation.goBack()} variant="outline" />
          <Button title="Salvar check-in" onPress={handleSalvar} loading={saving} />
        </View>
      </ScrollView>
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
  title: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    marginBottom: SPACING.md,
  },
  quickCheckinButton: {
    marginBottom: SPACING.md,
  },
  row: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  toggle: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.primary, fontWeight: "600" },
  toggleTextActive: { color: COLORS.white },
  inlineRow: { flexDirection: "row" },
  flex: { flex: 1 },
  inlineSpacer: { width: SPACING.sm },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  optionPillActive: {
    backgroundColor: COLORS.primary,
  },
  optionPillText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  optionPillTextActive: {
    color: COLORS.white,
  },
  validationError: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
});
