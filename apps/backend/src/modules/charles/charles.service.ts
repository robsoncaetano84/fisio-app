import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceService } from '../clinical-governance/clinical-governance.service';

const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';
const CLINICAL_REGION_KEYS = [
  'CERVICAL',
  'TORACICA',
  'LOMBAR',
  'SACROILIACA',
  'QUADRIL',
  'JOELHO',
  'TORNOZELO_PE',
  'OMBRO',
  'COTOVELO',
  'PUNHO_MAO',
] as const;
type ClinicalRegionKey = (typeof CLINICAL_REGION_KEYS)[number];

const REGION_INFERENCE_RULES: Array<{ regex: RegExp; region: ClinicalRegionKey }> = [
  { regex: /(cerv|pescoc|cabec)/, region: 'CERVICAL' },
  { regex: /(torac|torax)/, region: 'TORACICA' },
  { regex: /(lomb|abdomen)/, region: 'LOMBAR' },
  { regex: /(sacro|iliac|pelve)/, region: 'SACROILIACA' },
  { regex: /(quadril|coxa)/, region: 'QUADRIL' },
  { regex: /(joelho)/, region: 'JOELHO' },
  { regex: /(tornoz|pe\b|pé)/, region: 'TORNOZELO_PE' },
  { regex: /(ombro|braco|braço)/, region: 'OMBRO' },
  { regex: /(cotovelo)/, region: 'COTOVELO' },
  { regex: /(punho|mao|mão)/, region: 'PUNHO_MAO' },
];

