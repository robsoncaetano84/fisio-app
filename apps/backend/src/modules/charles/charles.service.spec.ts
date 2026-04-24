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
      getActiveProtocol: jest.fn().mockResolvedValue({
        version: '1.0.0',
        name: 'Protocolo clinico base',
      }),
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
    expect(result.protocolVersion).toBe('1.0.0');
    expect(result.protocolName).toBe('Protocolo clinico base');
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
      getActiveProtocol: jest.fn().mockResolvedValue({
        version: '1.0.0',
        name: 'Protocolo clinico base',
      }),
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
      protocolVersion: '1.0.0',
      protocolName: 'Protocolo clinico base',
    });
  });

  it('keeps next action available even when active protocol cannot be read', async () => {
    const pacientesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'pac-1',
        nomeCompleto: 'Paciente Teste',
      }),
    } as any;
    const governanceService = {
      writeAudit: jest.fn().mockResolvedValue(undefined),
      getActiveProtocol: jest.fn().mockRejectedValue(new Error('service down')),
    } as any;
    const service = new CharlesService(
      pacientesService,
      governanceService,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
    );

    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('ANAMNESE');
    expect(result.protocolVersion).toBeNull();
    expect(result.protocolName).toBeNull();
  });

  it('returns high-confidence dor classification suggestion when tipoDor is mapped', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        tipoDor: 'MECANICA',
        descricaoSintomas: 'dor localizada em joelho',
      },
    });

    const result = await service.getExameFisicoDorSuggestion('pac-1', user);
    expect(result.stage).toBe('EXAME_FISICO');
    expect(result.suggestionType).toBe('DOR_CLASSIFICATION');
    expect(result.dorPrincipal).toBe('NOCICEPTIVA');
    expect(result.dorSubtipo).toBe('MECANICA');
    expect(result.confidence).toBe('ALTA');
  });

  it('returns low-confidence suggestion when there is no anamnesis', async () => {
    const service = makeService();
    const result = await service.getExameFisicoDorSuggestion('pac-1', user);
    expect(result.dorPrincipal).toBeNull();
    expect(result.dorSubtipo).toBeNull();
    expect(result.confidence).toBe('BAIXA');
  });

  it('returns evolution SOAP suggestion with moderate confidence when there is clinical context', async () => {
    const service = makeService({
      anamnese: {
        createdAt: new Date(),
        descricaoSintomas: 'Dor em ombro direito ao elevar braco',
        fatoresPiora: 'acima da cabeca',
        fatorAlivio: 'repouso',
        areasAfetadas: [{ regiao: 'OMBRO' }],
      },
      laudo: {
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
      },
    });

    const result = await service.getEvolucaoSoapSuggestion('pac-1', user);
    expect(result.stage).toBe('EVOLUCAO');
    expect(result.suggestionType).toBe('EVOLUCAO_SOAP');
    expect(result.confidence).toBe('MODERADA');
    expect(result.subjetivo).toContain('Dor em ombro direito');
    expect(result.objetivo).toContain('ADM');
  });

  it('returns low-confidence evolution SOAP suggestion when data is insufficient', async () => {
    const service = makeService();
    const result = await service.getEvolucaoSoapSuggestion('pac-1', user);
    expect(result.confidence).toBe('BAIXA');
    expect(result.subjetivo).toBeNull();
    expect(result.objetivo).toBeNull();
    expect(result.avaliacao).toBeNull();
    expect(result.plano).toBeNull();
  });

  it('does not break next-action flow when audit write fails', async () => {
    const pacientesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'pac-1',
        nomeCompleto: 'Paciente Teste',
      }),
    } as any;
    const governanceService = {
      writeAudit: jest.fn().mockRejectedValue(new Error('audit unavailable')),
      getActiveProtocol: jest.fn().mockResolvedValue({
        version: '1.0.0',
        name: 'Protocolo clinico base',
      }),
    } as any;
    const anamneseRepo = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const evolucaoRepo = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const laudoRepo = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const service = new CharlesService(
      pacientesService,
      governanceService,
      anamneseRepo,
      evolucaoRepo,
      laudoRepo,
    );

    const result = await service.getNextAction('pac-1', user);
    expect(result.nextAction.stage).toBe('ANAMNESE');
  });

  it('does not break suggestion flow when audit write fails', async () => {
    const pacientesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'pac-1',
        nomeCompleto: 'Paciente Teste',
      }),
    } as any;
    const governanceService = {
      writeAudit: jest.fn().mockRejectedValue(new Error('audit unavailable')),
      getActiveProtocol: jest.fn().mockResolvedValue({
        version: '1.0.0',
        name: 'Protocolo clinico base',
      }),
    } as any;
    const anamneseRepo = {
      findOne: jest.fn().mockResolvedValue({
        createdAt: new Date(),
        descricaoSintomas: 'Dor em joelho ao agachar',
        areasAfetadas: [{ regiao: 'JOELHO' }],
      }),
    } as any;
    const evolucaoRepo = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const laudoRepo = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const service = new CharlesService(
      pacientesService,
      governanceService,
      anamneseRepo,
      evolucaoRepo,
      laudoRepo,
    );

    const result = await service.getEvolucaoSoapSuggestion('pac-1', user);
    expect(result.stage).toBe('EVOLUCAO');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
