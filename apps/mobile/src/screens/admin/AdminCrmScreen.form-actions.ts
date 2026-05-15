import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  createCrmInteraction,
  createCrmLead,
  createCrmTask,
  updateCrmInteraction,
  updateCrmLead,
  updateCrmTask,
} from "../../services/crm";
import {
  createEmptyInteractionForm,
  createEmptyLeadForm,
  createEmptyTaskForm,
} from "./AdminCrmScreen.constants";

type FormToast = {
  type: "error" | "success";
  message: string;
};

type FormActionsParams = {
  leadForm: ReturnType<typeof createEmptyLeadForm>;
  taskForm: ReturnType<typeof createEmptyTaskForm>;
  interactionForm: ReturnType<typeof createEmptyInteractionForm>;
  setLeadForm: Dispatch<SetStateAction<ReturnType<typeof createEmptyLeadForm>>>;
  setTaskForm: Dispatch<SetStateAction<ReturnType<typeof createEmptyTaskForm>>>;
  setInteractionForm: Dispatch<
    SetStateAction<ReturnType<typeof createEmptyInteractionForm>>
  >;
  selectedLeadId: string;
  setSelectedLeadId: Dispatch<SetStateAction<string>>;
  loadMain: () => Promise<void>;
  loadInteractions: (leadId: string) => Promise<void>;
  showToast: (toast: FormToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmFormActions({
  leadForm,
  taskForm,
  interactionForm,
  setLeadForm,
  setTaskForm,
  setInteractionForm,
  selectedLeadId,
  setSelectedLeadId,
  loadMain,
  loadInteractions,
  showToast,
  t,
}: FormActionsParams) {
  const resetLeadForm = useCallback(
    () => setLeadForm(createEmptyLeadForm()),
    [setLeadForm],
  );

  const resetTaskForm = useCallback(
    () => setTaskForm(createEmptyTaskForm(selectedLeadId || "")),
    [selectedLeadId, setTaskForm],
  );

  const resetInteractionForm = useCallback(
    () => setInteractionForm(createEmptyInteractionForm()),
    [setInteractionForm],
  );

  const saveLead = useCallback(async () => {
    if (!leadForm.nome.trim()) {
      showToast({
        type: "error",
        message: t("crm.messages.enterLeadName"),
      });
      return;
    }
    const payload = {
      nome: leadForm.nome.trim(),
      empresa: leadForm.empresa.trim() || undefined,
      canal: leadForm.canal,
      stage: leadForm.stage,
      valorPotencial: Number((leadForm.valor || "0").replace(",", ".")) || 0,
    };
    try {
      if (leadForm.id) await updateCrmLead(leadForm.id, payload);
      else {
        const created = await createCrmLead(payload);
        setSelectedLeadId(created.id);
      }
      resetLeadForm();
      await loadMain();
      showToast({ type: "success", message: t("crm.messages.leadSaved") });
    } catch {
      showToast({ type: "error", message: t("errors.saveFailed") });
    }
  }, [leadForm, loadMain, resetLeadForm, setSelectedLeadId, showToast, t]);

  const saveTask = useCallback(async () => {
    if (!taskForm.titulo.trim()) {
      showToast({
        type: "error",
        message: t("crm.messages.enterTaskTitle"),
      });
      return;
    }
    try {
      if (taskForm.id) {
        await updateCrmTask(taskForm.id, {
          titulo: taskForm.titulo.trim(),
          leadId: taskForm.leadId.trim() || null,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
        });
      } else {
        await createCrmTask({
          titulo: taskForm.titulo.trim(),
          leadId: taskForm.leadId.trim() || undefined,
          dueAt: taskForm.dueAt
            ? new Date(taskForm.dueAt).toISOString()
            : undefined,
        });
      }
      resetTaskForm();
      await loadMain();
      showToast({ type: "success", message: t("crm.messages.taskSaved") });
    } catch {
      showToast({ type: "error", message: t("errors.saveFailed") });
    }
  }, [loadMain, resetTaskForm, showToast, t, taskForm]);

  const saveInteraction = useCallback(async () => {
    if (!selectedLeadId) {
      showToast({
        type: "error",
        message: t("crm.messages.selectLead"),
      });
      return;
    }
    if (!interactionForm.resumo.trim()) {
      showToast({
        type: "error",
        message: t("crm.messages.enterInteractionSummary"),
      });
      return;
    }
    try {
      if (interactionForm.id) {
        await updateCrmInteraction(interactionForm.id, {
          tipo: interactionForm.tipo,
          resumo: interactionForm.resumo.trim(),
        });
      } else {
        await createCrmInteraction({
          leadId: selectedLeadId,
          tipo: interactionForm.tipo,
          resumo: interactionForm.resumo.trim(),
        });
      }
      resetInteractionForm();
      await loadInteractions(selectedLeadId);
      showToast({
        type: "success",
        message: t("crm.messages.interactionSaved"),
      });
    } catch {
      showToast({ type: "error", message: t("errors.saveFailed") });
    }
  }, [
    interactionForm,
    loadInteractions,
    resetInteractionForm,
    selectedLeadId,
    showToast,
    t,
  ]);

  return {
    resetLeadForm,
    resetTaskForm,
    resetInteractionForm,
    saveLead,
    saveTask,
    saveInteraction,
  };
}
