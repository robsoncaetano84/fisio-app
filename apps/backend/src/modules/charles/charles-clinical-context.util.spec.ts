import {
  buildCharlesClinicalContext,
  hasCriticalRedFlag,
  hasStructuredExame,
  normalizeClinicalRegion,
} from './charles-clinical-context.util';

describe('charles clinical context utils', () => {
  describe('hasStructuredExame', () => {
    it('accepts structured exam payloads and meaningful free text', () => {
      expect(hasStructuredExame('__EXAME_FISICO_STRUCTURED_V1__{}')).toBe(true);
      expect(
        hasStructuredExame('Exame fisico preenchido com dados suficientes.'),
      ).toBe(true);
    });

    it('rejects empty or too short values', () => {
      expect(hasStructuredExame('')).toBe(false);
      expect(hasStructuredExame('curto')).toBe(false);
      expect(hasStructuredExame(null)).toBe(false);
    });
  });

  describe('hasCriticalRedFlag', () => {
    it('ignores explicit no-critical-red-flag markers', () => {
      expect(hasCriticalRedFlag(['SEM_RED_FLAG_CRITICA'])).toBe(false);
      expect(hasCriticalRedFlag(['nao informado'])).toBe(false);
      expect(hasCriticalRedFlag([])).toBe(false);
    });

    it('detects clinical red flags', () => {
      expect(hasCriticalRedFlag(['Deficit neurologico'])).toBe(true);
    });
  });

  describe('normalizeClinicalRegion', () => {
    it('normalizes aliases and accented body regions', () => {
      expect(normalizeClinicalRegion('mão direita')).toBe('PUNHO_MAO');
      expect(normalizeClinicalRegion('pé esquerdo')).toBe('TORNOZELO_PE');
      expect(normalizeClinicalRegion('antebraço direito')).toBe('COTOVELO');
      expect(normalizeClinicalRegion('sacro')).toBe('SACROILIACA');
    });
  });

  describe('buildCharlesClinicalContext', () => {
    it('builds upper-chain context from hand/wrist areas', () => {
      const context = buildCharlesClinicalContext({
        areasAfetadas: [{ regiao: 'Punho esquerdo' }],
      });

      expect(context.regioesPrioritarias).toContain('PUNHO_MAO');
      expect(context.regioesRelacionadas).toEqual(
        expect.arrayContaining(['PUNHO_MAO', 'COTOVELO', 'OMBRO', 'CERVICAL']),
      );
      expect(context.cadeiaProvavel).toBe('CADEIA_UPPER');
    });

    it('builds lower-chain context from knee areas', () => {
      const context = buildCharlesClinicalContext({
        areasAfetadas: [{ regiao: 'joelho direito' }],
      });

      expect(context.regioesPrioritarias).toContain('JOELHO');
      expect(context.regioesRelacionadas).toEqual(
        expect.arrayContaining(['JOELHO', 'QUADRIL', 'LOMBAR', 'TORNOZELO_PE']),
      );
      expect(context.cadeiaProvavel).toBe('CADEIA_LOWER');
    });
  });
});
