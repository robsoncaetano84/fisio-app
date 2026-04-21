// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LANGUAGE SELECTOR
// ==========================================
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";
import { AppLanguage } from "../../i18n/translations";
import { useLanguage } from "../../i18n/LanguageProvider";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  const options: AppLanguage[] = ["pt", "en", "es"];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("lang.label")}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const active = language === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => {
                setLanguage(option).catch(() => undefined);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {t(`lang.${option}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  options: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  option: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "14",
  },
  optionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  optionTextActive: {
    color: COLORS.primary,
  },
});
