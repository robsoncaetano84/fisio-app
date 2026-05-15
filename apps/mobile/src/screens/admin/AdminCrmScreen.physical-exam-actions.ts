import { useCallback } from "react";
import { Platform } from "react-native";
import { trackEvent } from "../../services/analytics";
import type { CrmPhysicalExamTestsSummary } from "../../services/crm";
import {
  buildPhysicalExamSummaryCsvRows,
  downloadCsv,
  PHYSICAL_EXAM_CSV_HEADERS,
  type ExamChartMode,
  type ExamConfidenceFilter,
} from "./AdminCrmScreen.utils";

type ToastType = "info" | "success";

type PhysicalExamToast = {
  type: ToastType;
  message: string;
};

type PhysicalExamTopInsights = {
  topRegionLabel: string;
  topRegionValue: string;
  topTestLabel: string;
  topTestValue: string;
};

type PhysicalExamTopListItem = {
  label: string;
  value: string;
};

type PhysicalExamSummaryActionsParams = {
  physicalExamSummary: CrmPhysicalExamTestsSummary | null;
  physicalExamTopInsights: PhysicalExamTopInsights;
  physicalExamTopRegionsList: PhysicalExamTopListItem[];
  physicalExamTopTestsList: PhysicalExamTopListItem[];
  examChartMode: ExamChartMode;
  examMinSample: number;
  examConfidenceFilter: ExamConfidenceFilter;
  showToast: (toast: PhysicalExamToast) => void;
  t: (key: string) => string;
};

type ExecutiveSummaryParams = Pick<
  PhysicalExamSummaryActionsParams,
  | "physicalExamSummary"
  | "physicalExamTopInsights"
  | "physicalExamTopRegionsList"
  | "physicalExamTopTestsList"
  | "examChartMode"
  | "examMinSample"
  | "examConfidenceFilter"
  | "t"
>;

const formatTopItems = (items: PhysicalExamTopListItem[]) =>
  items
    .slice(0, 3)
    .map((item, index) => `${index + 1}. ${item.label} (${item.value})`)
    .join(" | ");

const buildPhysicalExamExecutiveSummary = ({
  physicalExamSummary,
  physicalExamTopInsights,
  physicalExamTopRegionsList,
  physicalExamTopTestsList,
  examChartMode,
  examMinSample,
  examConfidenceFilter,
  t,
}: ExecutiveSummaryParams) => {
  if (!physicalExamSummary) return "";

  const topRegionsText = formatTopItems(physicalExamTopRegionsList);
  const topTestsText = formatTopItems(physicalExamTopTestsList);

  return [
    `${t("crm.summary.executivePhysicalExamTitle")} (${physicalExamSummary.windowDays} ${t("crm.summary.days")})`,
    `Laudos analisados: ${physicalExamSummary.laudosAnalisados}`,
    `Com exame estruturado: ${physicalExamSummary.laudosComExameEstruturado}`,
    `Testes avaliados: ${physicalExamSummary.totalAvaliados}`,
    `Testes positivos: ${physicalExamSummary.totalPositivos}`,
    `Taxa de positividade geral: ${Math.round(physicalExamSummary.taxaPositividadeGeral)}%`,
    `Base mínima para ranking: ${examChartMode === "TAXA" ? `${examMinSample} avaliados` : "não aplicada"}`,
    `Filtro de confiança amostral: ${examChartMode === "TAXA" ? examConfidenceFilter : "não aplicado"}`,
    `${examChartMode === "TAXA" ? t("crm.summary.topRegionRate") : t("crm.summary.topRegionPositives")}: ${physicalExamTopInsights.topRegionLabel} (${physicalExamTopInsights.topRegionValue})`,
    `${examChartMode === "TAXA" ? t("crm.summary.topTestRate") : t("crm.summary.topTestPositives")}: ${physicalExamTopInsights.topTestLabel} (${physicalExamTopInsights.topTestValue})`,
    `Top regiões: ${topRegionsText || "-"}`,
    `Top testes: ${topTestsText || "-"}`,
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
  ].join("\n");
};

export function usePhysicalExamSummaryActions({
  physicalExamSummary,
  physicalExamTopInsights,
  physicalExamTopRegionsList,
  physicalExamTopTestsList,
  examChartMode,
  examMinSample,
  examConfidenceFilter,
  showToast,
  t,
}: PhysicalExamSummaryActionsParams) {
  const exportPhysicalExamSummaryCsv = useCallback(() => {
    if (!physicalExamSummary) {
      showToast({
        type: "info",
        message: t("crm.messages.noPhysicalExamDataToExport"),
      });
      return;
    }
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const rows = buildPhysicalExamSummaryCsvRows(
      physicalExamSummary,
      examChartMode,
      examMinSample,
      examConfidenceFilter,
    );

    downloadCsv(
      `crm-exame-fisico-resumo-${now}.csv`,
      PHYSICAL_EXAM_CSV_HEADERS,
      rows,
    );

    trackEvent("crm_kpi_clicked", {
      kpi: "physical_exam_csv_exported",
      windowDays: physicalExamSummary.windowDays,
      mode: examChartMode,
      minSample: examChartMode === "TAXA" ? examMinSample : null,
      confidenceFilter: examChartMode === "TAXA" ? examConfidenceFilter : null,
      rows: rows.length,
    }).catch(() => undefined);
    showToast({
      type: "success",
      message: t("crm.messages.physicalExamSummaryExported"),
    });
  }, [
    physicalExamSummary,
    showToast,
    examChartMode,
    examMinSample,
    examConfidenceFilter,
    t,
  ]);

  const copyPhysicalExamExecutiveSummary = useCallback(async () => {
    if (!physicalExamSummary) {
      showToast({
        type: "info",
        message: t("crm.messages.noPhysicalExamDataToCopy"),
      });
      return;
    }

    const summary = buildPhysicalExamExecutiveSummary({
      physicalExamSummary,
      physicalExamTopInsights,
      physicalExamTopRegionsList,
      physicalExamTopTestsList,
      examChartMode,
      examMinSample,
      examConfidenceFilter,
      t,
    });

    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(summary);
        trackEvent("crm_kpi_clicked", {
          kpi: "physical_exam_summary_copied",
          windowDays: physicalExamSummary.windowDays,
          mode: examChartMode,
          minSample: examChartMode === "TAXA" ? examMinSample : null,
          confidenceFilter:
            examChartMode === "TAXA" ? examConfidenceFilter : null,
        }).catch(() => undefined);
        showToast({
          type: "success",
          message: t("crm.messages.summaryCopied"),
        });
        return;
      } catch {
        // The UI already falls back to the platform support message below.
      }
    }

    showToast({ type: "info", message: t("crm.messages.copyWebOnly") });
  }, [
    physicalExamSummary,
    physicalExamTopInsights,
    physicalExamTopRegionsList,
    physicalExamTopTestsList,
    examChartMode,
    examMinSample,
    examConfidenceFilter,
    showToast,
    t,
  ]);

  return {
    exportPhysicalExamSummaryCsv,
    copyPhysicalExamExecutiveSummary,
  };
}
