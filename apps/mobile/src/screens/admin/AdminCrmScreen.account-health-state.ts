import { useMemo } from "react";
import {
  computeAccountHealthScore,
  type AccountHealthScore,
  type EmotionalConcentration,
  type PacRow,
  type ProfRow,
} from "./AdminCrmScreen.utils";

type AccountHealthParams = {
  profs: ProfRow[];
  pacs: PacRow[];
  selectedProf: ProfRow | null;
};

const groupPatientsByProfessional = (patients: PacRow[]) => {
  const map = new Map<string, PacRow[]>();
  patients.forEach((patient) => {
    const current = map.get(patient.profissionalId) || [];
    current.push(patient);
    map.set(patient.profissionalId, current);
  });
  return map;
};

const computeEmotionalConcentration = (
  patients: PacRow[],
): EmotionalConcentration => {
  const total = patients.length;
  const vulneraveis = patients.filter(
    (patient) => patient.emocionalVulneravel,
  ).length;
  const percentual = total > 0 ? Math.round((vulneraveis / total) * 100) : 0;
  const status: EmotionalConcentration["status"] =
    total >= 5 && percentual >= 40
      ? "RISK"
      : total >= 5 && percentual >= 25
        ? "ATTENTION"
        : "OK";
  return { vulneraveis, total, percentual, status };
};

export function useAdminCrmAccountHealth({
  profs,
  pacs,
  selectedProf,
}: AccountHealthParams) {
  const patientsByProfessional = useMemo(
    () => groupPatientsByProfessional(pacs),
    [pacs],
  );

  const profAccountScores = useMemo(() => {
    const map = new Map<string, AccountHealthScore>();
    profs.forEach((prof) => {
      const profPatients = patientsByProfessional.get(prof.id) || [];
      map.set(prof.id, computeAccountHealthScore(prof, profPatients));
    });
    return map;
  }, [patientsByProfessional, profs]);

  const profEmotionalConcentrationMap = useMemo(() => {
    const map = new Map<string, EmotionalConcentration>();
    profs.forEach((prof) => {
      map.set(
        prof.id,
        computeEmotionalConcentration(
          patientsByProfessional.get(prof.id) || [],
        ),
      );
    });
    return map;
  }, [patientsByProfessional, profs]);

  const accountHealthOverview = useMemo(
    () => ({
      risk: profs.filter(
        (prof) => profAccountScores.get(prof.id)?.status === "RISK",
      ).length,
      attention: profs.filter(
        (prof) => profAccountScores.get(prof.id)?.status === "ATTENTION",
      ).length,
      healthy: profs.filter(
        (prof) => profAccountScores.get(prof.id)?.status === "HEALTHY",
      ).length,
      sensitiveCaseloads: profs.filter((prof) => {
        const emotional = profEmotionalConcentrationMap.get(prof.id);
        return Boolean(
          emotional && emotional.total >= 5 && emotional.percentual >= 25,
        );
      }).length,
    }),
    [profs, profAccountScores, profEmotionalConcentrationMap],
  );

  const selectedProfAccountScore = selectedProf
    ? profAccountScores.get(selectedProf.id) || null
    : null;
  const selectedProfEmotionalConcentration = selectedProf
    ? profEmotionalConcentrationMap.get(selectedProf.id) || null
    : null;

  return {
    profAccountScores,
    profEmotionalConcentrationMap,
    accountHealthOverview,
    selectedProfAccountScore,
    selectedProfEmotionalConcentration,
  };
}
