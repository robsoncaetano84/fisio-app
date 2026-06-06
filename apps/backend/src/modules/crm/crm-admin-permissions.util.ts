import { parseJsonObject } from '../../common/safe-json';

export type CrmAdminPermission =
  | 'dashboard.read'
  | 'crm.read'
  | 'crm.write'
  | 'audit.read'
  | 'sensitive.read';

export const CRM_ADMIN_PERMISSIONS: ReadonlySet<CrmAdminPermission> = new Set([
  'dashboard.read',
  'crm.read',
  'crm.write',
  'audit.read',
  'sensitive.read',
]);

export function parseCrmAdminPermissionsConfig(
  rawConfig?: string | null,
): Map<string, Set<CrmAdminPermission>> {
  const raw = String(rawConfig || '').trim();
  if (!raw) return new Map();

  const parsed = parseJsonObject(raw);
  if (parsed) {
    return parseJsonPermissions(parsed);
  }
  return parsePairsPermissions(raw);
}

export function resolveCrmAdminPermissions(args: {
  permissionMap: Map<string, Set<CrmAdminPermission>>;
  email?: string | null;
}): Set<CrmAdminPermission> {
  const email = String(args.email || '')
    .trim()
    .toLowerCase();
  const direct = args.permissionMap.get(email);
  const wildcard = args.permissionMap.get('*');
  return new Set<CrmAdminPermission>([...(wildcard || []), ...(direct || [])]);
}

function parseJsonPermissions(
  parsed: Record<string, unknown>,
): Map<string, Set<CrmAdminPermission>> {
  const map = new Map<string, Set<CrmAdminPermission>>();

  for (const [emailKey, permissionsRaw] of Object.entries(parsed || {})) {
    const email = emailKey.trim().toLowerCase();
    if (!email) continue;
    const permissions = Array.isArray(permissionsRaw)
      ? permissionsRaw
      : typeof permissionsRaw === 'string'
        ? String(permissionsRaw).split('|')
        : [];
    const normalized = normalizePermissions(permissions);
    if (normalized.size > 0) map.set(email, normalized);
  }

  return map;
}

function parsePairsPermissions(
  raw: string,
): Map<string, Set<CrmAdminPermission>> {
  const map = new Map<string, Set<CrmAdminPermission>>();
  const pairs = raw
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  pairs.forEach((pair) => {
    const [emailRaw, permissionsRaw] = pair.split('=');
    const email = (emailRaw || '').trim().toLowerCase();
    if (!email) return;
    const normalized = normalizePermissions(
      (permissionsRaw || '')
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean),
    );
    if (normalized.size > 0) map.set(email, normalized);
  });

  return map;
}

function normalizePermissions(items: unknown[]): Set<CrmAdminPermission> {
  const normalized = new Set<CrmAdminPermission>();
  items.forEach((item) => {
    const permission = String(item).trim() as CrmAdminPermission;
    if (CRM_ADMIN_PERMISSIONS.has(permission)) normalized.add(permission);
  });
  return normalized;
}
