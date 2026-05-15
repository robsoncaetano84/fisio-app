import { LaudoClinicalContextService } from './laudo-clinical-context.service';

describe('LaudoClinicalContextService', () => {
  const makeRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
  });

  const makeService = () => {
    const laudoRepository = makeRepository();
    const anamneseRepository = makeRepository();
    const evolucaoRepository = makeRepository();
    const pacienteExameRepository = makeRepository();
    const pacientesService = {
      findOne: jest.fn(),
    };
    const laudoAiSuggestionService = {
      buildExamInsights: jest.fn(),
    };
    const laudoExameFisicoService = {
      findLatestByPacienteId: jest.fn(),
    };
    const service = new LaudoClinicalContextService(
      laudoRepository as any,
      anamneseRepository as any,
      evolucaoRepository as any,
      pacienteExameRepository as any,
      pacientesService as any,
      laudoAiSuggestionService as any,
      laudoExameFisicoService as any,
    );

    return {
      service,
      laudoRepository,
      anamneseRepository,
      evolucaoRepository,
      pacienteExameRepository,
      pacientesService,
      laudoAiSuggestionService,
      laudoExameFisicoService,
    };
  };

  it('finds latest anamnese by patient', async () => {
    const { service, anamneseRepository } = makeService();
    const anamnese = { id: 'anamnese-1' };
    anamneseRepository.findOne.mockResolvedValue(anamnese);

    await expect(service.findLatestAnamnese('paciente-1')).resolves.toBe(
      anamnese,
    );
    expect(anamneseRepository.findOne).toHaveBeenCalledWith({
      where: { pacienteId: 'paciente-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('builds suggestion context from clinical data and interpreted exams', async () => {
    const {
      service,
      laudoRepository,
      anamneseRepository,
      evolucaoRepository,
      pacienteExameRepository,
      pacientesService,
      laudoAiSuggestionService,
      laudoExameFisicoService,
    } = makeService();
    const paciente = {
      id: 'paciente-1',
      nomeCompleto: 'Paciente Teste',
      dataNascimento: new Date('2000-01-01T00:00:00.000Z'),
      sexo: 'FEMININO',
    };
    const anamneses = [{ id: 'anamnese-1', pacienteId: 'paciente-1' }];
    const evolucoes = [{ id: 'evolucao-1', pacienteId: 'paciente-1' }];
    const exames = [{ id: 'exame-1', pacienteId: 'paciente-1' }];
    const examesInterpretados = [
      {
        nomeOriginal: 'exame.pdf',
        tipoExame: 'RM',
        dataExame: null,
        mimeType: 'application/pdf',
        observacao: '',
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
        aiInterpretacao: 'Sem sinais de alarme.',
      },
    ];

    pacientesService.findOne.mockResolvedValue(paciente);
    anamneseRepository.find.mockResolvedValue(anamneses);
    evolucaoRepository.find.mockResolvedValue(evolucoes);
    pacienteExameRepository.find.mockResolvedValue(exames);
    laudoRepository.findOne.mockResolvedValue({
      exameFisico: 'Exame fisico antigo.',
    });
    laudoAiSuggestionService.buildExamInsights.mockResolvedValue(
      examesInterpretados,
    );
    laudoExameFisicoService.findLatestByPacienteId.mockResolvedValue({
      exameFisico: 'Exame fisico registrado.',
    });

    const context = await service.buildSuggestionContext(
      'paciente-1',
      'usuario-1',
    );

    expect(pacientesService.findOne).toHaveBeenCalledWith(
      'paciente-1',
      'usuario-1',
    );
    expect(pacienteExameRepository.find).toHaveBeenCalledWith({
      where: { pacienteId: 'paciente-1', usuarioId: 'usuario-1' },
      order: { createdAt: 'DESC' },
      take: 12,
    });
    expect(context).toMatchObject({
      paciente,
      anamneses,
      evolucoes,
      exames: examesInterpretados,
      exameFisicoResumo: 'Exame fisico registrado.',
    });
  });
});
