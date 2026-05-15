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
        areasAfetadas: ['lombar'],
        intensidadeDor: 6,
        descricaoSintomas: null,
        tempoProblema: '2 semanas',
        inicioProblema: null,
        fatorAlivio: 'Repouso',
        fatoresPiora: null,
        mecanismoLesao: null,
        lesoesPrevias: null,
        usoMedicamentos: null,
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
    });
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
    });

    expect(draft.source).toBe('rules');
    expect(draft.examesConsiderados).toBe(1);
    expect(draft.examesComLeituraIa).toBe(1);
    expect(draft.payload.diagnosticoFuncional).toContain(
      'Correlacionar com 1 exame(s) anexado(s).',
    );
    expect(draft.payload.diagnosticoFuncional).toContain(
      'Baseado no exame fisico',
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
      'evolucoes',
      'exameFisico',
      'exames',
    ]);
    expect(preview.diagnosticoFuncional).toBe(
      'Disfuncao funcional confirmada.',
    );
  });
});
