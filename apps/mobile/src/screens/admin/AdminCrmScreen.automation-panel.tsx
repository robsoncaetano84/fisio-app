import React, { type Dispatch, type SetStateAction } from "react";
import { trackEvent } from "../../services/analytics";
import { AutomationSuggestionsPanel } from "./AdminCrmScreen.automations";
import type { CrmAutomationItem } from "./AdminCrmScreen.types";
import type { CrmAutomationHistoryItem } from "./AdminCrmScreen.utils";

type AutomationPanelProps = {
  loading: boolean;
  items: CrmAutomationItem[];
  dismissedAutomationIds: string[];
  history: CrmAutomationHistoryItem[];
  setDismissedAutomationIds: Dispatch<SetStateAction<string[]>>;
  pushAutomationHistory: (
    entry: Omit<CrmAutomationHistoryItem, "id" | "occurredAt">,
  ) => void;
  t: (key: string) => string;
};

export function AdminCrmAutomationPanel({
  loading,
  items,
  dismissedAutomationIds,
  history,
  setDismissedAutomationIds,
  pushAutomationHistory,
  t,
}: AutomationPanelProps) {
  if (loading || items.length === 0) return null;

  return (
    <AutomationSuggestionsPanel
      items={items}
      dismissedCount={dismissedAutomationIds.length}
      history={history}
      onResetDismissed={() => {
        setDismissedAutomationIds([]);
        pushAutomationHistory({
          action: "RESET",
          automationId: "ALL",
          title: t("crm.actions.resetDismissedAutomations"),
        });
        trackEvent("crm_automation_reset", {
          count: dismissedAutomationIds.length,
        }).catch(() => undefined);
      }}
      onExecute={(item) => {
        pushAutomationHistory({
          action: "EXECUTED",
          automationId: item.id,
          title: item.title,
        });
        trackEvent("crm_automation_action_executed", {
          automationId: item.id,
          severity: item.severity,
          ctaLabel: item.ctaLabel,
        }).catch(() => undefined);
        item.onPress();
      }}
      onDismiss={(item) => {
        pushAutomationHistory({
          action: "DISMISSED",
          automationId: item.id,
          title: item.title,
        });
        trackEvent("crm_automation_dismissed", {
          automationId: item.id,
          severity: item.severity,
        }).catch(() => undefined);
        setDismissedAutomationIds((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id],
        );
      }}
    />
  );
}
