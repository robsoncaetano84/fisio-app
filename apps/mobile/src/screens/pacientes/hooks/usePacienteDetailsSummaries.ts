import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Anamnese, Evolucao, MotivoBusca } from "../../../types";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export type NextBestActionCode =
  | "SEND_CHECKIN_REMINDER"
  | "SEND_ADHERENCE_REMINDER"
  | "SCHEDULE_RETURN"
  | "OPEN_ADHERENCE_PANEL"
  | "RECORD_EVOLUTION";

export type AdherenceRiskReasonCode =
  | "NO_EVOLUTION"
  | "LONG_GAP"
  | "MEDIUM_GAP"
  | "LOW_ADHERENCE"
  | "MEDIUM_ADHERENCE"
  | "HIGH_STRESS"
  | "LOW_ENERGY"
  | "LOW_SUPPORT"
  | "POOR_SLEEP";

type LifestyleTone = "good" | "warn" | "risk";

export interface LifestyleSummary {
  status: string;
  tone: LifestyleTone;
  chips: string[];
  observacoes: string;
}

export interface FunctionalSummary {
  limitacoes: string;
  piora: string;
  meta: string;
}

export interface CaseSummaryItem {
  key: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface UsePacienteDetailsSummariesParams {
  anamneses: Anamnese[];
  evolucoesDoPaciente: Evolucao[];
  pacienteId: string;
  latestAnamnese?: Anamnese;
  latestEvolucao?: Evolucao;
  dateLocale: string;
  t: TranslateFn;
}

export const parseDatePreservingDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const getMotivoBuscaLabel = (
  motivoBusca: MotivoBusca | string | null | undefined,
  t: TranslateFn,
) => {
  if (!motivoBusca) return t("patientDetails.notInformed");
  if (motivoBusca === MotivoBusca.SINTOMA_EXISTENTE) {
    return t("patientDetails.seekReasonExisting");
  }
  if (motivoBusca === MotivoBusca.PREVENTIVO) {
    return t("patientDetails.seekReasonPreventive");
  }
  return String(motivoBusca).replace(/_/g, " ");
};

export function usePacienteDetailsSummaries({
  anamneses,
  evolucoesDoPaciente,
  pacienteId,
  latestAnamnese,
  latestEvolucao,
  dateLocale,
  t,
}: UsePacienteDetailsSummariesParams) {
  const adesao = useMemo(() => {
    const now = Date.now();
    const last28Days = 28 * 24 * 60 * 60 * 1000;
    const last14Days = 14 * 24 * 60 * 60 * 1000;
    const last7Days = 7 * 24 * 60 * 60 * 1000;

    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    const sessionsIn28Days = evolucoesDoPaciente.filter((e) => {
      const time = parseDatePreservingDateOnly(e.data).getTime();
      if (Number.isNaN(time)) return false;
      return now - time <= last28Days;
    }).length;

    const score = Math.max(
      0,
      Math.min(100, Math.round((sessionsIn28Days / 4) * 100)),
    );

    const lastSession = evolucoesDoPaciente[0];
    const lastSessionMs = lastSession
      ? parseDatePreservingDateOnly(lastSession.data).getTime()
      : NaN;
    const daysWithoutSession = Number.isNaN(lastSessionMs)
      ? null
      : Math.floor((now - lastSessionMs) / (24 * 60 * 60 * 1000));

    const riskReasons: AdherenceRiskReasonCode[] = [];
    let riskScore = 0;

    if (daysWithoutSession === null) {
      riskScore += 80;
      riskReasons.push("NO_EVOLUTION");
    } else if (now - lastSessionMs > last14Days) {
      riskScore += 60;
      riskReasons.push("LONG_GAP");
    } else if (now - lastSessionMs > last7Days) {
      riskScore += 35;
      riskReasons.push("MEDIUM_GAP");
    }

    if (score < 50) {
      riskScore += 30;
      riskReasons.push("LOW_ADHERENCE");
    } else if (score < 75) {
      riskScore += 15;
      riskReasons.push("MEDIUM_ADHERENCE");
    }

    if ((ultimaAnamnese?.nivelEstresse ?? 0) >= 8) {
      riskScore += 12;
      riskReasons.push("HIGH_STRESS");
    }
    if (
      typeof ultimaAnamnese?.energiaDiaria === "number" &&
      ultimaAnamnese.energiaDiaria <= 3
    ) {
      riskScore += 10;
      riskReasons.push("LOW_ENERGY");
    }
    if (
      typeof ultimaAnamnese?.apoioEmocional === "number" &&
      ultimaAnamnese.apoioEmocional <= 3
    ) {
      riskScore += 8;
      riskReasons.push("LOW_SUPPORT");
    }
    if (
      typeof ultimaAnamnese?.qualidadeSono === "number" &&
      ultimaAnamnese.qualidadeSono <= 3
    ) {
      riskScore += 8;
      riskReasons.push("POOR_SLEEP");
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    let risco: "ALTO" | "MODERADO" | "BAIXO" = "BAIXO";
    if (riskScore >= 70) {
      risco = "ALTO";
    } else if (riskScore >= 40) {
      risco = "MODERADO";
    }

    const proximaSessaoSugerida = Number.isNaN(lastSessionMs)
      ? new Date(now + 24 * 60 * 60 * 1000)
      : new Date(lastSessionMs + 7 * 24 * 60 * 60 * 1000);

    const hasEmotionalVulnerability =
      riskReasons.includes("HIGH_STRESS") ||
      riskReasons.includes("LOW_ENERGY") ||
      riskReasons.includes("LOW_SUPPORT") ||
      riskReasons.includes("POOR_SLEEP");
    const hasHighEmotionalVulnerability =
      riskReasons.includes("HIGH_STRESS") &&
      (riskReasons.includes("LOW_ENERGY") ||
        riskReasons.includes("LOW_SUPPORT"));

    let nextBestAction: NextBestActionCode = "RECORD_EVOLUTION";
    if (daysWithoutSession === null || (daysWithoutSession ?? 0) >= 14) {
      nextBestAction = "SCHEDULE_RETURN";
    } else if (hasHighEmotionalVulnerability) {
      nextBestAction = "SCHEDULE_RETURN";
    } else if ((daysWithoutSession ?? 0) >= 7) {
      nextBestAction = "SEND_CHECKIN_REMINDER";
    } else if (hasEmotionalVulnerability) {
      nextBestAction = "SEND_CHECKIN_REMINDER";
    } else if (score < 50) {
      nextBestAction = "SEND_ADHERENCE_REMINDER";
    } else if (score < 75) {
      nextBestAction = "OPEN_ADHERENCE_PANEL";
    }

    return {
      sessionsIn28Days,
      score,
      riskScore,
      riskReasons,
      daysWithoutSession,
      risco,
      proximaSessaoSugerida,
      nextBestAction,
      hasEmotionalVulnerability,
      hasHighEmotionalVulnerability,
    };
  }, [evolucoesDoPaciente, anamneses, pacienteId]);

  const resumoEstiloVidaEmocional = useMemo<LifestyleSummary | null>(() => {
    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    if (!ultimaAnamnese) return null;

    const chips: string[] = [];

    if (ultimaAnamnese.horasSonoMedia?.trim()) {
      chips.push(
        t("patientDetails.lifestyleSleep", {
          value: ultimaAnamnese.horasSonoMedia.trim(),
        }),
      );
    }
    if (typeof ultimaAnamnese.qualidadeSono === "number") {
      chips.push(
        t("patientDetails.lifestyleSleepQuality", {
          value: ultimaAnamnese.qualidadeSono,
        }),
      );
    }
    if (typeof ultimaAnamnese.nivelEstresse === "number") {
      chips.push(
        t("patientDetails.lifestyleStress", {
          value: ultimaAnamnese.nivelEstresse,
        }),
      );
    }
    if (typeof ultimaAnamnese.energiaDiaria === "number") {
      chips.push(
        t("patientDetails.lifestyleEnergy", {
          value: ultimaAnamnese.energiaDiaria,
        }),
      );
    }
    if (typeof ultimaAnamnese.apoioEmocional === "number") {
      chips.push(
        t("patientDetails.lifestyleEmotionalSupport", {
          value: ultimaAnamnese.apoioEmocional,
        }),
      );
    }
    if (ultimaAnamnese.humorPredominante?.trim()) {
      chips.push(
        t("patientDetails.lifestyleMood", {
          value: ultimaAnamnese.humorPredominante.trim(),
        }),
      );
    }
    if (ultimaAnamnese.atividadeFisicaRegular === true) {
      chips.push(
        ultimaAnamnese.frequenciaAtividadeFisica?.trim()
          ? t("patientDetails.lifestylePhysicalActivity", {
              value: ultimaAnamnese.frequenciaAtividadeFisica.trim(),
            })
          : t("patientDetails.lifestylePhysicalActivityYes"),
      );
    } else if (ultimaAnamnese.atividadeFisicaRegular === false) {
      chips.push(t("patientDetails.lifestylePhysicalActivityNo"));
    }

    const hasAnyData =
      chips.length > 0 || !!ultimaAnamnese.observacoesEstiloVida?.trim();

    if (!hasAnyData) return null;

    let status = t("patientDetails.lifestyleNoRelevantAlert");
    let tone: LifestyleTone = "good";
    const estresse = ultimaAnamnese.nivelEstresse ?? 0;
    const energia = ultimaAnamnese.energiaDiaria ?? 0;
    const apoio = ultimaAnamnese.apoioEmocional ?? 0;

    if (estresse >= 8 || energia <= 3 || apoio <= 3) {
      status = t("patientDetails.lifestyleRiskAttention");
      tone = "risk";
    } else if (estresse >= 6 || energia <= 5 || apoio <= 5) {
      status = t("patientDetails.lifestyleWarnAttention");
      tone = "warn";
    }

    return {
      status,
      tone,
      chips,
      observacoes: ultimaAnamnese.observacoesEstiloVida?.trim() || "",
    };
  }, [anamneses, pacienteId, t]);

  const resumoFuncionalObjetivos = useMemo<FunctionalSummary | null>(() => {
    const ultimaAnamnese = anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    if (!ultimaAnamnese) return null;

    const limitacoes = ultimaAnamnese.limitacoesFuncionais?.trim() || "";
    const piora = ultimaAnamnese.atividadesQuePioram?.trim() || "";
    const meta = ultimaAnamnese.metaPrincipalPaciente?.trim() || "";

    if (!limitacoes && !piora && !meta) return null;

    return { limitacoes, piora, meta };
  }, [anamneses, pacienteId]);

  const caseSummaryItems = useMemo<CaseSummaryItem[]>(() => {
    const items: CaseSummaryItem[] = [];

    if (latestAnamnese?.motivoBusca) {
      items.push({
        key: "queixa",
        label: t("patientDetails.mainComplaint"),
        value: getMotivoBuscaLabel(latestAnamnese.motivoBusca, t),
        icon: "pulse-outline",
      });
    }

    const areasResumo = latestAnamnese?.areasAfetadas
      ?.slice(0, 3)
      .map((area) => {
        const detalhes = [
          area.lado ? String(area.lado) : "",
          typeof area.intensidade === "number"
            ? t("patientDetails.painIntensityShort", {
                value: area.intensidade,
              })
            : "",
        ]
          .filter(Boolean)
          .join(", ");
        return `${area.regiao}${detalhes ? ` (${detalhes})` : ""}`;
      })
      .filter(Boolean)
      .join("; ");

    if (areasResumo) {
      items.push({
        key: "areas",
        label: t("patientDetails.affectedAreas"),
        value: areasResumo,
        icon: "body-outline",
      });
    }

    if (resumoFuncionalObjetivos?.limitacoes) {
      items.push({
        key: "limitacoes",
        label: t("patientDetails.limitations"),
        value: resumoFuncionalObjetivos.limitacoes,
        icon: "walk-outline",
      });
    }

    if (resumoFuncionalObjetivos?.meta) {
      items.push({
        key: "meta",
        label: t("patientDetails.patientGoal"),
        value: resumoFuncionalObjetivos.meta,
        icon: "flag-outline",
      });
    }

    if (latestEvolucao) {
      const dataUltima = parseDatePreservingDateOnly(latestEvolucao.data);
      const dataLabel = Number.isNaN(dataUltima.getTime())
        ? t("patientDetails.dateUnavailable")
        : dataUltima.toLocaleDateString(dateLocale);
      const avaliacao =
        latestEvolucao.avaliacao || latestEvolucao.ajustes || "";
      items.push({
        key: "evolucao",
        label: t("patientDetails.latestEvolution"),
        value: avaliacao ? `${dataLabel} - ${avaliacao}` : dataLabel,
        icon: "trending-up-outline",
      });
    }

    if (resumoEstiloVidaEmocional?.tone === "risk") {
      items.push({
        key: "alerta",
        label: t("patientDetails.attention"),
        value: resumoEstiloVidaEmocional.status,
        icon: "alert-circle-outline",
      });
    }

    if (!items.length) {
      items.push({
        key: "empty",
        label: t("patientDetails.summary"),
        value: t("patientDetails.noClinicalSummary"),
        icon: "document-text-outline",
      });
    }

    return items.slice(0, 5);
  }, [
    dateLocale,
    latestAnamnese,
    latestEvolucao,
    resumoEstiloVidaEmocional,
    resumoFuncionalObjetivos,
    t,
  ]);

  const riskReasonLabels = useMemo<Record<AdherenceRiskReasonCode, string>>(
    () => ({
      NO_EVOLUTION: t("patientDetails.riskNoEvolution"),
      LONG_GAP: t("patientDetails.riskLongGap"),
      MEDIUM_GAP: t("patientDetails.riskMediumGap"),
      LOW_ADHERENCE: t("patientDetails.riskLowAdherence"),
      MEDIUM_ADHERENCE: t("patientDetails.riskMediumAdherence"),
      HIGH_STRESS: t("patientDetails.riskHighStress"),
      LOW_ENERGY: t("patientDetails.riskLowEnergy"),
      LOW_SUPPORT: t("patientDetails.riskLowSupport"),
      POOR_SLEEP: t("patientDetails.riskPoorSleep"),
    }),
    [t],
  );

  const contextualNextActionHint = useMemo(() => {
    if (!resumoFuncionalObjetivos) return "";
    if (resumoFuncionalObjetivos.meta) {
      return ` ${t("patientDetails.contextGoalHint", {
        value: resumoFuncionalObjetivos.meta,
      })}`;
    }
    if (resumoFuncionalObjetivos.limitacoes) {
      return ` ${t("patientDetails.contextLimitationsHint")}`;
    }
    return "";
  }, [resumoFuncionalObjetivos, t]);

  const hasFunctionalContextForMessage = !!(
    resumoFuncionalObjetivos?.meta ||
    resumoFuncionalObjetivos?.limitacoes ||
    resumoFuncionalObjetivos?.piora
  );

  return {
    adesao,
    caseSummaryItems,
    contextualNextActionHint,
    hasFunctionalContextForMessage,
    resumoEstiloVidaEmocional,
    resumoFuncionalObjetivos,
    riskReasonLabels,
  };
}
