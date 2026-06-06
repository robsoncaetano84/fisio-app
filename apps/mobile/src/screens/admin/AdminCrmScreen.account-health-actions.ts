import { useCallback, type Dispatch, type SetStateAction } from "react";
import { trackEvent } from "../../services/analytics";
import type {
  ProfAccountStatusFilter,
  ProfEmotionalConcentrationFilter,
  TabKey,
} from "./AdminCrmScreen.types";
import type { AccountHealthStatus } from "./AdminCrmScreen.utils";

type AccountHealthActionsParams = {
  setTab: Dispatch<SetStateAction<TabKey>>;
  setProfAccountStatusFilter: Dispatch<SetStateAction<ProfAccountStatusFilter>>;
  setProfEmotionalConcentrationFilter: Dispatch<
    SetStateAction<ProfEmotionalConcentrationFilter>
  >;
};

export function useAdminCrmAccountHealthActions({
  setTab,
  setProfAccountStatusFilter,
  setProfEmotionalConcentrationFilter,
}: AccountHealthActionsParams) {
  const openAccountStatus = useCallback(
    (status: AccountHealthStatus) => {
      trackEvent("crm_kpi_clicked", {
        kpi: `accounts_${status.toLowerCase()}`,
        targetTab: "PROFISSIONAIS",
        profAccountStatusFilter: status,
      }).catch(() => undefined);
      setTab("PROFISSIONAIS");
      setProfAccountStatusFilter(status);
    },
    [setProfAccountStatusFilter, setTab],
  );

  const openSensitiveCaseloads = useCallback(() => {
    trackEvent("crm_kpi_clicked", {
      kpi: "sensitive_caseloads",
      targetTab: "PROFISSIONAIS",
      profEmotionalConcentrationFilter: "ALTA",
    }).catch(() => undefined);
    setTab("PROFISSIONAIS");
    setProfEmotionalConcentrationFilter("ALTA");
  }, [setProfEmotionalConcentrationFilter, setTab]);

  return {
    openAccountStatus,
    openSensitiveCaseloads,
  };
}
