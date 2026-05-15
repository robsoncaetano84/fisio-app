import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { trackEvent } from "../../services/analytics";
import type { CrmAutomationItem } from "./AdminCrmScreen.types";
import type { AccountHealthScore, ProfRow } from "./AdminCrmScreen.utils";

type InfoToast = {
  type: "info";
  message: string;
};

type AdminCrmAnalyticsParams = {
  isWeb: boolean;
  isMaster: boolean;
  loading: boolean;
  profs: ProfRow[];
  profAccountScores: Map<string, AccountHealthScore>;
  crmAutomationItems: CrmAutomationItem[];
  includeSensitiveData: boolean;
  setIncludeSensitiveData: Dispatch<SetStateAction<boolean>>;
  setSensitiveReason: Dispatch<SetStateAction<string>>;
  showToast: (toast: InfoToast) => void;
};

export function useAdminCrmAnalytics({
  isWeb,
  isMaster,
  loading,
  profs,
  profAccountScores,
  crmAutomationItems,
  includeSensitiveData,
  setIncludeSensitiveData,
  setSensitiveReason,
  showToast,
}: AdminCrmAnalyticsParams) {
  const lastScoreSummaryHashRef = useRef<string | null>(null);
  const lastAutomationPanelHashRef = useRef<string | null>(null);
  const sensitiveDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!isWeb || !isMaster || loading) return;
    const payload = {
      totalProfessionals: profs.length,
      healthy: 0,
      attention: 0,
      risk: 0,
    };
    profs.forEach((professional) => {
      const status = profAccountScores.get(professional.id)?.status;
      if (status === "HEALTHY") payload.healthy += 1;
      else if (status === "ATTENTION") payload.attention += 1;
      else if (status === "RISK") payload.risk += 1;
    });
    const hash = JSON.stringify(payload);
    if (lastScoreSummaryHashRef.current === hash) return;
    lastScoreSummaryHashRef.current = hash;
    trackEvent("crm_account_score_summary_viewed", payload).catch(
      () => undefined,
    );
  }, [isWeb, isMaster, loading, profs, profAccountScores]);

  useEffect(() => {
    if (!isWeb || !isMaster || loading || crmAutomationItems.length === 0) {
      return;
    }
    const payload = {
      visibleCount: crmAutomationItems.length,
      ids: crmAutomationItems.map((item) => item.id),
      severities: crmAutomationItems.map((item) => item.severity),
    };
    const hash = JSON.stringify(payload);
    if (lastAutomationPanelHashRef.current === hash) return;
    lastAutomationPanelHashRef.current = hash;
    trackEvent("crm_automations_panel_viewed", payload).catch(() => undefined);
  }, [isWeb, isMaster, loading, crmAutomationItems]);

  useEffect(() => {
    if (!isWeb || !isMaster) return;
    trackEvent("crm_sensitive_visibility_changed", {
      enabled: includeSensitiveData,
    }).catch(() => undefined);
  }, [includeSensitiveData, isMaster, isWeb]);

  useEffect(() => {
    if (sensitiveDataTimerRef.current) {
      clearTimeout(sensitiveDataTimerRef.current);
      sensitiveDataTimerRef.current = null;
    }
    if (!includeSensitiveData) return;
    sensitiveDataTimerRef.current = setTimeout(
      () => {
        setIncludeSensitiveData(false);
        setSensitiveReason("");
        showToast({
          type: "info",
          message:
            "Visualização de dados sensíveis desativada automaticamente.",
        });
      },
      5 * 60 * 1000,
    );
    return () => {
      if (sensitiveDataTimerRef.current) {
        clearTimeout(sensitiveDataTimerRef.current);
        sensitiveDataTimerRef.current = null;
      }
    };
  }, [
    includeSensitiveData,
    setIncludeSensitiveData,
    setSensitiveReason,
    showToast,
  ]);
}
