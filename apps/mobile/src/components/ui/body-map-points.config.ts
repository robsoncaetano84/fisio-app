export type BodySex = "masculino" | "feminino";
export type BodyView = "anterior" | "posterior";
export type BodySide = "direito" | "esquerdo" | "central";

export interface BodyMapPoint {
  id: string;
  label: string;
  sex: BodySex;
  view: BodyView;
  side?: BodySide;
  xPercent: number;
  yPercent: number;
  visibleRadius?: number;
  hitSize?: number;
  group?: string;
  order?: number;
  regionKey?: string;
}

export interface SelectedBodyRegion {
  id: string;
  label: string;
  sex: BodySex;
  view: BodyView;
  side?: BodySide;
}

type BaseBodyMapPoint = Omit<BodyMapPoint, "sex" | "view">;

export type BodyMapPointOverride = Partial<
  Pick<BodyMapPoint, "xPercent" | "yPercent" | "visibleRadius" | "hitSize">
>;

export type BodyMapPointOverrides = Partial<
  Record<BodySex, Partial<Record<BodyView, Record<string, BodyMapPointOverride>>>>
>;

export const BODY_MAP_PANEL_ASPECT_RATIO = 512 / 1064;

const DEFAULT_VISIBLE_RADIUS = 8;
const DEFAULT_HIT_SIZE = 44;
const CURRENT_MATRIX_GLOBAL_Y_SHIFT = -1.2;
const CURRENT_MATRIX_SHOULDER_EXTRA_Y_SHIFT = -2.2;

const verticalShiftForCurrentMatrix = (point: BaseBodyMapPoint) =>
  CURRENT_MATRIX_GLOBAL_Y_SHIFT +
  (point.id.startsWith("ombro-") ? CURRENT_MATRIX_SHOULDER_EXTRA_Y_SHIFT : 0);

const withDefaults = (point: BaseBodyMapPoint, order: number): BaseBodyMapPoint => ({
  visibleRadius: DEFAULT_VISIBLE_RADIUS,
  hitSize: DEFAULT_HIT_SIZE,
  order,
  regionKey: point.id,
  ...point,
  yPercent: point.yPercent + verticalShiftForCurrentMatrix(point),
});

const buildBasePoints = (points: BaseBodyMapPoint[]) => points.map(withDefaults);

