import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import {
  ClinicalFlowEvent,
  ClinicalFlowStage,
} from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';

const STAGES: ClinicalFlowStage[] = ['ANAMNESE', 'EXAME_FISICO', 'EVOLUCAO'];
const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';

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

  async getClinicalFlowSummary(professionalId: string, windowDays = 7) {
    const days = Number.isFinite(windowDays)
      ? Math.max(1, Math.floor(windowDays))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const entries = await this.clinicalFlowRepo.find({
      where: {
        professionalId,
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

  async getPatientCheckEngagementSummary(professionalId: string, windowDays = 7) {
    const days = Number.isFinite(windowDays)
      ? Math.max(1, Math.floor(windowDays))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [checkClicks, checkinsSubmitted] = await Promise.all([
      this.patientCheckClickRepo.count({
        where: {
          professionalId,
          occurredAt: MoreThanOrEqual(since),
        },
      }),
      this.atividadeCheckinRepo.count({
        where: {
          usuarioId: professionalId,
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
    };
  }

  async getPhysicalExamTestsSummary(professionalId: string, windowDays = 30) {
    const days = Number.isFinite(windowDays)
      ? Math.max(1, Math.floor(windowDays))
      : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const laudos = await this.laudoRepo
      .createQueryBuilder('laudo')
      .innerJoin('laudo.paciente', 'paciente')
      .where('paciente.usuario_id = :professionalId', { professionalId })
      .andWhere('laudo.updatedAt >= :since', { since })
      .andWhere('laudo.exame_fisico IS NOT NULL')
      .orderBy('laudo.updatedAt', 'DESC')
      .take(2000)
      .getMany();

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
    };
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
