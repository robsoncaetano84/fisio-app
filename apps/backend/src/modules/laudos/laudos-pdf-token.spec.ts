// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// L AU DO S P DF T OK EN.S PE C
// ==========================================
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import type { Request } from 'express';
import { LaudosController } from './laudos.controller';

/**
 * F4: o access token completo nunca pode ser aceito pela query string dos PDFs.
 * A query so aceita um token de download com escopo (laudo/tipo) e curta duracao.
 */
describe('LaudosController — token de download de PDF (F4)', () => {
  const secret = 'test-secret';
  const config = {
    get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined),
  } as unknown as ConfigService;

  // service nao e usado nestes testes (exercitamos so os helpers de token)
  const controller = new LaudosController(null as never, config);

  const noHeaderReq = { headers: {} } as unknown as Request;

  function callResolve(
    token: string | undefined,
    expected: { scope: string; tipo: 'laudo' | 'plano' },
    req: Request = noHeaderReq,
  ): string {
    // acessa o metodo privado para teste focado
    return (
      controller as unknown as {
        resolveUsuarioIdForPdf: (
          r: Request,
          t: string | undefined,
          e: { scope: string; tipo: 'laudo' | 'plano' },
        ) => string;
      }
    ).resolveUsuarioIdForPdf(req, token, expected);
  }

  function issue(scope: string, tipo: 'laudo' | 'plano'): string {
    return (
      controller as unknown as {
        issuePdfDownloadToken: (
          u: string,
          s: string,
          t: 'laudo' | 'plano',
        ) => { token: string };
      }
    ).issuePdfDownloadToken('user-1', scope, tipo).token;
  }

  it('aceita um token de download com escopo correto', () => {
    const token = issue('laudo-123', 'laudo');
    expect(callResolve(token, { scope: 'laudo-123', tipo: 'laudo' })).toBe(
      'user-1',
    );
  });

  it('recusa o access token cru na query (sem purpose de download)', () => {
    const accessToken = sign({ sub: 'user-1', role: 'USER' }, secret);
    expect(() =>
      callResolve(accessToken, { scope: 'laudo-123', tipo: 'laudo' }),
    ).toThrow(UnauthorizedException);
  });

  it('recusa token de download de outro laudo (escopo diferente)', () => {
    const token = issue('laudo-123', 'laudo');
    expect(() =>
      callResolve(token, { scope: 'laudo-999', tipo: 'laudo' }),
    ).toThrow(UnauthorizedException);
  });

  it('recusa token de download com tipo diferente (laudo vs plano)', () => {
    const token = issue('laudo-123', 'laudo');
    expect(() =>
      callResolve(token, { scope: 'laudo-123', tipo: 'plano' }),
    ).toThrow(UnauthorizedException);
  });

  it('aceita access token via header Authorization (fora da URL)', () => {
    const accessToken = sign({ sub: 'user-1', role: 'USER' }, secret);
    const req = {
      headers: { authorization: `Bearer ${accessToken}` },
    } as unknown as Request;
    expect(callResolve(undefined, { scope: 'laudo-123', tipo: 'laudo' }, req)).toBe(
      'user-1',
    );
  });

  it('sem token e sem header, nega acesso', () => {
    expect(() =>
      callResolve(undefined, { scope: 'laudo-123', tipo: 'laudo' }),
    ).toThrow(UnauthorizedException);
  });
});
