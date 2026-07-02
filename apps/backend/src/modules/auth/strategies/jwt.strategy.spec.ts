// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// J WT.S TR AT EG Y.S PE C
// ==========================================
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UsuariosService } from '../../usuarios/usuarios.service';

/**
 * F9: um token revogado (logout incrementa tokenVersion) nao pode autenticar.
 * Tokens antigos sem o claim sao tratados como versao 0.
 */
describe('JwtStrategy (F9 — revogacao por tokenVersion)', () => {
  const config = {
    get: () => 'secret',
  } as unknown as ConfigService;

  function build(usuario: unknown) {
    const usuarios = {
      findById: jest.fn().mockResolvedValue(usuario),
    } as unknown as UsuariosService;
    return new JwtStrategy(config, usuarios);
  }

  const payload = (tokenVersion?: number): JwtPayload => ({
    sub: 'u1',
    email: 'a@b.com',
    role: 'USER',
    tokenVersion,
  });

  it('autentica quando a versao do token casa com a do usuario', async () => {
    const strategy = build({ id: 'u1', ativo: true, tokenVersion: 3 });
    await expect(strategy.validate(payload(3))).resolves.toMatchObject({
      id: 'u1',
    });
  });

  it('rejeita quando o token foi revogado (versao antiga)', async () => {
    const strategy = build({ id: 'u1', ativo: true, tokenVersion: 4 });
    await expect(strategy.validate(payload(3))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('trata token sem o claim como versao 0 (compatibilidade)', async () => {
    const strategy = build({ id: 'u1', ativo: true, tokenVersion: 0 });
    await expect(strategy.validate(payload(undefined))).resolves.toMatchObject({
      id: 'u1',
    });
  });

  it('rejeita usuario inativo', async () => {
    const strategy = build({ id: 'u1', ativo: false, tokenVersion: 0 });
    await expect(strategy.validate(payload(0))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
