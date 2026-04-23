import { CharlesService } from './charles.service';

describe('CharlesService - deterministic orchestrator', () => {
  const makeService = (overrides?: {
    anamnese?: any;
    evolucao?: any;
    laudo?: any;
  }) => {
    const pacientesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'pac-1',
        nomeCompleto: 'Paciente Teste',
      }),
    } as any;

    const governanceService = {
      writeAudit: jest.fn().mockResolvedValue(undefined),
    } as any;

    const anamneseRepo = {
      findOne: jest.fn().mockResolvedValue(overrides?.anamnese ?? null),
    } as any;

    const evolucaoRepo = {
      findOne: jest.fn().mockResolvedValue(overrides?.evolucao ?? null),
    } as any;

    const laudoRepo = {
      findOne: jest.fn().mockResolvedValue(overrides?.laudo ?? null),
    } as any;

    return new CharlesService(
      pacientesService,
      governanceService,
      anamneseRepo,
      evolucaoRepo,
      laudoRepo,
    );
  };

  const user = { id: 'user-1', role: 'USER' } as any;

  it('blocks flow when anamnesis has critical red flag', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: ['Deficit neurologico'],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
    });

    const result = await service.getNextAction('pac-1', user);
    expect(result.blocked).toBe(true);
    expect(result.blockers.some((b) => b.code === 'RED_FLAG_CRITICA')).toBe(true);
    expect(result.nextAction.reason.toLowerCase()).toContain('red flag');
  });

  it('returns context with region and probable chain from anamnesis areas', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'PUNHO' }],
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.context.regioesPrioritarias).toContain('PUNHO');
    expect(result.context.cadeiaProvavel).toBe('CADEIA_UPPER');
  });

  it('keeps flow unblocked and points to anamnesis when no clinical data exists', async () => {
    const service = makeService();
    const result = await service.getNextAction('pac-1', user);
    expect(result.blocked).toBe(false);
    expect(result.nextAction.stage).toBe('ANAMNESE');
  });
});

