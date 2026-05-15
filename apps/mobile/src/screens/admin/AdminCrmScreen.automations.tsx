import React from "react";
import { Text, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  Action,
  SeverityBadge,
  SmallBtn,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type { CrmAutomationItem } from "./AdminCrmScreen.types";
import {
  automationHistoryActionLabel,
  dt,
  type CrmAutomationHistoryItem,
} from "./AdminCrmScreen.utils";

type AutomationSuggestionsPanelProps = {
  items: CrmAutomationItem[];
  dismissedCount: number;
  history: CrmAutomationHistoryItem[];
  onResetDismissed: () => void;
  onExecute: (item: CrmAutomationItem) => void;
  onDismiss: (item: CrmAutomationItem) => void;
};

export function AutomationSuggestionsPanel({
  items,
  dismissedCount,
  history,
  onResetDismissed,
  onExecute,
  onDismiss,
}: AutomationSuggestionsPanelProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.section}>{t("crm.sections.suggestedAutomations")}</Text>
        <View style={styles.wrapRow}>
          <Text style={styles.muted}>{t("crm.labels.mvpRules")}</Text>
          {dismissedCount > 0 ? (
            <SmallBtn
              title={t("crm.actions.resetAutomations")}
              onPress={onResetDismissed}
            />
          ) : null}
        </View>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.automationItem}>
          <View style={{ flex: 1 }}>
            <View style={styles.wrapRow}>
              <SeverityBadge
                level={item.severity}
                labels={{
                  high: t("crm.severity.high"),
                  medium: t("crm.severity.medium"),
                }}
              />
              <Text style={styles.lineTitle}>{item.title}</Text>
            </View>
            <Text style={styles.lineSub}>{item.description}</Text>
          </View>
          <View style={styles.wrapRow}>
            <Action
              title={item.ctaLabel}
              onPress={() => onExecute(item)}
              secondary
            />
            <SmallBtn
              title={t("crm.actions.dismiss")}
              onPress={() => onDismiss(item)}
            />
          </View>
        </View>
      ))}
      {history.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.section}>{t("crm.sections.lastActions")}</Text>
          {history.map((entry) => (
            <View key={entry.id} style={styles.automationHistoryItem}>
              <Text style={styles.lineTitle}>
                {automationHistoryActionLabel(entry.action)} {"\u2022"}{" "}
                {entry.title}
              </Text>
              <Text style={styles.lineSub}>{dt(entry.occurredAt)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
