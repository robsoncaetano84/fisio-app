export function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***';
  const head = localPart.slice(0, 2);
  return `${head}***@${domain}`;
}

export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 4) return '***';
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

export function maskRichText(
  value?: string | null,
  includeSensitive?: boolean,
): string | null {
  if (!value) return null;
  return includeSensitive ? value : '[mascarado]';
}
