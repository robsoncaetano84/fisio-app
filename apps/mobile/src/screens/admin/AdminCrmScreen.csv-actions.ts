import { useCallback } from "react";
import { Platform } from "react-native";
import type {
  CrmInteraction,
  CrmInteractionType,
  CrmLead,
  CrmLeadStage,
  CrmTask,
} from "../../services/crm";
import {
  buildCurrentPatientRows,
  buildCurrentProfessionalRows,
  buildFullPatientRows,
  buildFullProfessionalRows,
  buildInteractionRows,
  buildLeadRows,
  buildTaskRows,
  currentPatientHeaders,
  currentProfessionalHeaders,
  fullPatientHeaders,
  fullProfessionalHeaders,
  interactionHeaders,
  leadHeaders,
  taskHeaders,
  timestampForFilename,
  type TableExportKind,
} from "./AdminCrmScreen.csv-builders";
import {
  downloadCsv,
  type AccountHealthScore,
  type EmotionalConcentration,
  type PacRow,
  type PacSortKey,
  type ProfRow,
  type ProfSortKey,
  type SortDir,
} from "./AdminCrmScreen.utils";

type CsvActionToast = {
  type: "error" | "info" | "success";
  message: string;
};

type CsvActionsParams = {
  pagedProfs: ProfRow[];
  pagedPacs: PacRow[];
  profEmotionalConcentrationMap: Map<string, EmotionalConcentration>;
  profAccountScores: Map<string, AccountHealthScore>;
  query: string;
  profActiveFilter: "TODOS" | "ATIVOS";
  profEspecialidadeFilter: string;
  profEmotionalConcentrationFilter: "TODOS" | "ALTA";
  pacLinkFilter: "TODOS" | "VINCULADOS" | "SEM_USUARIO";
  pacCidadeFilter: string;
  pacUfFilter: string;
  profSort: { key: ProfSortKey; dir: SortDir };
  pacSort: { key: PacSortKey; dir: SortDir };
  leads: CrmLead[];
  stageFilter: CrmLeadStage | "TODOS";
  stageLabel: Record<CrmLeadStage, string>;
  tasks: CrmTask[];
  taskLeadMap: Map<string, CrmLead>;
  interactions: CrmInteraction[];
  selectedLeadId: string;
  selectedLead: CrmLead | null;
  interactionLabel: Record<CrmInteractionType, string>;
  showToast: (toast: CsvActionToast) => void;
  t: (key: string) => string;
};

const isCsvDownloadSupported = () =>
  Platform.OS === "web" && typeof window !== "undefined";

