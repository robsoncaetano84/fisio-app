export type CrmCommandCenterSeverity = 'HIGH' | 'MEDIUM';

export type CrmCommandCenterActionType =
  | 'TASK_OVERDUE'
  | 'LEAD_STALE'
  | 'PATIENT_NO_EVOLUTION'
  | 'PATIENT_NO_CHECKIN'
  | 'PENDING_ANAMNESIS'
  | 'PENDING_INVITE'
  | 'LOW_ACTIVATION_ACCOUNT';

export type CrmCommandCenterTargetType =
  | 'TASK'
  | 'LEAD'
  | 'PATIENT'
  | 'PROFESSIONAL';

export type CrmCommandCenterItem = {
  id: string;
  type: CrmCommandCenterActionType;
  severity: CrmCommandCenterSeverity;
  title: string;
  description: string;
  ctaLabel: string;
  targetType: CrmCommandCenterTargetType;
  targetId: string;
  occurredAt: Date | string | null;
  metadata: Record<string, unknown>;
};

export type CrmCommandCenterTaskSignal = {
  id: string;
  titulo: string;
  dueAt: Date | string | null;
  leadId?: string | null;
  responsavelNome?: string | null;
  responsavelUsuarioId?: string | null;
};

export type CrmCommandCenterLeadSignal = {
  id: string;
  nome: string;
  stage: string;
  updatedAt: Date | string;
  responsavelNome?: string | null;
  responsavelUsuarioId?: string | null;
};

export type CrmCommandCenterPatientSignal = {
  id: string;
  nomeCompleto: string;
  professionalId?: string | null;
  profissionalNome?: string | null;
  createdAt: Date | string;
  hasAnamnese: boolean;
  lastEvolucaoAt?: Date | string | null;
  hasActiveActivity: boolean;
  lastCheckinAt?: Date | string | null;
  tratamentoConcluido: boolean;
  conviteEnviado: boolean;
  conviteEnviadoEm?: Date | string | null;
};

export type CrmCommandCenterProfessionalSignal = {
  id: string;
  nome: string;
  pacientesTotal: number;
  pacientesAtivos: number;
  lastPacienteUpdate?: Date | string | null;
};

export type BuildCrmCommandCenterParams = {
  now: number;
  windowDays: number;
  semEvolucaoDias: number;
  limit: number;
  overdueTasks: CrmCommandCenterTaskSignal[];
  staleLeads: CrmCommandCenterLeadSignal[];
  patients: CrmCommandCenterPatientSignal[];
  professionals: CrmCommandCenterProfessionalSignal[];
};

