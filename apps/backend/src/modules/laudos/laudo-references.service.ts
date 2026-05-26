import { Injectable } from '@nestjs/common';

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

export type LaudoReferenceProfile =
  | 'GERAL'
  | 'LOMBAR'
  | 'CERVICAL'
  | 'JOELHO'
  | 'OMBRO'
  | 'QUADRIL'
  | 'TORNOZELO_PE'
  | 'COTOVELO'
  | 'PUNHO_MAO'
  | 'SACROILIACA'
  | 'TORACICA';

export type LaudoReferenceSupplementalProfile =
  | 'TENDINOPATIA'
  | 'DOR_NEUROPATICA'
  | 'DOR_NOCIPLASTICA'
  | 'POS_OPERATORIO';

export type LaudoReferenceSuggestionResponse = {
  profile: LaudoReferenceProfile;
  supplementalProfiles?: LaudoReferenceSupplementalProfile[];
  disclaimer: string;
  laudoReferences: LaudoReferenceItem[];
  planoReferences: LaudoReferenceItem[];
};

export type LaudoReferenceUpdate = {
  laudoReferences?: LaudoReferenceItem[];
  planoReferences?: LaudoReferenceItem[];
};

type LaudoReferenceSource = Partial<
  Record<
    | 'descricaoSintomas'
    | 'tempoProblema'
    | 'fatorAlivio'
    | 'fatoresPiora'
    | 'mecanismoLesao'
    | 'atividadesQuePioram'
    | 'lesoesPrevias'
    | 'usoMedicamentos'
    | 'eventoEspecifico',
    string | null | undefined
  >
> & {
  areasAfetadas?: Array<{
    regiao?: string | null;
    lado?: string | null;
    vista?: string | null;
    intensidade?: number | null;
    observacao?: string | null;
  }> | null;
};

type ReferenceBundle = {
  laudoReferences: LaudoReferenceItem[];
  planoReferences: LaudoReferenceItem[];
};

@Injectable()
export class LaudoReferencesService {
  getSuggestedReferences(
    anamnese: LaudoReferenceSource | null,
  ): LaudoReferenceSuggestionResponse {
    const searchText = this.collectSearchText(anamnese);
    const profile = this.inferReferenceProfile(searchText);
    const supplementalProfiles = this.inferSupplementalProfiles(searchText);
    const catalog = this.getReferenceCatalog();
    const supplementalCatalog = this.getSupplementalReferenceCatalog();
    const byProfile = catalog[profile];
    const supplementalBundles = supplementalProfiles.map(
      (supplementalProfile) => supplementalCatalog[supplementalProfile],
    );

    return {
      profile,
      supplementalProfiles,
      disclaimer:
        'Referencias sugeridas para apoio a decisao clinica. Nao substituem avaliacao, raciocinio clinico e validacao profissional.',
      laudoReferences: this.mergeReferenceItems(
        byProfile.laudoReferences,
        ...supplementalBundles.map((bundle) => bundle.laudoReferences),
      ),
      planoReferences: this.mergeReferenceItems(
        byProfile.planoReferences,
        ...supplementalBundles.map((bundle) => bundle.planoReferences),
      ),
    };
  }

  mergeWithUpdatedReferences(
    base: LaudoReferenceSuggestionResponse,
    updated: LaudoReferenceUpdate | null | undefined,
  ): LaudoReferenceSuggestionResponse {
    if (!updated) return base;
    const laudoReferences = this.mergeReferenceItems(
      base.laudoReferences,
      updated.laudoReferences || [],
    );
    const planoReferences = this.mergeReferenceItems(
      base.planoReferences,
      updated.planoReferences || [],
    );

    return {
      ...base,
      disclaimer: `${base.disclaimer} Estudos atualizados podem variar conforme disponibilidade das bases consultadas; valide aplicabilidade, qualidade metodologica e data antes de usar em decisao clinica.`,
      laudoReferences,
      planoReferences,
    };
  }

