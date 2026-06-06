import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  CrmClinicalDashboardSummary,
  CrmLead,
  CrmLeadStage,
  CrmTask,
} from "../../services/crm";
import { createEmptyTaskForm } from "./AdminCrmScreen.constants";
import type {
  CrmAutomationItem,
  PacLinkFilter,
  PacStatusFilter,
  TabKey,
} from "./AdminCrmScreen.types";
import type {
  AccountHealthScore,
  CrmAutomationHistoryItem,
  ProfRow,
} from "./AdminCrmScreen.utils";
import { toLocal } from "./AdminCrmScreen.utils";

type AutomationItemsParams = {
  tasks: CrmTask[];
  leads: CrmLead[];
  profs: ProfRow[];
  profAccountScores: Map<string, AccountHealthScore>;
  dismissedAutomationIds: string[];
  clinicalSummary: CrmClinicalDashboardSummary | null;
  stageLabel: Record<CrmLeadStage, string>;
  setTab: Dispatch<SetStateAction<TabKey>>;
  setPacStatusFilter: Dispatch<SetStateAction<PacStatusFilter>>;
  setPacLinkFilter: Dispatch<SetStateAction<PacLinkFilter>>;
  setSelectedLeadId: Dispatch<SetStateAction<string>>;
  setSelectedProfId: Dispatch<SetStateAction<string>>;
  setTaskForm: Dispatch<SetStateAction<ReturnType<typeof createEmptyTaskForm>>>;
  setAutomationHistory: Dispatch<
    SetStateAction<CrmAutomationHistoryItem[]>
  >;
};

