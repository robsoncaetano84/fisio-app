import React from "react";
import {
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  focusStyle,
  sharedComponentStyles as styles,
} from "./AdminCrmScreen.component-shared";

export function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={(state) => [
        styles.tab,
        active && styles.tabActive,
        focusStyle(state),
      ]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MiniTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={(state) => [
        styles.miniTab,
        active && styles.miniTabActive,
        focusStyle(state),
      ]}
    >
      <Text style={[styles.miniTabText, active && styles.miniTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={(state) => [
        styles.chip,
        active && styles.chipActive,
        focusStyle(state),
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Action({
  title,
  onPress,
  secondary,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={6}
      style={(state) => [
        styles.action,
        secondary && styles.actionSecondary,
        style,
        focusStyle(state),
      ]}
    >
      <Text
        style={[styles.actionText, secondary && styles.actionTextSecondary]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function SmallBtn({
  title,
  onPress,
  danger,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={6}
      style={(state) => [
        styles.small,
        danger && styles.smallDanger,
        focusStyle(state),
      ]}
    >
      <Text style={[styles.smallText, danger && styles.smallTextDanger]}>
        {title}
      </Text>
    </Pressable>
  );
}
