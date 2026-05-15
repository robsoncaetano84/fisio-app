import React from "react";
import { Text, View } from "react-native";
import { SPACING } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  BarChart,
  Chip,
  SampleConfidenceBadge,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type {
  ChartDataItem,
  ExamChartMode,
  ExamConfidenceFilter,
} from "./AdminCrmScreen.utils";

type PhysicalExamFilterStats = {
  totalRegions: number;
  totalTests: number;
  consideredRegions: number;
  consideredTests: number;
  excludedRegions: number;
  excludedTests: number;
};

type PhysicalExamTopListItem = {
  label: string;
  value: string;
  detail: string;
  sample: number;
};

type ClinicalCrmChartsPanelProps = {
  chartMode: ExamChartMode;
  minSample: number;
  confidenceFilter: ExamConfidenceFilter;
  filterStats: PhysicalExamFilterStats;
  clinicalPipelineChartData: ChartDataItem[];
  clinicalAlertsChartData: ChartDataItem[];
  clinicalDurationChartData: ChartDataItem[];
  clinicalOperationalEventsChartData: ChartDataItem[];
  funnelStageChartData: ChartDataItem[];
  physicalExamRegionChartData: ChartDataItem[];
  physicalExamTopTestsChartData: ChartDataItem[];
  physicalExamProfilesChartData: ChartDataItem[];
  physicalExamTopRegionsList: PhysicalExamTopListItem[];
  physicalExamTopTestsList: PhysicalExamTopListItem[];
  onChartModeChange: (value: ExamChartMode) => void;
  onMinSampleChange: (value: number) => void;
  onConfidenceFilterChange: (value: ExamConfidenceFilter) => void;
};