export function useAdminCrmAutomationItems({
  tasks,
  leads,
  profs,
  profAccountScores,
  dismissedAutomationIds,
  clinicalSummary,
  stageLabel,
  setTab,
  setPacStatusFilter,
  setPacLinkFilter,
  setSelectedLeadId,
  setSelectedProfId,
  setTaskForm,
  setAutomationHistory,
}: AutomationItemsParams) {
  const crmAutomationItems = useMemo<CrmAutomationItem[]>(() => {
    const now = Date.now();
    const pendingTasks = tasks.filter((task) => task.status !== "CONCLUIDA");
    const overdueTasks = pendingTasks
      .filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now)
      .sort(
        (a, b) =>
          new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime(),
      );

    const staleLeads = leads
      .filter((lead) => lead.stage === "CONTATO" || lead.stage === "PROPOSTA")
      .filter((lead) => {
        const updatedMs = new Date(lead.updatedAt || lead.createdAt).getTime();
        const daysWithoutUpdate = Number.isNaN(updatedMs)
          ? 999
          : (now - updatedMs) / (1000 * 60 * 60 * 24);
        if (daysWithoutUpdate < 3) return false;
        const hasRecentPendingTask = pendingTasks.some((task) => {
          if (task.leadId !== lead.id) return false;
          if (!task.dueAt) return true;
          const dueMs = new Date(task.dueAt).getTime();
          return !Number.isNaN(dueMs) && dueMs >= now - 1000 * 60 * 60 * 24;
        });
        return !hasRecentPendingTask;
      })
      .sort(
        (a, b) =>
          new Date(a.updatedAt || a.createdAt).getTime() -
          new Date(b.updatedAt || b.createdAt).getTime(),
      );

    const lowActivationAccounts = profs
      .map((prof) => ({ prof, score: profAccountScores.get(prof.id) }))
      .filter((item): item is { prof: ProfRow; score: AccountHealthScore } =>
        Boolean(item.score),
      )
      .filter(
        (item) =>
          item.score.status !== "HEALTHY" ||
          item.score.reasons.some((reason) => reason.includes("ativação")),
      )
      .sort((a, b) => a.score.score - b.score.score);

    const items: CrmAutomationItem[] = [];

    if ((clinicalSummary?.alertas.semEvolucao || 0) > 0) {
      items.push({
        id: "clinical_no_evolution",
        title: "Pacientes sem evolução recente",
        severity:
          (clinicalSummary?.alertas.semEvolucao || 0) >= 5 ? "HIGH" : "MEDIUM",
        description: `${clinicalSummary?.alertas.semEvolucao || 0} paciente(s) sem evolução no período esperado.`,
        ctaLabel: "Abrir pacientes em atenção",
        onPress: () => {
          setTab("PACIENTES");
          setPacStatusFilter("RISCO");
        },
      });
    }

    if ((clinicalSummary?.alertas.anamnesePendente || 0) > 0) {
      items.push({
        id: "clinical_pending_anamnesis",
        title: "Anamnese pendente",
        severity:
          (clinicalSummary?.alertas.anamnesePendente || 0) >= 5
            ? "HIGH"
            : "MEDIUM",
        description: `${clinicalSummary?.alertas.anamnesePendente || 0} paciente(s) ainda sem anamnese concluída.`,
        ctaLabel: "Abrir fila clínica",
        onPress: () => {
          setTab("PACIENTES");
          setPacStatusFilter("RISCO");
        },
      });
    }

    if ((clinicalSummary?.alertas.conviteNaoAceito || 0) > 0) {
      items.push({
        id: "clinical_invite_not_accepted",
        title: "Convites não aceitos",
        severity: "MEDIUM",
        description: `${clinicalSummary?.alertas.conviteNaoAceito || 0} convite(s) pendente(s) de aceite.`,
        ctaLabel: "Abrir sem usuário",
        onPress: () => {
          setTab("PACIENTES");
          setPacLinkFilter("SEM_USUARIO");
        },
      });
    }

    if (overdueTasks.length > 0) {
      const first = overdueTasks[0];
      items.push({
        id: "overdue_followups",
        title: "Follow-up vencido",
        severity: "HIGH",
        description: `${overdueTasks.length} tarefa(s) pendente(s) com prazo vencido. Próxima: ${first.titulo}.`,
        ctaLabel: "Abrir tarefas",
        onPress: () => {
          setTab("TAREFAS");
        },
      });
    }

    if (staleLeads.length > 0) {
      const lead = staleLeads[0];
      items.push({
        id: "lead_without_followup",
        title: "Lead sem follow-up recente",
        severity: "MEDIUM",
        description: `${lead.nome} (${stageLabel[lead.stage]}) está sem acompanhamento recente.`,
        ctaLabel: "Gerar tarefa",
        onPress: () => {
          setSelectedLeadId(lead.id);
          setTaskForm({
            id: "",
            titulo: `Follow-up: ${lead.nome}`,
            dueAt: toLocal(
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            ),
            leadId: lead.id,
          });
          setTab("TAREFAS");
        },
      });
    }

    if (lowActivationAccounts.length > 0) {
      const target = lowActivationAccounts[0];
      items.push({
        id: "low_activation_accounts",
        title: "Baixa ativação de conta",
        severity: target.score.status === "RISK" ? "HIGH" : "MEDIUM",
        description: `${lowActivationAccounts.length} conta(s) em atenção/risco. Priorizar ${target.prof.nome} (score ${target.score.score}).`,
        ctaLabel: "Abrir profissional",
        onPress: () => {
          setSelectedProfId(target.prof.id);
          setTab("PROFISSIONAIS");
        },
      });
    }

    return items
      .filter((item) => !dismissedAutomationIds.includes(item.id))
      .slice(0, 3);
  }, [
    clinicalSummary,
    dismissedAutomationIds,
    leads,
    profAccountScores,
    profs,
    setPacLinkFilter,
    setPacStatusFilter,
    setSelectedLeadId,
    setSelectedProfId,
    setTab,
    setTaskForm,
    stageLabel,
    tasks,
  ]);

  const pushAutomationHistory = useCallback(
    (entry: Omit<CrmAutomationHistoryItem, "id" | "occurredAt">) => {
      setAutomationHistory((prev) =>
        [
          {
            ...entry,
            id: `${entry.action}:${entry.automationId}:${Date.now()}`,
            occurredAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5),
      );
    },
    [setAutomationHistory],
  );

  return {
    crmAutomationItems,
    pushAutomationHistory,
  };
}