const anteriorBasePoints = buildBasePoints([
  { id: "cabeca", label: "Cabeça", side: "central", xPercent: 45.5, yPercent: 9.7, group: "cabeca", regionKey: "cabeca" },
  { id: "pescoco", label: "Pescoço", side: "central", xPercent: 45.5, yPercent: 18.5, group: "cervical", regionKey: "pescoco" },
  { id: "ombro-direito", label: "Ombro direito", side: "direito", xPercent: 24, yPercent: 24, group: "membro-superior", regionKey: "ombro" },
  { id: "ombro-esquerdo", label: "Ombro esquerdo", side: "esquerdo", xPercent: 66, yPercent: 24, group: "membro-superior", regionKey: "ombro" },
  { id: "braco-direito", label: "Braço direito", side: "direito", xPercent: 21, yPercent: 30.7, group: "membro-superior", regionKey: "braco" },
  { id: "braco-esquerdo", label: "Braço esquerdo", side: "esquerdo", xPercent: 68, yPercent: 30.7, group: "membro-superior", regionKey: "braco" },
  { id: "cotovelo-direito", label: "Cotovelo direito", side: "direito", xPercent: 18.4, yPercent: 37.9, group: "membro-superior", regionKey: "cotovelo" },
  { id: "cotovelo-esquerdo", label: "Cotovelo esquerdo", side: "esquerdo", xPercent: 69.7, yPercent: 37.9, group: "membro-superior", regionKey: "cotovelo" },
  { id: "antebraco-direito", label: "Antebraço direito", side: "direito", xPercent: 15.7, yPercent: 44.2, group: "membro-superior", regionKey: "antebraco" },
  { id: "antebraco-esquerdo", label: "Antebraço esquerdo", side: "esquerdo", xPercent: 71.3, yPercent: 44.2, group: "membro-superior", regionKey: "antebraco" },
  { id: "punho-mao-direito", label: "Punho/Mão direito", side: "direito", xPercent: 10.8, yPercent: 54, group: "membro-superior", regionKey: "punho_mao" },
  { id: "punho-mao-esquerdo", label: "Punho/Mão esquerdo", side: "esquerdo", xPercent: 75, yPercent: 54, group: "membro-superior", regionKey: "punho_mao" },
  { id: "torax", label: "Tórax", side: "central", xPercent: 45.5, yPercent: 25.4, group: "tronco", regionKey: "torax" },
  { id: "abdomen", label: "Abdômen", side: "central", xPercent: 45.5, yPercent: 37.9, group: "tronco", regionKey: "abdomen" },
  { id: "coxofemoral-direito", label: "Coxofemoral direito", side: "direito", xPercent: 34.1, yPercent: 50.2, group: "quadril", regionKey: "coxofemoral" },
  { id: "coxofemoral-esquerdo", label: "Coxofemoral esquerdo", side: "esquerdo", xPercent: 53.8, yPercent: 50.5, group: "quadril", regionKey: "coxofemoral" },
  { id: "coxa-direita", label: "Coxa direita", side: "direito", xPercent: 35, yPercent: 60.7, group: "membro-inferior", regionKey: "coxa" },
  { id: "coxa-esquerda", label: "Coxa esquerda", side: "esquerdo", xPercent: 54, yPercent: 60.8, group: "membro-inferior", regionKey: "coxa" },
  { id: "joelho-direito", label: "Joelho direito", side: "direito", xPercent: 35, yPercent: 72.3, group: "membro-inferior", regionKey: "joelho" },
  { id: "joelho-esquerdo", label: "Joelho esquerdo", side: "esquerdo", xPercent: 54, yPercent: 72.3, group: "membro-inferior", regionKey: "joelho" },
  { id: "tibial-anterior-direito", label: "Tibial anterior direito", side: "direito", xPercent: 35, yPercent: 82.8, group: "membro-inferior", regionKey: "tibial_anterior" },
  { id: "tibial-anterior-esquerdo", label: "Tibial anterior esquerdo", side: "esquerdo", xPercent: 53, yPercent: 82.8, group: "membro-inferior", regionKey: "tibial_anterior" },
  { id: "tornozelo-pe-direito", label: "Tornozelo/Pé direito", side: "direito", xPercent: 35.6, yPercent: 95.5, group: "membro-inferior", regionKey: "tornozelo_pe" },
  { id: "tornozelo-pe-esquerdo", label: "Tornozelo/Pé esquerdo", side: "esquerdo", xPercent: 54, yPercent: 95.5, group: "membro-inferior", regionKey: "tornozelo_pe" },
]);

