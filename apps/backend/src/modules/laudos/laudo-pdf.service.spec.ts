import { LaudoStatus } from './entities/laudo.entity';
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

  it('does not append footer-only blank pages for long reports', async () => {
    const longSection = Array.from(
      { length: 20 },
      (_, index) =>
        `- Linha clinica ${index + 1} com descricao funcional, progresso, conduta e criterio objetivo para acompanhar resposta do paciente.`,
    ).join('\n');

    const buffer = await service.buildPdfBuffer({
      laudo: {
        ...baseLaudo,
        diagnosticoFuncional: longSection,
        exameFisico: longSection,
        rascunhoProfissional: longSection,
        objetivosCurtoPrazo: longSection,
        objetivosMedioPrazo: longSection,
        criteriosAlta: longSection,
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
