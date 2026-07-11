import {
  buildCreateLaudoDraft,
  buildGenerateLaudoSuggestionInput,
  buildSuggestionPreview,
  LaudoSuggestionContext,
} from './laudo-suggestion-composer.util';

describe('laudo suggestion composer util', () => {
  const context: LaudoSuggestionContext = {
    paciente: {
      nomeCompleto: 'Paciente Teste',
      dataNascimento: new Date('2000-01-01T00:00:00.000Z'),
      sexo: 'FEMININO',
      profissao: null,
    },
    anamneses: [
      {
        motivoBusca: 'Dor lombar',
        areasAfetadas: [
          {
            regiao: 'lombar',
            lado: 'ambos',
            intensidade: 6,
            observacao: 'Dor ao flexionar e permanecer sentado.',
          },
        ],
        intensidadeDor: 6,
        descricaoSintomas: null,
        tempoProblema: '2 semanas',
        inicioProblema: null,
        fatorAlivio: 'Repouso',
        fatoresPiora: null,
        mecanismoLesao: null,
        lesoesPrevias: null,
        usoMedicamentos: null,
        dorRepouso: false,
        dorNoturna: false,
        irradiacao: false,
        localIrradiacao: null,
        tipoDor: 'MECANICA',
        redFlags: [],
        yellowFlags: ['medo de movimento'],
        limitacoesFuncionais: 'Dificuldade para correr',
        atividadesQuePioram: 'Corrida',
        metaPrincipalPaciente: 'Voltar a correr 5km',
      },
    ],
    evolucoes: [
      {
        data: new Date('2026-01-02T00:00:00.000Z'),
        avaliacao: 'Melhora parcial',
        plano: null,
        observacoes: 'Sem sinais de alarme',
      },
    ],
    exames: [
      {
        nomeOriginal: 'ressonancia.pdf',
        tipoExame: 'RM',
        dataExame: null,
        mimeType: 'application/pdf',
        observacao: '',
        uploadedAt: new Date('2026-01-03T00:00:00.000Z'),
        aiInterpretacao: 'Sem sinais de alarme.',
      },
    ],
    exameFisicoResumo: 'Teste regional positivo com deficit funcional.',
  };

  it('maps clinical context to OpenAI suggestion input', () => {
    const input = buildGenerateLaudoSuggestionInput(context);

    expect(input.paciente).toMatchObject({
      nomeCompleto: 'Paciente Teste',
      sexo: 'FEMININO',
      profissao: '',
    });
    expect(input.paciente.idade).toEqual(expect.any(Number));
    expect(input.anamnese).toMatchObject({
      motivoBusca: 'Dor lombar',
      descricaoSintomas: '',
      inicioProblema: '',
      usoMedicamentos: '',
      tipoDor: 'MECANICA',
      metaPrincipalPaciente: 'Voltar a correr 5km',
    });
    expect(input.clinicalReasoning).toMatchObject({
      queixaPrincipal: 'Dor lombar',
      areasSelecionadasDetalhadas: [
        expect.objectContaining({
          regiao: 'lombar',
          lado: 'ambos',
          intensidade: 6,
          observacao: 'Dor ao flexionar e permanecer sentado.',
        }),
      ],
      observacoesAreas: ['lombar: Dor ao flexionar e permanecer sentado.'],
      ancorasEspecificidade: expect.arrayContaining([
        'Area selecionada: lombar (ambos, dor 6/10, Dor ao flexionar e permanecer sentado.)',
        'Observacao de area: lombar: Dor ao flexionar e permanecer sentado.',
        'Dor 6/10',
        'Limitacao funcional: Dificuldade para correr',
      ]),
      irritabilidade: 'MODERADA',
      confidenceBase: 'ALTA',
    });
    expect(input.clinicalReasoning.pontosAnamnesePreenchidos).toEqual(
      expect.arrayContaining([
        'areasAfetadas',
        'areasAfetadas.observacao',
        'fatorAlivio',
        'limitacoesFuncionais',
      ]),
    );
    expect(input.evolucoes).toEqual([
      {
        data: context.evolucoes[0].data,
        avaliacaoClinica: 'Melhora parcial',
        planoSessao: '',
        observacoes: 'Sem sinais de alarme',
      },
    ]);
  });

  it('builds fallback create payload with evidence hints', () => {
    const draft = buildCreateLaudoDraft({
      pacienteId: 'paciente-1',
      context,
      aiSuggestion: {},
      referenciasClinicas: {
        profile: 'OMBRO',
        disclaimer: 'Validar clinicamente.',
        laudoReferences: [
          {
            id: 'guideline-ombro',
            title: 'Shoulder Clinical Practice Guideline',
            category: 'GUIDELINE',
            source: 'JOSPT',
            year: 2025,
            url: 'https://example.com',
            rationale: 'Apoia avaliacao e manejo do ombro.',
          },
        ],
        planoReferences: [
          {
            id: 'book-ombro',
            title: 'The Athlete Shoulder',
            category: 'LIVRO',
            source: 'Elsevier',
            year: 2009,
            url: 'https://example.com/book',
            rationale: 'Apoia progressao e reabilitacao.',
          },
        ],
      },
    });

    expect(draft.source).toBe('rules');
    expect(draft.examesConsiderados).toBe(1);
    expect(draft.examesComLeituraIa).toBe(1);
    expect(draft.payload.diagnosticoFuncional).toContain('Hipotese funcional:');
    expect(draft.payload.diagnosticoFuncional).toContain(
      'Baseado no exame fisico',
    );
    expect(draft.payload.diagnosticoFuncional).toContain('Dor ao flexionar');
    expect(draft.payload.objetivosCurtoPrazo).toContain('Voltar a correr 5km');
    expect(draft.payload.condutas).toContain('Educacao em dor');
    expect(draft.payload.condutas).toContain(
      'Exercicios terapeuticos progressivos',
    );
    expect(draft.payload.condutas).toContain('progressao por:');
    expect(draft.payload.planoTratamentoIA).toContain(
      'Fase 2 - Recuperacao de movimento/forca',
    );
    expect(draft.payload.criteriosAlta).toContain('lombar');
    expect(draft.payload.planoTratamentoIA).toContain(
      'Referencias clinicas sugeridas',
    );
    expect(draft.payload.planoTratamentoIA).toContain(
      'Shoulder Clinical Practice Guideline',
    );
  });

  it('builds high-confidence preview when AI and interpreted exams are present', () => {
    const preview = buildSuggestionPreview(context, {
      diagnosticoFuncional: 'Disfuncao funcional confirmada.',
      condutas: 'Exercicios progressivos.',
    });

    expect(preview.source).toBe('ai');
    expect(preview.confidence).toBe('ALTA');
    expect(preview.evidenceFields).toEqual([
      'anamnese',
      'areasAfetadas',
      'observacoesArea',
      'evolucoes',
      'exameFisico',
      'exames',
    ]);
    expect(preview.diagnosticoFuncional).toBe(
      'Disfuncao funcional confirmada.',
    );
  });
});