const posteriorBasePoints = buildBasePoints([
  { id: "cabeca", label: "Cabeça", side: "central", xPercent: 56, yPercent: 10.5, group: "cabeca", regionKey: "cabeca" },
  { id: "cervical", label: "Cervical", side: "central", xPercent: 56, yPercent: 18.5, group: "coluna", regionKey: "coluna_cervical" },
  { id: "ombro-direito", label: "Ombro direito", side: "direito", xPercent: 76, yPercent: 24, group: "membro-superior", regionKey: "ombro" },
  { id: "ombro-esquerdo", label: "Ombro esquerdo", side: "esquerdo", xPercent: 34, yPercent: 24, group: "membro-superior", regionKey: "ombro" },
  { id: "braco-direito", label: "Braço direito", side: "direito", xPercent: 83, yPercent: 30.7, group: "membro-superior", regionKey: "braco" },
  { id: "braco-esquerdo", label: "Braço esquerdo", side: "esquerdo", xPercent: 31, yPercent: 30.7, group: "membro-superior", regionKey: "braco" },
  { id: "cotovelo-direito", label: "Cotovelo direito", side: "direito", xPercent: 88, yPercent: 37.9, group: "membro-superior", regionKey: "cotovelo" },
  { id: "cotovelo-esquerdo", label: "Cotovelo esquerdo", side: "esquerdo", xPercent: 26, yPercent: 37.9, group: "membro-superior", regionKey: "cotovelo" },
  { id: "antebraco-direito", label: "Antebraço direito", side: "direito", xPercent: 89, yPercent: 44.2, group: "membro-superior", regionKey: "antebraco" },
  { id: "antebraco-esquerdo", label: "Antebraço esquerdo", side: "esquerdo", xPercent: 25.5, yPercent: 44.2, group: "membro-superior", regionKey: "antebraco" },
  { id: "punho-mao-direito", label: "Punho/Mão direito", side: "direito", xPercent: 89, yPercent: 54, group: "membro-superior", regionKey: "punho_mao" },
  { id: "punho-mao-esquerdo", label: "Punho/Mão esquerdo", side: "esquerdo", xPercent: 25, yPercent: 54, group: "membro-superior", regionKey: "punho_mao" },
  { id: "toracica", label: "Torácica", side: "central", xPercent: 55, yPercent: 35, group: "coluna", regionKey: "coluna_toracica" },
  { id: "lombar", label: "Lombar", side: "central", xPercent: 55, yPercent: 45, group: "coluna", regionKey: "coluna_lombar" },
  { id: "sacro", label: "Sacro", side: "central", xPercent: 55, yPercent: 45.9, group: "coluna", regionKey: "sacro" },
  { id: "gluteo-direito", label: "Glúteo direito", side: "direito", xPercent: 65, yPercent: 53, group: "quadril", regionKey: "gluteo" },
  { id: "gluteo-esquerdo", label: "Glúteo esquerdo", side: "esquerdo", xPercent: 47, yPercent: 53, group: "quadril", regionKey: "gluteo" },
  { id: "posterior-coxa-direito", label: "Posterior de coxa direito", side: "direito", xPercent: 66, yPercent: 64, group: "membro-inferior", regionKey: "posterior_coxa" },
  { id: "posterior-coxa-esquerdo", label: "Posterior de coxa esquerdo", side: "esquerdo", xPercent: 47, yPercent: 64, group: "membro-inferior", regionKey: "posterior_coxa" },
  { id: "popliteo-direito", label: "Poplíteo direito", side: "direito", xPercent: 65, yPercent: 76.5, group: "membro-inferior", regionKey: "popliteo" },
  { id: "popliteo-esquerdo", label: "Poplíteo esquerdo", side: "esquerdo", xPercent: 45, yPercent: 76.5, group: "membro-inferior", regionKey: "popliteo" },
  { id: "panturrilha-direita", label: "Panturrilha direita", side: "direito", xPercent: 65, yPercent: 87, group: "membro-inferior", regionKey: "panturrilha" },
  { id: "panturrilha-esquerda", label: "Panturrilha esquerda", side: "esquerdo", xPercent: 45, yPercent: 87, group: "membro-inferior", regionKey: "panturrilha" },
  { id: "tornozelo-pe-direito", label: "Tornozelo direito", side: "direito", xPercent: 65, yPercent: 96, group: "membro-inferior", regionKey: "tornozelo_pe" },
  { id: "tornozelo-pe-esquerdo", label: "Tornozelo esquerdo", side: "esquerdo", xPercent: 45, yPercent: 96, group: "membro-inferior", regionKey: "tornozelo_pe" },
]);

export const BODY_MAP_BASE_POINTS: Record<BodyView, BaseBodyMapPoint[]> = {
  anterior: anteriorBasePoints,
  posterior: posteriorBasePoints,
};

