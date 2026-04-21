// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// INPUT COMPONENT
// ==========================================

import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  isPassword?: boolean;
  showCount?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  showCount = false,
  showClear = false,
  onClear,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;
  const stringValue = rest.value != null ? String(rest.value) : "";
  const showClearButton = showClear && !!stringValue && !!onClear;
  const showFooter = showCount || showClearButton;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              hasError
                ? COLORS.error
                : isFocused
                  ? COLORS.primary
                  : COLORS.gray500
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={COLORS.gray400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.gray500}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {showFooter && (
        <View style={styles.footer}>
          {showClearButton ? (
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {showCount && (
            <Text style={styles.counter}>
              {stringValue.length}
              {typeof rest.maxLength === "number" ? `/${rest.maxLength}` : ""}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  rightIconButton: {
    padding: SPACING.md,
  },
  error: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  counter: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
});
