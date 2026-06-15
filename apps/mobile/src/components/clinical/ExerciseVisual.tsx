import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";

export type ExerciseImageType =
  | "MOBILIDADE_GERAL"
  | "MOBILIDADE_LOMBAR"
  | "CONTROLE_CERVICAL"
  | "OMBRO_MANGUITO"
  | "JOELHO_AGACHAMENTO"
  | "QUADRIL_GLUTEOS"
  | "TORNOZELO_EQUILIBRIO"
  | "PUNHO_PREENSAO";

export const EXERCISE_IMAGE_OPTIONS: Array<{
  value: ExerciseImageType;
  label: string;
  hint: string;
}> = [
  {
    value: "MOBILIDADE_GERAL",
    label: "Mobilidade geral",
    hint: "Movimento ativo em amplitude toleravel",
  },
  {
    value: "MOBILIDADE_LOMBAR",
    label: "Mobilidade lombar",
    hint: "Controle lombo-pelvico e ponte curta",
  },
  {
    value: "CONTROLE_CERVICAL",
    label: "Controle cervical",
    hint: "Postura cervical e estabilidade escapular",
  },
  {
    value: "OMBRO_MANGUITO",
    label: "Ombro e manguito",
    hint: "Controle escapular e movimento assistido",
  },
  {
    value: "JOELHO_AGACHAMENTO",
    label: "Joelho/agachamento",
    hint: "Agachamento parcial e controle de alinhamento",
  },
  {
    value: "QUADRIL_GLUTEOS",
    label: "Quadril/gluteos",
    hint: "Ativacao de gluteos e controle pelvico",
  },
  {
    value: "TORNOZELO_EQUILIBRIO",
    label: "Tornozelo/equilibrio",
    hint: "Apoio e propriocepcao",
  },
  {
    value: "PUNHO_PREENSAO",
    label: "Punho/preensao",
    hint: "Mobilidade distal e forca de preensao",
  },
];

const DEFAULT_TYPE: ExerciseImageType = "MOBILIDADE_GERAL";

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeExerciseImageType(
  value?: string | null,
): ExerciseImageType {
  const normalized = String(value || "").trim().toUpperCase();
  const match = EXERCISE_IMAGE_OPTIONS.find((item) => item.value === normalized);
  return match?.value || DEFAULT_TYPE;
}

export function inferExerciseImageType(...values: unknown[]): ExerciseImageType {
  const text = normalizeText(values.join(" "));
  const hasAny = (terms: string[]) => terms.some((term) => text.includes(term));

  if (hasAny(["ombro", "manguito", "escapul"])) return "OMBRO_MANGUITO";
  if (hasAny(["cervical", "pescoco", "cefaleia"])) return "CONTROLE_CERVICAL";
  if (hasAny(["lombar", "lombo", "ciatic", "lombalgia"])) {
    return "MOBILIDADE_LOMBAR";
  }
  if (hasAny(["joelho", "patelar", "quadriceps", "agachamento"])) {
    return "JOELHO_AGACHAMENTO";
  }
  if (hasAny(["quadril", "coxofemoral", "gluteo"])) return "QUADRIL_GLUTEOS";
  if (hasAny(["tornozelo", "apoio", "equilibrio", "propriocepcao"])) {
    return "TORNOZELO_EQUILIBRIO";
  }
  if (hasAny(["punho", "mao", "carpal", "preensao", "cotovelo"])) {
    return "PUNHO_PREENSAO";
  }
  return DEFAULT_TYPE;
}

