// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE ADESAO SCREEN
// ==========================================
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { api } from "../../services";
import {
  Atividade,
  AtividadeCheckinTimeline,
  RootStackParamList,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useToast } from "../../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteAdesao">;
  route: RouteProp<RootStackParamList, "PacienteAdesao">;
};

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function PacienteAdesaoScreen({ route }: Props) {
  const { pacienteId } = route.params;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [checkins, setCheckins] = useState<AtividadeCheckinTimeline[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [atividadesRes, checkinsRes] = await Promise.all([
        api.get<Atividade[]>("/atividades", { params: { pacienteId } }),
        api.get<AtividadeCheckinTimeline[]>("/atividades/checkins", {
          params: { pacienteId },
        }),
      ]);
      setAtividades(atividadesRes.data || []);
      setCheckins(checkinsRes.data || []);
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => undefined);
      return () => undefined;
    }, [pacienteId]),
  );

  const metrics = useMemo(() => {
    const totalAtividades = atividades.length;
    const totalChecks = checkins.length;
    const checksConcluidos = checkins.filter((c) => c.concluiu).length;
    const taxaConclusão =
      totalChecks > 0 ? Math.round((checksConcluidos / totalChecks) * 100) : 0;

    const dorDepoisValid = checkins
      .map((c) => c.dorDepois)
      .filter((d): d is number => typeof d === "number");
    const mediaDorDepois =
      dorDepoisValid.length > 0
        ? (
            dorDepoisValid.reduce((sum, d) => sum + d, 0) /
            dorDepoisValid.length
          ).toFixed(1)
        : "-";

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const checks7dias = checkins.filter((c) => {
      const ms = new Date(c.createdAt).getTime();
      return !Number.isNaN(ms) && now - ms <= sevenDaysMs;
    }).length;

    return {
      totalAtividades,
      totalChecks,
      checksConcluidos,
      taxaConclusão,
      mediaDorDepois,
      checks7dias,
    };
  }, [atividades, checkins]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando aderência...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Atividades"
              value={String(metrics.totalAtividades)}
              icon="list-outline"
            />
            <MetricCard
              label="Checks"
              value={String(metrics.totalChecks)}
              icon="checkmark-done-outline"
            />
            <MetricCard
              label="Conclusão"
              value={`${metrics.taxaConclusão}%`}
              icon="stats-chart-outline"
            />
            <MetricCard
              label="Média dor"
              value={String(metrics.mediaDorDepois)}
              icon="pulse-outline"
            />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Últimos 7 dias</Text>
            <Text style={styles.summaryText}>
              Checks registrados: {metrics.checks7dias}
            </Text>
            <Text style={styles.summaryText}>
              Checks concluidos: {metrics.checksConcluidos}
            </Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Timeline de check-ins</Text>
            {checkins.length === 0 ? (
              <Text style={styles.emptyText}>
                Sem check-ins para este paciente.
              </Text>
            ) : (
              checkins.slice(0, 50).map((item) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineIconWrap}>
                    <Ionicons
                      name={item.concluiu ? "checkmark-circle" : "alert-circle"}
                      size={16}
                      color={item.concluiu ? COLORS.success : COLORS.warning}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineActivity}>
                      {item.atividadeTitulo}
                    </Text>
                    <Text style={styles.timelineMeta}>
                      {new Date(item.createdAt).toLocaleString("pt-BR")} •{" "}
                      {item.concluiu ? "Concluiu" : "Não concluiu"}
                    </Text>
                    {item.concluiu ? (
                      <Text style={styles.timelineExtra}>
                        Dor {item.dorAntes ?? "-"} → {item.dorDepois ?? "-"} •{" "}
                        {item.tempoMinutos
                          ? `${item.tempoMinutos} min`
                          : "tempo não informado"}
                      </Text>
                    ) : (
                      <Text style={styles.timelineExtra}>
                        Motivo: {item.motivoNaoExecucao || "não informado"}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING.xl },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metricCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  metricValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  summaryTitle: {
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: SPACING.xs,
    fontSize: FONTS.sizes.base,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: 2,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  timelineTitle: {
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: SPACING.sm,
    fontSize: FONTS.sizes.base,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  timelineIconWrap: {
    marginRight: SPACING.xs,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingBottom: SPACING.xs,
  },
  timelineActivity: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  timelineMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  timelineExtra: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
