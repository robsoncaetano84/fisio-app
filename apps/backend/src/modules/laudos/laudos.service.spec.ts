import { BadRequestException } from '@nestjs/common';
import { LaudosService } from './laudos.service';

describe('LaudosService - structured exame validation and parsing', () => {
  const makeService = () =>
    new LaudosService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

  const prefix = '__EXAME_FISICO_STRUCTURED_V1__';

  const buildPayload = (overrides?: Record<string, unknown>) => ({
    version: 1,
    avaliacaoRegioes: [
      {
        regiao: 'LOMBAR',
        titulo: 'Coluna lombar',
        testes: [
          { nome: 'Lasègue (SLR)', resultado: 'NEGATIVO', selecionado: true },
          { nome: 'Slump test', resultado: 'NAO_TESTADO', selecionado: true },
        ],
      },
    ],
    redFlags: {
      criticalTriggered: false,
      referralDestination: '',
      referralReason: '',
    },
    raciocinioClinico: {
      origemProvavelDor: 'Origem mecânico-funcional lombar.',
      estruturaEnvolvida: 'Complexo lombo-pélvico',
      tipoLesao: 'Mecanica',
      fatorBiomecanicoAssociado: 'Sobrecarga em flexão + carga',
      relacaoComEsporte: 'Crossfit recreativo',
    },
    diagnosticoFuncionalIa: {
      disfuncaoPrincipal: 'Déficit de estabilidade lombar em carga.',
      cadeiaEnvolvida: 'Cadeia lombo-pelvica',
      compensacoes: 'Compensação em cadeia posterior.',
    },
    condutaIa: {
      tecnicaManualIndicada: 'Mobilização lombar de baixa irritabilidade.',
      ajusteArticular: 'Ajuste segmentar apenas se restrição objetiva.',
      exercicioCorretivo: 'Estabilidade lombo-pélvica progressiva.',
      liberacaoMiofascial: 'Liberação miofascial em cadeia posterior.',
      progressaoEsportiva: 'Retorno progressivo por dor e função.',
    },
    cruzamentoFinal: {
      hipotesePrincipal: 'Disfunção funcional lombar.',
      hipotesesSecundarias: 'Componente neural a confirmar.',
      inconsistencias: 'Sem inconsistências críticas.',
      condutaDirecionada: 'Controle de dor + estabilidade + progressão.',
      prioridade: 'MEDIA',
      confiancaHipotese: 'MODERADA',
      scoreEvidencia: 3,
    },
    ...overrides,
  });

  it('does not throw for non-structured plain text exame', () => {
    const service = makeService();
    expect(() =>
      (service as any).validateStructuredExameInput('texto livre de exame fisico'),
    ).not.toThrow();
  });

  it('does not throw for malformed structured payload (fallback behavior)', () => {
    const service = makeService();
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}{invalid-json`),
    ).not.toThrow();
  });

  it('throws when structured payload has no POSITIVO/NEGATIVO regional test', () => {
    const service = makeService();
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          testes: [
            { nome: 'Lasègue (SLR)', resultado: 'NAO_TESTADO' },
            { nome: 'Slump test', resultado: 'NAO_TESTADO' },
          ],
        },
      ],
    });
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).toThrow(BadRequestException);
  });

  it('does not throw when at least one regional test is POSITIVO', () => {
    const service = makeService();
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'JOELHO',
          testes: [
            { nome: 'Lachman', resultado: 'NEGATIVO' },
            { nome: 'Estresse em valgo', resultado: 'POSITIVO' },
          ],
        },
      ],
    });
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('parses structured payload with valid prefix', () => {
    const service = makeService();
    const payload = buildPayload();
    const parsed = (service as any).parseStructuredExame(
      `${prefix}${JSON.stringify(payload)}`,
    );
    expect(parsed).toBeTruthy();
    expect(parsed.version).toBe(1);
    expect(parsed.raciocinioClinico?.tipoLesao).toBe('Mecanica');
  });

  it('returns null when parsing payload without prefix', () => {
    const service = makeService();
    const payload = buildPayload();
    const parsed = (service as any).parseStructuredExame(JSON.stringify(payload));
    expect(parsed).toBeNull();
  });

  it('formats structured exam text with key IA sections', () => {
    const service = makeService();
    const payload = buildPayload();
    const formatted = (service as any).formatExameFisicoForDisplay(
      `${prefix}${JSON.stringify(payload)}`,
    ) as string;
    expect(formatted).toContain('Raciocinio clinico');
    expect(formatted).toContain('Diagnostico funcional');
    expect(formatted).toContain('Conduta direcionada');
  });

  it('scenario A (joelho esportivo): accepts valid regional tests', () => {
    const service = makeService();
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'JOELHO',
          testes: [
            { nome: 'Lachman', resultado: 'NEGATIVO' },
            { nome: 'Estresse em valgo', resultado: 'POSITIVO' },
            { nome: 'McMurray', resultado: 'NEGATIVO' },
          ],
        },
        {
          regiao: 'QUADRIL',
          testes: [{ nome: 'Trendelenburg', resultado: 'POSITIVO' }],
        },
      ],
      raciocinioClinico: {
        origemProvavelDor: 'Sobrecarga mecânica de joelho em gesto esportivo.',
        estruturaEnvolvida: 'Compartimento femorotibial medial e controle de quadril.',
        tipoLesao: 'Mecanica',
        fatorBiomecanicoAssociado: 'Valgo dinâmico em aterrissagem.',
        relacaoComEsporte: 'Futebol recreativo',
      },
    });
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('scenario B (lombar neural): accepts with neural positive tests', () => {
    const service = makeService();
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          testes: [
            { nome: 'Lasègue (SLR)', resultado: 'POSITIVO' },
            { nome: 'Slump test', resultado: 'POSITIVO' },
            { nome: 'Schober', resultado: 'NEGATIVO' },
          ],
        },
      ],
      raciocinioClinico: {
        origemProvavelDor: 'Componente neural lombossacro pós-carga axial.',
        estruturaEnvolvida: 'Raiz neural lombar e tecido mecanossensível.',
        tipoLesao: 'Neural',
        fatorBiomecanicoAssociado: 'Flexão com carga e fadiga lombo-pélvica.',
        relacaoComEsporte: 'Crossfit',
      },
    });
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('scenario C (ombro esportivo): accepts with shoulder positives', () => {
    const service = makeService();
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'OMBRO',
          testes: [
            { nome: 'Neer', resultado: 'POSITIVO' },
            { nome: 'Hawkins-Kennedy', resultado: 'POSITIVO' },
            { nome: 'Drop arm', resultado: 'NEGATIVO' },
            { nome: 'Jobe (Empty can)', resultado: 'POSITIVO' },
          ],
        },
      ],
      raciocinioClinico: {
        origemProvavelDor: 'Sobrecarga de ombro por gesto acima da cabeça.',
        estruturaEnvolvida: 'Espaço subacromial e manguito rotador.',
        tipoLesao: 'Inflamatoria',
        fatorBiomecanicoAssociado: 'Déficit de controle escapular em saque.',
        relacaoComEsporte: 'Voleibol',
      },
    });
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });
});
