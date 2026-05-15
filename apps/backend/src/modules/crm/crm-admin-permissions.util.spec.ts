import {
  parseCrmAdminPermissionsConfig,
  resolveCrmAdminPermissions,
} from './crm-admin-permissions.util';

describe('crm admin permissions util', () => {
  it('parses JSON permission config and ignores unknown permissions', () => {
    const map = parseCrmAdminPermissionsConfig(
      JSON.stringify({
        'ADMIN@TESTE.COM': ['dashboard.read', 'crm.write', 'unknown'],
      }),
    );

    expect(map.get('admin@teste.com')).toEqual(
      new Set(['dashboard.read', 'crm.write']),
    );
  });

  it('parses semicolon permission config', () => {
    const map = parseCrmAdminPermissionsConfig(
      'admin@teste.com=dashboard.read|audit.read; *=crm.read',
    );

    expect(map.get('admin@teste.com')).toEqual(
      new Set(['dashboard.read', 'audit.read']),
    );
    expect(map.get('*')).toEqual(new Set(['crm.read']));
  });

  it('merges wildcard and direct permissions', () => {
    const permissionMap = parseCrmAdminPermissionsConfig(
      JSON.stringify({
        '*': ['dashboard.read'],
        'admin@teste.com': ['crm.write'],
      }),
    );

    expect(
      resolveCrmAdminPermissions({
        permissionMap,
        email: 'ADMIN@TESTE.COM',
      }),
    ).toEqual(new Set(['dashboard.read', 'crm.write']));
  });
});
