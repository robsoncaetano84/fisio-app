import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import {
  buildCharlesClinicalContext,
  hasCriticalRedFlag,
  hasStructuredExame,
} from './charles-clinical-context.util';

export type CharlesClinicalStage =
  | 'ANAMNESE'
  | 'EXAME_FISICO'
  | 'EVOLUCAO'
  | 'LAUDO'
  | 'PLANO'
  | 'MONITORAMENTO';

export type CharlesStageStatus = 'PENDING' | 'COMPLETED' | 'BLOCKED';

export interface CharlesStageItem {
  stage: CharlesClinicalStage;
  status: CharlesStageStatus;
  reason: string;
}

export interface CharlesNextAction {
  stage: CharlesClinicalStage;
  reason: string;
  guidance: string;
}

export interface CharlesNextActionResponse {
  orchestrator: 'CLINICAL_ORCHESTRATOR';
  mode: 'deterministic-v1';
  requiresProfessionalApproval: true;
  protocolVersion: string | null;
  protocolName: string | null;
  blocked: boolean;
  paciente: {
    id: string;
    nomeCompleto: string;
  };
  context: {
    regioesPrioritarias: string[];
    regioesRelacionadas: string[];
    cadeiaProvavel: string | null;
  };
  timeline: {
    anamneseEm: Date | null;
    exameFisicoEm: Date | null;
    evolucaoEm: Date | null;
    laudoEm: Date | null;
  };
  blockers: Array<{
    code: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    message: string;
  }>;
  alerts: Array<{
    code: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
  }>;
  stages: CharlesStageItem[];
  nextAction: CharlesNextAction;
}

export type BuildCharlesNextActionResponseArgs = {
  paciente: {
    id: string;
    nomeCompleto: string;
  };
  latestAnamnese?: Partial<Anamnese> | null;
  latestEvolucao?: Partial<Evolucao> | null;
  latestLaudo?: Partial<Laudo> | null;
  activeProtocol?: {
    version: string;
    name: string;
  } | null;
};

export function buildCharlesNextActionResponse(
  args: BuildCharlesNextActionResponseArgs,
): CharlesNextActionResponse {
  const {
    paciente,
    latestAnamnese,
    latestEvolucao,
    latestLaudo,
    activeProtocol,
  } = args;

  const hasAnamnese = !!latestAnamnese;
  const hasExameFisico = hasStructuredExame(latestLaudo?.exameFisico);
  const hasEvolucao = !!latestEvolucao;
  const laudoValidado =
    latestLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL;
  const hasPlanoOuAlta = !!String(latestLaudo?.criteriosAlta || '').trim();
  const hasCriticalRedFlagResult = hasCriticalRedFlag(latestAnamnese?.redFlags);
  const context = buildCharlesClinicalContext(latestAnamnese);
  const blockers = buildBlockers(hasCriticalRedFlagResult);
  const alerts = buildAlerts(latestAnamnese);
  const stages = buildStages({
    hasAnamnese,
    hasExameFisico,
    hasEvolucao,
    laudoValidado,
    hasPlanoOuAlta,
    hasCriticalRedFlag: hasCriticalRedFlagResult,
  });
  const nextAction = resolveNextAction({
    hasAnamnese,
    hasExameFisico,
    hasEvolucao,
    laudoValidado,
    hasPlanoOuAlta,
    hasCriticalRedFlag: hasCriticalRedFlagResult,
  });

  return {
    orchestrator: 'CLINICAL_ORCHESTRATOR',
    mode: 'deterministic-v1',
    requiresProfessionalApproval: true,
    protocolVersion: activeProtocol?.version || null,
    protocolName: activeProtocol?.name || null,
    blocked: blockers.length > 0,
    paciente: {
      id: paciente.id,
      nomeCompleto: paciente.nomeCompleto,
    },
    context,
    timeline: {
      anamneseEm: latestAnamnese?.createdAt || null,
      exameFisicoEm: hasExameFisico ? latestLaudo?.updatedAt || null : null,
      evolucaoEm: latestEvolucao?.data || null,
      laudoEm: latestLaudo?.updatedAt || null,
    },
    blockers,
    alerts,
    stages,
    nextAction,
  };
}

function buildBlockers(
  hasCriticalRedFlagResult: boolean,
): CharlesNextActionResponse['blockers'] {
  if (!hasCriticalRedFlagResult) return [];
  return [
    {
      code: 'RED_FLAG_CRITICA',
      severity: 'CRITICAL',
      message:
        'Red flag critica detectada na anamnese. Continuidade do ciclo deve ser bloqueada ate encaminhamento.',
    },
  ];
}

