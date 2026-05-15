import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { LaudoReferencesService } from './laudo-references.service';

const makeAnamnese = (overrides: Partial<Anamnese>): Anamnese =>
  ({
    descricaoSintomas: '',
    tempoProblema: '',
    fatorAlivio: '',
    fatoresPiora: '',
    mecanismoLesao: '',
    atividadesQuePioram: '',
    lesoesPrevias: '',
    usoMedicamentos: '',
    eventoEspecifico: '',
    areasAfetadas: [],
    ...overrides,
  }) as unknown as Anamnese;

describe('LaudoReferencesService', () => {
  const service = new LaudoReferencesService();

  it('returns general references when there is no anamnesis', () => {
    const result = service.getSuggestedReferences(null);

    expect(result.profile).toBe('GERAL');
    expect(result.disclaimer).toContain('apoio à decisão clínica');
    expect(result.laudoReferences).toHaveLength(2);
    expect(result.planoReferences).toHaveLength(2);
  });

  it('infers lumbar profile from affected areas', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        areasAfetadas: [{ regiao: 'Coluna lombar' } as never],
      }),
    );

    expect(result.profile).toBe('LOMBAR');
    expect(result.laudoReferences.some((item) => item.id.includes('lbp'))).toBe(
      true,
    );
  });

  it('infers cervical profile from symptoms text', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Dor cervical irradiada para trapézio',
      }),
    );

    expect(result.profile).toBe('CERVICAL');
    expect(
      result.laudoReferences.some((item) => item.id.includes('neck')),
    ).toBe(true);
  });

  it('infers knee profile from patellar or meniscal context', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Queixa patelar e suspeita meniscal no joelho',
      }),
    );

    expect(result.profile).toBe('JOELHO');
    expect(
      result.planoReferences.some((item) => item.id.includes('aclr')),
    ).toBe(true);
  });
});
