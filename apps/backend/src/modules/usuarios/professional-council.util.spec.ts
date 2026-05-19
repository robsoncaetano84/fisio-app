import {
  normalizeCrefitoRegion,
  normalizeProfessionalCouncilFields,
} from './professional-council.util';

describe('professional council utils', () => {
  it('normalizes CREFITO by region number', () => {
    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'crefito',
        conselhoUf: '3',
      }),
    ).toEqual({
      conselhoSigla: 'CREFITO',
      conselhoUf: '3',
      conselhoProf: 'CREFITO-3',
    });
  });

  it('maps legacy CREFITO UF values to current region numbers', () => {
    expect(normalizeCrefitoRegion('SP')).toBe('3');
    expect(normalizeCrefitoRegion('CREFITO-GO')).toBe('19');
    expect(normalizeCrefitoRegion('AM')).toBe('20');
    expect(normalizeCrefitoRegion('AC')).toBe('18');
  });

  it('keeps UF format for non-CREFITO councils', () => {
    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'crm',
        conselhoUf: 'sp',
      }),
    ).toEqual({
      conselhoSigla: 'CRM',
      conselhoUf: 'SP',
      conselhoProf: 'CRM-SP',
    });
  });

  it('normalizes regional councils beyond CREFITO', () => {
    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'crefono',
        conselhoUf: 'SP',
      }),
    ).toEqual({
      conselhoSigla: 'CREFONO',
      conselhoUf: '2',
      conselhoProf: 'CREFONO-2',
    });

    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'crp',
        conselhoUf: 'SP',
      }),
    ).toEqual({
      conselhoSigla: 'CRP',
      conselhoUf: '06',
      conselhoProf: 'CRP-06',
    });

    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'crn',
        conselhoUf: 'SP',
      }),
    ).toEqual({
      conselhoSigla: 'CRN',
      conselhoUf: '3',
      conselhoProf: 'CRN-3',
    });
  });

  it('formats CREF with regional number and jurisdiction suffix', () => {
    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'cref',
        conselhoUf: 'SP',
      }),
    ).toEqual({
      conselhoSigla: 'CREF',
      conselhoUf: '4/SP',
      conselhoProf: 'CREF4/SP',
    });

    expect(
      normalizeProfessionalCouncilFields({
        conselhoSigla: 'cref',
        conselhoProf: 'CREF18/PA-AP',
      }),
    ).toEqual({
      conselhoSigla: 'CREF',
      conselhoUf: '18/PA-AP',
      conselhoProf: 'CREF18/PA-AP',
    });
  });
});
