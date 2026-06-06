import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Platform } from "react-native";
import {
  CRM_AUTOMATIONS_DISMISSED_KEY_PREFIX,
  CRM_AUTOMATIONS_HISTORY_KEY_PREFIX,
  CRM_PREFS_KEY,
} from "./AdminCrmScreen.constants";
import type {
  ClinicalPipelineStatusFilter,
  CrmLeadStageFilter,
  PacEmotionalFilter,
  PacLinkFilter,
  PacStatusFilter,
  ProfAccountStatusFilter,
  ProfActiveFilter,
  ProfEmotionalConcentrationFilter,
  TabKey,
  TaskBucket,
} from "./AdminCrmScreen.types";
import type {
  CrmAutomationHistoryItem,
  ExamChartMode,
  ExamConfidenceFilter,
  PacSortKey,
  ProfSortKey,
  SortDir,
} from "./AdminCrmScreen.utils";
import {
  isJsonRecord,
  parseJsonArray,
  parseJsonObject,
} from "../../utils/safeJson";

type ProfSort = { key: ProfSortKey; dir: SortDir };
type PacSort = { key: PacSortKey; dir: SortDir };

type CrmPrefsStorageParams = {
  tab: TabKey;
  query: string;
  stageFilter: CrmLeadStageFilter;
  profSort: ProfSort;
  pacSort: PacSort;
  profActiveFilter: ProfActiveFilter;
  profAccountStatusFilter: ProfAccountStatusFilter;
  profEmotionalConcentrationFilter: ProfEmotionalConcentrationFilter;
  pacLinkFilter: PacLinkFilter;
  pacStatusFilter: PacStatusFilter;
  pacEmotionalFilter: PacEmotionalFilter;
  profEspecialidadeFilter: string;
  pacCidadeFilter: string;
  pacUfFilter: string;
  windowDays: number;
  examWindowDays: number;
  semEvolucaoDias: number;
  clinicalPipelineStatusFilter: ClinicalPipelineStatusFilter;
  examChartMode: ExamChartMode;
  examMinSample: number;
  examConfidenceFilter: ExamConfidenceFilter;
  taskBucketFilter: TaskBucket;
  setTab: Dispatch<SetStateAction<TabKey>>;
  setQuery: Dispatch<SetStateAction<string>>;
  setStageFilter: Dispatch<SetStateAction<CrmLeadStageFilter>>;
  setProfSort: Dispatch<SetStateAction<ProfSort>>;
  setPacSort: Dispatch<SetStateAction<PacSort>>;
  setProfActiveFilter: Dispatch<SetStateAction<ProfActiveFilter>>;
  setProfAccountStatusFilter: Dispatch<
    SetStateAction<ProfAccountStatusFilter>
  >;
  setProfEmotionalConcentrationFilter: Dispatch<
    SetStateAction<ProfEmotionalConcentrationFilter>
  >;
  setPacLinkFilter: Dispatch<SetStateAction<PacLinkFilter>>;
  setPacStatusFilter: Dispatch<SetStateAction<PacStatusFilter>>;
  setPacEmotionalFilter: Dispatch<SetStateAction<PacEmotionalFilter>>;
  setProfEspecialidadeFilter: Dispatch<SetStateAction<string>>;
  setPacCidadeFilter: Dispatch<SetStateAction<string>>;
  setPacUfFilter: Dispatch<SetStateAction<string>>;
  setWindowDays: Dispatch<SetStateAction<number>>;
  setExamWindowDays: Dispatch<SetStateAction<number>>;
  setSemEvolucaoDias: Dispatch<SetStateAction<number>>;
  setClinicalPipelineStatusFilter: Dispatch<
    SetStateAction<ClinicalPipelineStatusFilter>
  >;
  setExamChartMode: Dispatch<SetStateAction<ExamChartMode>>;
  setExamMinSample: Dispatch<SetStateAction<number>>;
  setExamConfidenceFilter: Dispatch<SetStateAction<ExamConfidenceFilter>>;
  setTaskBucketFilter: Dispatch<SetStateAction<TaskBucket>>;
};

