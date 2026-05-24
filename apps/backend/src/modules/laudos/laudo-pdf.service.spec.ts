import { LaudoStatus } from './entities/laudo.entity';
import { STRUCTURED_EXAME_PREFIX } from './laudo-exame-fisico-structured.util';
import { LaudoPdfService } from './laudo-pdf.service';

describe('LaudoPdfService', () => {
  const service = new LaudoPdfService();
  const countPages = (buffer: Buffer) =>
    (buffer.toString('latin1').match(/\/Type \/Page\b/g) || []).length;
  const contentStreamLengths = (buffer: Buffer) =>
    [
      ...buffer
        .toString('latin1')
        .matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g),
    ].map((match) => match[1].length);

  const baseLaudo = {
    status: LaudoStatus.VALIDADO_PROFISSIONAL,
    diagnosticoFuncional: 'Disfuncao funcional lombar.',
    exameFisico: 'Mobilidade reduzida em flexao.',
    rascunhoProfissional: 'Acompanhar resposta nas proximas sessoes.',
    objetivosCurtoPrazo: 'Reduzir dor.',
    objetivosMedioPrazo: 'Retornar ao treino.',
    frequenciaSemanal: 2,
    duracaoSemanas: 6,
    criteriosAlta: 'Funcao restaurada sem dor limitante.',
    observacoes: null,
    condutas: 'Terapia manual e exercicios progressivos.',
    planoTratamentoIA: 'Plano semanal com progressao por tolerancia.',
  } as any;

  const profissional = {
    nome: 'Dra. Ana Silva',
    conselhoProf: 'CREFITO-3',
    registroProf: '12345',
    especialidade: 'Fisioterapia Ortopedica',
  };

  it('builds professional laudo pdf buffer', async () => {
    const buffer = await service.buildPdfBuffer({
      laudo: baseLaudo,
      pacienteNome: 'Paciente Teste',
      profissional,
      tipo: 'laudo',
      audience: 'professional',
    });

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
    const raw = buffer.toString('latin1');
    expect(raw).toContain('Dra. Ana Silva');
    expect(raw).toContain('CREFITO-3 12345');
  });

  it('builds patient treatment plan pdf buffer', async () => {
    const buffer = await service.buildPdfBuffer({
      laudo: baseLaudo,
      pacienteNome: 'Paciente Teste',
      profissional,
      tipo: 'plano',
      audience: 'patient',
    });

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
    const raw = buffer.toString('latin1');
    expect(raw).toContain('Meu Plano de Tratamento');
    expect(raw).toContain('Documento clinico de Paciente Teste');
    expect(raw).toContain('CREFITO-3 12345');
  });

  it('does not expose internal observations in patient PDFs', async () => {
    const internalObservation =
      'Massa 2 - ombro/punho esportivo para comparacao de respostas do Charles/IA.';
    const addCalloutSpy = jest
      .spyOn(service as any, 'addCallout')
      .mockImplementation(() => undefined);

    (service as any).addObservation(
      {},
      { ...baseLaudo, observacoes: internalObservation },
      'professional',
    );
    (service as any).addObservation(
      {},
      { ...baseLaudo, observacoes: internalObservation },
      'patient',
    );

    expect(addCalloutSpy).toHaveBeenNthCalledWith(
      1,
      {},
      'Observacao importante',
      'Documento para uso clinico profissional. Reavaliar periodicamente.',
    );
    expect(addCalloutSpy).toHaveBeenNthCalledWith(
      2,
      {},
      'Observacao importante',
      expect.stringContaining('Este documento orienta seu acompanhamento'),
    );
    expect(addCalloutSpy.mock.calls[0][2]).not.toContain(internalObservation);
    expect(addCalloutSpy.mock.calls[1][2]).not.toContain(internalObservation);
    expect(addCalloutSpy.mock.calls[1][2]).toContain(
      'Este documento orienta seu acompanhamento',
    );

    addCalloutSpy.mockRestore();
  });

  it('uses patient-friendly physical exam summary in patient reports', () => {
    const structuredExam = `${STRUCTURED_EXAME_PREFIX}${JSON.stringify({
      dorPrincipal: 'Mecanica',
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          titulo: 'Coluna lombar',
          adm: 'Nao informado',
          testes: [
            { nome: 'Lasegue (SLR)', resultado: 'NEGATIVO' },
            {
              nome: 'Slump test',
              resultado: 'NAO_TESTADO',
              selecionado: true,
            },
          ],
        },
      ],
    })}`;
    const addSectionsSpy = jest
      .spyOn(service as any, 'addSections')
      .mockImplementation(() => undefined);
    const addObservationSpy = jest
      .spyOn(service as any, 'addObservation')
      .mockImplementation(() => undefined);

    (service as any).addBody(
      {},
      { ...baseLaudo, exameFisico: structuredExam },
      'laudo',
      'patient',
    );

    const sections = addSectionsSpy.mock.calls[0][1];
    const examSection = sections.find(
      (section: { title: string }) => section.title === 'Achados da avaliacao',
    );

    expect(examSection.value).toContain('Coluna lombar');
    expect(examSection.value).not.toContain('Selecionado');
    expect(examSection.value).not.toContain('Nao informado');
    expect(examSection.value).not.toContain('Avaliacao por regioes');

    addSectionsSpy.mockRestore();
    addObservationSpy.mockRestore();
  });

  it('does not append footer-only blank pages for long reports', async () => {
    const longSection = Array.from(
      { length: 20 },
      (_, index) =>
        `- Linha clinica ${index + 1} com descricao funcional, progresso, conduta e criterio objetivo para acompanhar resposta do paciente.`,
    ).join('\n');

    const buffer = await service.buildPdfBuffer({
      laudo: {
        ...baseLaudo,
        motivoAvaliacao: longSection,
        historicoClinico: longSection,
        achadosClinicos: longSection,
        diagnosticoFuncional: longSection,
        conclusao: longSection,
        condutas: longSection,
        observacoes: longSection,
      },
      pacienteNome: 'Paciente Teste',
      profissional,
      tipo: 'laudo',
      audience: 'professional',
    });

    const pages = countPages(buffer);
    const streams = contentStreamLengths(buffer);

    expect(pages).toBeGreaterThan(1);
    expect(pages).toBeLessThanOrEqual(12);
    expect(streams).toHaveLength(pages);
    expect(Math.min(...streams)).toBeGreaterThan(1000);
  });
});
