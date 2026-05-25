import type {
  CommunityAttachmentDraft,
  CommunityReferenceDraft,
} from "./community-content";

export type CommunityCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group?: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
};

export type CommunityAuthor = {
  id: string;
  username?: string;
  displayName: string;
  profession: string | null;
  specialty: string | null;
  reputationScore: number;
};

export type CommunityTag = {
  id: string;
  name: string;
  slug: string;
};

export type CommunityTagDetails = CommunityTag & {
  usageCount: number;
  description: string | null;
};

export type CommunityPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentMarkdown?: string;
  score: number;
  viewsCount: number;
  repliesCount: number;
  publishedAt: string | null;
  lastActivityAt: string;
  category: CommunityCategory;
  authorProfile: CommunityAuthor;
  tags: CommunityTag[];
  references?: CommunityReferenceDraft[];
  attachmentsMetadata?: CommunityAttachmentDraft[];
  thanksCount?: number;
};

export type CommunityReply = {
  id: string;
  contentMarkdown: string;
  score: number;
  isUseful: boolean;
  thanksCount?: number;
  createdAt: string;
  authorProfile: CommunityAuthor;
};

export type CommunityPostDetails = CommunityPost & {
  replies: CommunityReply[];
};

export type CommunityResourceKind = "article" | "reference";

export type CommunityResource = {
  id: string;
  kind: CommunityResourceKind;
  title: string;
  slug: string;
  summary: string;
  sourceName: string;
  sourceUrl: string | null;
  doi: string | null;
  publishedYear: number | null;
  authors: string[];
  clinicalUse: string;
  sharedAt: string;
  sharedBy: CommunityAuthor;
  tags: CommunityTag[];
  category: CommunityCategory | null;
  thanksCount?: number;
};