type CrmPrefs = Partial<
  Pick<
    CrmPrefsStorageParams,
    | "tab"
    | "query"
    | "stageFilter"
    | "profSort"
    | "pacSort"
    | "profActiveFilter"
    | "profAccountStatusFilter"
    | "profEmotionalConcentrationFilter"
    | "pacLinkFilter"
    | "pacStatusFilter"
    | "pacEmotionalFilter"
    | "profEspecialidadeFilter"
    | "pacCidadeFilter"
    | "pacUfFilter"
    | "windowDays"
    | "examWindowDays"
    | "semEvolucaoDias"
    | "clinicalPipelineStatusFilter"
    | "examChartMode"
    | "examMinSample"
    | "examConfidenceFilter"
    | "taskBucketFilter"
  >
>;

export function useCrmPrefsStorage(params: CrmPrefsStorageParams) {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CRM_PREFS_KEY);
      if (!raw) return;
      const prefs = parseJsonObject<CrmPrefs>(raw);
      if (!prefs) return;
      if (prefs.tab) params.setTab(prefs.tab);
      if (typeof prefs.query === "string") params.setQuery(prefs.query);
      if (prefs.stageFilter) params.setStageFilter(prefs.stageFilter);
      if (prefs.profSort) params.setProfSort(prefs.profSort);
      if (prefs.pacSort) params.setPacSort(prefs.pacSort);
      if (prefs.profActiveFilter) {
        params.setProfActiveFilter(prefs.profActiveFilter);
      }
      if (prefs.profAccountStatusFilter) {
        params.setProfAccountStatusFilter(prefs.profAccountStatusFilter);
      }
      if (prefs.profEmotionalConcentrationFilter) {
        params.setProfEmotionalConcentrationFilter(
          prefs.profEmotionalConcentrationFilter,
        );
      }
      if (prefs.pacLinkFilter) params.setPacLinkFilter(prefs.pacLinkFilter);
      if (prefs.pacStatusFilter) {
        params.setPacStatusFilter(prefs.pacStatusFilter);
      }
      if (prefs.pacEmotionalFilter) {
        params.setPacEmotionalFilter(prefs.pacEmotionalFilter);
      }
      if (typeof prefs.profEspecialidadeFilter === "string") {
        params.setProfEspecialidadeFilter(prefs.profEspecialidadeFilter);
      }
      if (typeof prefs.pacCidadeFilter === "string") {
        params.setPacCidadeFilter(prefs.pacCidadeFilter);
      }
      if (typeof prefs.pacUfFilter === "string") {
        params.setPacUfFilter(prefs.pacUfFilter);
      }
      if (typeof prefs.windowDays === "number" && prefs.windowDays > 0) {
        params.setWindowDays(
          Math.min(90, Math.max(3, Math.round(prefs.windowDays))),
        );
      }
      if (
        typeof prefs.examWindowDays === "number" &&
        prefs.examWindowDays > 0
      ) {
        params.setExamWindowDays(
          Math.min(90, Math.max(3, Math.round(prefs.examWindowDays))),
        );
      }
      if (
        typeof prefs.semEvolucaoDias === "number" &&
        prefs.semEvolucaoDias > 0
      ) {
        params.setSemEvolucaoDias(
          Math.min(60, Math.max(3, Math.round(prefs.semEvolucaoDias))),
        );
      }
      if (prefs.clinicalPipelineStatusFilter) {
        params.setClinicalPipelineStatusFilter(
          prefs.clinicalPipelineStatusFilter,
        );
      }
      if (prefs.examChartMode) params.setExamChartMode(prefs.examChartMode);
      if (typeof prefs.examMinSample === "number" && prefs.examMinSample > 0) {
        params.setExamMinSample(
          Math.min(20, Math.max(1, Math.round(prefs.examMinSample))),
        );
      }
      if (prefs.examConfidenceFilter) {
        params.setExamConfidenceFilter(prefs.examConfidenceFilter);
      }
      if (prefs.taskBucketFilter) {
        params.setTaskBucketFilter(prefs.taskBucketFilter);
      }
    } catch {
      // ignore corrupted localStorage prefs
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CRM_PREFS_KEY,
        JSON.stringify({
          tab: params.tab,
          query: params.query,
          stageFilter: params.stageFilter,
          profSort: params.profSort,
          pacSort: params.pacSort,
          profActiveFilter: params.profActiveFilter,
          profAccountStatusFilter: params.profAccountStatusFilter,
          profEmotionalConcentrationFilter:
            params.profEmotionalConcentrationFilter,
          pacLinkFilter: params.pacLinkFilter,
          pacStatusFilter: params.pacStatusFilter,
          pacEmotionalFilter: params.pacEmotionalFilter,
          profEspecialidadeFilter: params.profEspecialidadeFilter,
          pacCidadeFilter: params.pacCidadeFilter,
          pacUfFilter: params.pacUfFilter,
          windowDays: params.windowDays,
          examWindowDays: params.examWindowDays,
          semEvolucaoDias: params.semEvolucaoDias,
          clinicalPipelineStatusFilter: params.clinicalPipelineStatusFilter,
          examChartMode: params.examChartMode,
          examMinSample: params.examMinSample,
          examConfidenceFilter: params.examConfidenceFilter,
          taskBucketFilter: params.taskBucketFilter,
        }),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [
    params.tab,
    params.query,
    params.stageFilter,
    params.profSort,
    params.pacSort,
    params.profActiveFilter,
    params.profAccountStatusFilter,
    params.profEmotionalConcentrationFilter,
    params.pacLinkFilter,
    params.pacStatusFilter,
    params.pacEmotionalFilter,
    params.profEspecialidadeFilter,
    params.pacCidadeFilter,
    params.pacUfFilter,
    params.windowDays,
    params.examWindowDays,
    params.semEvolucaoDias,
    params.clinicalPipelineStatusFilter,
    params.examChartMode,
    params.examMinSample,
    params.examConfidenceFilter,
    params.taskBucketFilter,
  ]);
}

