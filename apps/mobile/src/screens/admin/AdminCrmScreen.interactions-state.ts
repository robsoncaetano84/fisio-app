import { useCallback, useEffect, useState } from "react";
import {
  getCrmInteractions,
  type CrmInteraction,
} from "../../services/crm";
import { parseApiError } from "../../utils/apiErrors";

type InteractionsToast = {
  type: "error";
  message: string;
};

type InteractionsStateParams = {
  selectedLeadId: string;
  includeSensitiveData: boolean;
  sensitiveReason: string;
  showToast: (toast: InteractionsToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmInteractionsState({
  selectedLeadId,
  includeSensitiveData,
  sensitiveReason,
  showToast,
  t,
}: InteractionsStateParams) {
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  const loadInteractions = useCallback(
    async (leadId: string) => {
      if (!leadId) {
        setInteractions([]);
        return;
      }
      setLoadingInteractions(true);
      try {
        setInteractions(
          await getCrmInteractions(leadId, {
            includeSensitive: includeSensitiveData,
            sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
          }),
        );
      } catch (error) {
        const parsed = parseApiError(error);
        showToast({
          type: "error",
          message: `${t("crm.messages.interactionsLoadFailed")}: ${parsed.message}`,
        });
      } finally {
        setLoadingInteractions(false);
      }
    },
    [includeSensitiveData, sensitiveReason, showToast, t],
  );

  useEffect(() => {
    loadInteractions(selectedLeadId).catch(() => undefined);
  }, [loadInteractions, selectedLeadId]);

  return {
    interactions,
    loadingInteractions,
    loadInteractions,
  };
}