export type CommunityFeedResponse = {
  items: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CommunityFeedSort = "recent" | "relevant" | "unanswered";

export type CommunityResourceResponse = {
  items: CommunityResource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CommunityProfile = CommunityAuthor & {
  bio: string;
  cityState: string | null;
  areasOfPractice: string[];
  contributionCount: number;
  usefulAnswerCount: number;
  sharedArticleCount: number;
  recommendedReferenceCount: number;
  badges: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: "post" | "reply" | "reference";
    href: string;
  }>;
};

export type CommunityContributionLevel =
  | "Participante"
  | "Colaborador"
  | "Contribuidor Tecnico"
  | "Mentor da Comunidade"
  | "Referencia SYNAP";

export type CommunityContributionLevelRule = {
  name: CommunityContributionLevel;
  minScore: number;
  description: string;
};

export type CommunityContributorHighlight = CommunityProfile & {
  level: CommunityContributionLevel;
  categoryName: string;
  highlightedReason: string;
  weeklyContributionCount: number;
  monthlyContributionCount: number;
};

export type CommunityContributorHighlightsResponse = {
  weekly: CommunityContributorHighlight[];
  monthly: CommunityContributorHighlight[];
  byCategory: CommunityContributorHighlight[];
  levels: CommunityContributionLevelRule[];
};

export type CommunitySearchResponse = {
  query: string;
  discussions: CommunityPost[];
  resources: CommunityResource[];
  categories: CommunityCategory[];
  tags: CommunityTagDetails[];
  profiles: CommunityProfile[];
  total: number;
};

export type CommunityProfilesSort = "contributions" | "useful" | "name";

export type CommunityProfilesResponse = {
  items: CommunityProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  specialties: string[];
  areas: string[];
};

const apiBaseUrl = (
  process.env.COMMUNITY_API_URL ||
  process.env.NEXT_PUBLIC_COMMUNITY_API_URL ||
  "http://localhost:3000/api"
).replace(/\/$/, "");

const defaultCategories: CommunityCategory[] = [
  {
    id: "ortopedia",
    name: "Ortopedia",
    slug: "ortopedia",
    description:
      "Discussoes tecnicas em ortopedia, dor, funcao e reabilitacao.",
    group: "Especialidades clinicas",
    color: "#2E7D5E",
    icon: "bone",
    sortOrder: 10,
  },
  {
    id: "traumato-ortopedia",
    name: "Traumato-Ortopedia",
    slug: "traumato-ortopedia",
    description:
      "Casos e condutas em trauma, pos-operatorio e retorno funcional.",
    group: "Especialidades clinicas",
    color: "#2E7D5E",
    icon: "activity",
    sortOrder: 20,
  },
  {
    id: "neurofuncional",
    name: "Neurofuncional",
    slug: "neurofuncional",
    description:
      "Reabilitacao neurologica, funcionalidade, marcha e controle motor.",
    group: "Especialidades clinicas",
    color: "#5C6BC0",
    icon: "brain",
    sortOrder: 30,
  },
  {
    id: "fisioterapia-esportiva",
    name: "Fisioterapia Esportiva",
    slug: "fisioterapia-esportiva",
    description:
      "Prevencao, retorno ao esporte, carga, desempenho e lesoes esportivas.",
    group: "Especialidades clinicas",
    color: "#FF7043",
    icon: "dumbbell",
    sortOrder: 40,
  },
  {
    id: "pediatria",
    name: "Pediatria",
    slug: "pediatria",
    description:
      "Desenvolvimento infantil, avaliacao funcional e cuidado pediatrico.",
    group: "Especialidades clinicas",
    color: "#5C6BC0",
    icon: "baby",
    sortOrder: 50,
  },
  {
    id: "geriatria",
    name: "Geriatria",
    slug: "geriatria",
    description:
      "Funcionalidade, quedas, fragilidade, autonomia e envelhecimento ativo.",
    group: "Especialidades clinicas",
    color: "#2E7D5E",
    icon: "heart-pulse",
    sortOrder: 60,
  },
  {
    id: "osteopatia",
    name: "Osteopatia",
    slug: "osteopatia",
    description:
      "Discussao tecnica de avaliacao, raciocinio e recursos osteopaticos.",
    group: "Abordagens e recursos",
    color: "#5C6BC0",
    icon: "hand",
    sortOrder: 70,
  },
  {
    id: "rpg",
    name: "RPG",
    slug: "rpg",
    description:
      "Reeducacao postural, cadeias musculares e abordagem funcional.",
    group: "Abordagens e recursos",
    color: "#2E7D5E",
    icon: "align-center",
    sortOrder: 80,
  },
  {
    id: "pilates",
    name: "Pilates",
    slug: "pilates",
    description:
      "Exercicio, controle motor, progressao, seguranca e aplicacao clinica.",
    group: "Abordagens e recursos",
    color: "#FF7043",
    icon: "circle",
    sortOrder: 90,
  },
  {
    id: "acupuntura",
    name: "Acupuntura",
    slug: "acupuntura",
    description:
      "Discussao profissional de indicacoes, seguranca e pratica clinica.",
    group: "Abordagens e recursos",
    color: "#5C6BC0",
    icon: "sparkles",
    sortOrder: 100,
  },
  {
    id: "dor-cronica",
    name: "Dor Cronica",
    slug: "dor-cronica",
    description:
      "Educacao em dor, funcionalidade, comportamento e cuidado persistente.",
    group: "Especialidades clinicas",
    color: "#FF7043",
    icon: "heart",
    sortOrder: 110,
  },
  {
    id: "reabilitacao",
    name: "Reabilitacao",
    slug: "reabilitacao",
    description:
      "Recuperacao funcional, objetivos terapeuticos e acompanhamento.",
    group: "Especialidades clinicas",
    color: "#2E7D5E",
    icon: "refresh-cw",
    sortOrder: 120,
  },
  {
    id: "casos-clinicos",
    name: "Casos Clinicos",
    slug: "casos-clinicos",
    description: "Casos anonimizados para raciocinio clinico colaborativo.",
    group: "Discussao clinica",
    color: "#5C6BC0",
    icon: "clipboard",
    sortOrder: 130,
  },
  {
    id: "discussao-de-laudos",
    name: "Discussao de Laudos",
    slug: "discussao-de-laudos",
    description:
      "Interpretacao, redacao e organizacao tecnica de laudos clinicos.",
    group: "Discussao clinica",
    color: "#2E7D5E",
    icon: "file-text",
    sortOrder: 140,
  },
  {
    id: "protocolos-terapeuticos",
    name: "Protocolos Terapeuticos",
    slug: "protocolos-terapeuticos",
    description: "Protocolos, progressao, criterios de alta e acompanhamento.",
    group: "Discussao clinica",
    color: "#FF7043",
    icon: "list-checks",
    sortOrder: 150,
  },
  {
    id: "evidencias-cientificas",
    name: "Evidencias Cientificas",
    slug: "evidencias-cientificas",
    description: "Discussao critica de evidencias e aplicacao clinica.",
    group: "Conhecimento cientifico",
    color: "#5C6BC0",
    icon: "microscope",
    sortOrder: 160,
  },
  {
    id: "artigos-cientificos",
    name: "Artigos Cientificos",
    slug: "artigos-cientificos",
    description: "Compartilhamento e leitura critica de artigos relevantes.",
    group: "Conhecimento cientifico",
    color: "#5C6BC0",
    icon: "book-open",
    sortOrder: 170,
  },
  {
    id: "referencias-bibliograficas",
    name: "Referencias Bibliograficas",
    slug: "referencias-bibliograficas",
    description:
      "Livros, guidelines, consensos e referencias para pratica profissional.",
    group: "Conhecimento cientifico",
    color: "#2E7D5E",
    icon: "library",
    sortOrder: 180,
  },
  {
    id: "tecnologia-na-saude",
    name: "Tecnologia na Saude",
    slug: "tecnologia-na-saude",
    description:
      "Ferramentas digitais, prontuario, automacao e tecnologia clinica.",
    group: "Tecnologia e produto",
    color: "#5C6BC0",
    icon: "monitor",
    sortOrder: 190,
  },
  {
    id: "ia-aplicada-a-saude",
    name: "IA aplicada a Saude",
    slug: "ia-aplicada-a-saude",
    description:
      "Uso responsavel de IA em documentacao, pesquisa e apoio clinico.",
    group: "Tecnologia e produto",
    color: "#FF7043",
    icon: "bot",
    sortOrder: 200,
  },
  {
    id: "gestao-profissional",
    name: "Gestao Profissional",
    slug: "gestao-profissional",
    description:
      "Organizacao profissional, processos de clinica e educacao continuada.",
    group: "Gestao e carreira",
    color: "#2E7D5E",
    icon: "briefcase",
    sortOrder: 210,
  },
  {
    id: "sugestoes-para-o-synap",
    name: "Sugestoes para o SYNAP",
    slug: "sugestoes-para-o-synap",
    description:
      "Ideias, melhorias e feedbacks para evolucao do ecossistema SYNAP.",
    group: "Tecnologia e produto",
    color: "#5C6BC0",
    icon: "lightbulb",
    sortOrder: 220,
  },
];

const demoAuthor: CommunityAuthor = {
  id: "demo-author",
  username: "equipe-synap",
  displayName: "Equipe SYNAP",
  profession: "Fisioterapia",
  specialty: "Reabilitação",
  reputationScore: 120,
};

const demoContributorAuthors: CommunityAuthor[] = [
  {
    id: "demo-camila-rocha",
    username: "camila-rocha",
    displayName: "Dra. Camila Rocha",
    profession: "Fisioterapia",
    specialty: "Neurofuncional",
    reputationScore: 245,
  },
  {
    id: "demo-rafael-mendes",
    username: "rafael-mendes",
    displayName: "Dr. Rafael Mendes",
    profession: "Fisioterapia",
    specialty: "Ortopedia",
    reputationScore: 198,
  },
  {
    id: "demo-mariana-alves",
    username: "mariana-alves",
    displayName: "Mariana Alves",
    profession: "Fisioterapia",
    specialty: "Dor cronica",
    reputationScore: 166,
  },
];

const demoContributionLevels: CommunityContributionLevelRule[] = [
  {
    name: "Participante",
    minScore: 0,
    description: "Participa de discussoes e acompanha conteudos tecnicos.",
  },
  {
    name: "Colaborador",
    minScore: 50,
    description:
      "Contribui com respostas, referencias e perguntas bem estruturadas.",
  },
  {
    name: "Contribuidor Tecnico",
    minScore: 120,
    description:
      "Mantem contribuicoes consistentes e uteis para outros profissionais.",
  },
  {
    name: "Mentor da Comunidade",
    minScore: 220,
    description:
      "Ajuda colegas com raciocinio clinico, cautela etica e revisao tecnica.",
  },
  {
    name: "Referencia SYNAP",
    minScore: 360,
    description:
      "Reconhecimento editorial para contribuicoes tecnicas de alto impacto.",
  },
];

const demoProfiles: CommunityProfile[] = [
  {
    ...demoAuthor,
    bio: "Perfil institucional para organizar boas praticas, discussao etica e modelos de colaboracao tecnica dentro da comunidade SYNAP.",
    cityState: "Sao Paulo, SP",
    areasOfPractice: [
      "Reabilitacao",
      "Evidencias cientificas",
      "Discussao de laudos",
      "Etica profissional",
    ],
    contributionCount: 42,
    usefulAnswerCount: 18,
    sharedArticleCount: 11,
    recommendedReferenceCount: 24,
    badges: [
      {
        id: "colaborador-cientifico",
        label: "Colaborador Cientifico",
        description: "Compartilha referencias e ajuda a qualificar discussoes.",
      },
      {
        id: "apoio-comunidade",
        label: "Apoio a Comunidade",
        description: "Contribui com orientacoes claras e postura colaborativa.",
      },
      {
        id: "mentor-tecnico",
        label: "Mentor Tecnico",
        description: "Ajuda profissionais a estruturar raciocinio clinico.",
      },
    ],
    recentActivity: [
      {
        id: "activity-1",
        title:
          "Como estruturar uma discussao clinica sem expor dados do paciente?",
        type: "post",
        href: "/discussoes/como-estruturar-discussao-clinica-sem-expor-dados",
      },
      {
        id: "activity-2",
        title: "Criterios para marcar uma resposta como mais util",
        type: "reference",
        href: "/discussoes/criterios-para-marcar-resposta-mais-util",
      },
    ],
  },
  {
    ...demoContributorAuthors[0],
    bio: "Fisioterapeuta com foco em reabilitacao neurofuncional, educacao em saude e discussao de casos anonimizados.",
    cityState: "Curitiba, PR",
    areasOfPractice: ["Neurofuncional", "Raciocinio clinico", "Funcionalidade"],
    contributionCount: 86,
    usefulAnswerCount: 37,
    sharedArticleCount: 14,
    recommendedReferenceCount: 22,
    badges: [
      {
        id: "referencia-neurofuncional",
        label: "Referencia em Neurofuncional",
        description:
          "Contribui com discussoes tecnicas em reabilitacao neurofuncional.",
      },
      {
        id: "mentor-tecnico",
        label: "Mentor Tecnico",
        description: "Ajuda colegas a organizar raciocinio clinico e condutas.",
      },
    ],
    recentActivity: [
      {
        id: "activity-camila-1",
        title: "Criterios funcionais para evolucao em reabilitacao neurologica",
        type: "reply",
        href: "/discussoes/criterios-para-marcar-resposta-mais-util",
      },
    ],
  },
  {
    ...demoContributorAuthors[1],
    bio: "Atua em traumato-ortopedia, exercicio terapeutico e educacao profissional baseada em evidencias.",
    cityState: "Belo Horizonte, MG",
    areasOfPractice: ["Ortopedia", "Dor lombar", "Exercicio terapeutico"],
    contributionCount: 72,
    usefulAnswerCount: 28,
    sharedArticleCount: 18,
    recommendedReferenceCount: 19,
    badges: [
      {
        id: "referencia-coluna",
        label: "Referencia em Coluna",
        description:
          "Compartilha referencias e condutas em dor lombar e coluna.",
      },
      {
        id: "compartilhador-evidencias",
        label: "Compartilhador de Evidencias",
        description: "Ajuda a conectar discussoes com literatura cientifica.",
      },
    ],
    recentActivity: [
      {
        id: "activity-rafael-1",
        title: "Modelo de leitura critica para artigos de reabilitacao",
        type: "reference",
        href: "/artigos/modelo-leitura-critica-artigos-reabilitacao",
      },
    ],
  },
  {
    ...demoContributorAuthors[2],
    bio: "Fisioterapeuta voltada a dor cronica, educacao em dor e apoio a comunicacao clinica acolhedora.",
    cityState: "Recife, PE",
    areasOfPractice: ["Dor cronica", "Educacao em dor", "Comunicacao clinica"],
    contributionCount: 61,
    usefulAnswerCount: 23,
    sharedArticleCount: 9,
    recommendedReferenceCount: 16,
    badges: [
      {
        id: "apoio-comunidade",
        label: "Apoio a Comunidade",
        description:
          "Contribui com respostas acolhedoras, tecnicas e cuidadosas.",
      },
      {
        id: "discussao-clinica-destaque",
        label: "Discussao Clinica Destaque",
        description: "Estrutura casos de forma clara e segura.",
      },
    ],
    recentActivity: [
      {
        id: "activity-mariana-1",
        title: "Como discutir casos clinicos preservando privacidade",
        type: "post",
        href: "/artigos/discutir-casos-clinicos-preservando-privacidade",
      },
    ],
  },
];

const demoContributorHighlights: CommunityContributorHighlightsResponse = {
  weekly: [
    {
      ...demoProfiles[1],
      level: "Mentor da Comunidade",
      categoryName: "Neurofuncional",
      highlightedReason:
        "Ajudou colegas a diferenciar achados funcionais, objetivos terapeuticos e criterios de reavaliacao.",
      weeklyContributionCount: 11,
      monthlyContributionCount: 34,
    },
    {
      ...demoProfiles[2],
      level: "Contribuidor Tecnico",
      categoryName: "Ortopedia",
      highlightedReason:
        "Compartilhou referencias aplicaveis para dor lombar e condutas baseadas em exercicio terapeutico.",
      weeklyContributionCount: 8,
      monthlyContributionCount: 29,
    },
  ],
  monthly: [
    {
      ...demoProfiles[0],
      level: "Contribuidor Tecnico",
      categoryName: "Evidencias Cientificas",
      highlightedReason:
        "Organizou boas praticas de discussao tecnica, seguranca de dados e uso etico da comunidade.",
      weeklyContributionCount: 6,
      monthlyContributionCount: 42,
    },
    {
      ...demoProfiles[3],
      level: "Contribuidor Tecnico",
      categoryName: "Dor Cronica",
      highlightedReason:
        "Contribuiu com respostas acolhedoras, tecnicas e orientadas a educacao em dor.",
      weeklyContributionCount: 7,
      monthlyContributionCount: 24,
    },
  ],
  byCategory: [
    {
      ...demoProfiles[1],
      level: "Mentor da Comunidade",
      categoryName: "Neurofuncional",
      highlightedReason:
        "Referencia para discussoes de funcionalidade e reabilitacao neurologica.",
      weeklyContributionCount: 11,
      monthlyContributionCount: 34,
    },
    {
      ...demoProfiles[2],
      level: "Contribuidor Tecnico",
      categoryName: "Ortopedia",
      highlightedReason:
        "Referencia para discussoes de coluna, dor e exercicio terapeutico.",
      weeklyContributionCount: 8,
      monthlyContributionCount: 29,
    },
    {
      ...demoProfiles[3],
      level: "Contribuidor Tecnico",
      categoryName: "Dor Cronica",
      highlightedReason:
        "Referencia para comunicacao clinica e educacao em dor.",
      weeklyContributionCount: 7,
      monthlyContributionCount: 24,
    },
  ],
  levels: demoContributionLevels,
};

const demoPosts: CommunityPost[] = [
  {
    id: "demo-1",
    title: "Como estruturar uma discussão clínica sem expor dados do paciente?",
    slug: "como-estruturar-discussao-clinica-sem-expor-dados",
    excerpt:
      "Modelo inicial para apresentar contexto, avaliação, hipótese funcional, conduta e referências sem dados identificáveis.",
    score: 18,
    viewsCount: 0,
    repliesCount: 3,
    publishedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    category: defaultCategories[1],
    authorProfile: demoAuthor,
    tags: [
      { id: "tag-lgpd", name: "LGPD", slug: "lgpd" },
      { id: "tag-casos", name: "Casos clínicos", slug: "casos-clinicos" },
    ],
  },
  {
    id: "demo-2",
    title: "Critérios para marcar uma resposta como mais útil",
    slug: "criterios-para-marcar-resposta-mais-util",
    excerpt:
      "A resposta mais útil deve priorizar clareza técnica, aplicabilidade clínica, cautela ética e referências quando possível.",
    score: 14,
    viewsCount: 0,
    repliesCount: 2,
    publishedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    category: defaultCategories[2],
    authorProfile: demoAuthor,
    tags: [
      { id: "tag-evidencias", name: "Evidências", slug: "evidencias" },
      { id: "tag-conduta", name: "Conduta", slug: "conduta" },
    ],
  },
  {
    id: "demo-3",
    title: "Quais criterios usar para reavaliar dor cronica persistente?",
    slug: "criterios-reavaliacao-dor-cronica-persistente",
    excerpt:
      "Discussao sobre funcionalidade, educacao em dor, sinais de alerta e parametros para reavaliacao segura.",
    score: 9,
    viewsCount: 0,
    repliesCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    category: defaultCategories[10],
    authorProfile: demoContributorAuthors[2],
    tags: [
      { id: "tag-dor-cronica", name: "Dor cronica", slug: "dor-cronica" },
      { id: "tag-reavaliacao", name: "Reavaliacao", slug: "reavaliacao" },
    ],
  },
];

const demoResources: CommunityResource[] = [
  {
    id: "resource-article-1",
    kind: "article",
    title: "Modelo de leitura critica para artigos de reabilitacao",
    slug: "modelo-leitura-critica-artigos-reabilitacao",
    summary:
      "Checklist pratico para avaliar populacao, intervencao, comparador, desfechos e aplicabilidade clinica antes de usar um artigo em uma conduta.",
    sourceName: "Exemplo de artigo compartilhado",
    sourceUrl: null,
    doi: null,
    publishedYear: 2026,
    authors: ["Equipe SYNAP"],
    clinicalUse:
      "Apoia discussoes de evidencias cientificas e ajuda a separar achados estatisticos de impacto funcional relevante.",
    sharedAt: new Date().toISOString(),
    sharedBy: demoAuthor,
    tags: [
      { id: "tag-evidencias", name: "Evidencias", slug: "evidencias" },
      { id: "tag-reabilitacao", name: "Reabilitacao", slug: "reabilitacao" },
    ],
    category: defaultCategories[2],
  },
  {
    id: "resource-article-2",
    kind: "article",
    title: "Como discutir casos clinicos preservando privacidade",
    slug: "discutir-casos-clinicos-preservando-privacidade",
    summary:
      "Material introdutorio para compartilhar casos de forma anonimizada, reduzindo risco de exposicao de dados sensiveis.",
    sourceName: "Guia interno SYNAP",
    sourceUrl: null,
    doi: null,
    publishedYear: 2026,
    authors: ["Equipe SYNAP"],
    clinicalUse:
      "Serve como referencia para moderadores e participantes ao publicar duvidas clinicas na comunidade.",
    sharedAt: new Date().toISOString(),
    sharedBy: demoAuthor,
    tags: [
      { id: "tag-lgpd", name: "LGPD", slug: "lgpd" },
      { id: "tag-etica", name: "Etica", slug: "etica" },
    ],
    category: defaultCategories[1],
  },
  {
    id: "resource-reference-1",
    kind: "reference",
    title: "Estrutura PICO para perguntas clinicas",
    slug: "estrutura-pico-perguntas-clinicas",
    summary:
      "Referencia de apoio para formular perguntas objetivas envolvendo paciente, intervencao, comparacao e desfecho.",
    sourceName: "Referencia educacional",
    sourceUrl: null,
    doi: null,
    publishedYear: null,
    authors: ["Equipe SYNAP"],
    clinicalUse:
      "Ajuda o profissional a transformar duvidas amplas em perguntas respondiveis por evidencia cientifica.",
    sharedAt: new Date().toISOString(),
    sharedBy: demoAuthor,
    tags: [
      {
        id: "tag-raciocinio",
        name: "Raciocinio clinico",
        slug: "raciocinio-clinico",
      },
      { id: "tag-evidencias", name: "Evidencias", slug: "evidencias" },
    ],
    category: defaultCategories[2],
  },
  {
    id: "resource-reference-2",
    kind: "reference",
    title: "Checklist etico antes de publicar um caso",
    slug: "checklist-etico-antes-publicar-caso",
    summary:
      "Lista de verificacao para remover identificadores, imagens sensiveis, datas completas e detalhes que possam reconhecer o paciente.",
    sourceName: "Boas praticas SYNAP",
    sourceUrl: null,
    doi: null,
    publishedYear: null,
    authors: ["Equipe SYNAP"],
    clinicalUse:
      "Pode ser usado antes de criar discussoes em casos clinicos, laudos ou condutas terapeuticas.",
    sharedAt: new Date().toISOString(),
    sharedBy: demoAuthor,
    tags: [
      { id: "tag-lgpd", name: "LGPD", slug: "lgpd" },
      { id: "tag-casos", name: "Casos clinicos", slug: "casos-clinicos" },
    ],
    category: defaultCategories[1],
  },
];

const filterDemoFeed = (params?: {
  category?: string;
  tag?: string;
  q?: string;
  sort?: CommunityFeedSort;
}): CommunityPost[] => {
  const q = normalizeSearch(params?.q || "");
  const sort = params?.sort || "recent";
  const filtered = demoPosts.filter((post) => {
    if (params?.category && post.category.slug !== params.category)
      return false;
    if (params?.tag && !post.tags.some((tag) => tag.slug === params.tag)) {
      return false;
    }
    if (sort === "unanswered" && post.repliesCount > 0) return false;
    if (!q) return true;
    return (
      matchesSearch(q, post.title, post.excerpt, post.category.name) ||
      post.tags.some((tag) => matchesSearch(q, tag.name, tag.slug))
    );
  });

  return filtered.sort((a, b) => {
    if (sort === "relevant") {
      return getHealthyFeedScore(b) - getHealthyFeedScore(a);
    }
    return (
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime()
    );
  });
};

const filterDemoResources = (params?: {
  kind?: CommunityResourceKind;
  tag?: string;
  q?: string;
}): CommunityResource[] => {
  const q = normalizeSearch(params?.q || "");
  return demoResources.filter((resource) => {
    if (params?.kind && resource.kind !== params.kind) return false;
    if (params?.tag && !resource.tags.some((tag) => tag.slug === params.tag)) {
      return false;
    }
    if (!q) return true;
    return (
      matchesSearch(
        q,
        resource.title,
        resource.summary,
        resource.clinicalUse,
        resource.sourceName,
        resource.category?.name,
      ) || resource.tags.some((tag) => matchesSearch(q, tag.name, tag.slug))
    );
  });
};

const filterDemoCategories = (q: string): CommunityCategory[] => {
  const query = normalizeSearch(q);
  return defaultCategories
    .filter((category) => {
      if (!query) return true;
      return matchesSearch(
        query,
        category.name,
        category.slug,
        category.description,
        category.group,
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8);
};

const filterDemoTags = (q: string): CommunityTagDetails[] => {
  const query = normalizeSearch(q);
  return collectDemoTags()
    .filter((tag) => {
      if (!query) return true;
      return matchesSearch(query, tag.name, tag.slug, tag.description);
    })
    .slice(0, 12);
};

const filterDemoProfiles = (params?: {
  q?: string;
  specialty?: string;
  area?: string;
  sort?: CommunityProfilesSort;
  limit?: number;
}): CommunityProfile[] => {
  const query = normalizeSearch(params?.q || "");
  const specialty = normalizeSearch(params?.specialty || "");
  const area = normalizeSearch(params?.area || "");
  const sort = params?.sort || "contributions";

  const profiles = demoProfiles
    .filter((profile) => {
      if (specialty && normalizeSearch(profile.specialty || "") !== specialty) {
        return false;
      }
      if (
        area &&
        !profile.areasOfPractice.some(
          (areaOfPractice) => normalizeSearch(areaOfPractice) === area,
        )
      ) {
        return false;
      }
      if (!query) return true;
      return (
        matchesSearch(
          query,
          profile.displayName,
          profile.username,
          profile.profession,
          profile.specialty,
          profile.bio,
          profile.cityState,
        ) ||
        profile.areasOfPractice.some((area) => matchesSearch(query, area)) ||
        profile.badges.some((badge) =>
          matchesSearch(query, badge.label, badge.description),
        )
      );
    })
    .sort((a, b) => {
      if (sort === "name") {
        return a.displayName.localeCompare(b.displayName);
      }
      if (sort === "useful") {
        return b.usefulAnswerCount - a.usefulAnswerCount;
      }
      return (
        b.contributionCount - a.contributionCount ||
        b.reputationScore - a.reputationScore
      );
    });

  return typeof params?.limit === "number"
    ? profiles.slice(0, params.limit)
    : profiles;
};

const collectDemoTags = (): CommunityTagDetails[] => {
  const tags = new Map<string, CommunityTagDetails>();

  for (const item of [...demoPosts, ...demoResources]) {
    for (const tag of item.tags) {
      const current = tags.get(tag.slug);
      tags.set(tag.slug, {
        ...tag,
        usageCount: (current?.usageCount || 0) + 1,
        description:
          current?.description || `Conteudos marcados com ${tag.name}.`,
      });
    }
  }

  return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name));
};

async function communityFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Community API ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCommunityCategories(): Promise<CommunityCategory[]> {
  try {
    return await communityFetch<CommunityCategory[]>("/community/categories");
  } catch {
    return defaultCategories;
  }
}

export async function getCommunityTags(): Promise<CommunityTagDetails[]> {
  try {
    return await communityFetch<CommunityTagDetails[]>("/community/tags");
  } catch {
    return collectDemoTags();
  }
}

export async function getCommunityTag(
  slug: string,
): Promise<CommunityTagDetails | null> {
  try {
    return await communityFetch<CommunityTagDetails>(
      `/community/tags/${encodeURIComponent(slug)}`,
    );
  } catch {
    return collectDemoTags().find((tag) => tag.slug === slug) || null;
  }
}

export async function getCommunityFeed(params?: {
  category?: string;
  tag?: string;
  q?: string;
  sort?: CommunityFeedSort;
}): Promise<CommunityFeedResponse> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.q) search.set("q", params.q);
  if (params?.sort) search.set("sort", params.sort);

  try {
    return await communityFetch<CommunityFeedResponse>(
      `/community/feed${search.size ? `?${search.toString()}` : ""}`,
    );
  } catch {
    const items = filterDemoFeed(params);
    return {
      items,
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
}

export async function getCommunityResources(params?: {
  kind?: CommunityResourceKind;
  tag?: string;
  q?: string;
}): Promise<CommunityResourceResponse> {
  const search = new URLSearchParams();
  if (params?.kind) search.set("kind", params.kind);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.q) search.set("q", params.q);

  try {
    return await communityFetch<CommunityResourceResponse>(
      `/community/resources${search.size ? `?${search.toString()}` : ""}`,
    );
  } catch {
    const items = filterDemoResources(params);
    return {
      items,
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
}

export async function getCommunityResource(
  slug: string,
): Promise<CommunityResource | null> {
  try {
    return await communityFetch<CommunityResource>(
      `/community/resources/${encodeURIComponent(slug)}`,
    );
  } catch {
    return demoResources.find((resource) => resource.slug === slug) || null;
  }
}

export async function getCommunityPost(
  slug: string,
): Promise<CommunityPostDetails | null> {
  try {
    return await communityFetch<CommunityPostDetails>(
      `/community/posts/${encodeURIComponent(slug)}`,
    );
  } catch {
    const post = demoPosts.find((item) => item.slug === slug);
    if (post) {
      return {
        ...post,
        contentMarkdown:
          "Use esta estrutura para manter a discussao profissional e segura:\n\n1. Contexto clinico anonimizado.\n2. Achados relevantes da avaliacao.\n3. Hipoteses funcionais.\n4. Conduta realizada ou proposta.\n5. Referencias ou duvidas objetivas.\n\nEvite nomes, datas completas, documentos, imagens identificaveis e qualquer informacao que permita reconhecer o paciente.",
        replies:
          post.repliesCount > 0
            ? [
                {
                  id: "demo-reply-1",
                  contentMarkdown:
                    "Uma boa resposta deve declarar limites, sugerir raciocinio e apontar criterios de reavaliacao. Quando possivel, inclua referencia bibliografica ou guideline.",
                  score: 8,
                  isUseful: true,
                  createdAt: new Date().toISOString(),
                  authorProfile: demoAuthor,
                },
              ]
            : [],
      };
    }
    return null;
  }
}

export async function getCommunityProfile(
  username: string,
): Promise<CommunityProfile | null> {
  try {
    return await communityFetch<CommunityProfile>(
      `/community/profiles/${encodeURIComponent(username)}`,
    );
  } catch {
    return (
      demoProfiles.find(
        (profile) =>
          profile.username === username ||
          profile.id === username ||
          slugify(profile.displayName) === username,
      ) || null
    );
  }
}

export async function getCommunityProfiles(params?: {
  q?: string;
  specialty?: string;
  area?: string;
  sort?: CommunityProfilesSort;
}): Promise<CommunityProfilesResponse> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.specialty) search.set("specialty", params.specialty);
  if (params?.area) search.set("area", params.area);
  if (params?.sort) search.set("sort", params.sort);

  try {
    return await communityFetch<CommunityProfilesResponse>(
      `/community/profiles${search.size ? `?${search.toString()}` : ""}`,
    );
  } catch {
    const items = filterDemoProfiles(params);
    const allProfiles = filterDemoProfiles();
    return {
      items,
      total: items.length,
      page: 1,
      limit: 24,
      totalPages: 1,
      specialties: collectUniqueValues(
        allProfiles.flatMap((profile) =>
          profile.specialty ? [profile.specialty] : [],
        ),
      ),
      areas: collectUniqueValues(
        allProfiles.flatMap((profile) => profile.areasOfPractice),
      ),
    };
  }
}

