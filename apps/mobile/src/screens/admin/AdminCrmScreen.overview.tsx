import React from "react";
import { Text, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { CrmAdminAuditLog } from "../../services/crm";
import { Metric, StatusBadge } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import { dt, type AccountHealthStatus } from "./AdminCrmScreen.utils";

type AccountHealthOverview = {
  risk: number;
  attention: number;
  healthy: number;
  sensitiveCaseloads: number;
};

type AdminAuditPanelProps = {
  logs: CrmAdminAuditLog[];
};

type AccountHealthOverviewPanelProps = {
  overview: AccountHealthOverview;
  onAccountStatusPress: (status: AccountHealthStatus) => void;
  onSensitiveCaseloadsPress: () => void;
};

export function AdminAuditPanel({ logs }: AdminAuditPanelProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <Text style={styles.section}>{t("crm.dashboard.adminAudit")}</Text>
        <Text style={styles.muted}>{"\u00daltimos acessos do admin"}</Text>
      </View>
      {logs.length === 0 ? (
        <Text style={styles.muted}>
          {"Nenhum log de auditoria encontrado."}
        </Text>
      ) : (
        logs.map((entry) => (
          <View key={entry.id} style={styles.auditLogItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>
                {entry.action}{" "}
                {entry.includeSensitive ? "\u2022 sens\u00edvel" : ""}
              </Text>
              <Text style={styles.lineSub}>
                {entry.actorEmail} {"\u2022"} {dt(entry.createdAt)}
              </Text>
              {entry.sensitiveReason ? (
                <Text style={styles.lineSub}>
                  Motivo: {entry.sensitiveReason}
                </Text>
              ) : null}
            </View>
            <StatusBadge
              status={entry.includeSensitive ? "ATTENTION" : "HEALTHY"}
              labels={{
                healthy: "Padr\u00e3o",
                attention: "Sens\u00edvel",
                risk: "Risco",
              }}
            />
          </View>
        ))
      )}
    </View>
  );
}

export function AccountHealthOverviewPanel({
  overview,
  onAccountStatusPress,
  onSensitiveCaseloadsPress,
}: AccountHealthOverviewPanelProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <Text style={styles.section}>{t("crm.labels.accountHealth")}</Text>
        <Text style={styles.muted}>{t("crm.metrics.accountsByScore")}</Text>
      </View>
      <View style={styles.wrapRow}>
        <Metric
          label={t("crm.metrics.accountsAtRisk")}
          value={String(overview.risk)}
          onPress={() => onAccountStatusPress("RISK")}
        />
        <Metric
          label={t("crm.metrics.accountsInAttention")}
          value={String(overview.attention)}
          onPress={() => onAccountStatusPress("ATTENTION")}
        />
        <Metric
          label={t("crm.metrics.accountsHealthy")}
          value={String(overview.healthy)}
          onPress={() => onAccountStatusPress("HEALTHY")}
        />
        <Metric
          label={t("crm.labels.sensitiveCaseloads")}
          value={String(overview.sensitiveCaseloads)}
          onPress={onSensitiveCaseloadsPress}
        />
      </View>
      <Text style={styles.disclaimerText}>
        {t("crm.messages.emotionalConcentrationDisclaimer")}
      </Text>
    </View>
  );
}
