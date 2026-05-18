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
    expect(result.disclaimer).toContain('apoio a decisao clinica');
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

  it('infers shoulder profile from rotator cuff context', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        areasAfetadas: [{ regiao: 'Ombro direito' } as never],
        descricaoSintomas: 'Dor no ombro com suspeita de manguito rotador',
      }),
    );

    expect(result.profile).toBe('OMBRO');
    expect(result.supplementalProfiles).toContain('TENDINOPATIA');
    expect(
      result.laudoReferences.some((item) => item.id.includes('rotator-cuff')),
    ).toBe(true);
    expect(
      result.planoReferences.some((item) => item.id.includes('cochrane')),
    ).toBe(true);
  });

  it('uses selected area observations to infer the reference profile', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        areasAfetadas: [
          {
            regiao: 'Tronco',
            observacao: 'Dor no ombro com sinal de manguito rotador',
          } as never,
        ],
      }),
    );

    expect(result.profile).toBe('OMBRO');
    expect(result.supplementalProfiles).toContain('TENDINOPATIA');
  });

  it('infers hip profile from femoroacetabular context', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas:
          'Dor no quadril com suspeita femoroacetabular e dor na virilha',
      }),
    );

    expect(result.profile).toBe('QUADRIL');
    expect(result.laudoReferences.some((item) => item.id.includes('hip'))).toBe(
      true,
    );
    expect(
      result.planoReferences.some((item) => item.id.includes('hip-oa')),
    ).toBe(true);
  });

  it('infers ankle and foot profile from sprain or plantar symptoms', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Entorse de tornozelo com dor plantar no pe direito',
      }),
    );

    expect(result.profile).toBe('TORNOZELO_PE');
    expect(
      result.laudoReferences.some((item) => item.id.includes('ankle')),
    ).toBe(true);
    expect(
      result.laudoReferences.some((item) => item.id.includes('plantar')),
    ).toBe(true);
  });

  it('infers elbow profile and adds tendinopathy references', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Epicondilalgia lateral no cotovelo ao segurar peso',
      }),
    );

    expect(result.profile).toBe('COTOVELO');
    expect(result.supplementalProfiles).toContain('TENDINOPATIA');
    expect(
      result.laudoReferences.some((item) => item.id.includes('lateral-elbow')),
    ).toBe(true);
    expect(
      result.laudoReferences.some((item) => item.id.includes('tendinopathy')),
    ).toBe(true);
  });

  it('infers wrist and hand profile from carpal tunnel context', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Formigamento na mao e suspeita de tunel do carpo',
      }),
    );

    expect(result.profile).toBe('PUNHO_MAO');
    expect(result.supplementalProfiles).toContain('DOR_NEUROPATICA');
    expect(
      result.laudoReferences.some((item) => item.id.includes('carpal-tunnel')),
    ).toBe(true);
  });

  it('infers sacroiliac profile before generic lumbar profile', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas:
          'Dor lombar baixa com teste positivo na articulacao sacroiliaca',
      }),
    );

    expect(result.profile).toBe('SACROILIACA');
    expect(
      result.laudoReferences.some((item) => item.id.includes('sacroiliac')),
    ).toBe(true);
  });

  it('infers thoracic profile from rib and dorsal symptoms', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas: 'Dor dorsal toracica irradiando para costela',
      }),
    );

    expect(result.profile).toBe('TORACICA');
    expect(
      result.planoReferences.some((item) => item.id.includes('thoracic')),
    ).toBe(true);
  });

  it('adds postoperative references without changing the regional profile', () => {
    const result = service.getSuggestedReferences(
      makeAnamnese({
        descricaoSintomas:
          'Pos operatorio de reconstrucao de LCA no joelho esquerdo',
      }),
    );

    expect(result.profile).toBe('JOELHO');
    expect(result.supplementalProfiles).toContain('POS_OPERATORIO');
    expect(
      result.planoReferences.some((item) => item.id.includes('aclr')),
    ).toBe(true);
  });

  it('merges updated references with curated references without duplicates', () => {
    const base = service.getSuggestedReferences(null);
    const result = service.mergeWithUpdatedReferences(base, {
      laudoReferences: [
        base.laudoReferences[0],
        {
          id: 'updated-guideline',
          title: 'Updated guideline',
          category: 'GUIDELINE',
          source: 'PubMed',
          year: 2026,
          url: 'https://pubmed.ncbi.nlm.nih.gov/123/',
          rationale: 'Atualiza raciocinio clinico.',
        },
      ],
    });

    expect(
      result.laudoReferences.filter(
        (item) => item.id === base.laudoReferences[0].id,
      ),
    ).toHaveLength(1);
    expect(
      result.laudoReferences.some((item) => item.id === 'updated-guideline'),
    ).toBe(true);
    expect(result.disclaimer).toContain('Estudos atualizados');
  });
});
