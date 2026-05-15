import { LaudoAiSuggestionService } from './laudo-ai-suggestion.service';

describe('LaudoAiSuggestionService', () => {
  const createOpenAiService = () =>
    ({
      isConfigured: jest.fn(),
      isEnabled: jest.fn(),
      resolveModel: jest.fn().mockReturnValue('test-model'),
      getPositiveIntegerEnv: jest.fn().mockReturnValue(15000),
      createJsonResponse: jest.fn(),
    }) as any;

  const baseInput = {
    paciente: {
      nomeCompleto: 'Paciente Teste',
      idade: 32,
      sexo: 'FEMININO',
      profissao: 'Atleta',
    },
    anamnese: null,
    evolucoes: [],
    exameFisicoResumo: 'Teste regional positivo.',
    exames: [],
  };

  it('returns empty suggestion when OpenAI is not configured', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(false);
    const service = new LaudoAiSuggestionService(openAiService);

    await expect(service.generateSuggestion(baseInput)).resolves.toEqual({});
    expect(openAiService.createJsonResponse).not.toHaveBeenCalled();
  });

  it('normalizes valid OpenAI suggestion fields', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(true);
    openAiService.createJsonResponse.mockResolvedValue({
      parsed: {
        diagnosticoFuncional: 'Disfuncao funcional.',
        objetivosCurtoPrazo: 'Reduzir dor.',
        objetivosMedioPrazo: 'Retornar ao esporte.',
        frequenciaSemanal: 9,
        duracaoSemanas: 80,
        condutas: 'Exercicios progressivos.',
        planoTratamentoIA: 'Fase 1: controle; fase 2: funcao.',
        criteriosAlta: 'Sem dor limitante.',
      },
    });
    const service = new LaudoAiSuggestionService(openAiService);

    const result = await service.generateSuggestion(baseInput);

    expect(result).toMatchObject({
      diagnosticoFuncional: 'Disfuncao funcional.',
      frequenciaSemanal: 7,
      duracaoSemanas: 52,
      criteriosAlta: 'Sem dor limitante.',
    });
  });

  it('builds base exam insight and skips unsupported mime types', async () => {
    const openAiService = createOpenAiService();
    const service = new LaudoAiSuggestionService(openAiService);
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const result = await service.buildExamInsights([
      {
        nomeOriginal: 'exame.txt',
        tipoExame: null,
        dataExame: null,
        mimeType: 'text/plain',
        observacao: null,
        createdAt,
      } as any,
    ]);

    expect(result).toEqual([
      {
        nomeOriginal: 'exame.txt',
        tipoExame: '',
        dataExame: null,
        mimeType: 'text/plain',
        observacao: '',
        uploadedAt: createdAt,
      },
    ]);
    expect(openAiService.createJsonResponse).not.toHaveBeenCalled();
  });
});
