import { ForbiddenException } from '@nestjs/common';
import { CrmService } from './crm.service';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import {
  CrmAutomationActionType,
  CrmAutomationStatus,
  CrmAutomationTargetType,
} from './entities/crm-automation-action.entity';

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
    expect(() => service.assertMasterAdminPermission(user, 'crm.read')).toThrow(
      ForbiddenException,
    );
  });
});

describe('CrmService automation metrics', () => {
  const makeQueryBuilder = (items: unknown[]) => ({
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(items),
  });

  it('aggregates resolution time, overdue actions and bottlenecks', async () => {
    const service = createService({});
    const resolvedAt = new Date('2026-06-07T12:00:00.000Z');
    const firstSeenAt = new Date('2026-06-07T06:00:00.000Z');
    const overdueSla = new Date(Date.now() - 60 * 60 * 1000);
    const futureSla = new Date(Date.now() + 60 * 60 * 1000);
    const windowActions = [
      {
        type: CrmAutomationActionType.PATIENT_NO_EVOLUTION,
        status: CrmAutomationStatus.DONE,
        firstSeenAt,
        resolvedAt,
        createdAt: firstSeenAt,
        metadata: {
          professionalId: 'prof-1',
          profissionalNome: 'Igor',
          pacienteNome: 'Paciente A',
        },
      },
      {
        type: CrmAutomationActionType.PATIENT_NO_CHECKIN,
        status: CrmAutomationStatus.DISMISSED,
        firstSeenAt,
        resolvedAt,
        createdAt: firstSeenAt,
        metadata: {
          professionalId: 'prof-2',
          profissionalNome: 'Ana',
          pacienteNome: 'Paciente B',
        },
      },
    ];
    const openActions = [
      {
        type: CrmAutomationActionType.PATIENT_NO_EVOLUTION,
        status: CrmAutomationStatus.OPEN,
        targetType: CrmAutomationTargetType.PATIENT,
        targetId: 'patient-1',
        slaDueAt: overdueSla,
        responsavelUsuarioId: null,
        metadata: {
          professionalId: 'prof-1',
          profissionalNome: 'Igor',
          pacienteNome: 'Paciente A',
        },
      },
      {
        type: CrmAutomationActionType.LEAD_STALE,
        status: CrmAutomationStatus.SNOOZED,
        targetType: CrmAutomationTargetType.LEAD,
        targetId: 'lead-1',
        slaDueAt: futureSla,
        responsavelUsuarioId: 'admin-1',
        metadata: {
          responsavelUsuarioId: 'admin-1',
          responsavelNome: 'Admin',
        },
      },
    ];
    const windowQb = makeQueryBuilder(windowActions);
    const openQb = makeQueryBuilder(openActions);
    (service as any).crmAutomationActionRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(windowQb)
        .mockReturnValueOnce(openQb),
    };

    const metrics = await service.getAutomationMetrics({ windowDays: 30 });

    expect(metrics.totals).toMatchObject({
      openActions: 2,
      overdueOpenActions: 1,
      resolvedActions: 1,
      dismissedActions: 1,
      avgResolutionHours: 6,
    });
    expect(
      metrics.byType.find(
        (item) => item.type === CrmAutomationActionType.PATIENT_NO_EVOLUTION,
      ),
    ).toMatchObject({ opened: 1, overdue: 1, resolved: 1 });
    expect(metrics.bottlenecks.byProfessional[0]).toMatchObject({
      id: 'prof-1',
      nome: 'Igor',
      open: 1,
      overdue: 1,
    });
    expect(metrics.bottlenecks.byPatient[0]).toMatchObject({
      id: 'patient-1',
      nome: 'Paciente A',
      open: 1,
      overdue: 1,
    });
  });
});
