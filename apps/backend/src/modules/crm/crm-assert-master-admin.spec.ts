// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RM A SS ER T M AS TE R A DM IN.S PE C
// ==========================================
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrmService } from './crm.service';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';

/**
 * F14: acesso ao CRM (dados de todos os tenants) deve falhar fechado quando
 * MASTER_ADMIN_EMAILS nao esta configurada.
 */
describe('CrmService.assertMasterAdmin (F14)', () => {
  function build(masterEmails: string | undefined): CrmService {
    const config = {
      get: (key: string) =>
        key === 'MASTER_ADMIN_EMAILS' ? masterEmails : undefined,
    } as unknown as ConfigService;
    // repos nao sao usados por assertMasterAdmin
    return new CrmService(
      config,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
    );
  }

  const admin = (email: string): Usuario =>
    ({ role: UserRole.ADMIN, email }) as Usuario;

  it('nega usuario que nao e ADMIN', () => {
    const service = build('boss@x.com');
    expect(() =>
      service.assertMasterAdmin({ role: UserRole.USER, email: 'a@x.com' } as Usuario),
    ).toThrow(ForbiddenException);
  });

  it('nega ADMIN quando MASTER_ADMIN_EMAILS esta vazia (fail-closed)', () => {
    const service = build('');
    expect(() => service.assertMasterAdmin(admin('boss@x.com'))).toThrow(
      ForbiddenException,
    );
  });

  it('nega ADMIN quando MASTER_ADMIN_EMAILS nao esta definida', () => {
    const service = build(undefined);
    expect(() => service.assertMasterAdmin(admin('boss@x.com'))).toThrow(
      ForbiddenException,
    );
  });

  it('permite ADMIN cujo e-mail esta na lista (case-insensitive)', () => {
    const service = build('boss@x.com, outro@x.com');
    expect(() => service.assertMasterAdmin(admin('BOSS@x.com'))).not.toThrow();
  });

  it('nega ADMIN cujo e-mail nao esta na lista', () => {
    const service = build('boss@x.com');
    expect(() => service.assertMasterAdmin(admin('intruso@x.com'))).toThrow(
      ForbiddenException,
    );
  });
});
