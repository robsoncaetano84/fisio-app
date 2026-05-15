import React from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import type {
  ClinicalAiSuggestionsSummaryResponse,
  ClinicalAuditLog,
  ClinicalMyConsentsResponse,
  ClinicalProtocolVersion,
} from "../../services/crm";
import { Action, BarChart, Metric } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import { dt } from "./AdminCrmScreen.utils";

type ChartDataItem = {
  label: string;
  value: number;
  color?: string;
};

type GovernancePanelProps = {
  activeProtocol: ClinicalProtocolVersion | null;
  loading: boolean;
  aiSummary: ClinicalAiSuggestionsSummaryResponse | null;
  protocolHistory: ClinicalProtocolVersion[];
  auditLogs: ClinicalAuditLog[];
  myConsents: ClinicalMyConsentsResponse | null;
  lifecycleChartData: ChartDataItem[];
  appliedByStageChartData: ChartDataItem[];
  appliedTimelineChartData: ChartDataItem[];
  protocolName: string;
  protocolVersion: string;
  activating: boolean;
  onProtocolNameChange: (value: string) => void;
  onProtocolVersionChange: (value: string) => void;
  onActivateProtocol: () => Promise<void>;
};

export function GovernancePanel({
  activeProtocol,
  loading,
  aiSummary,
  protocolHistory,
  auditLogs,
  myConsents,
  lifecycleChartData,
  appliedByStageChartData,
  appliedTimelineChartData,
  protocolName,
  protocolVersion,
  activating,
  onProtocolNameChange,
  onProtocolVersionChange,
  onActivateProtocol,
}: GovernancePanelProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <Text style={styles.section}>{t("crm.governance.title")}</Text>
        <Text style={styles.muted}>
          {activeProtocol
            ? t("crm.governance.activeProtocol", {
                name: activeProtocol.name,
                version: activeProtocol.version,
              })
            : t("crm.governance.noActiveProtocol")}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.muted}>
            {t("crm.labels.professional")}:{" "}
            {aiSummary?.filters.professionalId || t("crm.common.noData")} |{" "}
            {t("crm.labels.patient")}:{" "}
            {aiSummary?.filters.patientId || t("crm.common.noData")}
          </Text>
          <View style={styles.wrapRow}>
            <Metric
              label={t("crm.governance.protocolHistoryCount")}
              value={String(protocolHistory.length)}
            />
            <Metric
              label={t("crm.governance.auditCount")}
              value={String(auditLogs.length)}
            />
            <Metric
              label={t("crm.governance.userConsentCount")}
              value={String(myConsents?.history?.length || 0)}
            />
          </View>
          <View style={styles.wrapRow}>
            <Metric
              label={t("crm.governance.aiReads")}
              value={String(aiSummary?.totals.reads || 0)}
            />
            <Metric
              label={t("crm.governance.aiApplied")}
              value={String(aiSummary?.totals.applied || 0)}
            />
            <Metric
              label={t("crm.governance.aiAdoptionRate")}
              value={`${Math.round((aiSummary?.totals.adoptionRate || 0) * 100)}%`}
            />
            <Metric
              label={t("crm.governance.aiConfirmationRate")}
              value={`${Math.round((aiSummary?.totals.confirmationRate || 0) * 100)}%`}
            />
          </View>
          <View style={styles.wrapRow}>
            <Metric
              label={t("crm.governance.aiPhysicalExam")}
              value={String(aiSummary?.byStage.EXAME_FISICO.applied || 0)}
            />
            <Metric
              label={t("crm.governance.aiEvolution")}
              value={String(aiSummary?.byStage.EVOLUCAO.applied || 0)}
            />
            <Metric
              label={t("crm.governance.aiReport")}
              value={String(aiSummary?.byStage.LAUDO.applied || 0)}
            />
            <Metric
              label={t("crm.governance.aiPlan")}
              value={String(aiSummary?.byStage.PLANO.applied || 0)}
            />
          </View>
          <View style={styles.chartPane}>
            <Text style={styles.chartTitle}>
              {t("crm.governance.chartLifecycleTitle")}
            </Text>
            <BarChart items={lifecycleChartData} />
          </View>
          <View style={styles.chartPane}>
            <Text style={styles.chartTitle}>
              {t("crm.governance.chartAppliedByStageTitle")}
            </Text>
            <BarChart items={appliedByStageChartData} />
          </View>
          <View style={styles.chartPane}>
            <Text style={styles.chartTitle}>
              {t("crm.governance.chartAppliedTimelineTitle")}
            </Text>
            <BarChart items={appliedTimelineChartData} />
          </View>
          <View style={styles.wrapRow}>
            <TextInput
              style={[styles.filterInput, { minWidth: 220 }]}
              placeholder={t("crm.governance.protocolNamePlaceholder")}
              value={protocolName}
              onChangeText={onProtocolNameChange}
            />
            <TextInput
              style={[styles.filterInput, { minWidth: 160 }]}
              placeholder={t("crm.governance.protocolVersionPlaceholder")}
              value={protocolVersion}
              onChangeText={onProtocolVersionChange}
            />
            <Action
              title={
                activating
                  ? t("crm.governance.activating")
                  : t("crm.governance.activateVersion")
              }
              onPress={() => onActivateProtocol().catch(() => undefined)}
              secondary={false}
            />
          </View>
          <Text style={styles.disclaimerText}>
            {t("crm.governance.sprint1Summary")}
          </Text>
          {protocolHistory.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.line}>
              <Text style={styles.lineTitle}>
                {item.name} v{item.version}{" "}
                {item.isActive ? `(${t("crm.governance.activeTag")})` : ""}
              </Text>
              <Text style={styles.lineSub}>
                {t("crm.governance.createdAt", {
                  date: dt(item.createdAt),
                })}{" "}
                {item.activatedAt
                  ? `| ${t("crm.governance.activatedAt", {
                      date: dt(item.activatedAt),
                    })}`
                  : ""}
              </Text>
            </View>
          ))}
          {auditLogs.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.line}>
              <Text style={styles.lineTitle}>
                [{item.actionType}] {item.action}
              </Text>
              <Text style={styles.lineSub}>
                {t("crm.governance.actor")}: {item.actorRole || "-"} |{" "}
                {t("crm.governance.patient")}: {item.patientId || "-"} |{" "}
                {dt(item.createdAt)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
