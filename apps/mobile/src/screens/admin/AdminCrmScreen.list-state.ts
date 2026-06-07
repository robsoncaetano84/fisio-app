import { useMemo } from "react";
import type {
  CrmAutomationAction,
  CrmCommandCenterActionType,
} from "../../services/crm";
import {
  comparePac,
  compareProf,
  type AccountHealthScore,
  type EmotionalConcentration,
  type PacRow,
  type PacSortKey,
  type ProfRow,
  type ProfSortKey,
  type SortDir,
} from "./AdminCrmScreen.utils";

type ListStateParams = {
  profs: ProfRow[];
  pacs: PacRow[];
  query: string;
  profAccountStatusFilter: "TODOS" | "HEALTHY" | "ATTENTION" | "RISK";
  profEmotionalConcentrationFilter: "TODOS" | "ALTA";
  pacStatusFilter: "TODOS" | "ATIVO" | "RISCO";
  pacEmotionalFilter: "TODOS" | "EMOCIONAL";
  automationActions: CrmAutomationAction[];
  automationTypeFilter: CrmCommandCenterActionType | "TODAS";
  profSort: { key: ProfSortKey; dir: SortDir };
  pacSort: { key: PacSortKey; dir: SortDir };
  profPagesMeta: number;
  pacPagesMeta: number;
  profAccountScores: Map<string, AccountHealthScore>;
  profEmotionalConcentrationMap: Map<string, EmotionalConcentration>;
};

export function useAdminCrmListState({
  profs,
  pacs,
  query,
  profAccountStatusFilter,
  profEmotionalConcentrationFilter,
  pacStatusFilter,
  pacEmotionalFilter,
  automationActions,
  automationTypeFilter,
  profSort,
  pacSort,
  profPagesMeta,
  pacPagesMeta,
  profAccountScores,
  profEmotionalConcentrationMap,
}: ListStateParams) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProfs = useMemo(() => {
    const base = normalizedQuery
      ? profs.filter(
          (professional) =>
            professional.nome.toLowerCase().includes(normalizedQuery) ||
            professional.cidade.toLowerCase().includes(normalizedQuery),
        )
      : profs;

    return base
      .filter((professional) => {
        if (profAccountStatusFilter === "TODOS") return true;
        return (
          profAccountScores.get(professional.id)?.status ===
          profAccountStatusFilter
        );
      })
      .filter((professional) => {
        if (profEmotionalConcentrationFilter === "TODOS") return true;
        const emotional = profEmotionalConcentrationMap.get(professional.id);
        return Boolean(
          emotional && emotional.total >= 5 && emotional.percentual >= 25,
        );
      });
  }, [
    normalizedQuery,
    profAccountScores,
    profAccountStatusFilter,
    profEmotionalConcentrationFilter,
    profEmotionalConcentrationMap,
    profs,
  ]);

  const filteredPacs = useMemo(() => {
    const patientAutomationTargetIds =
      automationTypeFilter === "TODAS"
        ? null
        : new Set(
            automationActions
              .filter(
                (action) =>
                  action.type === automationTypeFilter &&
                  action.targetType === "PATIENT",
              )
              .map((action) => action.targetId),
          );
    const base = normalizedQuery
      ? pacs.filter(
          (patient) =>
            patient.nome.toLowerCase().includes(normalizedQuery) ||
            patient.profissionalNome.toLowerCase().includes(normalizedQuery),
        )
      : pacs;

    return base
      .filter((patient) =>
        pacStatusFilter === "TODOS" ? true : patient.status === pacStatusFilter,
      )
      .filter((patient) =>
        patientAutomationTargetIds
          ? patientAutomationTargetIds.has(patient.id)
          : true,
      )
      .filter((patient) =>
        pacEmotionalFilter === "TODOS" ? true : patient.emocionalVulneravel,
      );
  }, [
    automationActions,
    automationTypeFilter,
    normalizedQuery,
    pacEmotionalFilter,
    pacStatusFilter,
    pacs,
  ]);

  const pagedProfs = useMemo(
    () =>
      [...filteredProfs].sort((left, right) => {
        if (profSort.key === "score") {
          const multiplier = profSort.dir === "asc" ? 1 : -1;
          const leftScore = profAccountScores.get(left.id)?.score ?? 0;
          const rightScore = profAccountScores.get(right.id)?.score ?? 0;
          return (leftScore - rightScore) * multiplier;
        }
        if (profSort.key === "vulnEmocional") {
          const multiplier = profSort.dir === "asc" ? 1 : -1;
          const leftEmotional = profEmotionalConcentrationMap.get(left.id);
          const rightEmotional = profEmotionalConcentrationMap.get(right.id);
          const leftValue = leftEmotional ? leftEmotional.percentual : 0;
          const rightValue = rightEmotional ? rightEmotional.percentual : 0;
          return (leftValue - rightValue) * multiplier;
        }
        return compareProf(left, right, profSort);
      }),
    [filteredProfs, profAccountScores, profEmotionalConcentrationMap, profSort],
  );

  const pagedPacs = useMemo(
    () =>
      [...filteredPacs].sort((left, right) => comparePac(left, right, pacSort)),
    [filteredPacs, pacSort],
  );

  return {
    profTotalPages: Math.max(1, profPagesMeta),
    pacTotalPages: Math.max(1, pacPagesMeta),
    pagedProfs,
    pagedPacs,
  };
}
