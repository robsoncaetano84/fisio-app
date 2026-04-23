import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceController } from './clinical-governance.controller';
import { ClinicalGovernanceService } from './clinical-governance.service';

describe('ClinicalGovernanceController', () => {
  const make = () => {
    const service = {
      getActiveProtocol: jest.fn().mockResolvedValue({ id: 'p-1' }),
      getProtocolHistory: jest.fn().mockResolvedValue([]),
      activateProtocol: jest.fn().mockResolvedValue({ id: 'p-2' }),
      getMyConsents: jest.fn().mockResolvedValue({ userId: 'u-1' }),
      upsertMyConsent: jest.fn().mockResolvedValue({ ok: true }),
      logAiSuggestion: jest.fn().mockResolvedValue({ ok: true }),
      listAuditLogs: jest.fn().mockResolvedValue({ items: [], count: 0 }),
      getAiSuggestionSummary: jest
        .fn()
        .mockResolvedValue({ totals: { reads: 0, applied: 0, confirmed: 0 } }),
    } as unknown as jest.Mocked<ClinicalGovernanceService>;

    const controller = new ClinicalGovernanceController(service);
    return { controller, service };
  };

  it('forwards protocol activation to service', async () => {
    const { controller, service } = make();
    const admin = { id: 'adm-1', role: UserRole.ADMIN } as any;
    const dto = { name: 'v2', version: '2.0.0', definition: {} };

    await controller.activateProtocol(admin, dto as any);

    expect(service.activateProtocol).toHaveBeenCalledWith(dto, admin);
  });

  it('forwards ai suggestion log to service', async () => {
    const { controller, service } = make();
    const user = { id: 'usr-1', role: UserRole.USER } as any;
    const dto = {
      patientId: 'pac-1',
      stage: 'EXAME_FISICO',
      suggestionType: 'CLASSIFICACAO_DOR',
      confidence: 0.87,
      reason: 'Sinais compatíveis com padrão mecânico',
      evidenceFields: ['queixaPrincipal', 'agravantes'],
    };

    await controller.logAiSuggestion(user, dto as any);

    expect(service.logAiSuggestion).toHaveBeenCalledWith(user, dto);
  });

  it('forwards audit log filters to service', async () => {
    const { controller, service } = make();
    const admin = { id: 'adm-1', role: UserRole.ADMIN } as any;

    await controller.listAuditLogs(admin, 'READ', 'pac-1', 25);

    expect(service.listAuditLogs).toHaveBeenCalledWith(admin, {
      actionType: 'READ',
      patientId: 'pac-1',
      limit: 25,
    });
  });

  it('enforces admin role metadata on protocol history/activate and audit logs', () => {
    const historyRoles = Reflect.getMetadata(
      ROLES_KEY,
      ClinicalGovernanceController.prototype.getProtocolHistory,
    );
    const activateRoles = Reflect.getMetadata(
      ROLES_KEY,
      ClinicalGovernanceController.prototype.activateProtocol,
    );
    const auditRoles = Reflect.getMetadata(
      ROLES_KEY,
      ClinicalGovernanceController.prototype.listAuditLogs,
    );
    const summaryRoles = Reflect.getMetadata(
      ROLES_KEY,
      ClinicalGovernanceController.prototype.getAiSuggestionSummary,
    );

    expect(historyRoles).toEqual([UserRole.ADMIN]);
    expect(activateRoles).toEqual([UserRole.ADMIN]);
    expect(auditRoles).toEqual([UserRole.ADMIN]);
    expect(summaryRoles).toEqual([UserRole.ADMIN]);
  });

  it('enforces admin/user role metadata on ai-suggestions log endpoint', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      ClinicalGovernanceController.prototype.logAiSuggestion,
    );
    expect(roles).toEqual([UserRole.ADMIN, UserRole.USER]);
  });

  it('forwards ai suggestion summary filters to service', async () => {
    const { controller, service } = make();
    const admin = { id: 'adm-1', role: UserRole.ADMIN } as any;

    await controller.getAiSuggestionSummary(admin, 14, 'prof-1', 'pac-1');

    expect(service.getAiSuggestionSummary).toHaveBeenCalledWith(admin, {
      windowDays: 14,
      professionalId: 'prof-1',
      patientId: 'pac-1',
    });
  });
});
