import { useMemo, type Dispatch, type SetStateAction } from "react";
import { trackEvent } from "../../services/analytics";
import type {
  ExamChartMode,
  PhysicalExamCoverage,
} from "./AdminCrmScreen.utils";
import type {
  PacEmotionalFilter,
  PacStatusFilter,
  TabKey,
} from "./AdminCrmScreen.types";

type PhysicalExamTopInsights = {
  topRegionLabel: string;
  topTestLabel: string;
};

type PhysicalExamNavigationParams = {
  chartMode: ExamChartMode;
  coverage: PhysicalExamCoverage;
  topInsights: PhysicalExamTopInsights;
  setTab: Dispatch<SetStateAction<TabKey>>;
  setPacStatusFilter: Dispatch<SetStateAction<PacStatusFilter>>;
  setPacEmotionalFilter: Dispatch<SetStateAction<PacEmotionalFilter>>;
};

export function usePhysicalExamNavigationActions({
  chartMode,
  coverage,
  topInsights,
  setTab,
  setPacStatusFilter,
  setPacEmotionalFilter,
}: PhysicalExamNavigationParams) {
  return useMemo(
    () => ({
      openPatientsInAttention: () => {
        setTab("PACIENTES");
        setPacStatusFilter("RISCO");
        setPacEmotionalFilter("TODOS");
        trackEvent("crm_kpi_clicked", {
          kpi: "physical_exam_coverage_action_clicked",
          coverageStatus: coverage.status,
          coveragePct: coverage.pct,
        }).catch(() => undefined);
      },
      openPatientQueue: () => {
        setTab("PACIENTES");
        setPacStatusFilter("RISCO");
        setPacEmotionalFilter("TODOS");
      },
      openTopRegion: () => {
        setTab("PACIENTES");
        setPacStatusFilter("RISCO");
        setPacEmotionalFilter("TODOS");
        trackEvent("crm_kpi_clicked", {
          kpi: "physical_exam_top_region",
          targetTab: "PACIENTES",
          pacStatusFilter: "RISCO",
          mode: chartMode,
          region: topInsights.topRegionLabel,
        }).catch(() => undefined);
      },
      openTopTest: () => {
        setTab("PACIENTES");
        setPacStatusFilter("RISCO");
        setPacEmotionalFilter("TODOS");
        trackEvent("crm_kpi_clicked", {
          kpi: "physical_exam_top_test",
          targetTab: "PACIENTES",
          pacStatusFilter: "RISCO",
          mode: chartMode,
          test: topInsights.topTestLabel,
        }).catch(() => undefined);
      },
    }),
    [
      chartMode,
      coverage,
      setPacEmotionalFilter,
      setPacStatusFilter,
      setTab,
      topInsights,
    ],
  );
}