  private collectSearchText(anamnese: LaudoReferenceSource | null): string {
    if (!anamnese) return '';

    const fields = [
      anamnese.descricaoSintomas,
      anamnese.tempoProblema,
      anamnese.fatorAlivio,
      anamnese.fatoresPiora,
      anamnese.mecanismoLesao,
      anamnese.atividadesQuePioram,
      anamnese.lesoesPrevias,
      anamnese.usoMedicamentos,
      anamnese.eventoEspecifico,
      ...(anamnese.areasAfetadas || []).flatMap((area) => [
        area.regiao,
        area.lado,
        area.vista,
        area.observacao,
      ]),
    ];

    return this.normalizeForSearch(fields.filter(Boolean).join(' '));
  }

  private inferReferenceProfile(searchText: string): LaudoReferenceProfile {
    if (!searchText) return 'GERAL';

    if (
      this.matchesAny(searchText, [
        'sacroili',
        'sacro ili',
        'iliaca',
        'iliaco',
        'pelve',
        'pelvica',
        'cintura pelvica',
      ])
    ) {
      return 'SACROILIACA';
    }
    if (
      this.matchesAny(searchText, [
        'lomb',
        'coluna lombar',
        'lombar',
        'ciatalgia',
        'ciatica',
      ])
    ) {
      return 'LOMBAR';
    }
    if (
      this.matchesAny(searchText, [
        'cervic',
        'pesco',
        'trap',
        'cervical',
        'torcicolo',
      ])
    ) {
      return 'CERVICAL';
    }
    if (
      this.matchesAny(searchText, [
        'ombro',
        'manguito',
        'rotador',
        'supraesp',
        'subacrom',
        'glenoumeral',
        'escapul',
      ])
    ) {
      return 'OMBRO';
    }
    if (
      this.matchesAny(searchText, [
        'joelho',
        'poplit',
        'patel',
        'menisc',
        'ligamento cruzado',
        'lca',
      ])
    ) {
      return 'JOELHO';
    }
    if (
      this.matchesAny(searchText, [
        'quadril',
        'coxa',
        'coxofemoral',
        'femoroacetabular',
        'labral',
        'labrum',
        'gluteo',
        'virilha',
      ])
    ) {
      return 'QUADRIL';
    }
    if (
      this.matchesAny(searchText, [
        'tornozelo',
        'pe',
        'plantar',
        'fascite',
        'aquiles',
        'entorse',
        'calcaneo',
        'metatarso',
      ])
    ) {
      return 'TORNOZELO_PE';
    }
    if (
      this.matchesAny(searchText, [
        'cotovelo',
        'epicondil',
        'epicondilalgia',
        'tenista',
        'golfista',
        'antebraco',
      ])
    ) {
      return 'COTOVELO';
    }
    if (
      this.matchesAny(searchText, [
        'punho',
        'mao',
        'carpo',
        'tunel do carpo',
        'dedo',
        'quervain',
        'tenossinovite',
      ])
    ) {
      return 'PUNHO_MAO';
    }
    if (
      this.matchesAny(searchText, [
        'torac',
        'dorsal',
        'costela',
        'costal',
        'escapulotorac',
        'torax',
      ])
    ) {
      return 'TORACICA';
    }

    return 'GERAL';
  }

  private inferSupplementalProfiles(
    searchText: string,
  ): LaudoReferenceSupplementalProfile[] {
    const profiles: LaudoReferenceSupplementalProfile[] = [];
    if (!searchText) return profiles;

    if (
      this.matchesAny(searchText, [
        'tendin',
        'tendao',
        'tendinea',
        'manguito',
        'aquiles',
        'epicondil',
        'fascite',
      ])
    ) {
      profiles.push('TENDINOPATIA');
    }
    if (
      this.matchesAny(searchText, [
        'neuropat',
        'formig',
        'parestes',
        'queim',
        'choque',
        'radicul',
        'irradi',
        'ciatic',
      ])
    ) {
      profiles.push('DOR_NEUROPATICA');
    }
    if (
      this.matchesAny(searchText, [
        'nociplast',
        'sensibilizacao',
        'sensibiliza',
        'fibromialgia',
        'dor cronica difusa',
        'dor generalizada',
      ])
    ) {
      profiles.push('DOR_NOCIPLASTICA');
    }
    if (
      this.matchesAny(searchText, [
        'pos operatorio',
        'pos-operatorio',
        'cirurgia',
        'cirurgico',
        'artroscopia',
        'reconstrucao',
        'reparo',
        'sutura',
      ])
    ) {
      profiles.push('POS_OPERATORIO');
    }

    return profiles;
  }