function Pose({ type }: { type: ExerciseImageType }) {
  const stroke = COLORS.primary;
  const accent = COLORS.secondary;
  const muted = COLORS.gray400;

  if (type === "JOELHO_AGACHAMENTO") {
    return (
      <>
        <Circle cx="84" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="84" y1="42" x2="76" y2="84" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="84" x2="110" y2="102" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="110" y1="102" x2="138" y2="126" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="82" x2="42" y2="110" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="42" y1="110" x2="28" y2="138" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="56" x2="42" y2="70" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Line x1="86" y1="58" x2="120" y2="72" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Path d="M96 101 C108 92 122 93 136 103" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "OMBRO_MANGUITO") {
    return (
      <>
        <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="82" y1="42" x2="82" y2="96" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="56" x2="42" y2="34" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="56" x2="122" y2="34" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="58" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="106" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M36 64 C56 50 108 50 128 64" stroke={muted} strokeWidth="3" fill="none" strokeDasharray="4 6" />
      </>
    );
  }

  if (type === "CONTROLE_CERVICAL") {
    return (
      <>
        <Circle cx="84" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="84" y1="42" x2="84" y2="94" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="60" y1="58" x2="108" y2="58" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="84" y1="94" x2="62" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="84" y1="94" x2="106" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M67 32 C78 18 92 18 102 32" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M56 48 C70 40 98 40 112 48" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "MOBILIDADE_LOMBAR") {
    return (
      <>
        <Circle cx="80" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Path d="M82 44 C68 58 66 78 80 96" stroke={stroke} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Line x1="78" y1="62" x2="44" y2="82" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Line x1="80" y1="96" x2="52" y2="134" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="112" y2="134" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M96 74 C118 82 128 98 126 120" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "QUADRIL_GLUTEOS") {
    return (
      <>
        <Circle cx="78" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="78" y1="42" x2="78" y2="86" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="86" x2="44" y2="128" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="86" x2="118" y2="112" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="118" y1="112" x2="142" y2="112" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="60" y1="58" x2="104" y2="58" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      </>
    );
  }

  if (type === "TORNOZELO_EQUILIBRIO") {
    return (
      <>
        <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="82" y1="42" x2="82" y2="88" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="58" x2="50" y2="70" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="82" y1="58" x2="116" y2="46" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="82" y1="88" x2="76" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="136" x2="104" y2="140" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M44 146 C70 134 100 134 126 146" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "PUNHO_PREENSAO") {
    return (
      <>
        <Circle cx="70" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="70" y1="44" x2="70" y2="94" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="70" y1="58" x2="116" y2="80" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Circle cx="132" cy="88" r="12" fill="none" stroke={accent} strokeWidth="4" />
        <Line x1="70" y1="94" x2="48" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="70" y1="94" x2="92" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M120 70 C134 74 142 82 146 96" stroke={muted} strokeWidth="3" fill="none" strokeDasharray="4 5" />
      </>
    );
  }

  return (
    <>
      <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
      <Line x1="82" y1="42" x2="82" y2="92" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Line x1="82" y1="58" x2="48" y2="82" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      <Line x1="82" y1="58" x2="116" y2="82" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      <Line x1="82" y1="92" x2="56" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Line x1="82" y1="92" x2="108" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Path d="M42 112 C62 100 102 100 122 112" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
}

type Props = {
  imageType?: string | null;
  title?: string | null;
  compact?: boolean;
};

export function ExerciseVisual({ imageType, title, compact }: Props) {
  const resolvedType = useMemo(
    () =>
      imageType
        ? normalizeExerciseImageType(imageType)
        : inferExerciseImageType(title),
    [imageType, title],
  );
  const option =
    EXERCISE_IMAGE_OPTIONS.find((item) => item.value === resolvedType) ||
    EXERCISE_IMAGE_OPTIONS[0];
  return (
    <View style={[styles.frame, styles.generatedFrame, compact && styles.frameCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 168 168">
        <Rect x="8" y="8" width="152" height="152" rx="18" fill="#F7FBFA" />
        <Path d="M24 140 H144" stroke={COLORS.gray300} strokeWidth="5" strokeLinecap="round" />
        <Pose type={resolvedType} />
        <SvgText
          x="132"
          y="151"
          fill={COLORS.gray400}
          fontSize="11"
          fontWeight="700"
          opacity="0.72"
          textAnchor="middle"
        >
          Synap
        </SvgText>
      </Svg>
      {!compact ? (
        <View style={styles.caption}>
          <Text style={styles.captionTitle}>{option.label}</Text>
          <Text style={styles.captionHint}>{option.hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    height: 172,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    backgroundColor: COLORS.gray100,
  },
  frameCompact: {
    width: 74,
    height: 74,
  },
  generatedFrame: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  caption: {
    position: "absolute",
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#FFFFFFE8",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  captionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  captionHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
