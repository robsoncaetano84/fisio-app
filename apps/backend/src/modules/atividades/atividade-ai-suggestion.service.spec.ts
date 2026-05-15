import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { OpenAiService } from '../ai/openai.service';
import { Paciente, Sexo } from '../pacientes/entities/paciente.entity';
import { AtividadeAiSuggestionService } from './atividade-ai-suggestion.service';

const paciente = {
  nomeCompleto: 'Paciente Teste',
  dataNascimento: new Date('1990-01-01T00:00:00.000Z'),
  sexo: Sexo.FEMININO,
  profissao: 'Corredora',
} as Paciente;

const anamnese = {
  motivoBusca: 'Dor no joelho',
  intensidadeDor: 6,
  descricaoSintomas: 'Dor anterior no joelho ao correr',
  tempoProblema: '2 meses',
  fatorAlivio: 'Repouso',
  limitacoesFuncionais: 'Correr acima de 5km',
  atividadesQuePioram: 'Descida e agachamento',
  metaPrincipalPaciente: 'Voltar a correr sem dor',
  qualidadeSono: 'Boa',
  nivelEstresse: 'Moderado',
  observacoesEstiloVida: 'Treina 4x por semana',
} as unknown as Anamnese;

const makeOpenAiService = (
  overrides?: Partial<OpenAiService>,
): jest.Mocked<OpenAiService> =>
  ({
    isConfigured: jest.fn(() => true),
    resolveModel: jest.fn(() => 'gpt-test'),
    getPositiveIntegerEnv: jest.fn(() => 8000),
    createJsonResponse: jest.fn(),
    ...overrides,
  }) as unknown as jest.Mocked<OpenAiService>;

describe('AtividadeAiSuggestionService', () => {
  it('returns a rule-based suggestion when OpenAI is not configured', async () => {
    const openAiService = makeOpenAiService({
      isConfigured: jest.fn(() => false),
    });
    const service = new AtividadeAiSuggestionService(openAiService);

    const result = await service.generate(
      { pacienteId: 'pac-1' },
      paciente,
      anamnese,
    );

    expect(result.source).toBe('rules');
    expect(result.titulo).toBe('Plano inicial: Voltar a correr sem dor');
    expect(result.descricao).toContain(
      'Meta principal: Voltar a correr sem dor.',
    );
    expect(result.descricao).toContain('Referencias:');
    expect(openAiService.createJsonResponse).not.toHaveBeenCalled();
  });

  it('uses sanitized AI content and only allowed references', async () => {
    const openAiService = makeOpenAiService();
    openAiService.createJsonResponse.mockResolvedValueOnce({
      model: 'gpt-test',
      outputText: '{"ok":true}',
      parsed: {
        titulo: '  Fortalecimento progressivo  ',
        descricao: '  Plano com controle de carga.  ',
        referencias: [
          'Magee DJ. Avaliacao musculoesqueletica.',
          'Referencia inventada',
          'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
        ],
      },
    });
    const service = new AtividadeAiSuggestionService(openAiService);

    const result = await service.generate(
      { pacienteId: 'pac-1', titulo: 'rascunho' },
      paciente,
      anamnese,
    );

    expect(result).toMatchObject({
      source: 'ai',
      model: 'gpt-test',
      titulo: 'Fortalecimento progressivo',
      referencias: [
        'Magee DJ. Avaliacao musculoesqueletica.',
        'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
      ],
    });
    expect(result.descricao).toContain('Plano com controle de carga.');
    expect(result.descricao).not.toContain('Referencia inventada');
    expect(openAiService.createJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-test',
        temperature: 0.2,
        operation: 'activity suggestion',
      }),
    );
  });

  it('falls back to default references when AI returns no allowed references', async () => {
    const openAiService = makeOpenAiService();
    openAiService.createJsonResponse.mockResolvedValueOnce({
      model: 'gpt-test',
      outputText: '{"ok":true}',
      parsed: {
        titulo: '',
        descricao: 'Conduta sugerida.',
        referencias: ['Referencia fora do catalogo'],
      },
    });
    const service = new AtividadeAiSuggestionService(openAiService);

    const result = await service.generate(
      { pacienteId: 'pac-1', titulo: 'Titulo manual' },
      paciente,
      null,
    );

    expect(result.source).toBe('ai');
    expect(result.titulo).toBe('Titulo manual');
    expect(result.referencias).toEqual([
      'Kisner C, Colby LA, Borstad J. Exercicios terapeuticos: fundamentos e tecnicas.',
      'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
    ]);
  });
});
