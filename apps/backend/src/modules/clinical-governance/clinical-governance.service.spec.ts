import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceService } from './clinical-governance.service';

describe('ClinicalGovernanceService', () => {
  const makeService = (overrides?: {
    activeProtocol?: any;
    user?: any;
    userRole?: UserRole;
  }) => {
    const protocolRepository = {
      findOne: jest.fn().mockResolvedValue(overrides?.activeProtocol ?? null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (row) => row),
      create: jest.fn((row) => ({ id: 'proto-new', ...row })),
    } as any;

    const consentRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (row) => row),
      create: jest.fn((row) => ({ id: 'consent-1', ...row })),
    } as any;

    const auditRepository = {
      save: jest.fn(async (row) => row),
      create: jest.fn((row) => ({ id: 'audit-1', ...row })),
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    } as any;

    const currentUser =
      overrides?.user ??
      ({
        id: 'user-1',
        role: overrides?.userRole ?? UserRole.USER,
        consentTermsRequired: false,
        consentPrivacyRequired: false,
        consentResearchOptional: false,
        consentAiOptional: false,
        consentProfessionalLgpdRequired: false,
        consentAcceptedAt: null,
      } as any);

    const userRepo = {
      findOne: jest.fn().mockResolvedValue(currentUser),
      save: jest.fn(async (row) => row),
    } as any;

    const txProtocolRepo = {
      findOne: jest.fn().mockResolvedValue(overrides?.activeProtocol ?? null),
    };
    const txConsentRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => row),
    };
    const txUserRepo = {
      findOne: jest.fn().mockResolvedValue(currentUser),
      save: jest.fn(async (row) => row),
    };

    userRepo.manager = {
      transaction: jest.fn(async (cb) =>
        cb({
          getRepository: jest.fn((entity: any) => {
            const name = entity?.name;
            if (name === 'Usuario') return txUserRepo;
            if (name === 'ConsentPurposeLog') return txConsentRepo;
            return txProtocolRepo;
          }),
        }),
      ),
    };

    const service = new ClinicalGovernanceService(
      protocolRepository,
      consentRepository,
      auditRepository,
      userRepo,
    );

    return {
      service,
      protocolRepository,
      consentRepository,
      auditRepository,
      userRepo,
      txUserRepo,
      txConsentRepo,
      currentUser,
    };
  };

  it('activates a new protocol and deactivates the previous one', async () => {
    const { service, protocolRepository } = makeService({
      activeProtocol: {
        id: 'proto-old',
        version: '1.0.0',
        name: 'v1',
        isActive: true,
      },
    });
    const admin = { id: 'adm-1', role: UserRole.ADMIN } as any;

    const result = await service.activateProtocol(
      {
        name: 'v2',
        version: '2.0.0',
        definition: { stages: ['ANAMNESE'] },
      },
      admin,
    );

    expect(result.version).toBe('2.0.0');
    expect(protocolRepository.save).toHaveBeenCalledTimes(2);
    expect(protocolRepository.save.mock.calls[0][0]).toMatchObject({
      id: 'proto-old',
      isActive: false,
    });
  });

  it('blocks activation when same active protocol name+version already exists', async () => {
    const { service } = makeService({
      activeProtocol: {
        id: 'proto-old',
        version: '1.0.0',
        name: 'Protocolo Base',
        isActive: true,
      },
    });

    await expect(
      service.activateProtocol(
        { name: 'protocolo base', version: '1.0.0', definition: {} },
        { id: 'adm-1', role: UserRole.ADMIN } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks PROFESSIONAL_LGPD_REQUIRED consent for PACIENTE role', async () => {
    const { service } = makeService({ userRole: UserRole.PACIENTE });
    const paciente = { id: 'pac-1', role: UserRole.PACIENTE } as any;

    await expect(
      service.upsertMyConsent(paciente, {
        purpose: 'PROFESSIONAL_LGPD_REQUIRED',
        accepted: true,
        source: 'app',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('upserts required consents and sets consentAcceptedAt when both required are true', async () => {
    const { service, txUserRepo } = makeService({ userRole: UserRole.USER });
    const user = { id: 'usr-1', role: UserRole.USER } as any;

    await service.upsertMyConsent(user, {
      purpose: 'TERMS_REQUIRED',
      accepted: true,
      source: 'web',
    });
    await service.upsertMyConsent(user, {
      purpose: 'PRIVACY_REQUIRED',
      accepted: true,
      source: 'web',
    });

    const savedUser = txUserRepo.save.mock.calls.at(-1)[0];
    expect(savedUser.consentTermsRequired).toBe(true);
    expect(savedUser.consentPrivacyRequired).toBe(true);
    expect(savedUser.consentAcceptedAt).toBeInstanceOf(Date);
  });

  it('blocks protocol history for non-admin users', async () => {
    const { service } = makeService();
    await expect(
      service.getProtocolHistory({ id: 'user-1', role: UserRole.USER } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('writes audit when listing audit logs', async () => {
    const { service, auditRepository } = makeService();
    const admin = { id: 'adm-1', role: UserRole.ADMIN } as any;

    await service.listAuditLogs(admin, {
      actionType: 'READ',
      patientId: 'pac-1',
      limit: 10,
    });

    const payload = auditRepository.create.mock.calls.at(-1)[0];
    expect(payload.action).toBe('audit.logs.read');
    expect(payload.actionType).toBe('READ');
    expect(payload.metadata).toMatchObject({
      actionType: 'READ',
      patientId: 'pac-1',
      limit: 10,
    });
  });
});