type AutomationStorageParams = {
  userId: string | undefined;
  dismissedAutomationIds: string[];
  automationHistory: CrmAutomationHistoryItem[];
  setDismissedAutomationIds: Dispatch<SetStateAction<string[]>>;
  setAutomationHistory: Dispatch<
    SetStateAction<CrmAutomationHistoryItem[]>
  >;
};

export function useAutomationStorage({
  userId,
  dismissedAutomationIds,
  automationHistory,
  setDismissedAutomationIds,
  setAutomationHistory,
}: AutomationStorageParams) {
  const dismissedKey = `${CRM_AUTOMATIONS_DISMISSED_KEY_PREFIX}:${userId || "anon"}`;
  const historyKey = `${CRM_AUTOMATIONS_HISTORY_KEY_PREFIX}:${userId || "anon"}`;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(dismissedKey);
      if (!raw) return;
      setDismissedAutomationIds(
        parseJsonArray<unknown>(raw).filter(
          (item): item is string => typeof item === "string",
        ),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [dismissedKey, setDismissedAutomationIds]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        dismissedKey,
        JSON.stringify(dismissedAutomationIds),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [dismissedAutomationIds, dismissedKey]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(historyKey);
      if (!raw) return;
      setAutomationHistory(
        parseJsonArray<unknown>(raw)
          .filter((item): item is CrmAutomationHistoryItem =>
            isJsonRecord(item),
          )
          .slice(0, 5),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [historyKey, setAutomationHistory]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        historyKey,
        JSON.stringify(automationHistory.slice(0, 5)),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [automationHistory, historyKey]);
}
