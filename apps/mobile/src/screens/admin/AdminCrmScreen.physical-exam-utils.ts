import type {
  ClinicalExamRegionSummary,
  ClinicalExamTopTestSummary,
  CrmPhysicalExamTestsSummary,
} from "../../services/crm";
import type {
  ChartDataItem,
  ExamChartMode,
  ExamConfidenceFilter,
  PhysicalExamCoverage,
  PhysicalExamCoverageStatus,
} from "./AdminCrmScreen.models";

export const getSampleConfidence = (
  sample: number,
): "ALTA" | "MEDIA" | "BAIXA" => {
  if (sample >= 10) return "ALTA";
  if (sample >= 5) return "MEDIA";
  return "BAIXA";
};

export const filterPhysicalExamRows = <
  T extends { avaliados: number },
>(
  rows: T[] | undefined,
  mode: ExamChartMode,
  minSample: number,
  confidenceFilter: ExamConfidenceFilter,
) => {
  let filtered = [...(rows || [])];
  if (mode === "TAXA") {
    filtered = filtered.filter((item) => item.avaliados >= minSample);
    if (confidenceFilter !== "TODOS") {
      filtered = filtered.filter(
        (item) => getSampleConfidence(item.avaliados) === confidenceFilter,
      );
    }
  }
  return filtered;
};

export const buildPhysicalExamFilterStats = (
  summary: CrmPhysicalExamTestsSummary | null,
  regions: ClinicalExamRegionSummary[],
  tests: ClinicalExamTopTestSummary[],
) => {
  const totalRegions = summary?.porRegiao?.length || 0;
  const totalTests = summary?.topTestesPositivos?.length || 0;
  return {
    totalRegions,
    totalTests,
    consideredRegions: regions.length,
    consideredTests: tests.length,
    excludedRegions: Math.max(0, totalRegions - regions.length),
    excludedTests: Math.max(0, totalTests - tests.length),
  };
};

const PHYSICAL_EXAM_REGION_COLORS = [
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#84CC16",
];

const PHYSICAL_EXAM_TEST_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#0EA5E9",
  "#6366F1",
];

const PHYSICAL_EXAM_PROFILE_COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
];

const sortPhysicalExamRows = <
  T extends { positivos: number; taxaPositividade: number },
>(
  rows: T[],
  mode: ExamChartMode,
) =>
  [...rows].sort((a, b) =>
    mode === "TAXA"
      ? b.taxaPositividade - a.taxaPositividade
      : b.positivos - a.positivos,
  );

export const buildPhysicalExamRegionChartData = (
  regions: ClinicalExamRegionSummary[],
  mode: ExamChartMode,
  noDataLabel: string,
): ChartDataItem[] => {
  if (!regions.length) {
    return [{ label: noDataLabel, value: 0, color: "#CBD5E1" }];
  }
  return sortPhysicalExamRows(regions, mode)
    .slice(0, 8)
    .map((item, index) => ({
      label: item.regiao,
      value:
        mode === "TAXA" ? Math.round(item.taxaPositividade) : item.positivos,
      color:
        PHYSICAL_EXAM_REGION_COLORS[
          index % PHYSICAL_EXAM_REGION_COLORS.length
        ],
    }));
};

export const buildPhysicalExamTopTestsChartData = (
  tests: ClinicalExamTopTestSummary[],
  mode: ExamChartMode,
  noDataLabel: string,
): ChartDataItem[] => {
  if (!tests.length) {
    return [{ label: noDataLabel, value: 0, color: "#CBD5E1" }];
  }
  return sortPhysicalExamRows(tests, mode)
    .slice(0, 8)
    .map((item, index) => ({
      label: item.teste,
      value:
        mode === "TAXA" ? Math.round(item.taxaPositividade) : item.positivos,
      color:
        PHYSICAL_EXAM_TEST_COLORS[index % PHYSICAL_EXAM_TEST_COLORS.length],
    }));
};

export const buildPhysicalExamProfilesChartData = (
  summary: CrmPhysicalExamTestsSummary | null,
  noDataLabel: string,
): ChartDataItem[] => {
  if (!summary?.perfisScoring?.length) {
    return [{ label: noDataLabel, value: 0, color: "#CBD5E1" }];
  }
  return summary.perfisScoring.slice(0, 8).map((item, index) => ({
    label: item.perfil,
    value: item.count,
    color:
      PHYSICAL_EXAM_PROFILE_COLORS[
        index % PHYSICAL_EXAM_PROFILE_COLORS.length
      ],
  }));
};

export const buildPhysicalExamTopRegionsList = (
  regions: ClinicalExamRegionSummary[],
  mode: ExamChartMode,
) =>
  sortPhysicalExamRows(regions, mode)
    .slice(0, 5)
    .map((item) => ({
      label: item.regiao,
      value:
        mode === "TAXA"
          ? `${Math.round(item.taxaPositividade)}%`
          : String(item.positivos),
      detail: mode === "TAXA" ? `${item.positivos}/${item.avaliados}` : "",
      sample: item.avaliados,
    }));

export const buildPhysicalExamTopTestsList = (
  tests: ClinicalExamTopTestSummary[],
  mode: ExamChartMode,
) =>
  sortPhysicalExamRows(tests, mode)
    .slice(0, 5)
    .map((item) => ({
      label: item.teste,
      value:
        mode === "TAXA"
          ? `${Math.round(item.taxaPositividade)}%`
          : String(item.positivos),
      detail: mode === "TAXA" ? `${item.positivos}/${item.avaliados}` : "",
      sample: item.avaliados,
    }));

export const buildPhysicalExamTopInsights = (
  summary: CrmPhysicalExamTestsSummary | null,
  mode: ExamChartMode,
  regions: ClinicalExamRegionSummary[],
  tests: ClinicalExamTopTestSummary[],
) => {
  const empty = {
    topRegionLabel: "-",
    topRegionValue: "-",
    topRegionDetail: "",
    topRegionSample: 0,
    topTestLabel: "-",
    topTestValue: "-",
    topTestDetail: "",
    topTestSample: 0,
  };
  if (!summary) return empty;

  const topRegion = sortPhysicalExamRows(regions, mode)[0];
  const topTest = sortPhysicalExamRows(tests, mode)[0];

  return {
    topRegionLabel: topRegion?.regiao || "-",
    topRegionValue: topRegion
      ? mode === "TAXA"
        ? `${Math.round(topRegion.taxaPositividade)}%`
        : String(topRegion.positivos)
      : "-",
    topRegionDetail:
      topRegion && mode === "TAXA"
        ? `${topRegion.positivos}/${topRegion.avaliados}`
        : "",
    topRegionSample: topRegion?.avaliados || 0,
    topTestLabel: topTest?.teste || "-",
    topTestValue: topTest
      ? mode === "TAXA"
        ? `${Math.round(topTest.taxaPositividade)}%`
        : String(topTest.positivos)
      : "-",
    topTestDetail:
      topTest && mode === "TAXA"
        ? `${topTest.positivos}/${topTest.avaliados}`
        : "",
    topTestSample: topTest?.avaliados || 0,
  };
};

export const buildPhysicalExamCoverage = (
  summary: CrmPhysicalExamTestsSummary | null,
): PhysicalExamCoverage => {
  const analyzed = summary?.laudosAnalisados || 0;
  const structured = summary?.laudosComExameEstruturado || 0;
  const pct = analyzed > 0 ? Math.round((structured / analyzed) * 100) : 0;
  const status: PhysicalExamCoverageStatus =
    pct >= 70 ? "ALTA" : pct >= 40 ? "MEDIA" : "BAIXA";
  return { pct, status };
};
