import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import {
  getSampleConfidence,
  type AccountHealthStatus,
} from "./AdminCrmScreen.utils";
import {
  focusStyle,
  sharedComponentStyles as styles,
} from "./AdminCrmScreen.component-shared";

export function Blocked({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.blocked}>
        <Ionicons name={icon} size={28} color={COLORS.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

export function Metric({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.metric, onPress && styles.metricInteractive]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      hitSlop={6}
      style={focusStyle}
    >
      {content}
    </Pressable>
  );
}

export function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricMini}>
      <Text style={styles.metricMiniValue}>{value}</Text>
      <Text style={styles.metricMiniLabel}>{label}</Text>
    </View>
  );
}

export function KpiCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export function SampleConfidenceBadge({ sample }: { sample: number }) {
  const confidence = getSampleConfidence(sample);
  return (
    <View
      style={[
        styles.sampleBadge,
        confidence === "ALTA"
          ? styles.sampleBadgeHigh
          : confidence === "MEDIA"
            ? styles.sampleBadgeMedium
            : styles.sampleBadgeLow,
      ]}
    >
      <Text
        style={[
          styles.sampleBadgeText,
          confidence === "ALTA"
            ? styles.sampleBadgeHighText
            : confidence === "MEDIA"
              ? styles.sampleBadgeMediumText
              : styles.sampleBadgeLowText,
        ]}
      >
        {confidence}
      </Text>
    </View>
  );
}

export function StatusBadge({
  status,
  labels,
}: {
  status: AccountHealthStatus;
  labels?: { healthy: string; attention: string; risk: string };
}) {
  const tone =
    status === "HEALTHY"
      ? {
          bg: "#EAF8F1",
          border: "#BFEAD0",
          text: "#187A46",
          label: labels?.healthy || "Conta saudável",
        }
      : status === "ATTENTION"
        ? {
            bg: "#FFF7E8",
            border: "#F4D39A",
            text: "#9A6700",
            label: labels?.attention || "Atenção",
          }
        : {
            bg: "#FFF0F0",
            border: "#F0B4B4",
            text: "#B52828",
            label: labels?.risk || "Risco",
          };
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.statusBadgeText, { color: tone.text }]}>
        {tone.label}
      </Text>
    </View>
  );
}

export function ReasonTag({ label }: { label: string }) {
  return (
    <View style={styles.reasonTag}>
      <Text style={styles.reasonTagText}>{label}</Text>
    </View>
  );
}

export function SeverityBadge({
  level,
  labels,
}: {
  level: "HIGH" | "MEDIUM";
  labels?: { high: string; medium: string };
}) {
  const tone =
    level === "HIGH"
      ? {
          bg: "#FFF0F0",
          border: "#F0B4B4",
          text: "#B52828",
          label: labels?.high || "Alta",
        }
      : {
          bg: "#FFF7E8",
          border: "#F4D39A",
          text: "#9A6700",
          label: labels?.medium || "Média",
        };
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.statusBadgeText, { color: tone.text }]}>
        {tone.label}
      </Text>
    </View>
  );
}
