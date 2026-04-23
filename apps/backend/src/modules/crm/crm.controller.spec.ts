import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';

function makeUsuario(overrides?: Partial<Usuario>): Usuario {
  return {
    id: 'admin-1',
    nome: 'Admin Teste',
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
    ...overrides,
  } as Usuario;
}

describe('CrmController sensitive access', () => {
  const createController = (allowedPermissions: string[]) => {
    const crmService = {
      assertMasterAdminPermission: jest.fn(
        (_usuario: Usuario, permission: string) => {
          if (!allowedPermissions.includes(permission)) {
            throw new ForbiddenException('Permissao insuficiente');
          }
        },
      ),
      createAdminAuditLog: jest.fn().mockResolvedValue(undefined),
      listAdminPacientes: jest.fn().mockResolvedValue([]),
    } as any;

    const controller = new CrmController(crmService);
    return { controller, crmService };
  };

  it('blocks includeSensitive=true without sensitive.read permission', async () => {
    const { controller } = createController(['crm.read']);
    const usuario = makeUsuario();

    await expect(
      controller.listAdminPacientes(
        usuario,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'true',
        'auditoria completa',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires minimum reason length when includeSensitive=true', async () => {
    const { controller } = createController(['crm.read', 'sensitive.read']);
    const usuario = makeUsuario();

    await expect(
      controller.listAdminPacientes(
        usuario,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'true',
        'curto',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows includeSensitive=true with sensitive permission and valid reason', async () => {
    const { controller, crmService } = createController([
      'crm.read',
      'sensitive.read',
    ]);
    const usuario = makeUsuario();

    await expect(
      controller.listAdminPacientes(
        usuario,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'true',
        'investigacao clinica',
      ),
    ).resolves.toEqual([]);

    expect(crmService.listAdminPacientes).toHaveBeenCalledWith(
      expect.objectContaining({ includeSensitive: true }),
    );
  });
});