export async function getCommunityContributorHighlights(): Promise<CommunityContributorHighlightsResponse> {
  try {
    return await communityFetch<CommunityContributorHighlightsResponse>(
      "/community/contributors/highlights",
    );
  } catch {
    return demoContributorHighlights;
  }
}

export async function getCommunitySearch(
  q: string,
): Promise<CommunitySearchResponse> {
  const query = q.trim();
  const search = new URLSearchParams();
  if (query) search.set("q", query);

  try {
    return await communityFetch<CommunitySearchResponse>(
      `/community/search${search.size ? `?${search.toString()}` : ""}`,
    );
  } catch {
    const discussions = filterDemoFeed({ q: query });
    const resources = filterDemoResources({ q: query });
    const categories = filterDemoCategories(query);
    const tags = filterDemoTags(query);
    const profiles = filterDemoProfiles({ q: query, limit: 8 });

    return {
      query,
      discussions,
      resources,
      categories,
      tags,
      profiles,
      total:
        discussions.length +
        resources.length +
        categories.length +
        tags.length +
        profiles.length,
    };
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(
  query: string,
  ...values: Array<string | null | undefined>
) {
  return values.some((value) => normalizeSearch(value || "").includes(query));
}

function collectUniqueValues(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function getHealthyFeedScore(post: CommunityPost): number {
  const recencyHours = Math.max(
    1,
    (Date.now() - new Date(post.lastActivityAt).getTime()) / (1000 * 60 * 60),
  );
  const recencyBoost = Math.max(0, 24 - recencyHours) / 24;
  const usefulSignal = post.score * 2 + post.repliesCount * 3;
  const unansweredBoost = post.repliesCount === 0 ? 4 : 0;

  return usefulSignal + unansweredBoost + recencyBoost;
}
