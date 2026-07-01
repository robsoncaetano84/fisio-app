// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PLANO TERAPEUTICO IA SCREEN
// Revisao e aprovacao, pelo fisioterapeuta, do plano de exercicios recomendado
// pela IA a partir da anamnese + exame fisico. Multiplataforma (Expo).
// ==========================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  AprovarPlanoIaItem,
  PlanoTerapeuticoItem,
  PlanoTerapeuticoResult,
  RootStackParamList,
} from "../../types";
import { api } from "../../services";
import { parseApiError } from "../../utils/apiErrors";
import { ExerciseVisual } from "../../components/clinical/ExerciseVisual";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "PlanoTerapeuticoIa"
  >;
  route: RouteProp<RootStackParamList, "PlanoTerapeuticoIa">;
};

type ItemEdit = {
  incluido: boolean;
  series: string;
  repeticoes: string;
  tempoSegundos: string;
  usaTempo: boolean;
  frequenciaSemanal: string;
  diaPrescricao: number;
};

const DIAS = [1, 2, 3, 4, 5, 6, 7];

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, "");

const toOptionalInt = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const buildInitialEdit = (item: PlanoTerapeuticoItem): ItemEdit => ({
  incluido: true,
  series: String(item.series ?? ""),
  repeticoes: item.repeticoes != null ? String(item.repeticoes) : "",
  tempoSegundos: item.tempoSegundos != null ? String(item.tempoSegundos) : "",
  usaTempo: item.tempoSegundos != null && item.repeticoes == null,
  frequenciaSemanal: String(item.frequenciaSemanal ?? ""),
  diaPrescricao: 1,
});

