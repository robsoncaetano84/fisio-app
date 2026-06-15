import {
  GenerateLaudoSuggestionInput,
  LaudoAiSuggestionService,
} from './laudo-ai-suggestion.service';

describe('LaudoAiSuggestionService', () => {
  const createOpenAiService = () =>
    ({
      isConfigured: jest.fn(),
      isEnabled: jest.fn(),
      resolveModel: jest.fn().mockReturnValue('test-model'),
      getPositiveIntegerEnv: jest.fn().mockReturnValue(15000),
      createJsonResponse: jest.fn(),
    }) as any;

  const baseInput: GenerateLaudoSuggestionInput = {
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
    clinicalReasoning: {
      queixaPrincipal: 'Dor lombar',
      areasPrioritarias: ['lombar'],
      areasSelecionadasDetalhadas: [
        {
          regiao: 'lombar',
          lado: 'ambos',
          observacao: 'Dor ao flexionar.',
          resumo: 'lombar (ambos, Dor ao flexionar.)',
        },
      ],
      observacoesAreas: ['lombar: Dor ao flexionar.'],
      pontosAnamnesePreenchidos: ['areasAfetadas', 'areasAfetadas.observacao'],
      ancorasEspecificidade: [
        'Area selecionada: lombar (ambos, Dor ao flexionar.)',
        'Observacao de area: lombar: Dor ao flexionar.',
        'Dor 6/10',
      ],
      irritabilidade: 'MODERADA',
      hipotesesFuncionais: ['Teste regional positivo.'],
      fatoresRelevantes: ['Dor referida: 6/10'],
      riscosOuAlertas: [],
      metasPaciente: ['Voltar a correr'],
      evolucaoRecente: [],
      evidenciasDisponiveis: ['anamnese', 'exame fisico estruturado'],
      lacunasClinicas: ['evolucao clinica ausente'],
      confidenceBase: 'MODERADA',
    },
    referenciasClinicas: {
      profile: 'OMBRO' as const,
      disclaimer: 'Validar clinicamente.',
      laudoReferences: [
        {
          id: 'guideline-ombro',
          title: 'Shoulder guideline',
          category: 'GUIDELINE' as const,
          source: 'JOSPT',
          year: 2025,
          url: 'https://example.com',
          rationale: 'Referencia de ombro.',
        },
      ],
      planoReferences: [],
    },
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
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('Resumo clinico priorizado'),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('Referencias clinicas permitidas'),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('Areas selecionadas detalhadas'),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('observacao clinica escrita'),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining(
          'Regras de especificidade obrigatorias',
        ),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('Ancoras obrigatorias'),
      }),
    );
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        userContent: expect.stringContaining('Teste de Adams'),
      }),
    );
  });

  it('searches and normalizes updated clinical references with web search', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(true);
    openAiService.isEnabled.mockReturnValue(true);
    openAiService.createJsonResponse.mockResolvedValue({
      parsed: {
        laudoReferences: [
          {
            id: 'recent-guideline',
            title: 'Recent shoulder guideline',
            category: 'GUIDELINE',
            source: 'JOSPT',
            year: 2026,
            authors: 'Autores Teste',
            url: 'https://www.jospt.org/doi/test',
            rationale: 'Atualiza o raciocinio clinico para ombro.',
          },
          {
            title: 'Commercial source',
            category: 'ARTIGO',
            source: 'Blog',
            year: 2026,
            url: 'https://example.com/source',
            rationale: 'Deve ser descartado.',
          },
        ],
        planoReferences: [
          {
            title: 'Recent rehab review',
            category: 'ARTIGO',
            source: 'PubMed',
            year: 2025,
            url: 'https://pubmed.ncbi.nlm.nih.gov/123/',
            rationale: 'Atualiza a progressao terapeutica.',
          },
        ],
      },
    });
    const service = new LaudoAiSuggestionService(openAiService);

    const result = await service.findUpdatedClinicalReferences(baseInput);

    expect(result?.laudoReferences).toHaveLength(1);
    expect(result?.planoReferences?.[0]).toMatchObject({
      id: expect.stringContaining('updated-recent-rehab-review'),
      title: 'Recent rehab review',
      category: 'ARTIGO',
    });
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          expect.objectContaining({
            type: 'web_search',
            filters: expect.objectContaining({
              allowed_domains: expect.arrayContaining([
                'pubmed.ncbi.nlm.nih.gov',
                'jospt.org',
              ]),
            }),
          }),
        ],
        toolChoice: 'auto',
      }),
    );
  });

  it('does not search updated references when web references are disabled', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(true);
    openAiService.isEnabled.mockReturnValue(false);
    const service = new LaudoAiSuggestionService(openAiService);

    await expect(
      service.findUpdatedClinicalReferences(baseInput),
    ).resolves.toBeNull();

    expect(openAiService.createJsonResponse).not.toHaveBeenCalled();
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
