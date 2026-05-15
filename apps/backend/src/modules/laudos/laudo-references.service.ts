import { Injectable } from '@nestjs/common';
import { Anamnese } from '../anamneses/entities/anamnese.entity';

export type LaudoReferenceCategory = 'LIVRO' | 'ARTIGO' | 'GUIDELINE';

export type LaudoReferenceItem = {
  id: string;
  title: string;
  category: LaudoReferenceCategory;
  source: string;
  year?: number;
  authors?: string;
  url: string;
  rationale: string;
};

export type LaudoReferenceProfile = 'GERAL' | 'LOMBAR' | 'CERVICAL' | 'JOELHO';

export type LaudoReferenceSuggestionResponse = {
  profile: LaudoReferenceProfile;
  disclaimer: string;
  laudoReferences: LaudoReferenceItem[];
  planoReferences: LaudoReferenceItem[];
};

@Injectable()
export class LaudoReferencesService {
  getSuggestedReferences(
    anamnese: Anamnese | null,
  ): LaudoReferenceSuggestionResponse {
    const profile = this.inferReferenceProfile(anamnese);
    const catalog = this.getReferenceCatalog();
    const byProfile = catalog[profile];

    return {
      profile,
      disclaimer:
        'Referências sugeridas para apoio à decisão clínica. Não substituem avaliação, raciocínio clínico e validação profissional.',
      laudoReferences: byProfile.laudoReferences,
      planoReferences: byProfile.planoReferences,
    };
  }

  private inferReferenceProfile(
    anamnese: Anamnese | null,
  ): LaudoReferenceProfile {
    if (!anamnese) return 'GERAL';

    const text = [
      anamnese.descricaoSintomas,
      anamnese.tempoProblema,
      anamnese.fatorAlivio,
      anamnese.fatoresPiora,
      anamnese.mecanismoLesao,
      anamnese.atividadesQuePioram,
      anamnese.lesoesPrevias,
      anamnese.usoMedicamentos,
      anamnese.eventoEspecifico,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const areaText = (anamnese.areasAfetadas || [])
      .map((a) => String(a.regiao || '').toLowerCase())
      .join(' ');

    const combined = `${areaText} ${text}`;

    if (
      combined.includes('lomb') ||
      combined.includes('coluna lombar') ||
      combined.includes('lombar')
    ) {
      return 'LOMBAR';
    }
    if (
      combined.includes('cervic') ||
      combined.includes('pesco') ||
      combined.includes('trap') ||
      combined.includes('cervical')
    ) {
      return 'CERVICAL';
    }
    if (
      combined.includes('joelho') ||
      combined.includes('poplit') ||
      combined.includes('patel') ||
      combined.includes('menisc')
    ) {
      return 'JOELHO';
    }

    return 'GERAL';
  }

  private getReferenceCatalog(): Record<
    LaudoReferenceProfile,
    {
      laudoReferences: LaudoReferenceItem[];
      planoReferences: LaudoReferenceItem[];
    }
  > {
    const commonLaudo: LaudoReferenceItem[] = [
      {
        id: 'guideline-pain-2021-iasp',
        title: 'IASP Terminology & Pain Definition Update',
        category: 'GUIDELINE',
        source: 'PAIN (IASP)',
        year: 2021,
        authors: 'Raja SN et al.',
        url: 'https://journals.lww.com/pain/fulltext/2020/09000/the_revised_international_association_for_the.8.aspx',
        rationale:
          'Base conceitual para avaliação de dor e comunicação clínica.',
      },
      {
        id: 'book-magee-orthopedic-physical-assessment',
        title: 'Orthopedic Physical Assessment',
        category: 'LIVRO',
        source: 'Elsevier',
        year: 2020,
        authors: 'David J. Magee',
        url: 'https://www.elsevier.com/books/orthopedic-physical-assessment/magee/978-0-323-52998-6',
        rationale:
          'Referência de avaliação física musculoesquelética e testes clínicos.',
      },
    ];

    const commonPlano: LaudoReferenceItem[] = [
      {
        id: 'guideline-who-rehab',
        title: 'WHO Rehabilitation in Health Systems',
        category: 'GUIDELINE',
        source: 'World Health Organization',
        year: 2017,
        url: 'https://www.who.int/publications/i/item/9789241549974',
        rationale: 'Princípios de planejamento terapêutico e funcionalidade.',
      },
      {
        id: 'book-therapeutic-exercise-kisner',
        title: 'Therapeutic Exercise: Foundations and Techniques',
        category: 'LIVRO',
        source: 'F.A. Davis',
        year: 2017,
        authors: 'Kisner, Colby, Borstad',
        url: 'https://www.fadavis.com/product/physical-therapy-therapeutic-exercise-kisner-colby-borstad-7',
        rationale:
          'Base para prescrição, progressão e dosagem de exercícios terapêuticos.',
      },
    ];

    return {
      GERAL: {
        laudoReferences: commonLaudo,
        planoReferences: commonPlano,
      },
      LOMBAR: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-jospt-lbp-2021',
            title:
              'Interventions for the Management of Acute and Chronic Low Back Pain',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2021,
            url: 'https://www.jospt.org/doi/10.2519/jospt.2021.0304',
            rationale: 'Diretriz para condutas e classificação em dor lombar.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'article-lbp-exercise-cochrane',
            title: 'Exercise therapy for chronic low back pain',
            category: 'ARTIGO',
            source: 'Cochrane Review',
            year: 2021,
            url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD009790.pub2/full',
            rationale:
              'Evidência para prescrição de exercício em dor lombar crônica.',
          },
        ],
      },
      CERVICAL: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-neckpain-jospt',
            title: 'Neck Pain Clinical Practice Guidelines',
            category: 'GUIDELINE',
            source: 'JOSPT / Orthopaedic Section CPG',
            year: 2017,
            url: 'https://www.jospt.org/doi/10.2519/jospt.2017.0302',
            rationale:
              'Classificação e manejo fisioterapêutico da cervicalgia.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'article-neck-pain-exercise-manual-therapy',
            title: 'Exercise and manual therapy for neck pain',
            category: 'ARTIGO',
            source: 'Systematic Review / Clinical Evidence',
            year: 2015,
            url: 'https://pubmed.ncbi.nlm.nih.gov/25830800/',
            rationale: 'Suporte para combinação de exercício e terapia manual.',
          },
        ],
      },
      JOELHO: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-knee-pain-patellofemoral-2019',
            title: 'Patellofemoral Pain Clinical Practice Guideline',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2019,
            url: 'https://www.jospt.org/doi/10.2519/jospt.2019.0302',
            rationale:
              'Avaliação e raciocínio clínico para dor patelofemoral/joelho.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'article-aclr-rehab-consensus',
            title:
              'Anterior Cruciate Ligament Rehabilitation: Clinical Practice',
            category: 'GUIDELINE',
            source: 'BJSM / Consensus Recommendations',
            year: 2020,
            url: 'https://bjsm.bmj.com/content/54/24/1506',
            rationale:
              'Referência para progressão funcional e critérios de retorno.',
          },
        ],
      },
    };
  }
}
