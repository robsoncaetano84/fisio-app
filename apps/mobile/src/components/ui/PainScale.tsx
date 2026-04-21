import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";

interface PainScaleProps {
  value: number;
  onChange: (value: number) => void;
  title?: string;
  subtitle?: string;
  highlightTitle?: boolean;
  labelResolver?: (score: number) => string;
  mode?: "pain" | "wellness";
  invertColors?: boolean;
}

const SCALE_VALUES = Array.from({ length: 11 }, (_, i) => i);

const PAIN_COLORS = [
  "#43A047",
  "#53B34A",
  "#66BB45",
  "#7BC043",
  "#C0CA33",
  "#F4D03F",
  "#FBC02D",
  "#F9A825",
  "#F57C00",
  "#F4511E",
  "#E53935",
];

const EMOJI_MARKERS = [
  { value: 0, emoji: "\u{1F603}" },
  { value: 2, emoji: "\u{1F642}" },
  { value: 4, emoji: "\u{1F610}" },
  { value: 6, emoji: "\u{1F641}" },
  { value: 8, emoji: "\u{1F62C}" },
  { value: 10, emoji: "\u{1F62D}" },
];

const WELLNESS_EMOJI_MARKERS = [
  { value: 0, emoji: "\u{1F62D}" },
  { value: 2, emoji: "\u{1F61E}" },
  { value: 4, emoji: "\u{1F610}" },
  { value: 6, emoji: "\u{1F642}" },
  { value: 8, emoji: "\u{1F60A}" },
  { value: 10, emoji: "\u{1F603}" },
];

function getPainLabel(score: number) {
  if (score <= 1) return "Sem dor";
  if (score <= 3) return "Leve";
  if (score <= 5) return "Moderada";
  if (score <= 7) return "Forte";
  if (score <= 9) return "Muito forte";
  return "Insuportável";
}

function getPainEmoji(score: number) {
  if (score <= 1) return "\u{1F603}";
  if (score <= 3) return "\u{1F642}";
  if (score <= 5) return "\u{1F610}";
  if (score <= 7) return "\u{1F641}";
  if (score <= 9) return "\u{1F62C}";
  return "\u{1F62D}";
}

function getWellnessLabel(score: number) {
  if (score <= 1) return "Muito ruim";
  if (score <= 3) return "Ruim";
  if (score <= 5) return "Regular";
  if (score <= 7) return "Bom";
  if (score <= 9) return "Muito bom";
  return "Excelente";
}

function getWellnessEmoji(score: number) {
  if (score <= 1) return "\u{1F62D}";
  if (score <= 3) return "\u{1F61E}";
  if (score <= 5) return "\u{1F610}";
  if (score <= 7) return "\u{1F642}";
  if (score <= 9) return "\u{1F60A}";
  return "\u{1F603}";
}

export function PainScale({
  value,
  onChange,
  title = "Intensidade da Dor",
  subtitle = "Selecione o nível de dor de 0 a 10",
  highlightTitle = false,
  labelResolver,
  mode = "pain",
  invertColors = false,
}: PainScaleProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const parsed = Number(value);
  const normalizedValue = Number.isFinite(parsed)
    ? Math.max(0, Math.min(10, Math.round(parsed)))
    : 0;

  const useWellnessScale = mode === "wellness";
  const scaleColors =
    useWellnessScale || invertColors ? [...PAIN_COLORS].reverse() : PAIN_COLORS;
  const emojiMarkers = useWellnessScale ? WELLNESS_EMOJI_MARKERS : EMOJI_MARKERS;
  const defaultLabelResolver = useWellnessScale ? getWellnessLabel : getPainLabel;
  const currentEmoji = useWellnessScale
    ? getWellnessEmoji(normalizedValue)
    : getPainEmoji(normalizedValue);

  const emojiButtonSize = compact ? 44 : 48;
  const emojiFontSize = compact ? 24 : 26;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, highlightTitle && styles.titleHighlight]}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.scaleBoard}>
        <View style={styles.numbersRow}>
          {SCALE_VALUES.map((num) => (
            <Text
              key={`num-${num}`}
              style={[styles.numberText, compact && styles.numberTextCompact]}
            >
              {num}
            </Text>
          ))}
        </View>

        <View style={styles.ticksRow}>
          {SCALE_VALUES.map((num) => (
            <View key={`tick-${num}`} style={styles.tickSlot}>
              <View style={[styles.tick, compact && styles.tickCompact]} />
            </View>
          ))}
        </View>

        <View style={styles.colorBarRow}>
          {SCALE_VALUES.map((num) => {
            const isSelected = normalizedValue === num;
            const isPassed = normalizedValue >= num;
            return (
              <TouchableOpacity
                key={`scale-${num}`}
                onPress={() => onChange(num)}
                activeOpacity={0.8}
                style={[
                  styles.colorCell,
                  { backgroundColor: scaleColors[num] },
                  !isPassed && styles.colorCellDimmed,
                  isSelected && styles.colorCellSelected,
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.emojiRow}>
        {emojiMarkers.map((marker) => {
          const selected = normalizedValue === marker.value;
          return (
            <TouchableOpacity
              key={`emoji-${marker.value}`}
              onPress={() => onChange(marker.value)}
              style={[
                styles.emojiButton,
                {
                  width: emojiButtonSize,
                  height: emojiButtonSize,
                  borderRadius: emojiButtonSize / 2,
                },
                selected && styles.emojiButtonSelected,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.emojiText, { fontSize: emojiFontSize }]}>
                {marker.emoji}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.indicator}>
        <Text style={styles.indicatorEmoji}>{currentEmoji}</Text>
        <View>
          <Text style={styles.indicatorValue}>Nível <Text style={styles.indicatorValueNumber}>{normalizedValue}</Text></Text>
          <Text style={styles.indicatorLabel}>
            {labelResolver
              ? labelResolver(normalizedValue)
              : defaultLabelResolver(normalizedValue)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  titleHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  scaleBoard: {
    width: "100%",
  },
  numbersRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  numberText: {
    flex: 1,
    textAlign: "center",
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  numberTextCompact: {
    fontSize: FONTS.sizes.xs,
  },
  ticksRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tickSlot: {
    flex: 1,
    alignItems: "center",
  },
  tick: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.gray500,
    borderRadius: 1,
  },
  tickCompact: {
    height: 10,
  },
  colorBarRow: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.gray300,
    height: 38,
  },
  colorCell: {
    flex: 1,
  },
  colorCellDimmed: {
    opacity: 0.35,
  },
  colorCellSelected: {
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.white,
    opacity: 1,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingHorizontal: 2,
  },
  emojiButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  emojiButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}14`,
  },
  emojiText: {
    fontSize: 26,
  },
  indicator: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  indicatorEmoji: {
    fontSize: 34,
  },
  indicatorValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  indicatorValueNumber: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  indicatorLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});


