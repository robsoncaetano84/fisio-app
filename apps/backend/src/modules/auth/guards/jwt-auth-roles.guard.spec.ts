// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// J WT A UT H R OL ES.G UA RD.S PE C
// ==========================================
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthRolesGuard } from './jwt-auth.guard';
import { UserRole } from '../../usuarios/entities/usuario.entity';

/**
 * Garante que a restricao de @Roles e realmente aplicada APOS a autenticacao.
 * Regressao da F1: antes o RolesGuard global rodava antes do JwtAuthGuard e
 * a role nunca era checada.
 */
describe('JwtAuthRolesGuard', () => {
  const parentProto = Object.getPrototypeOf(JwtAuthRolesGuard.prototype);

  function buildContext(role?: UserRole): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  function buildGuard(rolesRequired: UserRole[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(rolesRequired),
    } as unknown as Reflector;
    return new JwtAuthRolesGuard(reflector);
  }

  afterEach(() => jest.restoreAllMocks());

  it('nega acesso quando a role do usuario nao esta na lista de @Roles', async () => {
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(true);
    const guard = buildGuard([UserRole.ADMIN, UserRole.USER]);

    await expect(
      guard.canActivate(buildContext(UserRole.PACIENTE)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite acesso quando a role do usuario esta na lista de @Roles', async () => {
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(true);
    const guard = buildGuard([UserRole.ADMIN, UserRole.USER]);

    await expect(guard.canActivate(buildContext(UserRole.USER))).resolves.toBe(
      true,
    );
  });

  it('permite acesso a qualquer usuario autenticado quando a rota nao declara @Roles', async () => {
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(true);
    const guard = buildGuard(undefined);

    await expect(
      guard.canActivate(buildContext(UserRole.PACIENTE)),
    ).resolves.toBe(true);
  });

  it('nega acesso quando ha @Roles mas o usuario nao tem role', async () => {
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(true);
    const guard = buildGuard([UserRole.ADMIN]);

    await expect(
      guard.canActivate(buildContext(undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('nao checa role se a autenticacao falhar', async () => {
    jest.spyOn(parentProto, 'canActivate').mockResolvedValue(false);
    const guard = buildGuard([UserRole.ADMIN]);

    await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(
      false,
    );
  });
});
