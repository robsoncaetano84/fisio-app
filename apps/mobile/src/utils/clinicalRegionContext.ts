import type { Anamnese } from "../types";
import type { RegionalTestGroup } from "../services/physicalExamModel";

export type ClinicalRegion = RegionalTestGroup["regiao"];

export const CLINICAL_REGION_LABELS: Record<ClinicalRegion, string> = {
  CERVICAL: "Cervical",
  TORACICA: "Toracica",
  LOMBAR: "Lombar",
  SACROILIACA: "Sacroiliaca",
  QUADRIL: "Quadril",
  JOELHO: "Joelho",
  TORNOZELO_PE: "Tornozelo/Pe",
  OMBRO: "Ombro",
  COTOVELO: "Cotovelo",
  PUNHO_MAO: "Punho/Mao",
};

const REGION_KEYWORDS: Array<{ keyword: string; region: ClinicalRegion }> = [
  { keyword: "cabeca", region: "CERVICAL" },
  { keyword: "pescoco", region: "CERVICAL" },
  { keyword: "cerv", region: "CERVICAL" },
  { keyword: "torac", region: "TORACICA" },
  { keyword: "torax", region: "TORACICA" },
  { keyword: "lomb", region: "LOMBAR" },
  { keyword: "sacro", region: "SACROILIACA" },
  { keyword: "iliac", region: "SACROILIACA" },
  { keyword: "pelve", region: "SACROILIACA" },
  { keyword: "quadril", region: "QUADRIL" },
  { keyword: "coxa", region: "QUADRIL" },
  { keyword: "joelho", region: "JOELHO" },
  { keyword: "tornoz", region: "TORNOZELO_PE" },
  { keyword: "pe", region: "TORNOZELO_PE" },
  { keyword: "ombro", region: "OMBRO" },
  { keyword: "braco", region: "OMBRO" },
  { keyword: "cotovelo", region: "COTOVELO" },
  { keyword: "punho", region: "PUNHO_MAO" },
  { keyword: "mao", region: "PUNHO_MAO" },
];

const AREA_REGION_MAP: Record<string, ClinicalRegion> = {
  cabeca: "CERVICAL",
  pescoco: "CERVICAL",
  coluna_cervical: "CERVICAL",
  torax: "TORACICA",
  coluna_toracica: "TORACICA",
  coluna_lombar: "LOMBAR",
  abdomen: "LOMBAR",
  quadril: "QUADRIL",
  coxa: "QUADRIL",
  joelho: "JOELHO",
  panturrilha: "TORNOZELO_PE",
  tornozelo_pe: "TORNOZELO_PE",
  ombro: "OMBRO",
  braco: "OMBRO",
  cotovelo: "COTOVELO",
  punho_mao: "PUNHO_MAO",
};

const CHAIN_REGION_MAP: Record<ClinicalRegion, ClinicalRegion[]> = {
  CERVICAL: ["CERVICAL", "TORACICA", "OMBRO"],
  TORACICA: ["TORACICA", "CERVICAL", "LOMBAR", "OMBRO"],
  LOMBAR: ["LOMBAR", "SACROILIACA", "QUADRIL", "JOELHO"],
  SACROILIACA: ["SACROILIACA", "LOMBAR", "QUADRIL", "JOELHO"],
  QUADRIL: ["QUADRIL", "SACROILIACA", "LOMBAR", "JOELHO", "TORNOZELO_PE"],
  JOELHO: ["JOELHO", "QUADRIL", "TORNOZELO_PE", "SACROILIACA", "LOMBAR"],
  TORNOZELO_PE: ["TORNOZELO_PE", "JOELHO", "QUADRIL", "SACROILIACA"],
  OMBRO: ["OMBRO", "CERVICAL", "TORACICA", "COTOVELO", "PUNHO_MAO"],
  COTOVELO: ["COTOVELO", "OMBRO", "PUNHO_MAO", "CERVICAL"],
  PUNHO_MAO: ["PUNHO_MAO", "COTOVELO", "OMBRO", "CERVICAL"],
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const inferRegionFromText = (value: string): ClinicalRegion[] => {
  const text = normalizeText(value);
  const regions = new Set<ClinicalRegion>();
  for (const item of REGION_KEYWORDS) {
    if (text.includes(item.keyword)) regions.add(item.region);
  }
  return [...regions];
};

export const inferClinicalRegionsFromAnamnese = (
  anamnese?: Anamnese,
): ClinicalRegion[] => {
  if (!anamnese) return [];
  const regions = new Set<ClinicalRegion>();

  for (const area of anamnese.areasAfetadas || []) {
    const raw = String(area.regiao || "").trim().toLowerCase();
    const mapped = AREA_REGION_MAP[raw];
    if (mapped) {
      regions.add(mapped);
      continue;
    }
    inferRegionFromText(raw).forEach((region) => regions.add(region));
  }

  inferRegionFromText(String(anamnese.descricaoSintomas || "")).forEach((region) =>
    regions.add(region),
  );

  return [...regions];
};

export const expandClinicalRegionChain = (regions: ClinicalRegion[]): ClinicalRegion[] => {
  const expanded = new Set<ClinicalRegion>();
  regions.forEach((region) => {
    (CHAIN_REGION_MAP[region] || [region]).forEach((item) => expanded.add(item));
  });
  return [...expanded];
};

export const resolveRelevantClinicalRegions = (anamnese?: Anamnese): ClinicalRegion[] => {
  const direct = inferClinicalRegionsFromAnamnese(anamnese);
  if (!direct.length) return [];
  return expandClinicalRegionChain(direct);
};

export const shouldShowChainField = (
  field: "quadril" | "pelve" | "colunaToracica" | "pe",
  regions: ClinicalRegion[],
) => {
  if (!regions.length) return true;
  const set = new Set(regions);
  switch (field) {
    case "quadril":
      return (
        set.has("QUADRIL") ||
        set.has("JOELHO") ||
        set.has("TORNOZELO_PE") ||
        set.has("LOMBAR") ||
        set.has("SACROILIACA")
      );
    case "pelve":
      return set.has("SACROILIACA") || set.has("LOMBAR") || set.has("QUADRIL");
    case "colunaToracica":
      return set.has("TORACICA") || set.has("CERVICAL") || set.has("OMBRO");
    case "pe":
      return set.has("TORNOZELO_PE") || set.has("JOELHO") || set.has("QUADRIL");
    default:
      return true;
  }
};

