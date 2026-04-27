// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANAMNESE LIST SCREEN
// ==========================================

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Button, useToast } from "../../components/ui";
import { useAnamneseStore } from "../../stores/anamneseStore";
import { usePacienteStore } from "../../stores/pacienteStore";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { RootStackParamList, Anamnese } from "../../types";

type AnamneseListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AnamneseList">;
  route: RouteProp<RootStackParamList, "AnamneseList">;
};

const AnamneseCard = React.memo(function AnamneseCard({
  anamnese,
  onPress,
}: {
  anamnese: Anamnese;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>
            {anamnese.createdAtFormatada || anamnese.createdAt}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.cardLabel}>Motivo:</Text>
        <Text style={styles.cardValue}>{anamnese.motivoBusca}</Text>
      </View>

      {anamnese.descricaoSintomas ? (
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Sintomas:</Text>
          <Text style={styles.cardValue} numberOfLines={2}>
            {anamnese.descricaoSintomas}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

export function AnamneseListScreen({
  navigation,
  route,
}: AnamneseListScreenProps) {
  const { pacienteId } = route.params;
  const { getPacienteById } = usePacienteStore();
  const { anamneses, isLoading, fetchAnamnesesByPaciente } =
    useAnamneseStore();
  const { showToast } = useToast();

  const paciente = getPacienteById(pacienteId);
  const anamnesesFiltradas = useMemo(
    () => anamneses.filter((a) => a.pacienteId === pacienteId),
    [anamneses, pacienteId],
  );

  useEffect(() => {
    fetchAnamnesesByPaciente(pacienteId).catch(() => {
      showToast({
        message: "Nao foi possivel concluir a operacao",
        type: "error",
      });
    });
  }, [fetchAnamnesesByPaciente, pacienteId, showToast]);

  const renderAnamnese = useCallback(
    ({ item }: { item: Anamnese }) => (
      <AnamneseCard
        anamnese={item}
        onPress={() =>
          navigation.navigate("AnamneseForm", {
            pacienteId,
            anamneseId: item.id,
          })
        }
      />
    ),
    [navigation, pacienteId],
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>Nenhuma anamnese registrada</Text>
      <Text style={styles.emptySubtitle}>
        Registre a primeira anamnese deste paciente
      </Text>
      <Button
        title="Nova Anamnese"
        onPress={() => navigation.navigate("AnamneseForm", { pacienteId })}
        style={{ marginTop: SPACING.md }}
      />
    </View>
  );

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text>Paciente nao encontrado</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.patientHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {paciente.nomeCompleto.charAt(0)}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{paciente.nomeCompleto}</Text>
          <Text style={styles.anamneseCount}>
            {anamnesesFiltradas.length} anamnese(s) registrada(s)
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={anamnesesFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderAnamnese}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={140}
          removeClippedSubviews
        />
      )}

      {anamnesesFiltradas.length > 0 ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AnamneseForm", { pacienteId })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}
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
  anamneseCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
