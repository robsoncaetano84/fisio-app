import { useCallback, useEffect, useState } from "react";
import {
  activateClinicalGovernanceProtocol,
  getClinicalGovernanceActiveProtocol,
  getClinicalGovernanceAiSuggestionsSummary,
  getClinicalGovernanceAuditLogs,
  getClinicalGovernanceMyConsents,
  getClinicalGovernanceProtocolHistory,
  type ClinicalAiSuggestionsSummaryResponse,
  type ClinicalAuditLog,
  type ClinicalMyConsentsResponse,
  type ClinicalProtocolVersion,
} from "../../services/crm";
import { parseApiError } from "../../utils/apiErrors";

type GovernanceToast = {
  type: "error" | "success";
  message: string;
};

type GovernanceStateParams = {
  isWeb: boolean;
  isMaster: boolean;
  windowDays: number;
  selectedProfId: string;
  selectedPacId: string;
  showToast: (toast: GovernanceToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmGovernanceState({
  isWeb,
  isMaster,
  windowDays,
  selectedProfId,
  selectedPacId,
  showToast,
  t,
}: GovernanceStateParams) {
  const [govActiveProtocol, setGovActiveProtocol] =
    useState<ClinicalProtocolVersion | null>(null);
  const [govProtocolHistory, setGovProtocolHistory] = useState<
    ClinicalProtocolVersion[]
  >([]);
  const [govAuditLogs, setGovAuditLogs] = useState<ClinicalAuditLog[]>([]);
  const [govAiSummary, setGovAiSummary] =
    useState<ClinicalAiSuggestionsSummaryResponse | null>(null);
  const [govMyConsents, setGovMyConsents] =
    useState<ClinicalMyConsentsResponse | null>(null);
  const [govLoading, setGovLoading] = useState(false);
  const [govProtocolName, setGovProtocolName] = useState(
    "Protocolo Clinico Base",
  );
  const [govProtocolVersion, setGovProtocolVersion] = useState("");
  const [govActivating, setGovActivating] = useState(false);

  const loadGovernance = useCallback(async () => {
    if (!isWeb || !isMaster) return;
    setGovLoading(true);
    try {
      const [
        activeProtocol,
        protocolHistory,
        myConsents,
        auditLogs,
        aiSummary,
      ] = await Promise.all([
        getClinicalGovernanceActiveProtocol().catch(() => null),
        getClinicalGovernanceProtocolHistory({ limit: 6 }).catch(() => []),
        getClinicalGovernanceMyConsents().catch(() => null),
        getClinicalGovernanceAuditLogs({ limit: 8 }).catch(() => ({
          items: [],
          count: 0,
        })),
        getClinicalGovernanceAiSuggestionsSummary({
          windowDays,
          professionalId: selectedProfId || undefined,
          patientId: selectedPacId || undefined,
        }).catch(() => null),
      ]);

      setGovActiveProtocol(activeProtocol);
      setGovProtocolHistory(protocolHistory);
      setGovMyConsents(myConsents);
      setGovAuditLogs(auditLogs.items || []);
      setGovAiSummary(aiSummary);
      if (activeProtocol?.name) {
        setGovProtocolName(activeProtocol.name);
      }
      setGovProtocolVersion((current) =>
        current || activeProtocol?.version || "",
      );
    } catch {
      // Keep CRM usable even if governance block fails.
    } finally {
      setGovLoading(false);
    }
  }, [isMaster, isWeb, windowDays, selectedProfId, selectedPacId]);

  const handleActivateProtocol = useCallback(async () => {
    if (!govProtocolName.trim() || !govProtocolVersion.trim()) {
      showToast({
        type: "error",
        message: t("crm.governance.fillNameVersion"),
      });
      return;
    }
    setGovActivating(true);
    try {
      await activateClinicalGovernanceProtocol({
        name: govProtocolName.trim(),
        version: govProtocolVersion.trim(),
      });
      showToast({
        type: "success",
        message: t("crm.governance.activateSuccess"),
      });
      await loadGovernance();
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({
        type: "error",
        message: parsed.message || t("crm.governance.activateError"),
      });
    } finally {
      setGovActivating(false);
    }
  }, [
    govProtocolName,
    govProtocolVersion,
    loadGovernance,
    showToast,
    t,
  ]);

  useEffect(() => {
    loadGovernance().catch(() => undefined);
  }, [loadGovernance]);

  return {
    govActiveProtocol,
    govProtocolHistory,
    govAuditLogs,
    govAiSummary,
    govMyConsents,
    govLoading,
    govProtocolName,
    setGovProtocolName,
    govProtocolVersion,
    setGovProtocolVersion,
    govActivating,
    loadGovernance,
    handleActivateProtocol,
  };
}
