const QUICK_INVITE_PLACEHOLDER_NAME = 'paciente convite rapido';

export function sanitizeDigits(value?: string | null): string {
  return (value || '').replace(/\D/g, '').trim();
}

export function shouldReplaceQuickInviteName(
  nomeCompleto?: string | null,
): boolean {
  const normalized = (nomeCompleto || '').trim().toLowerCase();
  return !normalized || normalized === QUICK_INVITE_PLACEHOLDER_NAME;
}
