import React from "react";
import { Text, View } from "react-native";
import { SPACING } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { CrmClinicalDashboardSummary } from "../../services/crm";
import { Metric, ReasonTag } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type { ClinicalPipelineStatusFilter } from "./AdminCrmScreen.types";
import { formatDurationMs } from "./AdminCrmScreen.utils";

type PipelineStatus = Exclude<ClinicalPipelineStatusFilter, "TODOS">;

type ClinicalDashboardPanelsProps = {
  summary: CrmClinicalDashboardSummary | null;
  topBlockedReasons: Array<{ reason: string; count: number }>;
  onStatusSelect: (status: PipelineStatus) => void;
  onPendingAnamnesisPress: () => void;
};

export function ClinicalDashboardPanels({
  summary,
  topBlockedReasons,
  onStatusSelect,
  onPendingAnamnesisPress,
}: ClinicalDashboardPanelsProps) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.healthKpiBlock}>
        <View style={styles.topRow}>
          <Text style={styles.section}>{t("crm.dashboard.carePipeline")}</Text>
          <Text style={styles.muted}>{t("crm.messages.assistanceStages")}</Text>
        </View>
        <View style={styles.wrapRow}>
          <Metric
            label={t("crm.pipeline.newPatient")}
            value={String(summary?.pipeline.novoPaciente || 0)}
            onPress={() => onStatusSelect("NOVO_PACIENTE")}
          />
          <Metric
            label={t("crm.pipeline.waitingLink")}
            value={String(summary?.pipeline.aguardandoVinculo || 0)}
            onPress={() => onStatusSelect("AGUARDANDO_VINCULO")}
          />
          <Metric
            label={t("crm.alerts.pendingAnamnesis")}
            value={String(summary?.pipeline.anamnesePendente || 0)}
            onPress={onPendingAnamnesisPress}
          />
          <Metric
            label={t("crm.pipeline.treatment")}
            value={String(summary?.pipeline.emTratamento || 0)}
            onPress={() => onStatusSelect("EM_TRATAMENTO")}
          />
          <Metric
            label={t("crm.pipeline.discharge")}
            value={String(summary?.pipeline.alta || 0)}
            onPress={() => onStatusSelect("ALTA")}
          />
        </View>
      </View>

      <View style={styles.healthKpiBlock}>
        <View style={styles.topRow}>
          <Text style={styles.section}>
            {t("crm.dashboard.executionMetrics")}
          </Text>
          <Text style={styles.muted}>
            {t("crm.messages.timeCompletionAndBlocks")}
          </Text>
        </View>
        <View style={styles.wrapRow}>
          <Metric
            label={t("crm.metrics.avgTimeAnamnesis")}
            value={formatDurationMs(
              summary?.metricas.tempoMedioPorEtapaMs.ANAMNESE || 0,
            )}
          />
          <Metric
            label={t("crm.metrics.avgTimePhysicalExam")}
            value={formatDurationMs(
              summary?.metricas.tempoMedioPorEtapaMs.EXAME_FISICO || 0,
            )}
          />
          <Metric
            label={t("crm.metrics.avgTimeEvolution")}
            value={formatDurationMs(
              summary?.metricas.tempoMedioPorEtapaMs.EVOLUCAO || 0,
            )}
          />
          <Metric
            label={t("crm.metrics.completedStages")}
            value={String(summary?.metricas.completedTotal || 0)}
          />
          <Metric
            label={t("crm.metrics.abandonedStages")}
            value={String(summary?.metricas.abandonedTotal || 0)}
          />
          <Metric
            label={t("crm.metrics.blockedStages")}
            value={String(summary?.metricas.blockedTotal || 0)}
          />
          <Metric
            label={t("crm.metrics.autosaves")}
            value={String(summary?.metricas.autosaveTotal || 0)}
          />
        </View>
        {topBlockedReasons.length > 0 ? (
          <View style={[styles.wrapRow, { marginTop: SPACING.sm }]}>
            <Text style={styles.muted}>
              {t("crm.metrics.topBlockedReasons")}
            </Text>
            {topBlockedReasons.map((item) => (
              <ReasonTag
                key={`${item.reason}-${item.count}`}
                label={`${item.reason} (${item.count})`}
              />
            ))}
          </View>
        ) : null}
      </View>
    </>
  );
}
