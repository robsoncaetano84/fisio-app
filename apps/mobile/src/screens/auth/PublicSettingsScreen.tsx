// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PUBLIC SETTINGS SCREEN
// ==========================================
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LanguageSelector } from "../../components/ui";
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";

export function PublicSettingsScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>{t("nav.settings")}</Text>
            <Text style={styles.subtitle}>{t("publicSettings.preLoginSubtitle")}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("settings.preferences")}</Text>
          <Text style={styles.label}>{t("lang.label")}</Text>
          <LanguageSelector />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING["2xl"],
    gap: SPACING.md,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "14",
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
});
