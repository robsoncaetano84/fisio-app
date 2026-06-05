import { BadRequestException } from '@nestjs/common';
import {
  formatExameFisicoForDisplay,
  formatExameFisicoForPatientDisplay,
  LEGACY_STRUCTURED_EXAME_PREFIX,
  parseStructuredExame,
  STRUCTURED_EXAME_PREFIX,
  validateStructuredExameInput,
} from './laudo-exame-fisico-structured.util';

describe('laudo exame fisico structured util', () => {
  const prefix = STRUCTURED_EXAME_PREFIX;
  const legacyPrefix = LEGACY_STRUCTURED_EXAME_PREFIX;

  const buildPayload = (overrides?: Record<string, unknown>) => ({
    version: 2,
    avaliacaoRegioes: [
      {
        regiao: 'LOMBAR',
        titulo: 'Coluna lombar',
        testes: [
          { nome: 'Lasegue (SLR)', resultado: 'NEGATIVO', selecionado: true },
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
      origemProvavelDor: 'Origem mecanico-funcional lombar.',
      estruturaEnvolvida: 'Complexo lombo-pelvico',
      tipoLesao: 'Mecanica',
      fatorBiomecanicoAssociado: 'Sobrecarga em flexao + carga',
      relacaoComEsporte: 'Crossfit recreativo',
    },
    diagnosticoFuncionalIa: {
      disfuncaoPrincipal: 'Deficit de estabilidade lombar em carga.',
      cadeiaEnvolvida: 'Cadeia lombo-pelvica',
    },
    condutaIa: {
      tecnicaManualIndicada: 'Mobilizacao lombar de baixa irritabilidade.',
      ajusteArticular: 'Ajuste segmentar apenas se restricao objetiva.',
      exercicioCorretivo: 'Estabilidade lombo-pelvica progressiva.',
      liberacaoMiofascial: 'Liberacao miofascial em cadeia posterior.',
      progressaoEsportiva: 'Retorno progressivo por dor e funcao.',
    },
    cruzamentoFinal: {
      hipotesePrincipal: 'Disfuncao funcional lombar.',
      hipotesesSecundarias: 'Componente neural a confirmar.',
      inconsistencias: 'Sem inconsistencias criticas.',
      condutaDirecionada: 'Controle de dor + estabilidade + progressao.',
      prioridade: 'MEDIA',
      confiancaHipotese: 'MODERADA',
      scoreEvidencia: 3,
    },
    ...overrides,
  });

  it('does not throw for non-structured plain text exame', () => {
    expect(() =>
      validateStructuredExameInput('texto livre de exame fisico'),
    ).not.toThrow();
  });

  it('does not throw for malformed structured payload (fallback behavior)', () => {
    expect(() =>
      validateStructuredExameInput(`${prefix}{invalid-json`),
    ).not.toThrow();
  });

  it('throws when structured payload has no POSITIVO/NEGATIVO regional test', () => {
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          testes: [
            { nome: 'Lasegue (SLR)', resultado: 'NAO_TESTADO' },
            { nome: 'Slump test', resultado: 'NAO_TESTADO' },
          ],
        },
      ],
    });

    expect(() =>
      validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).toThrow(BadRequestException);
  });

  it('does not throw when at least one regional test is POSITIVO', () => {
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
      validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('parses structured payload with valid prefix', () => {
    const payload = buildPayload();
    const parsed = parseStructuredExame(`${prefix}${JSON.stringify(payload)}`);

    expect(parsed).toBeTruthy();
    expect(parsed.version).toBe(2);
    expect(parsed.raciocinioClinico?.tipoLesao).toBe('Mecanica');
  });

  it('keeps reading legacy structured V1 payloads', () => {
    const payload = buildPayload({ version: 1 });
    const parsed = parseStructuredExame(
      `${legacyPrefix}${JSON.stringify(payload)}`,
    );

    expect(parsed).toBeTruthy();
    expect(parsed.version).toBe(1);
  });

  it('returns null when parsing payload without prefix', () => {
    const payload = buildPayload();
    const parsed = parseStructuredExame(JSON.stringify(payload));

    expect(parsed).toBeNull();
  });

  it('formats structured exam text with key IA sections', () => {
    const payload = buildPayload();
    const formatted = formatExameFisicoForDisplay(
      `${prefix}${JSON.stringify(payload)}`,
    );

    expect(formatted).toContain('Raciocinio clinico');
    expect(formatted).toContain('Diagnostico funcional');
    expect(formatted).toContain('Conduta direcionada');
  });

  it('formats postural assessment and Adams findings as clinical evidence', () => {
    const payload = buildPayload({
      observacao: {
        postura: 'A avaliar.',
        assimetria: 'Nao informado',
        avaliacaoPostural: {
          planoFrontal: 'Ombro direito discretamente elevado.',
          planoSagital: 'Cabeca anteriorizada.',
          testeAdams: 'Giba toracica discreta a direita.',
          planoFrontalItens: {
            cabeca: 'Normal',
            ombros: 'Direita mais alta/desviada',
            escapulas: 'Nao avaliado',
            pelve: 'Normal',
            joelhos: 'Nao avaliado',
            pes: 'Nao avaliado',
          },
          planoSagitalItens: {
            cabeca: 'Anteriorizada',
            cifoseToracica: 'Aumentada',
            lordoseLombar: 'Nao avaliado',
            pelve: 'Neutra',
            joelhos: 'Nao avaliado',
            apoioPlantar: 'Normal',
          },
          adams: {
            resultado: 'Assimetria a direita',
            regiao: 'Toracica',
            intensidade: 'Moderada',
            atrGraus: '6',
          },
        },
      },
    });

    const formatted = formatExameFisicoForDisplay(
      `${prefix}${JSON.stringify(payload)}`,
    );
    const patient = formatExameFisicoForPatientDisplay(
      `${prefix}${JSON.stringify(payload)}`,
    );

    expect(formatted).toContain('Avaliacao postural direcionada');
    expect(formatted).toContain('Plano frontal:');
    expect(formatted).toContain('Ombros: Direita mais alta/desviada');
    expect(formatted).toContain('Plano sagital:');
    expect(formatted).toContain('Cabeca: Anteriorizada');
    expect(formatted).toContain('Teste de Adams:');
    expect(formatted).toContain('ATR/escoliometro: 6 graus');
    expect(formatted).toContain('Alerta Adams');
    expect(formatted).not.toContain('Escapulas: Nao avaliado');
    expect(patient).toContain('Avaliacao postural');
    expect(patient).toContain('Teste de Adams');
  });

  it('formats structured exam for patients without technical placeholders', () => {
    const payload = buildPayload({
      dorPrincipal: 'Mecanica',
      padraoDor: {
        local: 'Lombar baixa',
        irradiada: 'Nao informado',
      },
      movimento: {
        ativo: 'Flexao reproduz desconforto leve',
        passivo: 'Nao informado',
      },
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
    });

    const formatted = formatExameFisicoForPatientDisplay(
      `${prefix}${JSON.stringify(payload)}`,
    );

    expect(formatted).toContain('Padrao principal avaliado');
    expect(formatted).toContain('Coluna lombar');
    expect(formatted).toContain('Lasegue');
    expect(formatted).not.toContain('Slump test');
    expect(formatted).not.toContain('Selecionado');
    expect(formatted).not.toContain('Nao informado');
    expect(formatted).not.toContain('Sem testes marcados');
    expect(formatted).not.toContain('Avaliacao por regioes');
    expect(formatted).not.toContain('Raciocinio clinico');
    expect(formatted).not.toContain('Conduta direcionada');
  });

  it('scenario A (joelho esportivo): accepts valid regional tests', () => {
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
        origemProvavelDor: 'Sobrecarga mecanica de joelho em gesto esportivo.',
        estruturaEnvolvida:
          'Compartimento femorotibial medial e controle de quadril.',
        tipoLesao: 'Mecanica',
        fatorBiomecanicoAssociado: 'Valgo dinamico em aterrissagem.',
        relacaoComEsporte: 'Futebol recreativo',
      },
    });

    expect(() =>
      validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('scenario B (lombar neural): accepts with neural positive tests', () => {
    const payload = buildPayload({
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          testes: [
            { nome: 'Lasegue (SLR)', resultado: 'POSITIVO' },
            { nome: 'Slump test', resultado: 'POSITIVO' },
            { nome: 'Schober', resultado: 'NEGATIVO' },
          ],
        },
      ],
      raciocinioClinico: {
        origemProvavelDor: 'Componente neural lombossacro pos-carga axial.',
        estruturaEnvolvida: 'Raiz neural lombar e tecido mecanossensivel.',
        tipoLesao: 'Neural',
        fatorBiomecanicoAssociado: 'Flexao com carga e fadiga lombo-pelvica.',
        relacaoComEsporte: 'Crossfit',
      },
    });

    expect(() =>
      validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });

  it('scenario C (ombro esportivo): accepts with shoulder positives', () => {
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
        origemProvavelDor: 'Sobrecarga de ombro por gesto acima da cabeca.',
        estruturaEnvolvida: 'Espaco subacromial e manguito rotador.',
        tipoLesao: 'Inflamatoria',
        fatorBiomecanicoAssociado: 'Deficit de controle escapular em saque.',
        relacaoComEsporte: 'Voleibol',
      },
    });

    expect(() =>
      validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });
});
