import { useCallback, type Dispatch, type SetStateAction } from "react";
import { trackEvent } from "../../services/analytics";
import { createEmptyTaskForm } from "./AdminCrmScreen.constants";
import type { TabKey } from "./AdminCrmScreen.types";
import type { AccountHealthScore, ProfRow } from "./AdminCrmScreen.utils";
import { toLocal } from "./AdminCrmScreen.utils";

type ProfessionalActionsParams = {
  selectedProf: ProfRow | null;
  selectedProfAccountScore: AccountHealthScore | null;
  setTaskForm: Dispatch<SetStateAction<ReturnType<typeof createEmptyTaskForm>>>;
  setSelectedLeadId: Dispatch<SetStateAction<string>>;
  setTab: Dispatch<SetStateAction<TabKey>>;
  t: (key: string) => string;
};

export function useAdminCrmProfessionalActions({
  selectedProf,
  selectedProfAccountScore,
  setTaskForm,
  setSelectedLeadId,
  setTab,
  t,
}: ProfessionalActionsParams) {
  const createReactivationTask = useCallback(() => {
    if (!selectedProf || !selectedProfAccountScore) return;
    const leadId = selectedProf.leadIds[0] || "";
    trackEvent("crm_reactivation_task_prefilled", {
      profissionalId: selectedProf.id,
      profissionalNome: selectedProf.nome,
      score: selectedProfAccountScore.score,
      status: selectedProfAccountScore.status,
      leadId: leadId || null,
    }).catch(() => undefined);
    setTaskForm({
      id: "",
      titulo: `${t("crm.forms.reactivationTaskTitlePrefix")}: ${selectedProf.nome}`,
      dueAt: toLocal(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ),
      leadId,
    });
    if (leadId) setSelectedLeadId(leadId);
    setTab("TAREFAS");
  }, [
    selectedProf,
    selectedProfAccountScore,
    setSelectedLeadId,
    setTab,
    setTaskForm,
    t,
  ]);

  return {
    createReactivationTask,
  };
}
