// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// EVOLUCAO LIST SCREEN
// ==========================================

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Button, useToast } from "../../components/ui";
import { useEvolucaoStore } from "../../stores/evolucaoStore";
import { usePacienteStore } from "../../stores/pacienteStore";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { RootStackParamList, Evolucao } from "../../types";

type EvolucaoListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EvolucaoList">;
  route: RouteProp<RootStackParamList, "EvolucaoList">;
};

const parseDatePreservingDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Card de Evolução
const EvolucaoCard = React.memo(function EvolucaoCard({
  evolucao,
  onPress,
  onLongPress,
}: {
  evolucao: Evolucao;
  onPress: () => void;
  onLongPress: () => void;
}) {

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>{evolucao.dataFormatada || evolucao.data}</Text>
          <Text style={styles.timeText}>{evolucao.horaFormatada || ""}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
      </View>

      {(evolucao.avaliacao || evolucao.ajustes) && (
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Avaliação clínica:</Text>
          <Text style={styles.cardValue} numberOfLines={2}>
            {evolucao.avaliacao || evolucao.ajustes}
          </Text>
        </View>
      )}

      {(evolucao.plano || evolucao.orientacoes) && (
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Orientações:</Text>
          <Text style={styles.cardValue} numberOfLines={2}>
            {evolucao.plano || evolucao.orientacoes}
          </Text>
        </View>
      )}

      {(evolucao.checkinDor || evolucao.checkinDificuldade) && (
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Check-in:</Text>
          <Text style={styles.cardValue} numberOfLines={2}>
            Dor: {evolucao.checkinDor ?? "-"} | Dificuldade: {evolucao.checkinDificuldade ?? "-"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export function EvolucaoListScreen({
  navigation,
  route,
}: EvolucaoListScreenProps) {
  const { pacienteId } = route.params;
  const { getPacienteById } = usePacienteStore();
  const { evolucoes, isLoading, fetchEvolucoesByPaciente, deleteEvolucao } =
    useEvolucaoStore();
  const { showToast } = useToast();

  const paciente = getPacienteById(pacienteId);
  const evolucoesFiltradas = useMemo(
    () => evolucoes.filter((e) => e.pacienteId === pacienteId),
    [evolucoes, pacienteId],
  );
  const adherenceInfo = useMemo(() => {
    if (!evolucoesFiltradas.length) {
      return {
        label: "Sem evoluções",
        tone: "warning" as const,
      };
    }

    const latest = evolucoesFiltradas
      .map((item) => parseDatePreservingDateOnly(item.data).getTime())
      .filter((time) => !Number.isNaN(time))
      .sort((a, b) => b - a)[0];

    if (!latest) {
      return {
        label: "Sem evoluções",
        tone: "warning" as const,
      };
    }

    const diffDays = Math.floor(
      (Date.now() - latest) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 7) {
      return {
        label: "Em dia",
        tone: "success" as const,
      };
    }

    return {
      label: `${diffDays} dia(s) sem evolução`,
      tone: "warning" as const,
    };
  }, [evolucoesFiltradas]);

  useEffect(() => {
    fetchEvolucoesByPaciente(pacienteId);
  }, [pacienteId]);

  const handleEvolucaoPress = useCallback((evolucao: Evolucao) => {
    navigation.navigate("EvolucaoForm", {
      pacienteId,
      evolucaoId: evolucao.id,
    });
  }, [navigation, pacienteId]);

  const handleDelete = useCallback((evolucaoId: string) => {
    Alert.alert("Excluir", "Deseja excluir esta evolução?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvolucao(evolucaoId);
          } catch (error) {
            showToast({ message: "Não foi possível concluir a operação", type: "error" });
          }
        },
      },
    ]);
  }, [deleteEvolucao]);

  const renderEvolucao = useCallback(
    ({ item }: { item: Evolucao }) => (
      <EvolucaoCard
        evolucao={item}
        onPress={() => handleEvolucaoPress(item)}
        onLongPress={() => handleDelete(item.id)}
      />
    ),
    [handleDelete, handleEvolucaoPress],
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>Nenhuma evolução registrada</Text>
      <Text style={styles.emptySubtitle}>
        Registre a primeira evolução deste paciente
      </Text>
      <Button
        title="Nova Evolução"
        onPress={() => navigation.navigate("EvolucaoForm", { pacienteId })}
        style={{ marginTop: SPACING.md }}
      />
    </View>
  );

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text>Paciente não encontrado</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header do Paciente */}
      <View style={styles.patientHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {paciente.nomeCompleto.charAt(0)}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{paciente.nomeCompleto}</Text>
          <Text style={styles.evolucaoCount}>
            {evolucoesFiltradas.length} evolução(ões) registrada(s)
          </Text>
          <View
            style={[
              styles.adherenceBadge,
              adherenceInfo.tone === "success"
                ? styles.adherenceBadgeSuccess
                : styles.adherenceBadgeWarning,
            ]}
          >
            <Text
              style={[
                styles.adherenceText,
                adherenceInfo.tone === "success"
                  ? styles.adherenceTextSuccess
                  : styles.adherenceTextWarning,
              ]}
            >
              {adherenceInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={evolucoesFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderEvolucao}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={140}
          removeClippedSubviews
        />
      )}

      {/* FAB */}
      {evolucoesFiltradas.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("EvolucaoForm", { pacienteId })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  patientAvatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.white,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  evolucaoCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adherenceBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  adherenceBadgeSuccess: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  adherenceBadgeWarning: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFE082",
  },
  adherenceText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  adherenceTextSuccess: {
    color: "#2E7D32",
  },
  adherenceTextWarning: {
    color: "#EF6C00",
  },
  listContent: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  cardSection: {
    marginTop: SPACING.xs,
  },
  cardLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: SPACING.base,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
});

