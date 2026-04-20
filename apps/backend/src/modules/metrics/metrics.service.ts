import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import {
  ClinicalFlowEvent,
  ClinicalFlowStage,
} from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';

const STAGES: ClinicalFlowStage[] = ['ANAMNESE', 'EXAME_FISICO', 'EVOLUCAO'];

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(ClinicalFlowEvent)
    private readonly clinicalFlowRepo: Repository<ClinicalFlowEvent>,
    @InjectRepository(PatientCheckClickEvent)
    private readonly patientCheckClickRepo: Repository<PatientCheckClickEvent>,
    @InjectRepository(AtividadeCheckin)
    private readonly atividadeCheckinRepo: Repository<AtividadeCheckin>,
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
}
