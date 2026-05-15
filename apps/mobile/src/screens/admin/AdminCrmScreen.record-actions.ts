import { useCallback } from "react";
import { Alert } from "react-native";
import {
  deleteCrmInteraction,
  deleteCrmLead,
  deleteCrmTask,
  updateCrmLead,
  updateCrmTask,
  type CrmLead,
  type CrmTask,
} from "../../services/crm";
import { STAGES } from "./AdminCrmScreen.constants";

type RecordActionsToast = {
  type: "error";
  message: string;
};

type RecordActionsParams = {
  selectedLeadId: string;
  loadMain: () => Promise<void>;
  loadInteractions: (leadId: string) => Promise<void>;
  showToast: (toast: RecordActionsToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmRecordActions({
  selectedLeadId,
  loadMain,
  loadInteractions,
  showToast,
  t,
}: RecordActionsParams) {
  const advanceLead = useCallback(
    (lead: CrmLead) => {
      updateCrmLead(lead.id, {
        stage: STAGES[(STAGES.indexOf(lead.stage) + 1) % STAGES.length],
      })
        .then(() => loadMain())
        .catch(() =>
          showToast({
            type: "error",
            message: t("crm.messages.leadStageChangeFailed"),
          }),
        );
    },
    [loadMain, showToast, t],
  );

  const confirmDeleteLead = useCallback(
    (lead: CrmLead) => {
      Alert.alert(t("crm.confirm.deleteLeadTitle"), lead.nome, [
        {
          text: t("crm.actions.cancel"),
          style: "cancel",
        },
        {
          text: t("crm.actions.delete"),
          style: "destructive",
          onPress: () =>
            deleteCrmLead(lead.id)
              .then(() => loadMain())
              .catch(() =>
                showToast({
                  type: "error",
                  message: t("crm.messages.leadDeleteFailed"),
                }),
              ),
        },
      ]);
    },
    [loadMain, showToast, t],
  );

  const toggleTaskStatus = useCallback(
    (taskItem: CrmTask) => {
      updateCrmTask(taskItem.id, {
        status: taskItem.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA",
      })
        .then(() => loadMain())
        .catch(() =>
          showToast({
            type: "error",
            message: t("crm.messages.taskUpdateFailed"),
          }),
        );
    },
    [loadMain, showToast, t],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      deleteCrmTask(taskId)
        .then(() => loadMain())
        .catch(() =>
          showToast({
            type: "error",
            message: t("crm.messages.taskDeleteFailed"),
          }),
        );
    },
    [loadMain, showToast, t],
  );

  const deleteInteraction = useCallback(
    (interactionId: string) => {
      if (!selectedLeadId) return;
      deleteCrmInteraction(interactionId)
        .then(() => loadInteractions(selectedLeadId))
        .catch(() =>
          showToast({
            type: "error",
            message: t("crm.messages.interactionDeleteFailed"),
          }),
        );
    },
    [loadInteractions, selectedLeadId, showToast, t],
  );

  return {
    advanceLead,
    confirmDeleteLead,
    toggleTaskStatus,
    deleteTask,
    deleteInteraction,
  };
}