export function PlanoTerapeuticoIaScreen({ navigation, route }: Props) {
  const { pacienteId, pacienteNome } = route.params;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plano, setPlano] = useState<PlanoTerapeuticoResult | null>(null);
  const [edits, setEdits] = useState<Record<string, ItemEdit>>({});

  const gerarPlano = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post<PlanoTerapeuticoResult>(
        "/atividades/plano-ia",
        { pacienteId },
      );
      setPlano(response.data);
      const initial: Record<string, ItemEdit> = {};
      response.data.itens.forEach((item) => {
        initial[item.exercicioId] = buildInitialEdit(item);
      });
      setEdits(initial);
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [pacienteId, showToast]);

  useEffect(() => {
    void gerarPlano();
  }, [gerarPlano]);

  const updateEdit = useCallback(
    (exercicioId: string, patch: Partial<ItemEdit>) => {
      setEdits((prev) => ({
        ...prev,
        [exercicioId]: { ...prev[exercicioId], ...patch },
      }));
    },
    [],
  );

  const incluidos = useMemo(
    () => Object.values(edits).filter((edit) => edit.incluido).length,
    [edits],
  );

  const aprovar = useCallback(async () => {
    if (!plano) return;
    const itens: AprovarPlanoIaItem[] = [];
    plano.itens.forEach((item, index) => {
      const edit = edits[item.exercicioId];
      if (!edit?.incluido) return;
      itens.push({
        exercicioId: item.exercicioId,
        series: toOptionalInt(edit.series),
        repeticoes: edit.usaTempo ? undefined : toOptionalInt(edit.repeticoes),
        tempoSegundos: edit.usaTempo
          ? toOptionalInt(edit.tempoSegundos)
          : undefined,
        frequenciaSemanal: toOptionalInt(edit.frequenciaSemanal),
        diaPrescricao: edit.diaPrescricao,
        ordemNoDia: index + 1,
      });
    });

    if (!itens.length) {
      showToast({
        message: "Selecione ao menos um exercicio para aprovar",
        type: "info",
      });
      return;
    }

    setSaving(true);
    try {
      await api.post("/atividades/plano-ia/aprovar", { pacienteId, itens });
      showToast({
        message: `Plano aprovado: ${itens.length} exercicio(s) prescrito(s)`,
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  }, [plano, edits, pacienteId, navigation, showToast]);

  const bloqueado = plano?.bloqueadoPorRedFlag ?? false;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>Plano recomendado por IA</Text>
          {pacienteNome ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {pacienteNome}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centeredText}>
            Analisando anamnese e exame fisico...
          </Text>
        </View>
      ) : !plano ? (
        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={COLORS.textSecondary}
          />
          <Text style={styles.centeredText}>
            Nao foi possivel gerar o plano agora.
          </Text>
          <Button title="Tentar novamente" onPress={gerarPlano} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.metaRow}>
              <View style={styles.sourceBadge}>
                <Ionicons
                  name={plano.source === "ai" ? "sparkles" : "options-outline"}
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.sourceBadgeText}>
                  {plano.source === "ai"
                    ? "Refinado por IA"
                    : "Recomendacao algoritmica"}
                </Text>
              </View>
              {plano.regioesAlvo.length ? (
                <Text style={styles.regioesText} numberOfLines={1}>
                  Foco: {plano.regioesAlvo.join(", ").toLowerCase()}
                </Text>
              ) : null}
            </View>

            {bloqueado ? (
              <View style={styles.redFlagCard}>
                <View style={styles.redFlagHeader}>
                  <Ionicons name="warning" size={18} color={COLORS.warning} />
                  <Text style={styles.redFlagTitle}>
                    Sinais de alerta identificados
                  </Text>
                </View>
                <Text style={styles.redFlagText}>
                  {plano.observacaoClinica}
                </Text>
                {plano.redFlags.map((flag) => (
                  <Text key={flag} style={styles.redFlagItem}>
                    • {flag}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.observacaoCard}>
                <Text style={styles.observacaoText}>
                  {plano.observacaoClinica}
                </Text>
              </View>
            )}

            {plano.itens.map((item) => {
              const edit = edits[item.exercicioId];
              if (!edit) return null;
              return (
                <View
                  key={item.exercicioId}
                  style={[
                    styles.itemCard,
                    !edit.incluido && styles.itemCardExcluido,
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemImage}>
                      <ExerciseVisual
                        imageType={item.imagemTipo}
                        imageUrl={item.imagemUrl}
                        cacheKey={item.imagemTipo || item.exercicioId}
                        title={item.exercicioNome}
                        compact
                      />
                    </View>
                    <View style={styles.itemHeaderTexts}>
                      <Text style={styles.itemNome}>{item.exercicioNome}</Text>
                      <View style={styles.chipsRow}>
                        <Text style={styles.chip}>
                          {item.regiaoCorporal.toLowerCase()}
                        </Text>
                        <Text style={styles.chip}>
                          {item.categoria.toLowerCase()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        updateEdit(item.exercicioId, {
                          incluido: !edit.incluido,
                        })
                      }
                      style={styles.checkbox}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={edit.incluido ? "checkbox" : "square-outline"}
                        size={24}
                        color={
                          edit.incluido ? COLORS.primary : COLORS.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.justificativa}>{item.justificativa}</Text>

                  {edit.incluido ? (
                    <>
                      <View style={styles.doseRow}>
                        <View style={styles.doseField}>
                          <Input
                            label="Series"
                            value={edit.series}
                            onChangeText={(v) =>
                              updateEdit(item.exercicioId, {
                                series: onlyDigits(v),
                              })
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={styles.doseField}>
                          <Input
                            label={edit.usaTempo ? "Segundos" : "Repeticoes"}
                            value={
                              edit.usaTempo
                                ? edit.tempoSegundos
                                : edit.repeticoes
                            }
                            onChangeText={(v) =>
                              updateEdit(
                                item.exercicioId,
                                edit.usaTempo
                                  ? { tempoSegundos: onlyDigits(v) }
                                  : { repeticoes: onlyDigits(v) },
                              )
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={styles.doseField}>
                          <Input
                            label="x/semana"
                            value={edit.frequenciaSemanal}
                            onChangeText={(v) =>
                              updateEdit(item.exercicioId, {
                                frequenciaSemanal: onlyDigits(v),
                              })
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>

                      <Text style={styles.diaLabel}>Dia da semana</Text>
                      <View style={styles.diasRow}>
                        {DIAS.map((dia) => (
                          <TouchableOpacity
                            key={dia}
                            onPress={() =>
                              updateEdit(item.exercicioId, {
                                diaPrescricao: dia,
                              })
                            }
                            style={[
                              styles.diaChip,
                              edit.diaPrescricao === dia && styles.diaChipAtivo,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.diaChipText,
                                edit.diaPrescricao === dia &&
                                  styles.diaChipTextAtivo,
                              ]}
                            >
                              {dia}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : null}
                </View>
              );
            })}

            {plano.referencias.length ? (
              <Text style={styles.referencias}>
                Referencias: {plano.referencias.join(" | ")}
              </Text>
            ) : null}

            <Text style={styles.disclaimer}>
              Sugestao gerada por IA. Requer validacao do fisioterapeuta antes
              de ser prescrita ao paciente.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Gerar novamente"
              variant="outline"
              onPress={gerarPlano}
              style={styles.footerSecondary}
            />
            <Button
              title={
                bloqueado
                  ? "Prescricao bloqueada"
                  : `Aprovar ${incluidos} exercicio(s)`
              }
              onPress={aprovar}
              loading={saving}
              disabled={bloqueado || incluidos === 0}
              style={styles.footerPrimary}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  centeredText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight + "22",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  sourceBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    color: COLORS.primary,
  },
  regioesText: {
    flex: 1,
    textAlign: "right",
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  observacaoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  observacaoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  redFlagCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    gap: 4,
  },
  redFlagHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  redFlagTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  redFlagText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  redFlagItem: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  itemCardExcluido: {
    opacity: 0.55,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
    backgroundColor: COLORS.borderLight,
  },
  itemHeaderTexts: {
    flex: 1,
    gap: 4,
  },
  itemNome: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  checkbox: {
    padding: SPACING.xs,
  },
  justificativa: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  doseRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  doseField: {
    flex: 1,
  },
  diaLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  diasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  diaChip: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  diaChipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diaChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  diaChipTextAtivo: {
    color: COLORS.white,
  },
  referencias: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  disclaimer: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerSecondary: {
    flex: 1,
  },
  footerPrimary: {
    flex: 2,
  },
});
