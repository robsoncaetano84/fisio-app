import { useMemo } from "react";
import type {
  ClinicalAiSuggestionsSummaryResponse,
  CrmClinicalDashboardSummary,
  CrmPhysicalExamTestsSummary,
  CrmPipelineSummary,
} from "../../services/crm";
import {
  buildClinicalAlertsChartData,
  buildClinicalDurationChartData,
  buildClinicalOperationalEventsChartData,
  buildClinicalPipelineChartData,
  buildFunnelStageChartData,
  buildGovernanceAiAppliedByStageChartData,
  buildGovernanceAiAppliedTimelineChartData,
  buildGovernanceAiLifecycleChartData,
} from "./AdminCrmScreen.chart-data";
import type {
  ExamChartMode,
  ExamConfidenceFilter,
  TaskBuckets,
} from "./AdminCrmScreen.models";
import {
  buildPhysicalExamCoverage,
  buildPhysicalExamFilterStats,
  buildPhysicalExamProfilesChartData,
  buildPhysicalExamRegionChartData,
  buildPhysicalExamTopInsights,
  buildPhysicalExamTopRegionsList,
  buildPhysicalExamTopTestsChartData,
  buildPhysicalExamTopTestsList,
  filterPhysicalExamRows,
} from "./AdminCrmScreen.physical-exam-utils";
import { buildTaskStatusChartData } from "./AdminCrmScreen.task-utils";

type DashboardDataParams = {
  clinicalSummary: CrmClinicalDashboardSummary | null;
  physicalExamSummary: CrmPhysicalExamTestsSummary | null;
  govAiSummary: ClinicalAiSuggestionsSummaryResponse | null;
  pipeline: CrmPipelineSummary | null;
  taskBuckets: TaskBuckets;
  examChartMode: ExamChartMode;
  examMinSample: number;
  examConfidenceFilter: ExamConfidenceFilter;
  t: (key: string) => string;
};

