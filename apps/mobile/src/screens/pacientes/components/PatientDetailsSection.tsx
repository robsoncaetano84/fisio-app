import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS, SHADOWS, SPACING } from "../../../constants/theme";

interface PatientDetailsSectionProps {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function PatientDetailsSection({
  title,
  children,
  headerRight,
}: PatientDetailsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {headerRight}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
