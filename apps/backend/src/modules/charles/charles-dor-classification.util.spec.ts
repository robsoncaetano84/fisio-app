import { TipoDor } from '../anamneses/entities/anamnese.entity';
import { inferDorClassificationFromAnamnese } from './charles-dor-classification.util';

describe('inferDorClassificationFromAnamnese', () => {
  it('returns low confidence when anamnesis is missing', () => {
    const result = inferDorClassificationFromAnamnese(null);

    expect(result.principal).toBeNull();
    expect(result.subtipo).toBeNull();
    expect(result.confidence).toBe('BAIXA');
    expect(result.evidenceFields).toEqual([]);
  });

  it('maps explicit tipoDor with high confidence', () => {
    const result = inferDorClassificationFromAnamnese({
      tipoDor: TipoDor.MECANICA,
    });

    expect(result.principal).toBe('NOCICEPTIVA');
    expect(result.subtipo).toBe('MECANICA');
    expect(result.confidence).toBe('ALTA');
    expect(result.evidenceFields).toEqual(['tipoDor']);
  });

  it('learns nociceptive phenotype from mechanical evidence', () => {
    const result = inferDorClassificationFromAnamnese({
      areasAfetadas: [{ regiao: 'JOELHO' }],
      descricaoSintomas: 'Dor localizada que reproduz ao apertar o ponto.',
      fatoresPiora: 'Piora com movimento, carga e agachamento.',
      fatorAlivio: 'Melhora com repouso.',
      inicioProblema: 'APOS_EVENTO' as any,
      mecanismoLesao: 'SOBRECARGA' as any,
    });

    expect(result.principal).toBe('NOCICEPTIVA');
    expect(result.subtipo).toBe('MECANICA');
    expect(result.confidence).toBe('ALTA');
    expect(result.reason).toContain('Fenotipo mecanico');
  });

  it('learns neuropathic phenotype from irradiation and neural symptoms', () => {
    const result = inferDorClassificationFromAnamnese({
      areasAfetadas: [{ regiao: 'LOMBAR' }],
      descricaoSintomas: 'Dor em choque e queima que desce pela perna.',
      fatoresPiora: 'Piora ao sentar e dobrar a coluna.',
      irradiacao: true,
      localIrradiacao: 'Perna esquerda',
    });

    expect(result.principal).toBe('NEUROPATICA');
    expect(result.subtipo).toBe('NEURAL');
    expect(result.confidence).toBe('ALTA');
    expect(result.reason).toContain('Fenotipo neural');
  });

  it('learns nociplastic phenotype from central modulation evidence', () => {
    const result = inferDorClassificationFromAnamnese({
      areasAfetadas: [{ regiao: 'LOMBAR' }, { regiao: 'CERVICAL' }],
      descricaoSintomas:
        'Dor difusa, desproporcional e persistente mesmo com exames normais.',
      sinaisSensibilizacaoCentral: 'Hipersensibilidade e nao melhora.',
      qualidadeSono: 3,
      nivelEstresse: 9,
      energiaDiaria: 3,
      yellowFlags: ['catastrofizacao', 'medo de movimento'],
    });

    expect(result.principal).toBe('NOCIPLASTICA');
    expect(result.subtipo).toBe('MIOFASCIAL');
    expect(result.confidence).toBe('ALTA');
    expect(result.reason).toContain('modulacao central');
  });
});