export const BODY_MAP_SEX_OVERRIDES: BodyMapPointOverrides = {
  masculino: {
    posterior: {
      cabeca: { xPercent: 57, yPercent: 8.3 },
      cervical: { xPercent: 57, yPercent: 16.3 },
      "ombro-direito": { xPercent: 80 },
      "braco-direito": { xPercent: 81 },
      "braco-esquerdo": { xPercent: 33.4 },
      "cotovelo-direito": { xPercent: 83.3 },
      "cotovelo-esquerdo": { xPercent: 32.8 },
      "antebraco-direito": { xPercent: 85.5 },
      "antebraco-esquerdo": { xPercent: 29.4 },
      "punho-mao-direito": { yPercent: 51.9 },
      "punho-mao-esquerdo": { yPercent: 51.9 },
      toracica: { xPercent: 57.2, yPercent: 25.3 },
      lombar: { xPercent: 57.4, yPercent: 36.2 },
      sacro: { xPercent: 57.4 },
      "gluteo-direito": { xPercent: 66, yPercent: 50.4 },
      "gluteo-esquerdo": { xPercent: 49, yPercent: 50.2 },
      "posterior-coxa-direito": { xPercent: 67.6, yPercent: 61.9 },
      "posterior-coxa-esquerdo": { xPercent: 46.2, yPercent: 61.9 },
      "popliteo-direito": { xPercent: 66.6, yPercent: 71.5 },
      "popliteo-esquerdo": { xPercent: 46, yPercent: 71.6 },
      "panturrilha-direita": { yPercent: 83 },
      "panturrilha-esquerda": { xPercent: 47, yPercent: 83 },
      "tornozelo-pe-direito": { xPercent: 63.4 },
      "tornozelo-pe-esquerdo": { xPercent: 48 },
    },
  },
  feminino: {
    anterior: {
      cabeca: { xPercent: 43.9, yPercent: 9.3 },
      pescoco: { xPercent: 44.3, yPercent: 18.9 },
      "ombro-direito": { xPercent: 26, yPercent: 21.6 },
      "ombro-esquerdo": { xPercent: 63, yPercent: 21.6 },
      "braco-direito": { xPercent: 23.4, yPercent: 29.7 },
      "braco-esquerdo": { xPercent: 65, yPercent: 29.9 },
      "cotovelo-direito": { xPercent: 20.4, yPercent: 36.9 },
      "cotovelo-esquerdo": { xPercent: 67.7, yPercent: 36.9 },
      "antebraco-direito": { xPercent: 17.1 },
      "antebraco-esquerdo": { xPercent: 70.9 },
      "punho-mao-esquerdo": { xPercent: 75.8 },
      torax: { xPercent: 43.9, yPercent: 25.8 },
      abdomen: { xPercent: 44.3 },
      "coxofemoral-direito": { xPercent: 33.7, yPercent: 49.1 },
      "coxa-direita": { xPercent: 34.6 },
      "joelho-direito": { xPercent: 35.2 },
      "joelho-esquerdo": { xPercent: 52.6 },
      "tibial-anterior-direito": { xPercent: 35.8 },
      "tibial-anterior-esquerdo": { xPercent: 52.4 },
      "tornozelo-pe-direito": { xPercent: 36.8 },
      "tornozelo-pe-esquerdo": { xPercent: 50.6 },
    },
    posterior: {
      cabeca: { xPercent: 55.4 },
      cervical: { xPercent: 55.4 },
      "ombro-direito": { xPercent: 74.4, yPercent: 21.6 },
      "ombro-esquerdo": { xPercent: 35.6, yPercent: 21.6 },
      "braco-direito": { xPercent: 76.1 },
      "braco-esquerdo": { xPercent: 34 },
      "cotovelo-direito": { xPercent: 78.1 },
      "cotovelo-esquerdo": { xPercent: 31.9 },
      "antebraco-direito": { xPercent: 81.3 },
      "antebraco-esquerdo": { xPercent: 28.8 },
      "punho-mao-direito": { xPercent: 86.8 },
      "punho-mao-esquerdo": { xPercent: 24 },
      toracica: { yPercent: 24.4 },
      lombar: { yPercent: 36.2 },
      "gluteo-direito": { xPercent: 64.2, yPercent: 50.6 },
      "gluteo-esquerdo": { xPercent: 46.4, yPercent: 50.4 },
      "posterior-coxa-direito": { xPercent: 64.8 },
      "posterior-coxa-esquerdo": { xPercent: 45.8 },
      "popliteo-direito": { xPercent: 64.4, yPercent: 71.9 },
      "popliteo-esquerdo": { yPercent: 71.9 },
      "panturrilha-direita": { xPercent: 63, yPercent: 82 },
      "panturrilha-esquerda": { xPercent: 46, yPercent: 82 },
      "tornozelo-pe-direito": { xPercent: 60.1, yPercent: 94.3 },
      "tornozelo-pe-esquerdo": { xPercent: 48.4, yPercent: 94.3 },
    },
  },
};

export const getBodyMapPoints = (
  sex: BodySex,
  view: BodyView,
  runtimeOverrides?: BodyMapPointOverrides,
): BodyMapPoint[] => {
  const staticOverrides = BODY_MAP_SEX_OVERRIDES[sex]?.[view] || {};
  const liveOverrides = runtimeOverrides?.[sex]?.[view] || {};

  return BODY_MAP_BASE_POINTS[view].map((point) => {
    const merged = {
      ...point,
      ...(staticOverrides[point.id] || {}),
      ...(liveOverrides[point.id] || {}),
    };
    return {
      ...merged,
      sex,
      view,
    };
  });
};

export const bodyMapPointKey = (point: Pick<BodyMapPoint, "sex" | "view" | "id">) =>
  `${point.sex}:${point.view}:${point.id}`;

export const selectedRegionKey = (
  region: Pick<SelectedBodyRegion, "sex" | "view" | "id">,
) => `${region.sex}:${region.view}:${region.id}`;