export function useAdminCrmCsvActions({
  pagedProfs,
  pagedPacs,
  profEmotionalConcentrationMap,
  profAccountScores,
  query,
  profActiveFilter,
  profEspecialidadeFilter,
  profEmotionalConcentrationFilter,
  pacLinkFilter,
  pacCidadeFilter,
  pacUfFilter,
  profSort,
  pacSort,
  leads,
  stageFilter,
  stageLabel,
  tasks,
  taskLeadMap,
  interactions,
  selectedLeadId,
  selectedLead,
  interactionLabel,
  showToast,
  t,
}: CsvActionsParams) {
  const showWebOnlyMessage = useCallback(() => {
    showToast({
      type: "info",
      message: t("crm.messages.exportCsvWebOnly"),
    });
  }, [showToast, t]);

  const exportCurrentTableCsv = useCallback(
    (kind: TableExportKind) => {
      if (!isCsvDownloadSupported()) {
        showWebOnlyMessage();
        return;
      }
      const now = timestampForFilename();
      if (kind === "PROFISSIONAIS") {
        downloadCsv(
          `crm-profissionais-${now}.csv`,
          currentProfessionalHeaders,
          buildCurrentProfessionalRows({
            pagedProfs,
            profAccountScores,
            profEmotionalConcentrationMap,
          }),
        );
        showToast({
          type: "success",
          message: t("crm.messages.csvProfessionalsExported"),
        });
        return;
      }

      downloadCsv(
        `crm-pacientes-${now}.csv`,
        currentPatientHeaders,
        buildCurrentPatientRows({ pagedPacs, stageLabel }),
      );
      showToast({
        type: "success",
        message: t("crm.messages.csvPatientsExported"),
      });
    },
    [
      pagedPacs,
      pagedProfs,
      profAccountScores,
      profEmotionalConcentrationMap,
      showToast,
      showWebOnlyMessage,
      stageLabel,
      t,
    ],
  );

  const exportAllFilteredCsv = useCallback(
    async (kind: TableExportKind) => {
      if (!isCsvDownloadSupported()) {
        showWebOnlyMessage();
        return;
      }
      const now = timestampForFilename();
      try {
        if (kind === "PROFISSIONAIS") {
          const rows = await buildFullProfessionalRows({
            query,
            profActiveFilter,
            profEspecialidadeFilter,
            profEmotionalConcentrationFilter,
            profSort,
          });
          downloadCsv(
            `crm-profissionais-filtrados-${now}.csv`,
            fullProfessionalHeaders,
            rows,
          );
          showToast({
            type: "success",
            message: t("crm.messages.csvProfessionalsFullExported"),
          });
          return;
        }

        const rows = await buildFullPatientRows({
          query,
          pacLinkFilter,
          pacCidadeFilter,
          pacUfFilter,
          pacSort,
          leads,
          stageLabel,
          noLinkLabel: t("crm.labels.noLink"),
        });
        downloadCsv(
          `crm-pacientes-filtrados-${now}.csv`,
          fullPatientHeaders,
          rows,
        );
        showToast({
          type: "success",
          message: t("crm.messages.csvPatientsFullExported"),
        });
      } catch {
        showToast({ type: "error", message: t("errors.unexpected") });
      }
    },
    [
      leads,
      pacCidadeFilter,
      pacLinkFilter,
      pacSort,
      pacUfFilter,
      profActiveFilter,
      profEmotionalConcentrationFilter,
      profEspecialidadeFilter,
      profSort,
      query,
      showToast,
      showWebOnlyMessage,
      stageLabel,
      t,
    ],
  );

  const exportLeadsCsv = useCallback(
    (allStages = false) => {
      const now = timestampForFilename();
      downloadCsv(
        `crm-leads-${allStages ? "todos" : "visao"}-${now}.csv`,
        leadHeaders,
        buildLeadRows({ leads, allStages, stageFilter, stageLabel }),
      );
      showToast({
        type: "success",
        message: t("crm.messages.csvLeadsExported"),
      });
    },
    [leads, showToast, stageFilter, stageLabel, t],
  );

  const exportTasksCsv = useCallback(() => {
    const now = timestampForFilename();
    downloadCsv(
      `crm-tarefas-${now}.csv`,
      taskHeaders,
      buildTaskRows({ tasks, taskLeadMap }),
    );
    showToast({
      type: "success",
      message: t("crm.messages.csvTasksExported"),
    });
  }, [showToast, taskLeadMap, tasks, t]);

  const exportInteractionsCsv = useCallback(() => {
    if (!selectedLeadId) {
      showToast({
        type: "info",
        message: t("crm.messages.selectLeadForInteractionsExport"),
      });
      return;
    }
    const now = timestampForFilename();
    downloadCsv(
      `crm-interacoes-${selectedLeadId}-${now}.csv`,
      interactionHeaders,
      buildInteractionRows({
        interactions,
        selectedLeadId,
        selectedLead,
        interactionLabel,
      }),
    );
    showToast({
      type: "success",
      message: t("crm.messages.csvInteractionsExported"),
    });
  }, [
    interactionLabel,
    interactions,
    selectedLead,
    selectedLeadId,
    showToast,
    t,
  ]);

  return {
    exportCurrentTableCsv,
    exportAllFilteredCsv,
    exportLeadsCsv,
    exportTasksCsv,
    exportInteractionsCsv,
  };
}
