import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../usuarios/entities/usuario.entity';
import { RolesGuard } from './roles.guard';

const makeContext = (user?: { role?: UserRole }): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  }) as unknown as ExecutionContext;

const makeGuard = (metadata: { isPublic?: boolean; roles?: UserRole[] }) => {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'isPublic') return metadata.isPublic;
      if (key === 'roles') return metadata.roles;
      return undefined;
    }),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('allows public routes', () => {
    const guard = makeGuard({ isPublic: true, roles: [UserRole.ADMIN] });

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows authenticated routes without role restriction', () => {
    const guard = makeGuard({});

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('denies role-protected routes without an authenticated user', () => {
    const guard = makeGuard({ roles: [UserRole.ADMIN] });

    expect(guard.canActivate(makeContext())).toBe(false);
  });

  it('allows users with a matching role', () => {
    const guard = makeGuard({ roles: [UserRole.ADMIN, UserRole.USER] });

    expect(guard.canActivate(makeContext({ role: UserRole.USER }))).toBe(true);
  });

  it('denies users without a matching role', () => {
    const guard = makeGuard({ roles: [UserRole.ADMIN] });

    expect(guard.canActivate(makeContext({ role: UserRole.PACIENTE }))).toBe(
      false,
    );
  });
});
