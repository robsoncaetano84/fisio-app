import {
  sanitizeDigits,
  shouldReplaceQuickInviteName,
} from './paciente-quick-invite.util';

describe('paciente quick invite util', () => {
  it('sanitizes digits', () => {
    expect(sanitizeDigits('(11) 99999-1234')).toBe('11999991234');
    expect(sanitizeDigits(null)).toBe('');
  });

  it('detects quick invite placeholder names', () => {
    expect(shouldReplaceQuickInviteName('Paciente Convite Rapido')).toBe(true);
    expect(shouldReplaceQuickInviteName('')).toBe(true);
    expect(shouldReplaceQuickInviteName('Maria Silva')).toBe(false);
  });
});
