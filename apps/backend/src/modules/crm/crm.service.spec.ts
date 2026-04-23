import { ForbiddenException } from '@nestjs/common';
import { CrmService } from './crm.service';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';

type ConfigMap = Record<string, string | undefined>;

function createService(config: ConfigMap): CrmService {
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as any;

  return new CrmService(
    configService,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
  );
}

function makeUser(params: Partial<Usuario>): Usuario {
  return {
    id: 'u-1',
    nome: 'Teste',
    email: 'admin@teste.com',
    senha: 'hash',
    role: UserRole.ADMIN,
    ativo: true,
    conselhoSigla: '',
    conselhoUf: '',
    conselhoProf: '',
    registroProf: '',
    especialidade: '',
    consentTermsRequired: false,
    consentPrivacyRequired: false,
    consentResearchOptional: false,
    consentAiOptional: false,
    consentAcceptedAt: null,
    consentProfessionalLgpdRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...params,
  } as Usuario;
}

describe('CrmService permissions', () => {
  it('blocks non-admin users', () => {
    const service = createService({
      MASTER_ADMIN_EMAILS: '',
    });
    const user = makeUser({ role: UserRole.USER });
    expect(() => service.assertMasterAdmin(user)).toThrow(ForbiddenException);
  });

  it('allows admin when allowlist is empty', () => {
    const service = createService({
      MASTER_ADMIN_EMAILS: '',
    });
    const user = makeUser({ email: 'qualquer@teste.com' });
    expect(() => service.assertMasterAdmin(user)).not.toThrow();
  });

  it('blocks admin outside allowlist', () => {
    const service = createService({
      MASTER_ADMIN_EMAILS: 'master@teste.com',
    });
    const user = makeUser({ email: 'outro@teste.com' });
    expect(() => service.assertMasterAdmin(user)).toThrow(ForbiddenException);
  });

  it('respects MASTER_ADMIN_PERMISSIONS json overrides', () => {
    const service = createService({
      MASTER_ADMIN_EMAILS: 'admin@teste.com',
      MASTER_ADMIN_PERMISSIONS: JSON.stringify({
        'admin@teste.com': ['dashboard.read', 'crm.read'],
      }),
    });
    const user = makeUser({ email: 'admin@teste.com' });

    expect(() =>
      service.assertMasterAdminPermission(user, 'dashboard.read'),
    ).not.toThrow();

    expect(() =>
      service.assertMasterAdminPermission(user, 'crm.write'),
    ).toThrow(ForbiddenException);
  });

  it('supports wildcard permissions in config', () => {
    const service = createService({
      MASTER_ADMIN_EMAILS: 'admin@teste.com',
      MASTER_ADMIN_PERMISSIONS: JSON.stringify({
        '*': ['dashboard.read'],
      }),
    });
    const user = makeUser({ email: 'admin@teste.com' });

    expect(() =>
      service.assertMasterAdminPermission(user, 'dashboard.read'),
    ).not.toThrow();
    expect(() =>
      service.assertMasterAdminPermission(user, 'crm.read'),
    ).toThrow(ForbiddenException);
  });
});

