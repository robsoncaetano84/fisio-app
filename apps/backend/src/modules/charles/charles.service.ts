import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';

const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';

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
  orchestrator: 'Charles';
  mode: 'deterministic-v1';
  requiresProfessionalApproval: true;
  paciente: {
    id: string;
    nomeCompleto: string;
  };
  timeline: {
    anamneseEm: Date | null;
    exameFisicoEm: Date | null;
    evolucaoEm: Date | null;
    laudoEm: Date | null;
  };
  stages: CharlesStageItem[];
  nextAction: CharlesNextAction;
}

@Injectable()
export class CharlesService {
  constructor(
    private readonly pacientesService: PacientesService,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
  ) {}

  async getNextAction(
    pacienteId: string,
    profissionalId: string,
  ): Promise<CharlesNextActionResponse> {
    const paciente = await this.pacientesService.findOne(pacienteId, profissionalId);

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
    });

    return {
      orchestrator: 'Charles',
      mode: 'deterministic-v1',
      requiresProfessionalApproval: true,
      paciente: {
        id: paciente.id,
        nomeCompleto: paciente.nomeCompleto,
      },
      timeline: {
        anamneseEm: latestAnamnese?.createdAt || null,
        exameFisicoEm: hasExameFisico ? latestLaudo?.updatedAt || null : null,
        evolucaoEm: latestEvolucao?.data || null,
        laudoEm: latestLaudo?.updatedAt || null,
      },
      stages,
      nextAction,
    };
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
  }): CharlesNextAction {
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
}