  private getReferenceCatalog(): Record<
    LaudoReferenceProfile,
    ReferenceBundle
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
          'Base conceitual para avaliacao de dor e comunicacao clinica.',
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
          'Referencia de avaliacao fisica musculoesqueletica e testes clinicos.',
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
        rationale: 'Principios de planejamento terapeutico e funcionalidade.',
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
          'Base para prescricao, progressao e dosagem de exercicios terapeuticos.',
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
            rationale: 'Diretriz para condutas e classificacao em dor lombar.',
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
              'Evidencia para prescricao de exercicio em dor lombar cronica.',
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
              'Classificacao e manejo fisioterapeutico da cervicalgia.',
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
            rationale: 'Suporte para combinacao de exercicio e terapia manual.',
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
              'Avaliacao e raciocinio clinico para dor patelofemoral/joelho.',
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
              'Referencia para progressao funcional e criterios de retorno.',
          },
        ],
      },
      OMBRO: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-rotator-cuff-tendinopathy-apta-jospt-2025',
            title:
              'Rotator Cuff Tendinopathy: Diagnosis, Non-surgical Medical Care and Rehabilitation',
            category: 'GUIDELINE',
            source: 'APTA / JOSPT Clinical Practice Guideline',
            year: 2025,
            authors: 'Desmeules F, Roy JS, Lafrance S et al.',
            url: 'https://www.apta.org/patient-care/evidence-based-practice-resources/cpgs/CPG_Rotator_Cuff_Tendinopathy_Diagnosis_Non-surgical_Medical_Care_Rehabilitation',
            rationale:
              'Diretriz atual para avaliacao, prognostico, manejo conservador, reabilitacao e retorno a funcao/esporte em tendinopatia do manguito rotador.',
          },
          {
            id: 'book-athletes-shoulder-wilk-reinold-andrews',
            title: "The Athlete's Shoulder",
            category: 'LIVRO',
            source: 'Elsevier',
            year: 2009,
            authors: 'Andrews JR, Wilk KE, Reinold MM',
            url: 'https://shop.elsevier.com/books/the-athletes-shoulder/andrews/978-0-443-06701-3',
            rationale:
              'Livro de referencia para biomecanica, lesoes esportivas, manguito rotador, instabilidade e reabilitacao do ombro.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'cochrane-rotator-cuff-manual-therapy-exercise-2016',
            title: 'Manual therapy and exercise for rotator cuff disease',
            category: 'ARTIGO',
            source: 'Cochrane Database of Systematic Reviews',
            year: 2016,
            authors: 'Page MJ, Green S, McBain B, Buchbinder R et al.',
            url: 'https://www.cochrane.org/CD012224/MUSKEL_manual-therapy-and-exercise-rotator-cuff-disease',
            rationale:
              'Revisao sistematica sobre beneficios, limites e seguranca de terapia manual e exercicio em doenca do manguito rotador.',
          },
          {
            id: 'systematic-review-rotator-cuff-exercise-2012',
            title:
              'Exercise for rotator cuff tendinopathy: a systematic review',
            category: 'ARTIGO',
            source: 'Physical Therapy Reviews / NCBI DARE',
            year: 2012,
            authors: 'Littlewood C, Ashton J, Chance-Larsen K et al.',
            url: 'https://www.ncbi.nlm.nih.gov/books/NBK97689/',
            rationale:
              'Sintese de evidencia sobre exercicio terapeutico no tratamento de tendinopatia do manguito rotador.',
          },
        ],
      },
      QUADRIL: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-hip-oa-jospt-2017',
            title: 'Hip Pain and Mobility Deficits: Hip Osteoarthritis',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2017,
            authors: 'Cibulka MT, Bloom NJ, Enseki KR et al.',
            url: 'https://www.jospt.org/doi/10.2519/jospt.2017.0301',
            rationale:
              'Diretriz para avaliacao e manejo de dor no quadril associada a deficits de mobilidade e osteoartrite.',
          },
          {
            id: 'guideline-nonarthritic-hip-jospt-2014',
            title: 'Nonarthritic Hip Joint Pain',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2014,
            url: 'https://www.jospt.org/doi/10.2519/jospt.2014.0302',
            rationale:
              'Apoia raciocinio para dor no quadril nao artrosica, incluindo quadros femoroacetabulares/labrais.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'cochrane-hip-oa-exercise-2014',
            title: 'Exercise for osteoarthritis of the hip',
            category: 'ARTIGO',
            source: 'Cochrane Database of Systematic Reviews',
            year: 2014,
            authors: 'Fransen M, McConnell S, Hernandez-Molina G et al.',
            url: 'https://www.cochrane.org/CD007912/MUSKEL_exercise-for-osteoarthritis-of-the-hip',
            rationale:
              'Revisao sobre exercicio terapeutico em osteoartrite do quadril.',
          },
        ],
      },
      TORNOZELO_PE: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-lateral-ankle-sprain-jospt-2021',
            title:
              'Ankle Stability and Movement Coordination Impairments: Lateral Ankle Ligament Sprains',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2021,
            authors: 'Martin RL, Davenport TE, Fraser JJ et al.',
            url: 'https://www.jospt.org/doi/10.2519/jospt.2021.0302',
            rationale:
              'Diretriz para avaliacao, instabilidade e coordenacao de movimento em entorse lateral de tornozelo.',
          },
          {
            id: 'guideline-heel-pain-plantar-fasciitis-jospt-2023',
            title: 'Heel Pain: Plantar Fasciitis',
            category: 'GUIDELINE',
            source: 'JOSPT Clinical Practice Guideline',
            year: 2023,
            url: 'https://www.jospt.org/doi/10.2519/jospt.2023.0303',
            rationale:
              'Diretriz para raciocinio clinico em dor no calcanhar e fascite plantar.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'guideline-achilles-tendinopathy-jospt-2024',
            title:
              'Achilles Pain, Stiffness, and Muscle Power Deficits: Midportion Achilles Tendinopathy',
            category: 'GUIDELINE',
            source: 'APTA / JOSPT Clinical Practice Guideline',
            year: 2024,
            url: 'https://orthopt.org/content/s/achilles-pain-stiffness-and-muscle-power-deficits-midportion-achilles-tendinopathy-revision-2024',
            rationale:
              'Diretriz para progressao de carga e manejo de tendinopatia do Aquiles.',
          },
        ],
      },
      COTOVELO: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'review-lateral-elbow-tendinopathy-jospt-2015',
            title:
              'Management of Lateral Elbow Tendinopathy: One Size Does Not Fit All',
            category: 'ARTIGO',
            source: 'JOSPT Review',
            year: 2015,
            authors: 'Coombes BK, Bisset L, Vicenzino B',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26381484/',
            rationale:
              'Referencia para subgrupos, prognostico e manejo individualizado da epicondilalgia lateral.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'review-tendinopathy-conservative-care-2016',
            title:
              'What is the clinical effectiveness and cost-effectiveness of conservative interventions for tendinopathy?',
            category: 'ARTIGO',
            source: 'Health Technology Assessment / PMC',
            year: 2016,
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4781358/',
            rationale:
              'Sintese para selecionar condutas conservadoras em tendinopatias, incluindo cotovelo lateral.',
          },
        ],
      },
      PUNHO_MAO: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-aaos-carpal-tunnel-2024',
            title: 'Management of Carpal Tunnel Syndrome',
            category: 'GUIDELINE',
            source: 'AAOS Clinical Practice Guideline',
            year: 2024,
            url: 'https://www.aaos.org/quality/quality-programs/carpal-tunnel-syndrome/?tab=all_guidelines',
            rationale:
              'Diretriz para diagnostico e tratamento de sindrome do tunel do carpo em adultos.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'network-meta-analysis-de-quervain-2023',
            title:
              'Management of de Quervain Tenosynovitis: A Systematic Review and Network Meta-Analysis',
            category: 'ARTIGO',
            source: 'JAMA Network Open / PubMed',
            year: 2023,
            url: 'https://pubmed.ncbi.nlm.nih.gov/37889490/',
            rationale:
              'Evidencia comparativa para manejo conservador e medico da tenossinovite de De Quervain.',
          },
        ],
      },
      SACROILIACA: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'guideline-pelvic-girdle-pain-european-2008',
            title:
              'European guidelines for the diagnosis and treatment of pelvic girdle pain',
            category: 'GUIDELINE',
            source: 'European Spine Journal',
            year: 2008,
            authors: 'Vleeming A, Albert HB, Ostgaard HC et al.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18259783/',
            rationale:
              'Diretriz para avaliacao e tratamento de dor da cintura pelvica.',
          },
          {
            id: 'review-sacroiliac-joint-laslett-2008',
            title:
              'Evidence-Based Diagnosis and Treatment of the Painful Sacroiliac Joint',
            category: 'ARTIGO',
            source: 'Journal of Manual & Manipulative Therapy',
            year: 2008,
            authors: 'Laslett M',
            url: 'https://www.tandfonline.com/doi/abs/10.1179/jmt.2008.16.3.142',
            rationale:
              'Revisao para diferenciar dor sacroiliaca de disfuncao e orientar testes/provas clinicas.',
          },
        ],
        planoReferences: commonPlano,
      },
      TORACICA: {
        laudoReferences: [
          ...commonLaudo,
          {
            id: 'systematic-review-thoracic-spine-pain-2009',
            title:
              'Thoracic spine pain in the general population: prevalence, incidence and associated factors',
            category: 'ARTIGO',
            source: 'BMC Musculoskeletal Disorders / PubMed',
            year: 2009,
            url: 'https://pubmed.ncbi.nlm.nih.gov/19563667/',
            rationale:
              'Contextualiza fatores associados e prevalencia em dor toracica musculoesqueletica.',
          },
        ],
        planoReferences: [
          ...commonPlano,
          {
            id: 'systematic-review-thoracic-exercise-2020',
            title:
              'Clinical reasoning framework for thoracic spine exercise prescription in sport',
            category: 'ARTIGO',
            source: 'BMJ Open Sport & Exercise Medicine',
            year: 2020,
            authors: 'Heneghan NR, Lokhaug SM, Tyros I et al.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/32341799/',
            rationale:
              'Apoia prescricao de mobilidade, controle motor, capacidade de trabalho e forca para coluna toracica.',
          },
        ],
      },
    };
  }

  private getSupplementalReferenceCatalog(): Record<
    LaudoReferenceSupplementalProfile,
    ReferenceBundle
  > {
    return {
      TENDINOPATIA: {
        laudoReferences: [
          {
            id: 'umbrella-review-physical-therapy-tendinopathy-2020',
            title:
              'Physical therapy for tendinopathy: An umbrella review of systematic reviews and meta-analyses',
            category: 'ARTIGO',
            source: 'Physical Therapy in Sport / PubMed',
            year: 2020,
            url: 'https://pubmed.ncbi.nlm.nih.gov/32877858/',
            rationale:
              'Sintese ampla sobre condutas fisioterapeuticas em tendinopatias.',
          },
        ],
        planoReferences: [
          {
            id: 'systematic-review-loading-achilles-tendinopathy-2019',
            title:
              'The efficacy of loading programmes for improving patient-reported outcomes in chronic midportion Achilles tendinopathy',
            category: 'ARTIGO',
            source: 'Systematic Review / PubMed',
            year: 2019,
            url: 'https://pubmed.ncbi.nlm.nih.gov/31763774/',
            rationale:
              'Apoia progressao de carga e monitoramento de desfechos em tendinopatia.',
          },
        ],
      },
      DOR_NEUROPATICA: {
        laudoReferences: [
          {
            id: 'neupsig-neuropathic-pain-assessment-2011',
            title: 'NeuPSIG guidelines on neuropathic pain assessment',
            category: 'GUIDELINE',
            source: 'PAIN / PubMed',
            year: 2011,
            url: 'https://pubmed.ncbi.nlm.nih.gov/20851519/',
            rationale:
              'Base para triagem, exame sensitivo e graduacao de suspeita de dor neuropatica.',
          },
        ],
        planoReferences: [
          {
            id: 'nice-neuropathic-pain-adults-2020',
            title:
              'Neuropathic pain in adults: pharmacological management in non-specialist settings',
            category: 'GUIDELINE',
            source: 'NICE Clinical Guideline',
            year: 2020,
            url: 'https://www.ncbi.nlm.nih.gov/books/NBK552848/',
            rationale:
              'Referencia para seguranca, limites de escopo e necessidade de manejo medico quando houver componente neuropatico.',
          },
        ],
      },
      DOR_NOCIPLASTICA: {
        laudoReferences: [
          {
            id: 'iasp-nociplastic-pain-criteria-2021',
            title:
              'Chronic nociplastic pain affecting the musculoskeletal system: clinical criteria and grading system',
            category: 'ARTIGO',
            source: 'PAIN / IASP',
            year: 2021,
            authors: 'Kosek E, Clauw D, Nijs J et al.',
            url: 'https://www.iasp-pain.org/publications/pain-research-forum/papers-of-the-week/paper/169271-chronic-nociplastic-pain-affecting-musculoskeletal-system-clinical-criteria-and/',
            rationale:
              'Criterios clinicos para suspeita e graduacao de dor nociplastica musculoesqueletica.',
          },
        ],
        planoReferences: [
          {
            id: 'best-practice-msk-pain-care-2019',
            title:
              'What does best practice care for musculoskeletal pain look like?',
            category: 'ARTIGO',
            source: 'British Journal of Sports Medicine / PubMed',
            year: 2019,
            url: 'https://pubmed.ncbi.nlm.nih.gov/30826805/',
            rationale:
              'Recomendacoes transversais para cuidado centrado na pessoa, educacao, atividade e uso seletivo de recursos.',
          },
        ],
      },
      POS_OPERATORIO: {
        laudoReferences: [
          {
            id: 'postoperative-rotator-cuff-rehab-systematic-review-2021',
            title: 'Postoperative Rehabilitation of Rotator Cuff Repair',
            category: 'ARTIGO',
            source: 'Systematic Review / PubMed',
            year: 2021,
            url: 'https://pubmed.ncbi.nlm.nih.gov/33972488/',
            rationale:
              'Revisao sobre fases, seguranca e variabilidade de protocolos no pos-operatorio de reparo do manguito.',
          },
        ],
        planoReferences: [
          {
            id: 'aspetar-aclr-rehab-guideline-2023',
            title:
              'Aspetar clinical practice guideline on rehabilitation after anterior cruciate ligament reconstruction',
            category: 'GUIDELINE',
            source: 'British Journal of Sports Medicine',
            year: 2023,
            url: 'https://bjsm.bmj.com/content/57/9/500',
            rationale:
              'Diretriz de reabilitacao baseada em criterios, especialmente util quando o contexto indicar reconstrucao de LCA.',
          },
        ],
      },
    };
  }

  private mergeReferenceItems(
    ...groups: LaudoReferenceItem[][]
  ): LaudoReferenceItem[] {
    const byId = new Map<string, LaudoReferenceItem>();
    for (const group of groups) {
      for (const item of group) {
        if (!byId.has(item.id)) {
          byId.set(item.id, item);
        }
      }
    }
    return Array.from(byId.values());
  }

  private matchesAny(text: string, needles: string[]): boolean {
    return needles.some((needle) => {
      if (['pe', 'mao', 'lca'].includes(needle)) {
        return new RegExp(`(^|\\s)${needle}(\\s|$)`).test(text);
      }
      return text.includes(needle);
    });
  }

  private normalizeForSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}
