import type {
  AccountHealthScore,
  AccountHealthStatus,
  CrmAutomationHistoryItem,
  PacRow,
  PacSortKey,
  ProfRow,
  ProfSortKey,
  SortDir,
} from "./AdminCrmScreen.models";
import { compareDateStr, compareStr } from "./AdminCrmScreen.format-utils";

export const compareProf = (
  a: ProfRow,
  b: ProfRow,
  sort: { key: ProfSortKey; dir: SortDir },
) => {
  const mult = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return compareStr(a.nome, b.nome) * mult;
    case "pacientes":
      return (a.pacientes - b.pacientes) * mult;
    case "ativos":
      return (a.ativos - b.ativos) * mult;
    case "ultimoAcesso":
      return compareDateStr(a.ultimoAcesso, b.ultimoAcesso) * mult;
    default:
      return 0;
  }
};

export const comparePac = (
  a: PacRow,
  b: PacRow,
  sort: { key: PacSortKey; dir: SortDir },
) => {
  const mult = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return compareStr(a.nome, b.nome) * mult;
    case "profissionalNome":
      return compareStr(a.profissionalNome, b.profissionalNome) * mult;
    case "status":
      return compareStr(a.status, b.status) * mult;
    case "ultimoCheckin":
      return compareDateStr(a.ultimoCheckin, b.ultimoCheckin) * mult;
    default:
      return 0;
  }
};

export const computeAccountHealthScore = (
  prof: ProfRow,
  patients: PacRow[],
): AccountHealthScore => {
  let score = 100;
  const reasons: string[] = [];
  const total = Math.max(0, prof.pacientes);
  const active = Math.max(0, prof.ativos);
  const activeRatio = total > 0 ? active / total : 0;
  const riskCount = patients.filter((patient) => patient.status === "RISCO").length;
  const riskRatio = patients.length > 0 ? riskCount / patients.length : 0;

  if (total === 0) {
    score -= 35;
    reasons.push("sem pacientes");
  }
  if (activeRatio < 0.5) {
    score -= 20;
    reasons.push("baixa ativação");
  } else if (activeRatio < 0.75) {
    score -= 10;
    reasons.push("ativação parcial");
  }
  if (prof.adesao < 50) {
    score -= 20;
    reasons.push("adesão média baixa");
  } else if (prof.adesao < 70) {
    score -= 10;
    reasons.push("adesão moderada");
  }
  if (riskRatio >= 0.4 && riskCount > 0) {
    score -= 20;
    reasons.push("muitos pacientes em risco");
  } else if (riskRatio >= 0.2 && riskCount > 0) {
    score -= 10;
    reasons.push("pacientes em atenção");
  }
  if (active === 0 && total > 0) {
    score -= 15;
    reasons.push("sem pacientes ativos");
  }

  score = Math.max(0, Math.min(100, score));
  const status: AccountHealthStatus =
    score >= 75 ? "HEALTHY" : score >= 50 ? "ATTENTION" : "RISK";

  let nextAction = "Acompanhar carteira";
  if (status === "RISK") nextAction = "Fazer contato e plano de reativação";
  else if (reasons.some((reason) => reason.includes("adesão"))) {
    nextAction = "Reforçar adesão dos pacientes";
  } else if (reasons.some((reason) => reason.includes("ativação"))) {
    nextAction = "Ativar pacientes e revisar rotina";
  } else if (
    reasons.some(
      (reason) => reason.includes("risco") || reason.includes("atenção"),
    )
  ) {
    nextAction = "Priorizar pacientes em risco";
  }

  return {
    score,
    status,
    reasons: reasons.length ? reasons.slice(0, 3) : ["conta estável"],
    nextAction,
  };
};

export const accountHealthStatusLabel = (status?: AccountHealthStatus) => {
  if (status === "HEALTHY") return "Conta saudável";
  if (status === "ATTENTION") return "Atenção";
  if (status === "RISK") return "Risco";
  return "";
};

export const automationHistoryActionLabel = (
  action: CrmAutomationHistoryItem["action"],
) => {
  if (action === "EXECUTED") return "Executada";
  if (action === "DISMISSED") return "Dispensada";
  return "Reset";
};