export type CrmCommandCenterSummary = {
  generatedAt: string;
  windowDays: number;
  semEvolucaoDias: number;
  kpis: {
    totalOpenActions: number;
    highPriorityActions: number;
    overdueTasks: number;
    staleLeads: number;
    patientsWithoutEvolution: number;
    patientsWithoutCheckin: number;
    pendingAnamnesis: number;
    pendingInvites: number;
    lowActivationAccounts: number;
  };
  nextActions: CrmCommandCenterItem[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_LEAD_DAYS = 3;
const STALE_LEAD_HIGH_DAYS = 7;
const PENDING_INVITE_HIGH_DAYS = 7;
const PENDING_ANAMNESIS_HIGH_DAYS = 7;
const LOW_ACTIVATION_RATIO = 0.5;
const PARTIAL_ACTIVATION_RATIO = 0.75;

function toTimestamp(value?: Date | string | null): number {
  if (!value) return NaN;
  return new Date(value).getTime();
}

function daysSince(value: Date | string | null | undefined, now: number) {
  const ts = toTimestamp(value);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((now - ts) / DAY_MS));
}

function formatDays(days: number | null) {
  if (days === null) return 'sem registro';
  if (days <= 0) return 'hoje';
  return `${days} dia${days === 1 ? '' : 's'}`;
}

function severityRank(severity: CrmCommandCenterSeverity) {
  return severity === 'HIGH' ? 0 : 1;
}

function sortActions(actions: CrmCommandCenterItem[]) {
  return actions.sort((a, b) => {
    const severityDiff = severityRank(a.severity) - severityRank(b.severity);
    if (severityDiff !== 0) return severityDiff;
    const aTs = toTimestamp(a.occurredAt);
    const bTs = toTimestamp(b.occurredAt);
    if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0;
    if (Number.isNaN(aTs)) return 1;
    if (Number.isNaN(bTs)) return -1;
    return aTs - bTs;
  });
}

export function buildCrmCommandCenterSummary(
  params: BuildCrmCommandCenterParams,
): CrmCommandCenterSummary {
  const overdueTaskItems: CrmCommandCenterItem[] = params.overdueTasks.map(
    (task) => {
      const overdueDays = daysSince(task.dueAt, params.now);
      return {
        id: `task:${task.id}`,
        type: 'TASK_OVERDUE',
        severity: 'HIGH',
        title: 'Tarefa vencida',
        description: `${task.titulo} - vencida há ${formatDays(overdueDays)}.`,
        ctaLabel: 'Abrir tarefas',
        targetType: 'TASK',
        targetId: task.id,
        occurredAt: task.dueAt,
        metadata: {
          taskTitulo: task.titulo,
          leadId: task.leadId || null,
          responsavelNome: task.responsavelNome || null,
          responsavelUsuarioId: task.responsavelUsuarioId || null,
        },
      };
    },
  );

  const staleLeadCandidates = params.staleLeads.filter((lead) => {
    const days = daysSince(lead.updatedAt, params.now);
    return days !== null && days >= STALE_LEAD_DAYS;
  });
  const staleLeadItems: CrmCommandCenterItem[] = staleLeadCandidates.map(
    (lead) => {
      const staleDays = daysSince(lead.updatedAt, params.now);
      return {
        id: `lead:${lead.id}`,
        type: 'LEAD_STALE',
        severity:
          staleDays !== null && staleDays >= STALE_LEAD_HIGH_DAYS
            ? 'HIGH'
            : 'MEDIUM',
        title: 'Lead sem follow-up',
        description: `${lead.nome} está parado há ${formatDays(staleDays)} no estágio ${lead.stage}.`,
        ctaLabel: 'Abrir lead',
        targetType: 'LEAD',
        targetId: lead.id,
        occurredAt: lead.updatedAt,
        metadata: {
          leadNome: lead.nome,
          stage: lead.stage,
          responsavelNome: lead.responsavelNome || null,
          responsavelUsuarioId: lead.responsavelUsuarioId || null,
        },
      };
    },
  );

  const pendingAnamnesisPatients = params.patients.filter(
    (patient) => !patient.hasAnamnese,
  );
  const pendingAnamnesisItems: CrmCommandCenterItem[] =
    pendingAnamnesisPatients.map((patient) => {
      const createdDays = daysSince(patient.createdAt, params.now);
      return {
        id: `patient-anamnesis:${patient.id}`,
        type: 'PENDING_ANAMNESIS',
        severity:
          createdDays !== null && createdDays >= PENDING_ANAMNESIS_HIGH_DAYS
            ? 'HIGH'
            : 'MEDIUM',
        title: 'Anamnese pendente',
        description: `${patient.nomeCompleto} ainda não tem anamnese registrada.`,
        ctaLabel: 'Abrir paciente',
        targetType: 'PATIENT',
        targetId: patient.id,
        occurredAt: patient.createdAt,
        metadata: {
          pacienteNome: patient.nomeCompleto,
          professionalId: patient.professionalId || null,
          profissionalNome: patient.profissionalNome || null,
          responsavelUsuarioId: patient.professionalId || null,
        },
      };
    });

  const noEvolutionPatients = params.patients.filter((patient) => {
    if (!patient.hasAnamnese || patient.tratamentoConcluido) return false;
    const days = daysSince(patient.lastEvolucaoAt, params.now);
    return days === null || days >= params.semEvolucaoDias;
  });
  const noEvolutionItems: CrmCommandCenterItem[] = noEvolutionPatients.map(
    (patient) => {
      const days = daysSince(patient.lastEvolucaoAt, params.now);
      return {
        id: `patient-evolution:${patient.id}`,
        type: 'PATIENT_NO_EVOLUTION',
        severity: 'HIGH',
        title: 'Paciente sem evolução recente',
        description: `${patient.nomeCompleto} está ${formatDays(days)} sem evolução registrada.`,
        ctaLabel: 'Abrir paciente',
        targetType: 'PATIENT',
        targetId: patient.id,
        occurredAt: patient.lastEvolucaoAt || patient.createdAt,
        metadata: {
          pacienteNome: patient.nomeCompleto,
          professionalId: patient.professionalId || null,
          profissionalNome: patient.profissionalNome || null,
          responsavelUsuarioId: patient.professionalId || null,
          semEvolucaoDias: params.semEvolucaoDias,
        },
      };
    },
  );

  const noCheckinPatients = params.patients.filter((patient) => {
    if (!patient.hasActiveActivity || patient.tratamentoConcluido) return false;
    const days = daysSince(patient.lastCheckinAt, params.now);
    return days === null || days >= params.windowDays;
  });
  const noCheckinItems: CrmCommandCenterItem[] = noCheckinPatients.map(
    (patient) => {
      const days = daysSince(patient.lastCheckinAt, params.now);
      return {
        id: `patient-checkin:${patient.id}`,
        type: 'PATIENT_NO_CHECKIN',
        severity:
          days === null || days >= params.windowDays * 2 ? 'HIGH' : 'MEDIUM',
        title: 'Check-in ausente',
        description: `${patient.nomeCompleto} está ${formatDays(days)} sem check-in em plano ativo.`,
        ctaLabel: 'Abrir paciente',
        targetType: 'PATIENT',
        targetId: patient.id,
        occurredAt: patient.lastCheckinAt || patient.createdAt,
        metadata: {
          pacienteNome: patient.nomeCompleto,
          professionalId: patient.professionalId || null,
          profissionalNome: patient.profissionalNome || null,
          responsavelUsuarioId: patient.professionalId || null,
          windowDays: params.windowDays,
        },
      };
    },
  );

  const pendingInvitePatients = params.patients.filter(
    (patient) => patient.conviteEnviado,
  );
  const pendingInviteItems: CrmCommandCenterItem[] = pendingInvitePatients.map(
    (patient) => {
      const days = daysSince(patient.conviteEnviadoEm, params.now);
      return {
        id: `patient-invite:${patient.id}`,
        type: 'PENDING_INVITE',
        severity:
          days !== null && days >= PENDING_INVITE_HIGH_DAYS ? 'HIGH' : 'MEDIUM',
        title: 'Convite não aceito',
        description: `${patient.nomeCompleto} está com convite pendente há ${formatDays(days)}.`,
        ctaLabel: 'Abrir vínculo',
        targetType: 'PATIENT',
        targetId: patient.id,
        occurredAt: patient.conviteEnviadoEm || patient.createdAt,
        metadata: {
          pacienteNome: patient.nomeCompleto,
          professionalId: patient.professionalId || null,
          profissionalNome: patient.profissionalNome || null,
          responsavelUsuarioId: patient.professionalId || null,
        },
      };
    },
  );

  const lowActivationProfessionals = params.professionals.filter((prof) => {
    if (prof.pacientesTotal <= 0) return true;
    return (
      prof.pacientesAtivos / prof.pacientesTotal < PARTIAL_ACTIVATION_RATIO
    );
  });
  const lowActivationItems: CrmCommandCenterItem[] =
    lowActivationProfessionals.map((prof) => {
      const activeRatio =
        prof.pacientesTotal > 0
          ? prof.pacientesAtivos / prof.pacientesTotal
          : 0;
      return {
        id: `professional-activation:${prof.id}`,
        type: 'LOW_ACTIVATION_ACCOUNT',
        severity:
          prof.pacientesTotal === 0 || activeRatio < LOW_ACTIVATION_RATIO
            ? 'HIGH'
            : 'MEDIUM',
        title: 'Conta com baixa ativação',
        description: `${prof.nome} tem ${prof.pacientesAtivos}/${prof.pacientesTotal} pacientes ativos.`,
        ctaLabel: 'Abrir profissional',
        targetType: 'PROFESSIONAL',
        targetId: prof.id,
        occurredAt: prof.lastPacienteUpdate || null,
        metadata: {
          professionalId: prof.id,
          profissionalNome: prof.nome,
          pacientesTotal: prof.pacientesTotal,
          pacientesAtivos: prof.pacientesAtivos,
        },
      };
    });

  const allActions = sortActions([
    ...overdueTaskItems,
    ...noEvolutionItems,
    ...noCheckinItems,
    ...pendingAnamnesisItems,
    ...pendingInviteItems,
    ...staleLeadItems,
    ...lowActivationItems,
  ]);

  const totalOpenActions =
    params.overdueTasks.length +
    staleLeadCandidates.length +
    pendingAnamnesisPatients.length +
    noEvolutionPatients.length +
    noCheckinPatients.length +
    pendingInvitePatients.length +
    lowActivationProfessionals.length;

  return {
    generatedAt: new Date(params.now).toISOString(),
    windowDays: params.windowDays,
    semEvolucaoDias: params.semEvolucaoDias,
    kpis: {
      totalOpenActions,
      highPriorityActions: allActions.filter((item) => item.severity === 'HIGH')
        .length,
      overdueTasks: params.overdueTasks.length,
      staleLeads: staleLeadCandidates.length,
      patientsWithoutEvolution: noEvolutionPatients.length,
      patientsWithoutCheckin: noCheckinPatients.length,
      pendingAnamnesis: pendingAnamnesisPatients.length,
      pendingInvites: pendingInvitePatients.length,
      lowActivationAccounts: lowActivationProfessionals.length,
    },
    nextActions: allActions.slice(0, params.limit),
  };
}
