import React, { useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  View,
} from "react-native";
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
  | "PUNHO_PREENSAO"
  | "MOBILIDADE_LOMBAR_GATO_CAMELO"
  | "PONTE_CURTA"
  | "CONTROLE_CERVICAL_PROFUNDO"
  | "ELEVACAO_ASSISTIDA_OMBRO"
  | "AGACHAMENTO_PARCIAL_ASSISTIDO"
  | "ABDUCAO_QUADRIL_DECUBITO_LATERAL"
  | "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO"
  | "PREENSAO_MANUAL_BOLA_MACIA"
  | "MOBILIDADE_TORACICA_ROTACAO_SENTADA"
  | "RETRACAO_ESCAPULAR_SENTADA"
  | "ISOMETRIA_ROTACAO_EXTERNA_OMBRO"
  | "EXTENSAO_JOELHO_SENTADO"
  | "SENTAR_LEVANTAR_CONTROLADO"
  | "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO"
  | "MARCHA_ESTACIONARIA_APOIO"
  | "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO"
  | "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO"
  | "DESLIZAMENTO_NEURAL_MEDIANO";

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
  {
    value: "MOBILIDADE_LOMBAR_GATO_CAMELO",
    label: "Gato-camelo lombar",
    hint: "Mobilidade suave da coluna em quatro apoios",
  },
  {
    value: "PONTE_CURTA",
    label: "Ponte curta",
    hint: "Ativacao de gluteos em decubito dorsal",
  },
  {
    value: "CONTROLE_CERVICAL_PROFUNDO",
    label: "Controle cervical profundo",
    hint: "Recolher o queixo com baixa amplitude",
  },
  {
    value: "ELEVACAO_ASSISTIDA_OMBRO",
    label: "Elevacao assistida de ombro",
    hint: "Elevacao com apoio e amplitude toleravel",
  },
  {
    value: "AGACHAMENTO_PARCIAL_ASSISTIDO",
    label: "Agachamento parcial assistido",
    hint: "Controle de joelho e quadril com apoio",
  },
  {
    value: "ABDUCAO_QUADRIL_DECUBITO_LATERAL",
    label: "Abducao de quadril lateral",
    hint: "Elevacao lateral da perna com pelve estavel",
  },
  {
    value: "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO",
    label: "Transferencia de peso bipodal",
    hint: "Controle de apoio entre os pes",
  },
  {
    value: "PREENSAO_MANUAL_BOLA_MACIA",
    label: "Preensao com bola macia",
    hint: "Apertar e relaxar sem irritar sintomas",
  },
  {
    value: "MOBILIDADE_TORACICA_ROTACAO_SENTADA",
    label: "Rotacao toracica sentada",
    hint: "Giro controlado do tronco em sedestacao",
  },
  {
    value: "RETRACAO_ESCAPULAR_SENTADA",
    label: "Retracao escapular sentada",
    hint: "Escapulas para tras e para baixo",
  },
  {
    value: "ISOMETRIA_ROTACAO_EXTERNA_OMBRO",
    label: "Isometria de rotacao externa",
    hint: "Pressao leve do dorso da mao contra apoio",
  },
  {
    value: "EXTENSAO_JOELHO_SENTADO",
    label: "Extensao de joelho sentado",
    hint: "Estender o joelho com controle",
  },
  {
    value: "SENTAR_LEVANTAR_CONTROLADO",
    label: "Sentar e levantar",
    hint: "Transferencia funcional com descida lenta",
  },
  {
    value: "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO",
    label: "Alongamento flexores de quadril",
    hint: "Meio ajoelhado com controle pelvico",
  },
  {
    value: "MARCHA_ESTACIONARIA_APOIO",
    label: "Marcha estacionaria com apoio",
    hint: "Elevar os pes alternadamente com apoio seguro",
  },
  {
    value: "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO",
    label: "Mobilidade de punho",
    hint: "Flexao e extensao ativas em amplitude toleravel",
  },
  {
    value: "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO",
    label: "Alongamento cervical lateral",
    hint: "Inclinacao lateral suave sem tracao forte",
  },
  {
    value: "DESLIZAMENTO_NEURAL_MEDIANO",
    label: "Deslizamento neural mediano",
    hint: "Movimento neural leve sem sintomas persistentes",
  },
];

const DEFAULT_TYPE: ExerciseImageType = "MOBILIDADE_GERAL";

