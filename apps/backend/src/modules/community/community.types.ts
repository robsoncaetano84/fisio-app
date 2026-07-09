export type CommunityModerationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'HIDDEN'
  | 'REJECTED';

export type CommunityResourceKind = 'article' | 'reference';

export type CommunityReportStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED';

export type CommunityContributionEventType =
  | 'CREATE_POST'
  | 'ANSWER_QUESTION'
  | 'USEFUL_ANSWER'
  | 'SHARE_ARTICLE'
  | 'SHARE_REFERENCE'
  | 'THANKS'
  | 'INAPPROPRIATE_CONTENT'
  | 'SPAM';

export type CommunityNotificationType =
  | 'REPLY'
  | 'MENTION'
  | 'THANKS'
  | 'USEFUL_REPLY'
  | 'MODERATION'
  | 'RELEVANT_DISCUSSION';

export const COMMUNITY_TARGET_TYPES = [
  'post',
  'reply',
  'resource',
  'profile',
] as const;
export type CommunityTargetType = (typeof COMMUNITY_TARGET_TYPES)[number];

export const COMMUNITY_CONTRIBUTION_RULES: Record<
  CommunityContributionEventType,
  number
> = {
  CREATE_POST: 5,
  ANSWER_QUESTION: 3,
  USEFUL_ANSWER: 15,
  SHARE_ARTICLE: 10,
  SHARE_REFERENCE: 5,
  THANKS: 1,
  INAPPROPRIATE_CONTENT: -20,
  SPAM: -50,
};

export const COMMUNITY_CONTRIBUTION_LEVELS = [
  {
    name: 'Participante',
    minScore: 0,
    description: 'Participa de discussoes e acompanha conteudos tecnicos.',
  },
  {
    name: 'Colaborador',
    minScore: 50,
    description:
      'Contribui com respostas, referencias e perguntas estruturadas.',
  },
  {
    name: 'Contribuidor Tecnico',
    minScore: 120,
    description: 'Mantem contribuicoes consistentes e uteis.',
  },
  {
    name: 'Mentor da Comunidade',
    minScore: 220,
    description:
      'Ajuda colegas com raciocinio clinico, ciencia e cautela etica.',
  },
  {
    name: 'Referencia SYNAP',
    minScore: 360,
    description: 'Reconhecimento editorial para contribuicoes de alto impacto.',
  },
];

export const COMMUNITY_DEFAULT_BADGES = [
  {
    slug: 'referencia-coluna',
    label: 'Referencia em Coluna',
    description: 'Contribuicoes qualificadas em dor, coluna e funcao.',
  },
  {
    slug: 'mentor-tecnico',
    label: 'Mentor Tecnico',
    description: 'Ajuda colegas a estruturar raciocinio e condutas.',
  },
  {
    slug: 'colaborador-cientifico',
    label: 'Colaborador Cientifico',
    description: 'Compartilha artigos, guidelines e leitura critica.',
  },
  {
    slug: 'discussao-clinica-destaque',
    label: 'Discussao Clinica Destaque',
    description: 'Publica casos e perguntas tecnicas com boa estrutura.',
  },
  {
    slug: 'compartilhador-evidencias',
    label: 'Compartilhador de Evidencias',
    description: 'Conecta pratica clinica a referencias confiaveis.',
  },
  {
    slug: 'apoio-comunidade',
    label: 'Apoio a Comunidade',
    description: 'Mantem postura acolhedora, tecnica e colaborativa.',
  },
  {
    slug: 'referencia-neurofuncional',
    label: 'Referencia em Neurofuncional',
    description: 'Contribui em funcionalidade e reabilitacao neurologica.',
  },
];

export const COMMUNITY_DEFAULT_CATEGORIES = [
  ['ortopedia', 'Ortopedia', 'Especialidades clinicas', 10],
  ['traumato-ortopedia', 'Traumato-Ortopedia', 'Especialidades clinicas', 20],
  ['neurofuncional', 'Neurofuncional', 'Especialidades clinicas', 30],
  [
    'fisioterapia-esportiva',
    'Fisioterapia Esportiva',
    'Especialidades clinicas',
    40,
  ],
  ['pediatria', 'Pediatria', 'Especialidades clinicas', 50],
  ['geriatria', 'Geriatria', 'Especialidades clinicas', 60],
  ['osteopatia', 'Osteopatia', 'Abordagens e recursos', 70],
  ['rpg', 'RPG', 'Abordagens e recursos', 80],
  ['pilates', 'Pilates', 'Abordagens e recursos', 90],
  ['acupuntura', 'Acupuntura', 'Abordagens e recursos', 100],
  ['dor-cronica', 'Dor Cronica', 'Especialidades clinicas', 110],
  ['reabilitacao', 'Reabilitacao', 'Especialidades clinicas', 120],
  ['casos-clinicos', 'Casos Clinicos', 'Discussao clinica', 130],
  ['discussao-de-laudos', 'Discussao de Laudos', 'Discussao clinica', 140],
  [
    'protocolos-terapeuticos',
    'Protocolos Terapeuticos',
    'Discussao clinica',
    150,
  ],
  [
    'evidencias-cientificas',
    'Evidencias Cientificas',
    'Conhecimento cientifico',
    160,
  ],
  [
    'artigos-cientificos',
    'Artigos Cientificos',
    'Conhecimento cientifico',
    170,
  ],
  [
    'referencias-bibliograficas',
    'Referencias Bibliograficas',
    'Conhecimento cientifico',
    180,
  ],
  ['tecnologia-na-saude', 'Tecnologia na Saude', 'Tecnologia e produto', 190],
  ['ia-aplicada-a-saude', 'IA aplicada a Saude', 'Tecnologia e produto', 200],
  ['gestao-profissional', 'Gestao Profissional', 'Gestao e carreira', 210],
  [
    'sugestoes-para-o-synap',
    'Sugestoes para o SYNAP',
    'Tecnologia e produto',
    220,
  ],
] as const;
