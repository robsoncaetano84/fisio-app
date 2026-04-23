import { MetricsService } from './metrics.service';
import { ClinicalFlowEvent } from './entities/clinical-flow-event.entity';

type RepoMock = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  count: jest.Mock;
};

const makeService = (
  clinicalRepo: RepoMock,
  checkClickRepo?: RepoMock,
  checkinRepo?: RepoMock,
  laudoRepo?: RepoMock,
  pacienteRepo?: RepoMock,
  anamneseRepo?: RepoMock,
  atividadeRepo?: RepoMock,
) =>
  new MetricsService(
    clinicalRepo as unknown as never,
    (checkClickRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      } as RepoMock)) as unknown as never,
    (checkinRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      } as RepoMock)) as unknown as never,
    (laudoRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
        createQueryBuilder: jest.fn(),
      } as unknown as RepoMock)) as unknown as never,
    (pacienteRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      } as RepoMock)) as unknown as never,
    (anamneseRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      } as RepoMock)) as unknown as never,
    (atividadeRepo ||
      ({
        create: jest.fn((v) => v),
        save: jest.fn(async (v) => v),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn(async () => []),
        })),
      } as unknown as RepoMock)) as unknown as never,
  );

describe('MetricsService', () => {
  it('summarizes clinical flow events correctly', async () => {
    const repo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(async () => {
        const now = new Date();
        const mk = (
          eventType: ClinicalFlowEvent['eventType'],
          stage: ClinicalFlowEvent['stage'],
          extras: Partial<ClinicalFlowEvent> = {},
        ): ClinicalFlowEvent =>
          ({
            id: 'evt-id',
            professionalId: 'prof-1',
            patientId: null,
            eventType,
            stage,
            durationMs: null,
            blockedReason: null,
            occurredAt: now,
            createdAt: now,
            ...extras,
          }) as ClinicalFlowEvent;

        return [
          mk('STAGE_OPENED', 'ANAMNESE'),
          mk('STAGE_COMPLETED', 'ANAMNESE', { durationMs: 120000 }),
          mk('STAGE_OPENED', 'EXAME_FISICO'),
          mk('STAGE_ABANDONED', 'EXAME_FISICO'),
          mk('STAGE_BLOCKED', 'EVOLUCAO', { blockedReason: 'MISSING_ANAMNESE' }),
          mk('STAGE_BLOCKED', 'EVOLUCAO', { blockedReason: 'MISSING_ANAMNESE' }),
          mk('STAGE_BLOCKED', 'EXAME_FISICO', { blockedReason: 'MISSING_REQUIRED_FIELDS' }),
        ];
      }),
      count: jest.fn(async () => 0),
    };

    const service = makeService(repo);
    const summary = await service.getClinicalFlowSummary('prof-1', 'USER' as never, 7);

    expect(summary.windowDays).toBe(7);
    expect(summary.opened).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.abandoned).toBe(1);
    expect(summary.blocked).toBe(3);
    expect(summary.abandonmentRate).toBe(50);
    expect(summary.avgDurationMsByStage.ANAMNESE).toBe(120000);
    expect(summary.avgDurationMsByStage.EXAME_FISICO).toBe(0);
    expect(summary.topBlockedReasons[0]).toEqual({
      reason: 'MISSING_ANAMNESE',
      count: 2,
    });
    expect(summary.filters.professionalId).toBe('prof-1');
  });

  it('tracks a clinical flow event with normalized blocked reason', async () => {
    const repo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(),
      count: jest.fn(async () => 0),
    };
    const service = makeService(repo);

    await service.trackClinicalFlowEvent('prof-1', {
      stage: 'EVOLUCAO',
      eventType: 'STAGE_BLOCKED',
      blockedReason: ' MISSING_ANAMNESE ',
      patientId: '3cc44952-8f81-4025-b85f-f95ef0374b32',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalId: 'prof-1',
        stage: 'EVOLUCAO',
        eventType: 'STAGE_BLOCKED',
        blockedReason: 'MISSING_ANAMNESE',
      }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  it('summarizes patient check engagement', async () => {
    const clinicalRepo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    };
    const clickRepo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(async () => []),
      count: jest.fn(async () => 10),
    };
    const checkinRepo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(async () => []),
      count: jest.fn(async () => 6),
    };

    const service = makeService(clinicalRepo, clickRepo, checkinRepo);
    const summary = await service.getPatientCheckEngagementSummary(
      'prof-1',
      'USER' as never,
      7,
    );

    expect(summary.windowDays).toBe(7);
    expect(summary.checkClicks).toBe(10);
    expect(summary.checkinsSubmitted).toBe(6);
    expect(summary.conversionRate).toBe(60);
  });

  it('applies status and patient filters for admin summary', async () => {
    const repo: RepoMock = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
      find: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    };
    const service = makeService(repo);
    await service.getClinicalFlowSummary('admin-1', 'ADMIN' as never, 14, {
      professionalId: 'prof-2',
      patientId: 'pat-1',
      status: 'blocked',
      stage: 'evolucao',
    });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          professionalId: 'prof-2',
          patientId: 'pat-1',
          eventType: 'STAGE_BLOCKED',
          stage: 'EVOLUCAO',
        }),
      }),
    );
  });
});