export function useAdminCrmDashboardData({
  clinicalSummary,
  physicalExamSummary,
  govAiSummary,
  pipeline,
  taskBuckets,
  examChartMode,
  examMinSample,
  examConfidenceFilter,
  t,
}: DashboardDataParams) {
  const clinicalPipelineChartData = useMemo(
    () =>
      buildClinicalPipelineChartData(clinicalSummary, {
        newPatient: t("crm.pipeline.new"),
        link: t("crm.pipeline.link"),
        anamnesis: t("crm.pipeline.anamnesis"),
        treatment: t("crm.pipeline.treatment"),
        discharge: t("crm.pipeline.discharge"),
      }),
    [clinicalSummary, t],
  );
  const clinicalAlertsChartData = useMemo(
    () =>
      buildClinicalAlertsChartData(clinicalSummary, {
        noCheckin: t("crm.alerts.noCheckin"),
        noProgress: t("crm.alerts.noProgress"),
        pendingAnamnesis: t("crm.alerts.pendingAnamnesis"),
        pendingInvite: t("crm.alerts.pendingInvite"),
      }),
    [clinicalSummary, t],
  );
  const clinicalDurationChartData = useMemo(
    () => buildClinicalDurationChartData(clinicalSummary),
    [clinicalSummary],
  );
  const clinicalOperationalEventsChartData = useMemo(
    () =>
      buildClinicalOperationalEventsChartData(clinicalSummary, {
        abandonedStages: t("crm.metrics.abandonedStages"),
        blockedStages: t("crm.metrics.blockedStages"),
        autosaves: t("crm.metrics.autosaves"),
      }),
    [clinicalSummary, t],
  );
  const clinicalTopBlockedReasons = useMemo(
    () => clinicalSummary?.metricas.topBlockedReasons || [],
    [clinicalSummary],
  );

  const filteredPhysicalExamRegions = useMemo(
    () =>
      filterPhysicalExamRows(
        physicalExamSummary?.porRegiao,
        examChartMode,
        examMinSample,
        examConfidenceFilter,
      ),
    [
      physicalExamSummary,
      examChartMode,
      examMinSample,
      examConfidenceFilter,
    ],
  );
  const filteredPhysicalExamTests = useMemo(
    () =>
      filterPhysicalExamRows(
        physicalExamSummary?.topTestesPositivos,
        examChartMode,
        examMinSample,
        examConfidenceFilter,
      ),
    [
      physicalExamSummary,
      examChartMode,
      examMinSample,
      examConfidenceFilter,
    ],
  );
  const physicalExamFilterStats = useMemo(
    () =>
      buildPhysicalExamFilterStats(
        physicalExamSummary,
        filteredPhysicalExamRegions,
        filteredPhysicalExamTests,
      ),
    [
      physicalExamSummary,
      filteredPhysicalExamRegions,
      filteredPhysicalExamTests,
    ],
  );
  const physicalExamRegionChartData = useMemo(
    () =>
      buildPhysicalExamRegionChartData(
        filteredPhysicalExamRegions,
        examChartMode,
        t("crm.common.noData"),
      ),
    [filteredPhysicalExamRegions, examChartMode, t],
  );
  const physicalExamTopTestsChartData = useMemo(
    () =>
      buildPhysicalExamTopTestsChartData(
        filteredPhysicalExamTests,
        examChartMode,
        t("crm.common.noData"),
      ),
    [filteredPhysicalExamTests, examChartMode, t],
  );
  const physicalExamProfilesChartData = useMemo(
    () =>
      buildPhysicalExamProfilesChartData(
        physicalExamSummary,
        t("crm.common.noData"),
      ),
    [physicalExamSummary, t],
  );
  const physicalExamTopRegionsList = useMemo(
    () =>
      buildPhysicalExamTopRegionsList(
        filteredPhysicalExamRegions,
        examChartMode,
      ),
    [filteredPhysicalExamRegions, examChartMode],
  );
  const physicalExamTopTestsList = useMemo(
    () =>
      buildPhysicalExamTopTestsList(filteredPhysicalExamTests, examChartMode),
    [filteredPhysicalExamTests, examChartMode],
  );
  const physicalExamTopInsights = useMemo(
    () =>
      buildPhysicalExamTopInsights(
        physicalExamSummary,
        examChartMode,
        filteredPhysicalExamRegions,
        filteredPhysicalExamTests,
      ),
    [
      physicalExamSummary,
      examChartMode,
      filteredPhysicalExamRegions,
      filteredPhysicalExamTests,
    ],
  );
  const hasPhysicalExamData = useMemo(
    () => (physicalExamSummary?.laudosComExameEstruturado || 0) > 0,
    [physicalExamSummary],
  );
  const physicalExamCoverage = useMemo(
    () => buildPhysicalExamCoverage(physicalExamSummary),
    [physicalExamSummary],
  );

  const governanceAiAppliedByStageChartData = useMemo(
    () =>
      buildGovernanceAiAppliedByStageChartData(govAiSummary, {
        physicalExam: t("crm.governance.aiPhysicalExam"),
        evolution: t("crm.governance.aiEvolution"),
        report: t("crm.governance.aiReport"),
        plan: t("crm.governance.aiPlan"),
      }),
    [govAiSummary, t],
  );
  const governanceAiLifecycleChartData = useMemo(
    () =>
      buildGovernanceAiLifecycleChartData(govAiSummary, {
        reads: t("crm.governance.aiReads"),
        applied: t("crm.governance.aiApplied"),
        confirmed: t("crm.governance.aiConfirmed"),
      }),
    [govAiSummary, t],
  );
  const governanceAiAppliedTimelineChartData = useMemo(
    () => buildGovernanceAiAppliedTimelineChartData(govAiSummary),
    [govAiSummary],
  );
  const funnelStageChartData = useMemo(
    () => buildFunnelStageChartData(pipeline),
    [pipeline],
  );
  const taskStatusChartData = useMemo(
    () => buildTaskStatusChartData(taskBuckets),
    [taskBuckets],
  );

  return {
    clinicalPipelineChartData,
    clinicalAlertsChartData,
    clinicalDurationChartData,
    clinicalOperationalEventsChartData,
    clinicalTopBlockedReasons,
    physicalExamFilterStats,
    physicalExamRegionChartData,
    physicalExamTopTestsChartData,
    physicalExamProfilesChartData,
    physicalExamTopRegionsList,
    physicalExamTopTestsList,
    physicalExamTopInsights,
    hasPhysicalExamData,
    physicalExamCoverage,
    governanceAiAppliedByStageChartData,
    governanceAiLifecycleChartData,
    governanceAiAppliedTimelineChartData,
    funnelStageChartData,
    taskStatusChartData,
  };
}
