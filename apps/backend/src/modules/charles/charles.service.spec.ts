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
    expect(result.stages.find((s) => s.stage === 'EXAME_FISICO')?.status).toBe(
      'BLOCKED',
    );
    expect(result.stages.find((s) => s.stage === 'EVOLUCAO')?.status).toBe(
      'BLOCKED',
    );
  });

  it('returns context with region and probable chain from anamnesis areas', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'Punho esquerdo' }],
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.context.regioesPrioritarias).toContain('PUNHO_MAO');
    expect(result.context.regioesRelacionadas).toEqual(
      expect.arrayContaining(['PUNHO_MAO', 'COTOVELO', 'OMBRO', 'CERVICAL']),
    );
    expect(result.context.cadeiaProvavel).toBe('CADEIA_UPPER');
  });

  it('keeps flow unblocked and points to anamnesis when no clinical data exists', async () => {
    const service = makeService();
    const result = await service.getNextAction('pac-1', user);
    expect(result.blocked).toBe(false);
    expect(result.nextAction.stage).toBe('ANAMNESE');
  });

  it('points to physical exam when anamnesis exists but no structured exam', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'JOELHO' }],
      },
      laudo: {
        updatedAt: new Date(),
        exameFisico: '',
        status: 'RASCUNHO_IA',
        criteriosAlta: '',
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('EXAME_FISICO');
    expect(result.stages.find((s) => s.stage === 'ANAMNESE')?.status).toBe(
      'COMPLETED',
    );
    expect(result.stages.find((s) => s.stage === 'EXAME_FISICO')?.status).toBe(
      'PENDING',
    );
  });

  it('points to evolution when structured exam exists but no evolution', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'OMBRO' }],
      },
      laudo: {
        updatedAt: new Date(),
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
        status: 'RASCUNHO_IA',
        criteriosAlta: '',
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('EVOLUCAO');
  });

  it('points to report validation when there is evolution but report is not validated', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
      evolucao: {
        data: new Date(),
      },
      laudo: {
        updatedAt: new Date(),
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
        status: 'RASCUNHO_IA',
        criteriosAlta: '',
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('LAUDO');
  });

  it('points to plan when report is validated but discharge criteria are missing', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'CERVICAL' }],
      },
      evolucao: {
        data: new Date(),
      },
      laudo: {
        updatedAt: new Date(),
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
        status: 'VALIDADO_PROFISSIONAL',
        criteriosAlta: '',
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('PLANO');
  });

  it('goes to monitoring when full cycle is completed', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'JOELHO' }],
      },
      evolucao: {
        data: new Date(),
      },
      laudo: {
        updatedAt: new Date(),
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
        status: 'VALIDADO_PROFISSIONAL',
        criteriosAlta: 'Alta funcional com autonomia.',
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('MONITORAMENTO');
    expect(result.blocked).toBe(false);
  });

  it('emits medium alert for relevant yellow flags', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        redFlags: [],
        yellowFlags: ['medo de movimento', 'catastrofizacao'],
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
    });
    const result = await service.getNextAction('pac-1', user);
    expect(
      result.alerts.some((a) => a.code === 'YELLOW_FLAGS_RELEVANTES'),
    ).toBe(true);
  });

  it('writes orchestrator audit with next stage metadata', async () => {
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
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    const evolucaoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    const laudoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    const service = new CharlesService(
      pacientesService,
      governanceService,
      anamneseRepo,
      evolucaoRepo,
      laudoRepo,
    );

    await service.getNextAction('pac-1', user);

    expect(governanceService.writeAudit).toHaveBeenCalledTimes(1);
    const payload = governanceService.writeAudit.mock.calls[0][0];
    expect(payload.action).toBe('orchestrator.next_action.read');
    expect(payload.patientId).toBe('pac-1');
    expect(payload.metadata).toMatchObject({
      nextStage: 'ANAMNESE',
      mode: 'deterministic-v1',
    });
  });
});