const CHAIN_REGION_MAP: Record<ClinicalRegionKey, ClinicalRegionKey[]> = {
  CERVICAL: ['CERVICAL', 'TORACICA', 'OMBRO', 'COTOVELO', 'PUNHO_MAO'],
  TORACICA: ['TORACICA', 'CERVICAL', 'OMBRO', 'LOMBAR'],
  LOMBAR: ['LOMBAR', 'SACROILIACA', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
  SACROILIACA: ['SACROILIACA', 'LOMBAR', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
  QUADRIL: ['QUADRIL', 'SACROILIACA', 'LOMBAR', 'JOELHO', 'TORNOZELO_PE'],
  JOELHO: ['JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR', 'TORNOZELO_PE'],
  TORNOZELO_PE: ['TORNOZELO_PE', 'JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR'],
  OMBRO: ['OMBRO', 'CERVICAL', 'TORACICA', 'COTOVELO', 'PUNHO_MAO'],
  COTOVELO: ['COTOVELO', 'OMBRO', 'PUNHO_MAO', 'CERVICAL'],
  PUNHO_MAO: ['PUNHO_MAO', 'COTOVELO', 'OMBRO', 'CERVICAL'],
};

export type CharlesClinicalStage =
  | 'ANAMNESE'
  | 'EXAME_FISICO'
  | 'EVOLUCAO'
  | 'LAUDO'
  | 'PLANO'
  | 'MONITORAMENTO';

export type CharlesStageStatus = 'PENDING' | 'COMPLETED';

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

@Injectable()
export class CharlesService {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly governanceService: ClinicalGovernanceService,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
  ) {}

  async getNextAction(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesNextActionResponse> {
    const paciente = await this.pacientesService.findOne(pacienteId, usuario.id);

    const [latestAnamnese, latestEvolucao, latestLaudo] = await Promise.all([
      this.anamneseRepository.findOne({
        where: { pacienteId: paciente.id },
        order: { createdAt: 'DESC' },
      }),
      this.evolucaoRepository.findOne({
        where: { pacienteId: paciente.id },
        order: { data: 'DESC' },
      }),
      this.laudoRepository.findOne({
        where: { pacienteId: paciente.id },
        order: { updatedAt: 'DESC' },
      }),
    ]);

    const hasAnamnese = !!latestAnamnese;
    const hasExameFisico = this.hasStructuredExame(latestLaudo?.exameFisico);
    const hasEvolucao = !!latestEvolucao;
    const laudoValidado = latestLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL;
    const hasPlanoOuAlta = !!String(latestLaudo?.criteriosAlta || '').trim();
    const hasCriticalRedFlag = !!(latestAnamnese?.redFlags || []).length;
    const context = this.buildClinicalContext(latestAnamnese);
    const blockers: CharlesNextActionResponse['blockers'] = [];
    const alerts: CharlesNextActionResponse['alerts'] = [];

    if (hasCriticalRedFlag) {
      blockers.push({
        code: 'RED_FLAG_CRITICA',
        severity: 'CRITICAL',
        message:
          'Red flag critica detectada na anamnese. Continuidade do ciclo deve ser bloqueada ate encaminhamento.',
      });
    }
    if ((latestAnamnese?.yellowFlags || []).length >= 2) {
      alerts.push({
        code: 'YELLOW_FLAGS_RELEVANTES',
        severity: 'MEDIUM',
        message:
          'Paciente com yellow flags relevantes; manter acompanhamento de adesao e abordagem biopsicossocial.',
      });
    }

    const stages: CharlesStageItem[] = [
      {
        stage: 'ANAMNESE',
        status: hasAnamnese ? 'COMPLETED' : 'PENDING',
        reason: hasAnamnese
          ? 'Anamnese registrada.'
          : 'Ainda nao existe anamnese para este paciente.',
      },
      {
        stage: 'EXAME_FISICO',
        status: hasExameFisico ? 'COMPLETED' : 'PENDING',
        reason: hasExameFisico
          ? 'Exame fisico estruturado encontrado no laudo mais recente.'
          : 'Exame fisico ainda nao preenchido.',
      },
      {
        stage: 'EVOLUCAO',
        status: hasEvolucao ? 'COMPLETED' : 'PENDING',
        reason: hasEvolucao
          ? 'Evolucao registrada.'
          : 'Sem evolucao registrada para o ciclo atual.',
      },
      {
        stage: 'LAUDO',
        status: laudoValidado ? 'COMPLETED' : 'PENDING',
        reason: laudoValidado
          ? 'Laudo validado pelo profissional.'
          : 'Laudo ainda em rascunho ou nao validado.',
      },
      {
        stage: 'PLANO',
        status: hasPlanoOuAlta ? 'COMPLETED' : 'PENDING',
        reason: hasPlanoOuAlta
          ? 'Plano/criterios de alta definidos.'
          : 'Defina criterios de alta e plano final do ciclo.',
      },
    ];

    const nextAction = this.resolveNextAction({
      hasAnamnese,
      hasExameFisico,
      hasEvolucao,
      laudoValidado,
      hasPlanoOuAlta,
      hasCriticalRedFlag,
    });

    const response: CharlesNextActionResponse = {
      orchestrator: 'CLINICAL_ORCHESTRATOR',
      mode: 'deterministic-v1',
      requiresProfessionalApproval: true,
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

    await this.governanceService.writeAudit({
      actor: usuario,
      actionType: 'READ',
      action: 'orchestrator.next_action.read',
      resourceType: 'CLINICAL_ORCHESTRATOR',
      resourceId: paciente.id,
      patientId: paciente.id,
      metadata: {
        nextStage: response.nextAction.stage,
        mode: response.mode,
      },
    });

    return response;
  }

  private hasStructuredExame(raw?: string | null): boolean {
    const value = String(raw || '').trim();
    if (!value) return false;
    return value.startsWith(STRUCTURED_EXAME_PREFIX) || value.length > 20;
  }

  private resolveNextAction(args: {
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
        guidance: 'Preencher exame fisico orientado por regiao e cadeia relacionada.',
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

  private buildClinicalContext(anamnese?: Anamnese | null): {
    regioesPrioritarias: string[];
    regioesRelacionadas: string[];
    cadeiaProvavel: string | null;
  } {
    const regioesSet = new Set<ClinicalRegionKey>();
    for (const area of anamnese?.areasAfetadas || []) {
      const raw = String(area.regiao || '').trim();
      const normalized = this.normalizeClinicalRegion(raw);
      if (normalized) regioesSet.add(normalized);
    }
    const regioes = Array.from(regioesSet);

    const regiaoKey = regioes.join(' ').toLowerCase();
    let cadeiaProvavel: string | null = null;
    if (/(lombar|sacroiliaca|quadril|joelho|tornozelo_pe)/.test(regiaoKey)) {
      cadeiaProvavel = 'CADEIA_LOWER';
    } else if (/(cervical|ombro|cotovelo|punho_mao|toracica)/.test(regiaoKey)) {
      cadeiaProvavel = 'CADEIA_UPPER';
    } else if (regioes.length > 0) {
      cadeiaProvavel = 'CADEIA_LOCAL';
    }

    const relacionadas = new Set<ClinicalRegionKey>();
    for (const regiao of regioes) {
      for (const related of CHAIN_REGION_MAP[regiao] || [regiao]) {
        relacionadas.add(related);
      }
    }

    return {
      regioesPrioritarias: regioes,
      regioesRelacionadas: Array.from(relacionadas),
      cadeiaProvavel,
    };
  }

  private normalizeClinicalRegion(rawRegion: string): ClinicalRegionKey | null {
    const normalized = String(rawRegion || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (!normalized) return null;
    if ((CLINICAL_REGION_KEYS as readonly string[]).includes(normalized)) {
      return normalized as ClinicalRegionKey;
    }
    if (normalized === 'SACRO' || normalized === 'ILIACO' || normalized === 'PELVIS') {
      return 'SACROILIACA';
    }
    if (normalized === 'PUNHO' || normalized === 'MAO') {
      return 'PUNHO_MAO';
    }
    if (normalized === 'TORNOZELO' || normalized === 'PE') {
      return 'TORNOZELO_PE';
    }

    const lower = normalized.toLowerCase();
    for (const rule of REGION_INFERENCE_RULES) {
      if (rule.regex.test(lower)) return rule.region;
    }
    return null;
  }
}
