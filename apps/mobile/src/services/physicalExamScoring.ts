export type ExamRegion =
  | "CERVICAL"
  | "TORACICA"
  | "LOMBAR"
  | "SACROILIACA"
  | "QUADRIL"
  | "JOELHO"
  | "TORNOZELO_PE"
  | "OMBRO"
  | "COTOVELO"
  | "PUNHO_MAO";

export type TestScoreRule = {
  token: string;
  score: number;
};

export type ClinicalScoringProfile =
  | "GERAL"
  | "COLUNA"
  | "MEMBRO_INFERIOR"
  | "MEMBRO_SUPERIOR"
  | "ESPORTIVO";

export const TEST_SCORE_RULES: TestScoreRule[] = [
  { token: "Lachman", score: 5 },
  { token: "Pivot", score: 5 },
  { token: "Sharp", score: 4 },
  { token: "Dekleyn", score: 4 },
  { token: "Las", score: 4 },
  { token: "Slump", score: 4 },
  { token: "Spurling", score: 4 },
  { token: "Jackson", score: 4 },
  { token: "Roos", score: 4 },
  { token: "Adson", score: 4 },
  { token: "Kemp", score: 4 },
  { token: "FADIR", score: 4 },
  { token: "Trendelenburg", score: 4 },
  { token: "McMurray", score: 4 },
  { token: "Apley", score: 4 },
  { token: "Thompson", score: 4 },
  { token: "Kleiger", score: 4 },
  { token: "Windlass", score: 3 },
  { token: "Navicular", score: 3 },
  { token: "Neer", score: 3 },
  { token: "Hawkins", score: 3 },
  { token: "Jobe", score: 3 },
  { token: "Drop arm", score: 3 },
  { token: "Speed", score: 3 },
  { token: "Yergason", score: 3 },
  { token: "Relocation", score: 3 },
  { token: "Lift-off", score: 3 },
  { token: "Belly press", score: 3 },
  { token: "Cozen", score: 3 },
  { token: "Mill", score: 3 },
  { token: "Golfer", score: 3 },
  { token: "Finkelstein", score: 3 },
  { token: "Watson", score: 3 },
  { token: "FABER", score: 3 },
  { token: "Gaenslen", score: 3 },
  { token: "Thigh thrust", score: 3 },
  { token: "Sacral thrust", score: 3 },
  { token: "Gillet", score: 3 },
  { token: "Phalen", score: 3 },
  { token: "Tinel", score: 3 },
];

export const CONFIDENCE_RULES = {
  highScore: 12,
  moderateScore: 6,
  highPositiveCount: 4,
  moderatePositiveCount: 2,
};

const PROFILE_REGION_WEIGHTS: Record<
  ClinicalScoringProfile,
  Record<ExamRegion, number>
> = {
  GERAL: {
    CERVICAL: 1,
    TORACICA: 1,
    LOMBAR: 1,
    SACROILIACA: 1,
    QUADRIL: 1,
    JOELHO: 1,
    TORNOZELO_PE: 1,
    OMBRO: 1,
    COTOVELO: 1,
    PUNHO_MAO: 1,
  },
  COLUNA: {
    CERVICAL: 1.3,
    TORACICA: 1.25,
    LOMBAR: 1.35,
    SACROILIACA: 1.2,
    QUADRIL: 0.9,
    JOELHO: 0.85,
    TORNOZELO_PE: 0.8,
    OMBRO: 0.85,
    COTOVELO: 0.8,
    PUNHO_MAO: 0.75,
  },
  MEMBRO_INFERIOR: {
    CERVICAL: 0.8,
    TORACICA: 0.9,
    LOMBAR: 1.05,
    SACROILIACA: 1.1,
    QUADRIL: 1.3,
    JOELHO: 1.35,
    TORNOZELO_PE: 1.25,
    OMBRO: 0.75,
    COTOVELO: 0.7,
    PUNHO_MAO: 0.65,
  },
  MEMBRO_SUPERIOR: {
    CERVICAL: 1.05,
    TORACICA: 1,
    LOMBAR: 0.85,
    SACROILIACA: 0.8,
    QUADRIL: 0.75,
    JOELHO: 0.7,
    TORNOZELO_PE: 0.65,
    OMBRO: 1.35,
    COTOVELO: 1.3,
    PUNHO_MAO: 1.25,
  },
  ESPORTIVO: {
    CERVICAL: 1,
    TORACICA: 1,
    LOMBAR: 1.1,
    SACROILIACA: 1.05,
    QUADRIL: 1.2,
    JOELHO: 1.25,
    TORNOZELO_PE: 1.2,
    OMBRO: 1.15,
    COTOVELO: 1.05,
    PUNHO_MAO: 1,
  },
};

const normalize = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const getWeightedPositiveScore = (testName: string): number => {
  const normalizedTest = normalize(testName);
  const hit = TEST_SCORE_RULES.find((item) =>
    normalizedTest.includes(normalize(item.token)),
  );
  return hit?.score ?? 2;
};

export const getProfileRegionWeight = (
  profile: ClinicalScoringProfile,
  region: ExamRegion,
): number => {
  return PROFILE_REGION_WEIGHTS[profile]?.[region] ?? 1;
};
