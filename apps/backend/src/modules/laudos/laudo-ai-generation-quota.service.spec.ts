import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';
import { LaudoAiGenerationQuotaService } from './laudo-ai-generation-quota.service';

describe('LaudoAiGenerationQuotaService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const makeRepository = (execute: jest.Mock) => {
    const queryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };

    return {
      queryBuilder,
      repository: {
        createQueryBuilder: jest.fn(() => queryBuilder),
      },
    };
  };

  it('acquires a daily slot when insert is accepted', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-13T12:00:00.000Z'));
    const execute = jest.fn().mockResolvedValue({ identifiers: [{ id: '1' }] });
    const { repository, queryBuilder } = makeRepository(execute);
    const service = new LaudoAiGenerationQuotaService(repository as any);

    await expect(service.acquireDailySlot('paciente-1')).resolves.toBe(true);

    expect(queryBuilder.into).toHaveBeenCalledWith(LaudoAiGeneration);
    expect(queryBuilder.values).toHaveBeenCalledWith({
      pacienteId: 'paciente-1',
      generatedOn: '2026-05-13',
    });
    expect(queryBuilder.orIgnore).toHaveBeenCalled();
  });

  it('returns false when the slot already exists or insert fails', async () => {
    const { repository } = makeRepository(jest.fn().mockResolvedValue({}));
    const service = new LaudoAiGenerationQuotaService(repository as any);

    await expect(service.acquireDailySlot('paciente-1')).resolves.toBe(false);
  });
});
