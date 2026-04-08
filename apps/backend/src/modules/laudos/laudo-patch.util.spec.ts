import { sanitizePartialUpdate } from './laudo-patch.util';

describe('sanitizePartialUpdate', () => {
  it('keeps explicit null and strips undefined keys', () => {
    const input = {
      diagnosticoFuncional: undefined,
      condutas: 'abc',
      observacoes: null,
    };

    const output = sanitizePartialUpdate(input);

    expect(output).toEqual({
      condutas: 'abc',
      observacoes: null,
    });
  });
});
