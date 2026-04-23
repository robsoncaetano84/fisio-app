import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import {
  Paciente,
  PacienteVinculoStatus,
} from '../pacientes/entities/paciente.entity';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import {
  ClinicalFlowEvent,
  ClinicalFlowEventType,
  ClinicalFlowStage,
} from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';

const STAGES: ClinicalFlowStage[] = ['ANAMNESE', 'EXAME_FISICO', 'EVOLUCAO'];
const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';
const STATUS_TO_EVENT_TYPE: Record<string, ClinicalFlowEventType> = {
  OPENED: 'STAGE_OPENED',
  COMPLETED: 'STAGE_COMPLETED',
  ABANDONED: 'STAGE_ABANDONED',
  BLOCKED: 'STAGE_BLOCKED',
};

type MetricsSummaryFilters = {
  professionalId?: string;
  patientId?: string;
  stage?: string;
  status?: string;
};

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(ClinicalFlowEvent)
    private readonly clinicalFlowRepo: Repository<ClinicalFlowEvent>,
    @InjectRepository(PatientCheckClickEvent)
    private readonly patientCheckClickRepo: Repository<PatientCheckClickEvent>,
    @InjectRepository(AtividadeCheckin)
    private readonly atividadeCheckinRepo: Repository<AtividadeCheckin>,
    @InjectRepository(Laudo)
    private readonly laudoRepo: Repository<Laudo>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepo: Repository<Anamnese>,
    @InjectRepository(Atividade)
    private readonly atividadeRepo: Repository<Atividade>,
  ) {}

  async trackClinicalFlowEvent(
    professionalId: string,
    dto: CreateClinicalFlowEventDto,
  ): Promise<{ ok: true }> {
    const blockedReason =
      dto.eventType === 'STAGE_BLOCKED' && dto.blockedReason
        ? dto.blockedReason.trim().slice(0, 80)
        : null;

    const created = this.clinicalFlowRepo.create({
      professionalId,
      patientId: dto.patientId || null,
      stage: dto.stage,
      eventType: dto.eventType,
      durationMs: dto.durationMs ?? null,
      blockedReason,
    });
    await this.clinicalFlowRepo.save(created);
    return { ok: true };
  }

  async getClinicalFlowSummary(
    actorId: string,
    actorRole: UserRole,
    windowDays = 7,
    filters?: MetricsSummaryFilters,
  ) {
    const days = Number.isFinite(windowDays)
      ? Math.min(90, Math.max(1, Math.floor(windowDays)))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const scopedProfessionalId = this.resolveScopedProfessionalId(
      actorId,
      actorRole,
      filters?.professionalId,
    );
    const normalizedStatus = String(filters?.status || '')
      .trim()
      .toUpperCase();
    const scopedEventType =
      normalizedStatus && normalizedStatus !== 'ALL'
        ? STATUS_TO_EVENT_TYPE[normalizedStatus]
        : undefined;
    const normalizedStage = String(filters?.stage || '')
      .trim()
      .toUpperCase();
    const scopedStage =
      normalizedStage && normalizedStage !== 'ALL'
        ? (normalizedStage as ClinicalFlowStage)
        : undefined;
    const patientId = String(filters?.patientId || '').trim() || undefined;

    const entries = await this.clinicalFlowRepo.find({
      where: {
        professionalId: scopedProfessionalId,
        ...(patientId ? { patientId } : {}),
        ...(scopedEventType ? { eventType: scopedEventType } : {}),
        ...(scopedStage ? { stage: scopedStage } : {}),
        occurredAt: MoreThanOrEqual(since),
      },
      order: { occurredAt: 'DESC' },
      take: 5000,
    });

    let opened = 0;
    let completed = 0;
    let abandoned = 0;
    let blocked = 0;

    const stageDurationSums: Record<ClinicalFlowStage, number> = {
      ANAMNESE: 0,
      EXAME_FISICO: 0,
      EVOLUCAO: 0,
    };
    const stageDurationCounts: Record<ClinicalFlowStage, number> = {
      ANAMNESE: 0,
      EXAME_FISICO: 0,
      EVOLUCAO: 0,
    };
    const blockedReasons = new Map<string, number>();

    entries.forEach((entry) => {
      if (entry.eventType === 'STAGE_OPENED') opened += 1;
      if (entry.eventType === 'STAGE_COMPLETED') {
        completed += 1;
        if (typeof entry.durationMs === 'number' && entry.durationMs >= 0) {
          stageDurationSums[entry.stage] += Math.round(entry.durationMs);
          stageDurationCounts[entry.stage] += 1;
        }
      }
      if (entry.eventType === 'STAGE_ABANDONED') abandoned += 1;
      if (entry.eventType === 'STAGE_BLOCKED') {
        blocked += 1;
        const reason = entry.blockedReason || 'UNKNOWN';
        blockedReasons.set(reason, (blockedReasons.get(reason) || 0) + 1);
      }
    });

    const avgDurationMsByStage: Record<ClinicalFlowStage, number> = {
      ANAMNESE:
        stageDurationCounts.ANAMNESE > 0
          ? Math.round(
              stageDurationSums.ANAMNESE / stageDurationCounts.ANAMNESE,
            )
          : 0,
      EXAME_FISICO:
        stageDurationCounts.EXAME_FISICO > 0
          ? Math.round(
              stageDurationSums.EXAME_FISICO / stageDurationCounts.EXAME_FISICO,
            )
          : 0,
      EVOLUCAO:
        stageDurationCounts.EVOLUCAO > 0
          ? Math.round(stageDurationSums.EVOLUCAO / stageDurationCounts.EVOLUCAO)
          : 0,
    };

    const topBlockedReasons = Array.from(blockedReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const abandonmentRate = opened > 0 ? Math.round((abandoned / opened) * 100) : 0;

    return {
      windowDays: days,
      opened,
      completed,
      abandoned,
      blocked,
      abandonmentRate,
      avgDurationMsByStage,
      topBlockedReasons,
      trackedStages: STAGES,
      filters: {
        professionalId: scopedProfessionalId || null,
        patientId: patientId || null,
        stage: scopedStage || null,
        status: scopedEventType || null,
      },
    };
  }

  async trackPatientCheckClick(
    professionalId: string,
    dto: CreatePatientCheckClickDto,
  ): Promise<{ ok: true }> {
    const source = dto.source?.trim().slice(0, 40) || null;
    const created = this.patientCheckClickRepo.create({
      professionalId,
      patientId: dto.patientId || null,
      source,
    });
    await this.patientCheckClickRepo.save(created);
    return { ok: true };
  }

  async getPatientCheckEngagementSummary(
    actorId: string,
    actorRole: UserRole,
    windowDays = 7,
    filters?: Pick<MetricsSummaryFilters, 'professionalId' | 'patientId' | 'status'>,
  ) {
    const days = Number.isFinite(windowDays)
      ? Math.min(90, Math.max(1, Math.floor(windowDays)))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const scopedProfessionalId = this.resolveScopedProfessionalId(
      actorId,
      actorRole,
      filters?.professionalId,
    );
    const patientId = String(filters?.patientId || '').trim() || undefined;
    const status = String(filters?.status || '').trim().toUpperCase() || undefined;
    const scopedPatientIds = await this.resolveScopedPatientIds({
      scopedProfessionalId,
      patientId,
      status,
      windowDays: days,
    });
    if (status && scopedPatientIds && scopedPatientIds.length === 0) {
      return {
        windowDays: days,
        checkClicks: 0,
        checkinsSubmitted: 0,
        conversionRate: 0,
        filters: {
          professionalId: scopedProfessionalId || null,
          patientId: patientId || null,
          status,
        },
      };
    }

    const [checkClicks, checkinsSubmitted] = await Promise.all([
      this.patientCheckClickRepo.count({
        where: {
          professionalId: scopedProfessionalId,
          ...(scopedPatientIds
            ? { patientId: In(scopedPatientIds) }
            : patientId
            ? { patientId }
            : {}),
          occurredAt: MoreThanOrEqual(since),
        },
      }),
      this.atividadeCheckinRepo.count({
        where: {
          usuarioId: scopedProfessionalId,
          ...(scopedPatientIds
            ? { pacienteId: In(scopedPatientIds) }
            : patientId
            ? { pacienteId: patientId }
            : {}),
          createdAt: MoreThanOrEqual(since),
        },
      }),
    ]);

    const conversionRate =
      checkClicks > 0 ? Math.round((checkinsSubmitted / checkClicks) * 100) : 0;

    return {
      windowDays: days,
      checkClicks,
      checkinsSubmitted,
      conversionRate,
      filters: {
        professionalId: scopedProfessionalId || null,
        patientId: patientId || null,
        status: status || null,
      },
    };
  }

  async getPhysicalExamTestsSummary(
    actorId: string,
    actorRole: UserRole,
    windowDays = 30,
    filters?: Pick<
      MetricsSummaryFilters,
      'professionalId' | 'patientId' | 'status'
    >,
  ) {
    const days = Number.isFinite(windowDays)
      ? Math.min(180, Math.max(1, Math.floor(windowDays)))
      : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const scopedProfessionalId = this.resolveScopedProfessionalId(
      actorId,
      actorRole,
      filters?.professionalId,
    );
    const patientId = String(filters?.patientId || '').trim() || undefined;
    const status = String(filters?.status || '').trim().toUpperCase() || undefined;
    const scopedPatientIds = await this.resolveScopedPatientIds({
      scopedProfessionalId,
      patientId,
      status,
      windowDays: days,
    });
    if (status && scopedPatientIds && scopedPatientIds.length === 0) {
      return {
        windowDays: days,
        laudosAnalisados: 0,
        laudosComExameEstruturado: 0,
        totalAvaliados: 0,
        totalPositivos: 0,
        taxaPositividadeGeral: 0,
        porRegiao: [],
        topTestesPositivos: [],
        perfisScoring: [],
        filters: {
          professionalId: scopedProfessionalId || null,
          patientId: patientId || null,
          status: status || null,
        },
      };
    }

    const qb = this.laudoRepo
      .createQueryBuilder('laudo')
      .innerJoin('laudo.paciente', 'paciente')
      .andWhere('laudo.updatedAt >= :since', { since })
      .andWhere('laudo.exame_fisico IS NOT NULL')
      .orderBy('laudo.updatedAt', 'DESC')
      .take(2000);
    if (scopedProfessionalId) {
      qb.andWhere('paciente.usuario_id = :professionalId', {
        professionalId: scopedProfessionalId,
      });
    }
    if (patientId) {
      qb.andWhere('paciente.id = :patientId', { patientId });
    }
    if (scopedPatientIds) {
      qb.andWhere('paciente.id IN (:...patientIds)', { patientIds: scopedPatientIds });
    }
    const laudos = await qb.getMany();

    const regionStats = new Map<
      string,
      { regiao: string; titulo: string; positivos: number; avaliados: number }
    >();
    const topTests = new Map<string, number>();
    const profileDist = new Map<string, number>();

    let laudosComExameEstruturado = 0;
    let totalPositivos = 0;
    let totalAvaliados = 0;

    for (const laudo of laudos) {
      const parsed = this.parseStructuredExame(laudo.exameFisico);
      if (!parsed) continue;
      laudosComExameEstruturado += 1;

      const perfil = String(parsed?.cruzamentoFinal?.perfilScoring || '').trim();
      if (perfil) {
        profileDist.set(perfil, (profileDist.get(perfil) || 0) + 1);
      }

      const grupos = Array.isArray(parsed?.avaliacaoRegioes)
        ? parsed.avaliacaoRegioes
        : [];
      for (const grupo of grupos) {
        const regiao = String(grupo?.regiao || 'NAO_INFORMADO');
        const titulo = String(grupo?.titulo || regiao);
        const testes = Array.isArray(grupo?.testes) ? grupo.testes : [];
        const avaliadosGrupo = testes.filter(
          (t) => String(t?.resultado || '') !== 'NAO_TESTADO',
        );
        const positivosGrupo = avaliadosGrupo.filter(
          (t) => String(t?.resultado || '') === 'POSITIVO',
        );

        totalAvaliados += avaliadosGrupo.length;
        totalPositivos += positivosGrupo.length;

        const current = regionStats.get(regiao) || {
          regiao,
          titulo,
          positivos: 0,
          avaliados: 0,
        };
        current.avaliados += avaliadosGrupo.length;
        current.positivos += positivosGrupo.length;
        regionStats.set(regiao, current);

        for (const teste of positivosGrupo) {
          const nome = String(teste?.nome || 'Teste');
          topTests.set(nome, (topTests.get(nome) || 0) + 1);
        }
      }
    }

    const porRegiao = Array.from(regionStats.values())
      .map((item) => ({
        ...item,
        taxaPositividade:
          item.avaliados > 0
            ? Math.round((item.positivos / item.avaliados) * 100)
            : 0,
      }))
      .sort((a, b) => b.positivos - a.positivos);

    const topTestesPositivos = Array.from(topTests.entries())
      .map(([teste, count]) => ({ teste, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const perfisScoring = Array.from(profileDist.entries())
      .map(([perfil, count]) => ({ perfil, count }))
      .sort((a, b) => b.count - a.count);

    return {
      windowDays: days,
      laudosAnalisados: laudos.length,
      laudosComExameEstruturado,
      totalAvaliados,
      totalPositivos,
      taxaPositividadeGeral:
        totalAvaliados > 0 ? Math.round((totalPositivos / totalAvaliados) * 100) : 0,
      porRegiao,
      topTestesPositivos,
      perfisScoring,
      filters: {
        professionalId: scopedProfessionalId || null,
        patientId: patientId || null,
        status: status || null,
      },
    };
  }

  private resolveScopedProfessionalId(
    actorId: string,
    actorRole: UserRole,
    requestedProfessionalId?: string,
  ) {
    const normalized = String(requestedProfessionalId || '').trim();
    if (actorRole === UserRole.ADMIN) {
      return normalized || undefined;
    }
    return actorId;
  }

  private async resolveScopedPatientIds(params: {
    scopedProfessionalId?: string;
    patientId?: string;
    status?: string;
    windowDays: number;
  }): Promise<string[] | undefined> {
    const { scopedProfessionalId, patientId, status, windowDays } = params;
    if (patientId) return [patientId];
    if (!status || status === 'ALL' || status === 'TODOS') return undefined;

    const pacientes = await this.pacienteRepo.find({
      where: {
        ativo: true,
        ...(scopedProfessionalId ? { usuarioId: scopedProfessionalId } : {}),
      },
      select: [
        'id',
        'createdAt',
        'pacienteUsuarioId',
        'vinculoStatus',
      ],
    });
    if (!pacientes.length) return [];
    const pacienteIds = pacientes.map((p) => p.id);

    const anamneses = await this.anamneseRepo.find({
      where: { pacienteId: In(pacienteIds) },
      select: ['pacienteId'],
    });
    const hasAnamnese = new Set(anamneses.map((x) => x.pacienteId));

    const laudos = await this.laudoRepo
      .createQueryBuilder('l')
      .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('l.pacienteId', 'ASC')
      .addOrderBy('l.updatedAt', 'DESC')
      .getMany();
    const latestLaudoByPaciente = new Map<string, Laudo>();
    laudos.forEach((item) => {
      if (!latestLaudoByPaciente.has(item.pacienteId)) {
        latestLaudoByPaciente.set(item.pacienteId, item);
      }
    });

    const atividadesAtivas = await this.atividadeRepo
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.ativo = :ativo', { ativo: true })
      .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const hasActiveActivity = new Set(atividadesAtivas.map((r) => r.pacienteId));

    const now = Date.now();
    const activityWindowMs = Math.max(1, windowDays) * 24 * 60 * 60 * 1000;
    const filteredIds: string[] = [];
    for (const paciente of pacientes) {
      const hasAnamnesePaciente = hasAnamnese.has(paciente.id);
      const lastLaudo = latestLaudoByPaciente.get(paciente.id);
      const hasAltaDocumento =
        lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL &&
        !!lastLaudo.criteriosAlta;
      const tratamentoConcluido =
        hasAltaDocumento && !hasActiveActivity.has(paciente.id);

      const aguardandoVinculo =
        !paciente.pacienteUsuarioId ||
        paciente.vinculoStatus === PacienteVinculoStatus.SEM_VINCULO ||
        paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO;

      const isNovoPaciente =
        !hasAnamnesePaciente &&
        now - new Date(paciente.createdAt).getTime() <= activityWindowMs;

      const matchesStatus =
        (status === 'NOVO_PACIENTE' && isNovoPaciente) ||
        (status === 'AGUARDANDO_VINCULO' && aguardandoVinculo) ||
        (status === 'ANAMNESE_PENDENTE' && !hasAnamnesePaciente) ||
        (status === 'EM_TRATAMENTO' && hasAnamnesePaciente && !tratamentoConcluido) ||
        (status === 'ALTA' && tratamentoConcluido);
      if (matchesStatus) {
        filteredIds.push(paciente.id);
      }
    }
    return filteredIds;
  }

  private parseStructuredExame(rawValue?: string | null): any | null {
    const raw = String(rawValue || '').trim();
    if (!raw.startsWith(STRUCTURED_EXAME_PREFIX)) return null;
    const json = raw.slice(STRUCTURED_EXAME_PREFIX.length);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
