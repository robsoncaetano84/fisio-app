import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { CrmPhysicalExamTestsSummary } from "../../services/crm";
import {
  Action,
  Chip,
  Metric,
  SampleConfidenceBadge,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type {
  ExamChartMode,
  PhysicalExamCoverage,
} from "./AdminCrmScreen.utils";

type PhysicalExamTopInsights = {
  topRegionLabel: string;
  topRegionValue: string;
  topRegionDetail: string;
  topRegionSample: number;
  topTestLabel: string;
  topTestValue: string;
  topTestDetail: string;
  topTestSample: number;
};

type PhysicalExamSummaryPanelProps = {
  summary: CrmPhysicalExamTestsSummary | null;
  coverage: PhysicalExamCoverage;
  hasData: boolean;
  chartMode: ExamChartMode;
  windowDays: number;
  topInsights: PhysicalExamTopInsights;
  onWindowDaysChange: (days: number) => void;
  onExportCsv: () => void;
  onCopySummary: () => void;
  onOpenPatientsInAttention: () => void;
  onOpenPatientQueue: () => void;
  onTopRegionPress: () => void;
  onTopTestPress: () => void;
};

export function PhysicalExamSummaryPanel({
  summary,
  coverage,
  hasData,
  chartMode,
  windowDays,
  topInsights,
  onWindowDaysChange,
  onExportCsv,
  onCopySummary,
  onOpenPatientsInAttention,
  onOpenPatientQueue,
  onTopRegionPress,
  onTopTestPress,
}: PhysicalExamSummaryPanelProps) {
  const { t } = useLanguage();
  const coverageLabel =
    coverage.status === "ALTA"
      ? "Alta"
      : coverage.status === "MEDIA"
        ? "M\u00e9dia"
        : "Baixa";
  const coverageMessage =
    coverage.status === "ALTA"
      ? "Cobertura adequada. Mantenha o padr\u00e3o de registro estruturado."
      : coverage.status === "MEDIA"
        ? "Cobertura intermedi\u00e1ria. Priorize registros estruturados em novos laudos."
        : "Cobertura baixa. Ative rotina de exame f\u00edsico estruturado para aumentar confiabilidade.";

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <Text style={styles.section}>
          {t("crm.dashboard.physicalExamStructuredMetrics")}
        </Text>
        <View style={styles.wrapRow}>
          <Action
            title={t("crm.actions.exportCsv")}
            secondary
            onPress={onExportCsv}
          />
          <Action
            title={t("crm.actions.copySummary")}
            secondary
            onPress={onCopySummary}
          />
          {[7, 30, 90].map((days) => (
            <Chip
              key={`exam-window-${days}`}
              label={`${days}d`}
              active={windowDays === days}
              onPress={() => onWindowDaysChange(days)}
            />
          ))}
          <Text style={styles.muted}>{t("crm.metrics.examWindow")}</Text>
        </View>
      </View>
      <View style={styles.wrapRow}>
        <Metric
          label={t("crm.metrics.reportsAnalyzed")}
          value={String(summary?.laudosAnalisados || 0)}
        />
        <Metric
          label={t("crm.metrics.withStructuredExam")}
          value={String(summary?.laudosComExameEstruturado || 0)}
        />
        <Metric
          label={t("crm.metrics.testsEvaluated")}
          value={String(summary?.totalAvaliados || 0)}
        />
        <Metric
          label={t("crm.metrics.positiveTests")}
          value={String(summary?.totalPositivos || 0)}
        />
        <Metric
          label={t("crm.metrics.positivityRate")}
          value={`${Math.round(summary?.taxaPositividadeGeral || 0)}%`}
        />
        <Metric
          label={t("crm.metrics.structuredCoverage")}
          value={`${coverage.pct}%`}
        />
      </View>
      <View style={styles.coverageRow}>
        <Text style={styles.muted}>
          {t("crm.metrics.structuredCoverageReports")}
        </Text>
        <View
          style={[
            styles.coverageBadge,
            coverage.status === "ALTA"
              ? styles.coverageHigh
              : coverage.status === "MEDIA"
                ? styles.coverageMedium
                : styles.coverageLow,
          ]}
        >
          <Text
            style={[
              styles.coverageBadgeText,
              coverage.status === "ALTA"
                ? styles.coverageHighText
                : coverage.status === "MEDIA"
                  ? styles.coverageMediumText
                  : styles.coverageLowText,
            ]}
          >
            {coverageLabel}
          </Text>
        </View>
      </View>
      <View style={styles.coverageActionRow}>
        <Text style={styles.muted}>{coverageMessage}</Text>
        {coverage.status !== "ALTA" ? (
          <View style={[styles.wrapRow, { marginTop: 8 }]}>
            <Action
              title={t("crm.actions.openPatientsInAttention")}
              secondary
              onPress={onOpenPatientsInAttention}
            />
          </View>
        ) : null}
      </View>
      {!hasData ? (
        <View style={styles.emptyPhysicalExamCallout}>
          <Text style={styles.muted}>
            {
              "Ainda n\u00e3o h\u00e1 exame f\u00edsico estruturado nessa janela. Amplie para 30/90 dias ou avance pacientes com anamnese para exame f\u00edsico."
            }
          </Text>
          <View style={[styles.wrapRow, { marginTop: 8 }]}>
            <Action
              title={t("crm.actions.openPatientQueue")}
              secondary
              onPress={onOpenPatientQueue}
            />
          </View>
        </View>
      ) : null}
      <View style={styles.insightsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.insightCard,
            pressed ? styles.insightCardPressed : null,
          ]}
          onPress={onTopRegionPress}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="body-outline" size={14} color={COLORS.primary} />
            <Text style={styles.insightLabel}>
              {chartMode === "TAXA"
                ? t("crm.dashboard.topRegionRate")
                : t("crm.dashboard.topRegionPositives")}
            </Text>
          </View>
          <Text style={styles.insightTitle}>
            {topInsights.topRegionLabel}
          </Text>
          <Text style={styles.insightValue}>
            {topInsights.topRegionValue}
          </Text>
          {topInsights.topRegionDetail ? (
            <View style={styles.insightMetaRow}>
              <Text style={styles.insightSubValue}>
                Base: {topInsights.topRegionDetail}
              </Text>
              <SampleConfidenceBadge sample={topInsights.topRegionSample} />
            </View>
          ) : null}
          <View style={styles.insightHintRow}>
            <Text style={styles.insightHint}>
              {t("crm.dashboard.clickToSeePatientsInAttention")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color={COLORS.textSecondary}
            />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.insightCard,
            pressed ? styles.insightCardPressed : null,
          ]}
          onPress={onTopTestPress}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="pulse-outline" size={14} color={COLORS.primary} />
            <Text style={styles.insightLabel}>
              {chartMode === "TAXA"
                ? t("crm.dashboard.topTestRate")
                : t("crm.dashboard.topTestPositives")}
            </Text>
          </View>
          <Text style={styles.insightTitle}>{topInsights.topTestLabel}</Text>
          <Text style={styles.insightValue}>{topInsights.topTestValue}</Text>
          {topInsights.topTestDetail ? (
            <View style={styles.insightMetaRow}>
              <Text style={styles.insightSubValue}>
                Base: {topInsights.topTestDetail}
              </Text>
              <SampleConfidenceBadge sample={topInsights.topTestSample} />
            </View>
          ) : null}
          <View style={styles.insightHintRow}>
            <Text style={styles.insightHint}>
              {t("crm.dashboard.clickToSeePatientsInAttention")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color={COLORS.textSecondary}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
