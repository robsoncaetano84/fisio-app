import { BadRequestException } from '@nestjs/common';
import { LaudosService } from './laudos.service';

describe('LaudosService - structured exame validation', () => {
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
    const payload = {
      avaliacaoRegioes: [
        {
          regiao: 'LOMBAR',
          testes: [
            { nome: 'Lasègue (SLR)', resultado: 'NAO_TESTADO' },
            { nome: 'Slump test', resultado: 'NAO_TESTADO' },
          ],
        },
      ],
    };
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).toThrow(BadRequestException);
  });

  it('does not throw when at least one regional test is POSITIVO', () => {
    const service = makeService();
    const payload = {
      avaliacaoRegioes: [
        {
          regiao: 'JOELHO',
          testes: [
            { nome: 'Lachman', resultado: 'NEGATIVO' },
            { nome: 'Estresse em valgo', resultado: 'POSITIVO' },
          ],
        },
      ],
    };
    expect(() =>
      (service as any).validateStructuredExameInput(`${prefix}${JSON.stringify(payload)}`),
    ).not.toThrow();
  });
});