const EXERCISE_IMAGE_ASSETS: Partial<
  Record<ExerciseImageType, ImageSourcePropType>
> = {
  MOBILIDADE_LOMBAR_GATO_CAMELO: require("../../../assets/exercises/mobilidade-lombar-gato-camelo.jpg"),
  PONTE_CURTA: require("../../../assets/exercises/ponte-curta.jpg"),
  CONTROLE_CERVICAL_PROFUNDO: require("../../../assets/exercises/controle-cervical-profundo.jpg"),
  ELEVACAO_ASSISTIDA_OMBRO: require("../../../assets/exercises/elevacao-assistida-ombro.jpg"),
  AGACHAMENTO_PARCIAL_ASSISTIDO: require("../../../assets/exercises/agachamento-parcial-assistido.jpg"),
  ABDUCAO_QUADRIL_DECUBITO_LATERAL: require("../../../assets/exercises/abducao-quadril-decubito-lateral.jpg"),
  EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO: require("../../../assets/exercises/equilibrio-bipodal-transferencia-peso.jpg"),
  PREENSAO_MANUAL_BOLA_MACIA: require("../../../assets/exercises/preensao-manual-bola-macia.jpg"),
  MOBILIDADE_TORACICA_ROTACAO_SENTADA: require("../../../assets/exercises/mobilidade-toracica-rotacao-sentada.jpg"),
  RETRACAO_ESCAPULAR_SENTADA: require("../../../assets/exercises/retracao-escapular-sentada.jpg"),
  ISOMETRIA_ROTACAO_EXTERNA_OMBRO: require("../../../assets/exercises/isometria-rotacao-externa-ombro.jpg"),
  EXTENSAO_JOELHO_SENTADO: require("../../../assets/exercises/extensao-joelho-sentado.jpg"),
  SENTAR_LEVANTAR_CONTROLADO: require("../../../assets/exercises/sentar-levantar-controlado.jpg"),
  ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO: require("../../../assets/exercises/alongamento-flexores-quadril-meio-ajoelhado.jpg"),
  MARCHA_ESTACIONARIA_APOIO: require("../../../assets/exercises/marcha-estacionaria-apoio.jpg"),
  MOBILIDADE_PUNHO_FLEXAO_EXTENSAO: require("../../../assets/exercises/mobilidade-punho-flexao-extensao.jpg"),
  ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO: require("../../../assets/exercises/alongamento-cervical-lateral-assistido.jpg"),
  DESLIZAMENTO_NEURAL_MEDIANO: require("../../../assets/exercises/deslizamento-neural-mediano.jpg"),
};

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

  if (hasAny(["gato", "camelo"])) return "MOBILIDADE_LOMBAR_GATO_CAMELO";
  if (hasAny(["ponte curta", "ponte"])) return "PONTE_CURTA";
  if (hasAny(["cervical profundo", "recolher o queixo", "queixo"])) {
    return "CONTROLE_CERVICAL_PROFUNDO";
  }
  if (hasAny(["alongamento cervical lateral", "cervical lateral"])) {
    return "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO";
  }
  if (hasAny(["elevacao assistida", "elevacao de ombro"])) {
    return "ELEVACAO_ASSISTIDA_OMBRO";
  }
  if (hasAny(["retracao escapular", "escapular sentada"])) {
    return "RETRACAO_ESCAPULAR_SENTADA";
  }
  if (hasAny(["rotacao externa", "isometria de rotacao"])) {
    return "ISOMETRIA_ROTACAO_EXTERNA_OMBRO";
  }
  if (hasAny(["agachamento parcial"])) {
    return "AGACHAMENTO_PARCIAL_ASSISTIDO";
  }
  if (hasAny(["extensao de joelho", "joelho sentado"])) {
    return "EXTENSAO_JOELHO_SENTADO";
  }
  if (hasAny(["sentar e levantar", "levantar controlado"])) {
    return "SENTAR_LEVANTAR_CONTROLADO";
  }
  if (hasAny(["abducao de quadril", "decubito lateral"])) {
    return "ABDUCAO_QUADRIL_DECUBITO_LATERAL";
  }
  if (hasAny(["flexores de quadril", "meio ajoelhado"])) {
    return "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO";
  }
  if (hasAny(["transferencia de peso", "equilibrio bipodal"])) {
    return "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO";
  }
  if (hasAny(["marcha estacionaria"])) return "MARCHA_ESTACIONARIA_APOIO";
  if (hasAny(["preensao", "bola macia"])) return "PREENSAO_MANUAL_BOLA_MACIA";
  if (hasAny(["flexao e extensao", "mobilidade de punho"])) {
    return "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO";
  }
  if (hasAny(["deslizamento neural", "neural mediano"])) {
    return "DESLIZAMENTO_NEURAL_MEDIANO";
  }
  if (hasAny(["toracica", "rotacao sentada"])) {
    return "MOBILIDADE_TORACICA_ROTACAO_SENTADA";
  }
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

  if (type === "MOBILIDADE_LOMBAR_GATO_CAMELO") {
    return (
      <>
        <Circle
          cx="44"
          cy="70"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Path
          d="M54 76 C76 58 104 58 124 76"
          stroke={stroke}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <Line
          x1="64"
          y1="84"
          x2="54"
          y2="126"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="108"
          y1="84"
          x2="118"
          y2="126"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="126"
          x2="42"
          y2="138"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="118"
          y1="126"
          x2="134"
          y2="138"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M70 48 C84 34 104 34 118 48"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M70 100 C84 114 104 114 118 100"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "PONTE_CURTA") {
    return (
      <>
        <Circle
          cx="40"
          cy="100"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="50"
          y1="100"
          x2="84"
          y2="78"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="84"
          y1="78"
          x2="118"
          y2="102"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="118"
          y1="102"
          x2="142"
          y2="102"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="62"
          y1="112"
          x2="118"
          y2="112"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M74 92 C82 72 92 62 106 58"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "CONTROLE_CERVICAL_PROFUNDO") {
    return (
      <>
        <Circle
          cx="86"
          cy="35"
          r="11"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="86"
          y1="48"
          x2="86"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="62"
          x2="112"
          y2="62"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="86"
          y1="96"
          x2="64"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="86"
          y1="96"
          x2="108"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M108 36 H86"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M92 30 L84 36 L92 42"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ELEVACAO_ASSISTIDA_OMBRO") {
    return (
      <>
        <Circle
          cx="82"
          cy="31"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="82"
          y1="44"
          x2="82"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="58"
          x2="50"
          y2="78"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="58"
          x2="110"
          y2="24"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="82"
          x2="112"
          y2="22"
          stroke={muted}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="96"
          x2="58"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="96"
          x2="106"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "AGACHAMENTO_PARCIAL_ASSISTIDO") {
    return (
      <>
        <Pose type="JOELHO_AGACHAMENTO" />
        <Line
          x1="145"
          y1="44"
          x2="145"
          y2="142"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="122"
          y1="70"
          x2="145"
          y2="70"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "ABDUCAO_QUADRIL_DECUBITO_LATERAL") {
    return (
      <>
        <Circle
          cx="38"
          cy="106"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="48"
          y1="106"
          x2="94"
          y2="106"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="94"
          y1="106"
          x2="138"
          y2="126"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="94"
          y1="104"
          x2="134"
          y2="72"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M102 98 C112 82 124 72 142 66"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

  if (type === "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO") {
    return (
      <>
        <Pose type="TORNOZELO_EQUILIBRIO" />
        <Path
          d="M48 122 H122"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M58 114 L46 122 L58 130"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M112 114 L124 122 L112 130"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "PREENSAO_MANUAL_BOLA_MACIA") {
    return (
      <>
        <Pose type="PUNHO_PREENSAO" />
        <Path
          d="M124 88 C132 80 144 82 148 94"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M124 88 C132 98 144 100 148 94"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MOBILIDADE_TORACICA_ROTACAO_SENTADA") {
    return (
      <>
        <Circle
          cx="82"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="82"
          y1="44"
          x2="82"
          y2="98"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="62"
          x2="110"
          y2="62"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="98"
          x2="58"
          y2="132"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="98"
          x2="110"
          y2="132"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="44" y="132" width="82" height="8" rx="4" fill={muted} />
        <Path
          d="M52 78 C72 52 112 52 132 78"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M124 66 L134 78 L120 84"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "RETRACAO_ESCAPULAR_SENTADA") {
    return (
      <>
        <Pose type="OMBRO_MANGUITO" />
        <Path
          d="M62 62 H82"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M104 62 H84"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M72 54 L82 62 L72 70"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M94 54 L84 62 L94 70"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ISOMETRIA_ROTACAO_EXTERNA_OMBRO") {
    return (
      <>
        <Circle
          cx="66"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="66"
          y1="44"
          x2="66"
          y2="98"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="58"
          x2="98"
          y2="58"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="98"
          y1="58"
          x2="98"
          y2="82"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="116"
          y1="34"
          x2="116"
          y2="132"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M102 82 H116"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="98"
          x2="46"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="98"
          x2="86"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "EXTENSAO_JOELHO_SENTADO") {
    return (
      <>
        <Circle
          cx="70"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="70"
          y1="48"
          x2="70"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="44" y="96" width="58" height="10" rx="4" fill={muted} />
        <Line
          x1="68"
          y1="96"
          x2="96"
          y2="116"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="96"
          y1="116"
          x2="138"
          y2="116"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="106"
          x2="54"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M104 104 L140 116 L104 128"
          stroke={accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "SENTAR_LEVANTAR_CONTROLADO") {
    return (
      <>
        <Circle
          cx="86"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="86"
          y1="48"
          x2="72"
          y2="94"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="72"
          y1="94"
          x2="104"
          y2="116"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="104"
          y1="116"
          x2="126"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="36" y="96" width="48" height="10" rx="4" fill={muted} />
        <Line
          x1="42"
          y1="106"
          x2="42"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M116 72 C132 84 138 102 134 120"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO") {
    return (
      <>
        <Circle
          cx="72"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="72"
          y1="48"
          x2="76"
          y2="88"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="76"
          y1="88"
          x2="48"
          y2="124"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="48"
          y1="124"
          x2="34"
          y2="140"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="76"
          y1="88"
          x2="114"
          y2="108"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="114"
          y1="108"
          x2="142"
          y2="108"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M86 82 C98 70 110 68 124 72"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MARCHA_ESTACIONARIA_APOIO") {
    return (
      <>
        <Circle
          cx="74"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="74"
          y1="44"
          x2="74"
          y2="92"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="58"
          x2="110"
          y2="58"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="122"
          y1="40"
          x2="122"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="92"
          x2="68"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="92"
          x2="104"
          y2="104"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="104"
          y1="104"
          x2="102"
          y2="130"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M96 94 C104 82 112 80 120 88"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO") {
    return (
      <>
        <Line
          x1="34"
          y1="96"
          x2="100"
          y2="96"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Line
          x1="100"
          y1="96"
          x2="136"
          y2="78"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="100"
          y1="96"
          x2="136"
          y2="114"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
        />
        <Rect x="28" y="104" width="76" height="8" rx="4" fill={muted} />
        <Path
          d="M128 64 C144 80 144 112 128 128"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M126 64 L138 66 L136 78"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M126 128 L138 126 L136 114"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO") {
    return (
      <>
        <Circle
          cx="92"
          cy="35"
          r="11"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="84"
          y1="48"
          x2="78"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="56"
          y1="64"
          x2="104"
          y2="64"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="78"
          y1="96"
          x2="58"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="78"
          y1="96"
          x2="100"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M106 30 C112 44 108 58 96 66"
          stroke={accent}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M86 22 C70 30 64 44 70 60"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

  if (type === "DESLIZAMENTO_NEURAL_MEDIANO") {
    return (
      <>
        <Circle
          cx="58"
          cy="38"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="58"
          y1="52"
          x2="58"
          y2="104"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="66"
          x2="112"
          y2="56"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="112"
          y1="56"
          x2="142"
          y2="48"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="104"
          x2="40"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="104"
          x2="80"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M112 42 C126 32 140 34 150 46"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

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
  const asset = EXERCISE_IMAGE_ASSETS[resolvedType];

  if (asset) {
    return (
      <View
        style={[
          styles.frame,
          styles.generatedFrame,
          styles.rasterFrame,
          compact && styles.frameCompact,
        ]}
      >
        <Image source={asset} style={styles.exerciseImage} resizeMode="contain" />
        <Text style={[styles.watermark, compact && styles.watermarkCompact]}>
          Synap
        </Text>
        {!compact ? (
          <View style={styles.caption}>
            <Text style={styles.captionTitle}>{option.label}</Text>
            <Text style={styles.captionHint}>{option.hint}</Text>
          </View>
        ) : null}
      </View>
    );
  }

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
  rasterFrame: {
    height: 220,
    backgroundColor: "#F7FBFA",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  watermark: {
    position: "absolute",
    right: SPACING.sm,
    bottom: 66,
    color: COLORS.gray400,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.5,
  },
  watermarkCompact: {
    right: 6,
    bottom: 4,
    fontSize: 9,
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
