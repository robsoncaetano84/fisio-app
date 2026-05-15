export type CrmClinicalDashboardStage =
  | 'ANAMNESE'
  | 'EXAME_FISICO'
  | 'EVOLUCAO';

export type CrmClinicalDashboardPatientSignal = {
  id: string;
  createdAt: Date | string;
  hasAnamnese: boolean;
  lastEvolucaoAt?: Date | string | null;
  lastLaudoUpdatedAt?: Date | string | null;
  hasAltaDocumento: boolean;
  hasActiveActivity: boolean;
  lastCheckinAt?: Date | string | null;
  aguardandoVinculo: boolean;
  conviteEnviado: boolean;
};

export type CrmClinicalDashboardFlowRow = {
  stage: CrmClinicalDashboardStage;
  avgDuration: string | number | null;
  opened: string | number;
  abandoned: string | number;
  completed: string | number;
  blocked: string | number;
  autosaved?: string | number;
};

export type CrmClinicalDashboardBlockedReasonRow = {
  reason: string | null;
  count: string | number;
};

export type CrmClinicalDashboardStageEventCounts = {
  opened: number;
  abandoned: number;
  completed: number;
  blocked: number;
  autosaved: number;
};

type CrmClinicalDashboardSummaryParams = {
  patients: CrmClinicalDashboardPatientSignal[];
  flowRows: CrmClinicalDashboardFlowRow[];
  blockedReasonRows?: CrmClinicalDashboardBlockedReasonRow[];
  now: number;
  windowDays: number;
  semEvolucaoDias: number;
  statusFilter?: string;
  professionalId?: string;
  patientId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function buildEmptyEventosPorEtapa(): Record<
  CrmClinicalDashboardStage,
  CrmClinicalDashboardStageEventCounts
> {
  return {
    ANAMNESE: {
      opened: 0,
      abandoned: 0,
      completed: 0,
      blocked: 0,
      autosaved: 0,
    },
    EXAME_FISICO: {
      opened: 0,
      abandoned: 0,
      completed: 0,
      blocked: 0,
      autosaved: 0,
    },
    EVOLUCAO: {
      opened: 0,
      abandoned: 0,
      completed: 0,
      blocked: 0,
      autosaved: 0,
    },
  };
}

function toTimestamp(value?: Date | string | null): number {
  if (!value) return NaN;
  return new Date(value).getTime();
}

function matchesOperationalStatus(params: {
  statusFilter?: string;
  patient: CrmClinicalDashboardPatientSignal;
  tratamentoConcluido: boolean;
  now: number;
  activityWindowMs: number;
}): boolean {
  const { statusFilter, patient, tratamentoConcluido, now, activityWindowMs } =
    params;
  if (!statusFilter || statusFilter === 'ALL' || statusFilter === 'TODOS') {
    return true;
  }

  const createdAtMs = toTimestamp(patient.createdAt);
  return (
    (statusFilter === 'NOVO_PACIENTE' &&
      !patient.hasAnamnese &&
      now - createdAtMs <= activityWindowMs) ||
    (statusFilter === 'AGUARDANDO_VINCULO' && patient.aguardandoVinculo) ||
    (statusFilter === 'ANAMNESE_PENDENTE' && !patient.hasAnamnese) ||
    (statusFilter === 'EM_TRATAMENTO' &&
      patient.hasAnamnese &&
      !tratamentoConcluido) ||
    (statusFilter === 'ALTA' && tratamentoConcluido)
  );
}

export function buildEmptyCrmClinicalDashboardSummary() {
  return {
    pipeline: {
      novoPaciente: 0,
      aguardandoVinculo: 0,
      anamnesePendente: 0,
      emTratamento: 0,
      alta: 0,
    },
    alertas: {
      semCheckin: 0,
      semEvolucao: 0,
      conviteNaoAceito: 0,
      anamnesePendente: 0,
    },
    metricas: {
      abandonoRate: 0,
      conclusaoPlanoRate: 0,
      pacientesEmAtencao: 0,
      tempoMedioPorEtapaMs: {
        ANAMNESE: 0,
        EXAME_FISICO: 0,
        EVOLUCAO: 0,
      },
      openedTotal: 0,
      abandonedTotal: 0,
      completedTotal: 0,
      blockedTotal: 0,
      autosaveTotal: 0,
      eventosPorEtapa: buildEmptyEventosPorEtapa(),
      topBlockedReasons: [],
    },
  };
}

export function buildCrmClinicalDashboardSummary(
  params: CrmClinicalDashboardSummaryParams,
) {
  const activityWindowMs = params.windowDays * DAY_MS;
  const semEvolucaoWindowMs = params.semEvolucaoDias * DAY_MS;
  const inactiveClosedWindowMs = 30 * DAY_MS;

  let novoPaciente = 0;
  let aguardandoVinculo = 0;
  let anamnesePendente = 0;
  let emTratamento = 0;
  let alta = 0;
  let semCheckin = 0;
  let semEvolucao = 0;
  let conviteNaoAceito = 0;
  let pacientesEmAtencao = 0;

  for (const patient of params.patients) {
    const lastEvolucaoMs = toTimestamp(patient.lastEvolucaoAt);
    const lastLaudoUpdatedMs = toTimestamp(patient.lastLaudoUpdatedAt);
    const lastCheckinMs = toTimestamp(patient.lastCheckinAt);
    const createdAtMs = toTimestamp(patient.createdAt);
    const tratamentoConcluido =
      patient.hasAltaDocumento && !patient.hasActiveActivity;

    if (
      !matchesOperationalStatus({
        statusFilter: params.statusFilter,
        patient,
        tratamentoConcluido,
        now: params.now,
        activityWindowMs,
      })
    ) {
      continue;
    }

    if (!patient.hasAnamnese && params.now - createdAtMs <= activityWindowMs) {
      novoPaciente += 1;
    }
    if (patient.aguardandoVinculo) {
      aguardandoVinculo += 1;
    }
    if (!patient.hasAnamnese) {
      anamnesePendente += 1;
    }
    if (patient.hasAnamnese && !tratamentoConcluido) {
      emTratamento += 1;
    }
    if (tratamentoConcluido) {
      alta += 1;
    }

    const lastClinicalEventMs = Math.max(
      Number.isNaN(lastCheckinMs) ? -1 : lastCheckinMs,
      Number.isNaN(lastEvolucaoMs) ? -1 : lastEvolucaoMs,
      Number.isNaN(lastLaudoUpdatedMs) ? -1 : lastLaudoUpdatedMs,
    );
    const inativoEncerrado =
      tratamentoConcluido &&
      lastClinicalEventMs > 0 &&
      params.now - lastClinicalEventMs > inactiveClosedWindowMs;

    if (tratamentoConcluido || inativoEncerrado) {
      continue;
    }

    if (patient.hasActiveActivity) {
      if (
        Number.isNaN(lastCheckinMs) ||
        params.now - lastCheckinMs > activityWindowMs
      ) {
        semCheckin += 1;
      }
    }
    if (
      Number.isNaN(lastEvolucaoMs) ||
      params.now - lastEvolucaoMs > semEvolucaoWindowMs
    ) {
      semEvolucao += 1;
      pacientesEmAtencao += 1;
    }
    if (patient.conviteEnviado) {
      conviteNaoAceito += 1;
    }
  }

  const tempoMedioPorEtapaMs = {
    ANAMNESE: 0,
    EXAME_FISICO: 0,
    EVOLUCAO: 0,
  };
  const eventosPorEtapa = buildEmptyEventosPorEtapa();
  let openedTotal = 0;
  let abandonedTotal = 0;
  let completedTotal = 0;
  let blockedTotal = 0;
  let autosaveTotal = 0;
  params.flowRows.forEach((row) => {
    const opened = Number(row.opened || 0);
    const abandoned = Number(row.abandoned || 0);
    const completed = Number(row.completed || 0);
    const blocked = Number(row.blocked || 0);
    const autosaved = Number(row.autosaved || 0);

    tempoMedioPorEtapaMs[row.stage] = Number(row.avgDuration || 0);
    eventosPorEtapa[row.stage] = {
      opened,
      abandoned,
      completed,
      blocked,
      autosaved,
    };
    openedTotal += opened;
    abandonedTotal += abandoned;
    completedTotal += completed;
    blockedTotal += blocked;
    autosaveTotal += autosaved;
  });

  const topBlockedReasons = (params.blockedReasonRows || [])
    .map((row) => ({
      reason: row.reason || 'UNKNOWN',
      count: Number(row.count || 0),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const abandonoRate =
    openedTotal > 0
      ? Number(((abandonedTotal / openedTotal) * 100).toFixed(1))
      : 0;
  const conclusaoPlanoRate =
    params.patients.length > 0
      ? Number(((alta / params.patients.length) * 100).toFixed(1))
      : 0;

  return {
    pipeline: {
      novoPaciente,
      aguardandoVinculo,
      anamnesePendente,
      emTratamento,
      alta,
    },
    alertas: {
      semCheckin,
      semEvolucao,
      conviteNaoAceito,
      anamnesePendente,
    },
    metricas: {
      abandonoRate,
      conclusaoPlanoRate,
      pacientesEmAtencao,
      tempoMedioPorEtapaMs,
      openedTotal,
      abandonedTotal,
      completedTotal,
      blockedTotal,
      autosaveTotal,
      eventosPorEtapa,
      topBlockedReasons,
    },
    filtros: {
      professionalId: params.professionalId || null,
      patientId: params.patientId || null,
      status: params.statusFilter || null,
    },
  };
}
