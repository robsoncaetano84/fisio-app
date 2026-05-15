import {
  buildEvolucaoSoapAiContext,
  buildEvolucaoSoapAiPrompt,
  inferEvolucaoSoapSuggestion,
  mergeSoapSuggestions,
  sanitizeAiSoapSuggestion,
} from './charles-soap-suggestion.util';

describe('charles SOAP suggestion utils', () => {
  it('returns low-confidence fallback when clinical data is insufficient', () => {
    const result = inferEvolucaoSoapSuggestion({});

    expect(result.confidence).toBe('BAIXA');
    expect(result.subjetivo).toBeNull();
    expect(result.objetivo).toBeNull();
    expect(result.evidenceFields).toEqual([]);
  });

  it('builds deterministic SOAP draft from anamnesis and structured exam', () => {
    const result = inferEvolucaoSoapSuggestion({
      anamnese: {
        descricaoSintomas: 'Dor em ombro direito ao elevar braco',
        fatoresPiora: 'acima da cabeca',
        fatorAlivio: 'repouso',
        areasAfetadas: [{ regiao: 'OMBRO' }],
      },
      laudo: {
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
      },
    });

    expect(result.confidence).toBe('MODERADA');
    expect(result.subjetivo).toContain('Dor em ombro direito');
    expect(result.objetivo).toContain('ADM');
    expect(result.evidenceFields).toEqual(
      expect.arrayContaining([
        'queixaPrincipal/descricaoSintomas',
        'areasAfetadas',
        'fatoresPiora',
        'fatorAlivio',
        'laudo.exameFisico',
      ]),
    );
  });

  it('sanitizes AI SOAP suggestion and limits evidence fields', () => {
    const result = sanitizeAiSoapSuggestion({
      confidence: 'ALTA',
      reason: '  Resposta contextual.  ',
      evidenceFields: [
        'anamnese.descricaoSintomas',
        ' ',
        123,
        'laudo.exameFisico',
        'evolucaoAnterior',
        'extra-1',
        'extra-2',
        'extra-3',
        'extra-4',
        'extra-5',
      ],
      subjetivo: '  Paciente relata melhora.  ',
      objetivo: null,
      avaliacao: ' Evolucao favoravel. ',
      plano: ' Progredir carga. ',
    });

    expect(result).toMatchObject({
      confidence: 'ALTA',
      reason: 'Resposta contextual.',
      subjetivo: 'Paciente relata melhora.',
      avaliacao: 'Evolucao favoravel.',
      plano: 'Progredir carga.',
    });
    expect(result?.evidenceFields).toHaveLength(8);
  });

  it('rejects empty AI SOAP suggestion', () => {
    expect(sanitizeAiSoapSuggestion({ confidence: 'ALTA' })).toBeNull();
  });

  it('merges AI and fallback suggestions preserving missing AI fields', () => {
    const fallback = inferEvolucaoSoapSuggestion({
      anamnese: {
        descricaoSintomas: 'Dor em joelho ao agachar',
        areasAfetadas: [{ regiao: 'JOELHO' }],
      },
    });

    const result = mergeSoapSuggestions(fallback, {
      confidence: 'ALTA',
      reason: 'Sugestao aprimorada.',
      evidenceFields: ['evolucaoAnterior'],
      subjetivo: 'Paciente refere melhora.',
      objetivo: null,
      avaliacao: null,
      plano: null,
    });

    expect(result.confidence).toBe('ALTA');
    expect(result.subjetivo).toBe('Paciente refere melhora.');
    expect(result.objetivo).toBe(fallback.objetivo);
    expect(result.evidenceFields).toEqual(
      expect.arrayContaining(['evolucaoAnterior', 'areasAfetadas']),
    );
  });

  it('builds AI clinical context with truncated free-text fields', () => {
    const fallback = inferEvolucaoSoapSuggestion({});
    const context = buildEvolucaoSoapAiContext({
      paciente: {
        dataNascimento: new Date('2000-01-01T00:00:00.000Z'),
        sexo: 'F',
        profissao: 'Fisioterapeuta'.repeat(20),
      },
      anamnese: {
        descricaoSintomas: 'Dor '.repeat(400),
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
      evolucao: null,
      laudo: null,
      fallback,
    });

    expect(context.paciente.idade).toBeGreaterThan(20);
    expect(context.paciente.profissao?.length).toBeLessThanOrEqual(120);
    expect(context.anamnese?.descricaoSintomas?.length).toBeLessThanOrEqual(
      900,
    );
    expect(context.camposPermitidosParaEvidenceFields).toContain(
      'anamnese.descricaoSintomas',
    );
  });

  it('builds OpenAI SOAP prompt with deterministic clinical context', () => {
    const fallback = inferEvolucaoSoapSuggestion({
      anamnese: {
        descricaoSintomas: 'Dor lombar ao sentar',
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
    });
    const prompt = buildEvolucaoSoapAiPrompt({
      paciente: {
        sexo: 'F',
      },
      anamnese: {
        descricaoSintomas: 'Dor lombar ao sentar',
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
      evolucao: null,
      laudo: null,
      fallback,
    });

    expect(prompt.systemPrompt).toContain('assistente clinico');
    expect(prompt.userPrompt).toContain('Retorne SOMENTE JSON valido');
    expect(prompt.userPrompt).toContain('Contexto clinico');
    expect(prompt.userPrompt).toContain(
      '"descricaoSintomas": "Dor lombar ao sentar"',
    );
    expect(prompt.userPrompt).toContain('anamnese.descricaoSintomas');
  });
});
