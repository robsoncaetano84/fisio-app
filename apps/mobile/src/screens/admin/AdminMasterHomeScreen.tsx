import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import { RootStackParamList } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminHome">;

export function AdminMasterHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Console ADM Master</Text>
          <Text style={styles.subtitle}>
            Área administrativa com visão global de profissionais e pacientes.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate("AdminCrm")}
          accessibilityRole="button"
          accessibilityLabel="Abrir Dashboard e CRM"
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Dashboard e CRM</Text>
            <Text style={styles.cardDescription}>
              Funil clínico, indicadores operacionais, auditoria e gestão de dados.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