export function ClinicalCrmChartsPanel({
  chartMode,
  minSample,
  confidenceFilter,
  filterStats,
  clinicalPipelineChartData,
  clinicalAlertsChartData,
  clinicalDurationChartData,
  clinicalOperationalEventsChartData,
  funnelStageChartData,
  physicalExamRegionChartData,
  physicalExamTopTestsChartData,
  physicalExamProfilesChartData,
  physicalExamTopRegionsList,
  physicalExamTopTestsList,
  onChartModeChange,
  onMinSampleChange,
  onConfidenceFilterChange,
}: ClinicalCrmChartsPanelProps) {
  const { t } = useLanguage();
  const isRateMode = chartMode === "TAXA";
  const physicalExamModeLabel = isRateMode ? "taxa %" : "positivos";

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <Text style={styles.section}>
          {t("crm.dashboard.clinicalAndCrmCharts")}
        </Text>
        <View style={styles.wrapRow}>
          <Chip
            label={t("crm.dashboard.sortByPositives")}
            active={chartMode === "POSITIVOS"}
            onPress={() => onChartModeChange("POSITIVOS")}
          />
          <Chip
            label={t("crm.dashboard.sortByRate")}
            active={isRateMode}
            onPress={() => onChartModeChange("TAXA")}
          />
          {isRateMode
            ? [1, 3, 5].map((sample) => (
                <Chip
                  key={`exam-min-sample-${sample}`}
                  label={`${t("crm.dashboard.baseMin")} ${sample}`}
                  active={minSample === sample}
                  onPress={() => onMinSampleChange(sample)}
                />
              ))
            : null}
          {isRateMode
            ? (
                [
                  { key: "TODOS", label: t("crm.dashboard.confidenceAll") },
                  { key: "ALTA", label: t("crm.dashboard.confidenceHigh") },
                  { key: "MEDIA", label: t("crm.dashboard.confidenceMedium") },
                  { key: "BAIXA", label: t("crm.dashboard.confidenceLow") },
                ] as const
              ).map((option) => (
                <Chip
                  key={`exam-confidence-${option.key}`}
                  label={option.label}
                  active={confidenceFilter === option.key}
                  onPress={() => onConfidenceFilterChange(option.key)}
                />
              ))
            : null}
        </View>
      </View>
      {isRateMode ? (
        <View style={styles.sampleInfoBox}>
          <Text style={styles.muted}>
            Ranking por taxa considera apenas itens com pelo menos {minSample}{" "}
            avaliados.
          </Text>
          <Text style={styles.sampleInfoText}>
            {t("crm.messages.confidenceFilter")}:{" "}
            {confidenceFilter === "TODOS"
              ? t("crm.messages.allSamples")
              : confidenceFilter.toLowerCase()}
          </Text>
          <Text style={styles.sampleInfoText}>
            {"Regi\u00f5es consideradas: "}
            {filterStats.consideredRegions}/{filterStats.totalRegions}
            {" \u2022 "}
            Testes considerados: {filterStats.consideredTests}/
            {filterStats.totalTests}
          </Text>
          {filterStats.excludedRegions > 0 ||
          filterStats.excludedTests > 0 ? (
            <Text style={styles.sampleInfoMuted}>
              {"Exclu\u00eddos pela base m\u00ednima: "}
              {filterStats.excludedRegions}
              {" regi\u00e3o(\u00f5es) e "}
              {filterStats.excludedTests} teste(s).
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.split}>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            {t("crm.dashboard.clinicalPipelineChart")}
          </Text>
          <BarChart items={clinicalPipelineChartData} />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            {t("crm.dashboard.clinicalAlertsChart")}
          </Text>
          <BarChart items={clinicalAlertsChartData} />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            {t("crm.dashboard.avgTimeByStageChart")}
          </Text>
          <BarChart items={clinicalDurationChartData} />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            {t("crm.dashboard.operationalEventsChart")}
          </Text>
          <BarChart items={clinicalOperationalEventsChartData} />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>Funil comercial (leads)</Text>
          <BarChart items={funnelStageChartData} />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            {"Exame f\u00edsico por regi\u00e3o ("}
            {physicalExamModeLabel})
          </Text>
          <BarChart
            items={physicalExamRegionChartData}
            formatValue={isRateMode ? (value) => `${value}%` : undefined}
            maxValue={isRateMode ? 100 : undefined}
          />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>
            Top testes ({physicalExamModeLabel})
          </Text>
          <BarChart
            items={physicalExamTopTestsChartData}
            formatValue={isRateMode ? (value) => `${value}%` : undefined}
            maxValue={isRateMode ? 100 : undefined}
          />
        </View>
        <View style={styles.chartPane}>
          <Text style={styles.chartTitle}>Perfis de scoring</Text>
          <BarChart items={physicalExamProfilesChartData} />
        </View>
      </View>
      <View style={[styles.split, { marginTop: SPACING.sm }]}>
        <TopPhysicalExamList
          title={`Top 5 regi\u00f5es (${physicalExamModeLabel})`}
          items={physicalExamTopRegionsList}
          emptyLabel={t("crm.common.noDataDot")}
          itemKeyPrefix="region-top"
        />
        <TopPhysicalExamList
          title={`Top 5 testes (${physicalExamModeLabel})`}
          items={physicalExamTopTestsList}
          emptyLabel={t("crm.common.noDataDot")}
          itemKeyPrefix="test-top"
        />
      </View>
    </View>
  );
}

function TopPhysicalExamList({
  title,
  items,
  emptyLabel,
  itemKeyPrefix,
}: {
  title: string;
  items: PhysicalExamTopListItem[];
  emptyLabel: string;
  itemKeyPrefix: string;
}) {
  return (
    <View style={styles.chartPane}>
      <Text style={styles.chartTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.muted}>{emptyLabel}</Text>
      ) : (
        items.map((item) => (
          <View
            key={`${itemKeyPrefix}-${item.label}`}
            style={styles.topListRow}
          >
            <View style={styles.topListLabelWrap}>
              <Text style={styles.topListLabel}>{item.label}</Text>
              {item.detail ? (
                <View style={styles.topListDetailRow}>
                  <Text style={styles.topListDetail}>Base: {item.detail}</Text>
                  <SampleConfidenceBadge sample={item.sample} />
                </View>
              ) : null}
            </View>
            <Text style={styles.topListValue}>{item.value}</Text>
          </View>
        ))
      )}
    </View>
  );
}
