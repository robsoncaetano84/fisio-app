import { maskEmail, maskPhone, maskRichText } from './crm-sensitive-data.util';

describe('crm sensitive data util', () => {
  it('masks email local part', () => {
    expect(maskEmail('admin@teste.com')).toBe('ad***@teste.com');
    expect(maskEmail('invalid')).toBe('***');
    expect(maskEmail(null)).toBeNull();
  });

  it('masks phone digits', () => {
    expect(maskPhone('(11) 99999-1234')).toBe('11******34');
    expect(maskPhone('1234')).toBe('***');
    expect(maskPhone(null)).toBeNull();
  });

  it('masks rich text unless sensitive access is enabled', () => {
    expect(maskRichText('observacao clinica', false)).toBe('[mascarado]');
    expect(maskRichText('observacao clinica', true)).toBe('observacao clinica');
    expect(maskRichText('', true)).toBeNull();
  });
});