function buildAlerts(
  latestAnamnese?: Partial<Anamnese> | null,
): CharlesNextActionResponse['alerts'] {
  if ((latestAnamnese?.yellowFlags || []).length < 2) return [];
  return [
    {
      code: 'YELLOW_FLAGS_RELEVANTES',
      severity: 'MEDIUM',
      message:
        'Paciente com yellow flags relevantes; manter acompanhamento de adesao e abordagem biopsicossocial.',
    },
  ];
}

function buildStages(args: {
  hasAnamnese: boolean;
  hasExameFisico: boolean;
  hasEvolucao: boolean;
  laudoValidado: boolean;
  hasPlanoOuAlta: boolean;
  hasCriticalRedFlag: boolean;
}): CharlesStageItem[] {
  const stages: CharlesStageItem[] = [
    {
      stage: 'ANAMNESE',
      status: args.hasAnamnese ? 'COMPLETED' : 'PENDING',
      reason: args.hasAnamnese
        ? 'Anamnese registrada.'
        : 'Ainda nao existe anamnese para este paciente.',
    },
    {
      stage: 'EXAME_FISICO',
      status: args.hasExameFisico ? 'COMPLETED' : 'PENDING',
      reason: args.hasExameFisico
        ? 'Exame fisico estruturado encontrado no laudo mais recente.'
        : 'Exame fisico ainda nao preenchido.',
    },
    {
      stage: 'EVOLUCAO',
      status: args.hasEvolucao ? 'COMPLETED' : 'PENDING',
      reason: args.hasEvolucao
        ? 'Evolucao registrada.'
        : 'Sem evolucao registrada para o ciclo atual.',
    },
    {
      stage: 'LAUDO',
      status: args.laudoValidado ? 'COMPLETED' : 'PENDING',
      reason: args.laudoValidado
        ? 'Laudo validado pelo profissional.'
        : 'Laudo ainda em rascunho ou nao validado.',
    },
    {
      stage: 'PLANO',
      status: args.hasPlanoOuAlta ? 'COMPLETED' : 'PENDING',
      reason: args.hasPlanoOuAlta
        ? 'Plano/criterios de alta definidos.'
        : 'Defina criterios de alta e plano final do ciclo.',
    },
  ];

  if (!args.hasCriticalRedFlag) return stages;
  return stages.map((item) => {
    if (item.status === 'COMPLETED') return item;
    return {
      ...item,
      status: 'BLOCKED',
      reason:
        'Etapa bloqueada por red flag critica ate encaminhamento e reavaliacao.',
    };
  });
}

function resolveNextAction(args: {
  hasAnamnese: boolean;
  hasExameFisico: boolean;
  hasEvolucao: boolean;
  laudoValidado: boolean;
  hasPlanoOuAlta: boolean;
  hasCriticalRedFlag: boolean;
}): CharlesNextAction {
  if (args.hasCriticalRedFlag) {
    return {
      stage: 'MONITORAMENTO',
      reason: 'Red flag critica detectada.',
      guidance:
        'Interromper continuidade do fluxo e encaminhar paciente para avaliacao medica/servico de urgencia conforme protocolo.',
    };
  }
  if (!args.hasAnamnese) {
    return {
      stage: 'ANAMNESE',
      reason: 'Sem anamnese registrada.',
      guidance: 'Registrar anamnese completa para iniciar o ciclo clinico.',
    };
  }
  if (!args.hasExameFisico) {
    return {
      stage: 'EXAME_FISICO',
      reason: 'Sem exame fisico estruturado.',
      guidance:
        'Preencher exame fisico orientado por regiao e cadeia relacionada.',
    };
  }
  if (!args.hasEvolucao) {
    return {
      stage: 'EVOLUCAO',
      reason: 'Sem evolucao clinica apos exame.',
      guidance: 'Registrar evolucao inicial e check-in da sessao.',
    };
  }
  if (!args.laudoValidado) {
    return {
      stage: 'LAUDO',
      reason: 'Laudo ainda nao validado.',
      guidance: 'Revisar e validar laudo/plano com aprovacao profissional.',
    };
  }
  if (!args.hasPlanoOuAlta) {
    return {
      stage: 'PLANO',
      reason: 'Plano final sem criterios de alta.',
      guidance: 'Definir criterios de alta e direcionamento do plano.',
    };
  }
  return {
    stage: 'MONITORAMENTO',
    reason: 'Ciclo clinico concluido.',
    guidance:
      'Manter monitoramento por check-ins e reavaliacao conforme necessidade.',
  };
}
