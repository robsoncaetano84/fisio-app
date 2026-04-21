// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// BUTTON COMPONENT
// ==========================================

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        size === "sm" && styles.size_sm,
        size === "md" && styles.size_md,
        size === "lg" && styles.size_lg,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.white
          }
        />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              variant === "primary" && styles.text_primary,
              variant === "secondary" && styles.text_secondary,
              variant === "outline" && styles.text_outline,
              variant === "ghost" && styles.text_ghost,
              size === "sm" && styles.textSize_sm,
              size === "md" && styles.textSize_md,
              size === "lg" && styles.textSize_lg,
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  size_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  size_md: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  size_lg: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
  text_primary: {
    color: COLORS.white,
  },
  text_secondary: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  textSize_sm: {
    fontSize: FONTS.sizes.sm,
  },
  textSize_md: {
    fontSize: FONTS.sizes.base,
  },
  textSize_lg: {
    fontSize: FONTS.sizes.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
