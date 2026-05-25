export type CommunityContributionCategory =
  | 'knowledge'
  | 'support'
  | 'science'
  | 'recognition'
  | 'moderation'
  | 'penalty';

export type CommunityContributionRule = {
  id: string;
  title: string;
  points: number;
  category: CommunityContributionCategory;
  description: string;
  visibleToPublic: boolean;
  requiresReview: boolean;
};

export type CommunityContributionLevel = {
  name: string;
  minScore: number;
  description: string;
  intent: string;
};

export type CommunityBadgeDefinition = {
  id: string;
  label: string;
  description: string;
  criteria: string;
  review: 'automatic' | 'moderated' | 'editorial';
};

export type CommunityRecognitionSurface = {
  title: string;
  description: string;
  cadence: string;
  rankingBehavior: string;
};

export type CommunityReputationModel = {
  version: string;
  updatedAt: string;
  principles: string[];
  exclusions: string[];
  rules: CommunityContributionRule[];
  levels: CommunityContributionLevel[];
  badges: CommunityBadgeDefinition[];
  recognitionSurfaces: CommunityRecognitionSurface[];
  safeguards: string[];
};

export const communityReputationVersion = '2026-05-25.reputation.v1';
export const communityReputationUpdatedAt = '2026-05-25T00:00:00.000Z';

const rules: CommunityContributionRule[] = [
  {
    id: 'create-discussion',
    title: 'Criar postagem tecnica',
    points: 5,
    category: 'knowledge',
    description:
      'Reconhece perguntas ou discussoes bem estruturadas, com contexto clinico anonimizado e objetivo claro.',
    visibleToPublic: true,
    requiresReview: false,
  },
  {
    id: 'answer-question',
    title: 'Responder duvida',
    points: 3,
    category: 'support',
    description:
      'Valoriza respostas que ajudam outro profissional a organizar raciocinio, conduta ou criterios de reavaliacao.',
    visibleToPublic: true,
    requiresReview: false,
  },
  {
    id: 'useful-answer',
    title: 'Resposta marcada como util',
    points: 15,
    category: 'recognition',
    description:
      'Sinal forte para respostas claras, tecnicas, respeitosas e aplicaveis ao contexto discutido.',
    visibleToPublic: true,
    requiresReview: false,
  },
  {
    id: 'share-scientific-article',
    title: 'Compartilhar artigo cientifico relevante',
    points: 10,
    category: 'science',
    description:
      'Reconhece artigo, guideline ou consenso compartilhado com resumo clinico e aplicabilidade profissional.',
    visibleToPublic: true,
    requiresReview: true,
  },
  {
    id: 'share-reference',
    title: 'Compartilhar referencia bibliografica',
    points: 5,
    category: 'science',
    description:
      'Valoriza referencias que melhoram a qualidade da discussao e ajudam educacao continuada.',
    visibleToPublic: true,
    requiresReview: true,
  },
  {
    id: 'thanks',
    title: 'Receber agradecimento',
    points: 1,
    category: 'recognition',
    description:
      'Sinal leve de utilidade entre colegas, limitado para evitar popularidade vazia.',
    visibleToPublic: true,
    requiresReview: false,
  },
  {
    id: 'inappropriate-content',
    title: 'Conteudo inadequado',
    points: -20,
    category: 'penalty',
    description:
      'Aplicado apos revisao quando ha risco etico, orientacao insegura, exposicao indevida ou conduta inadequada.',
    visibleToPublic: false,
    requiresReview: true,
  },
  {
    id: 'spam',
    title: 'Spam ou captacao indevida',
    points: -50,
    category: 'penalty',
    description:
      'Aplicado apos revisao para conteudo promocional abusivo, repetitivo ou fora do objetivo profissional da comunidade.',
    visibleToPublic: false,
    requiresReview: true,
  },
];

const levels: CommunityContributionLevel[] = [
  {
    name: 'Participante',
    minScore: 0,
    description: 'Acompanha discussoes e participa de forma pontual.',
    intent: 'Entrada saudavel na comunidade, sem pressao por volume.',
  },
  {
    name: 'Colaborador',
    minScore: 50,
    description: 'Contribui com perguntas, respostas e referencias uteis.',
    intent: 'Reconhecer constancia inicial e comportamento colaborativo.',
  },
  {
    name: 'Contribuidor Tecnico',
    minScore: 120,
    description: 'Mantem contribuicoes tecnicas consistentes e aplicaveis.',
    intent: 'Evidenciar ajuda recorrente sem transformar em competicao.',
  },
  {
    name: 'Mentor da Comunidade',
    minScore: 220,
    description: 'Apoia colegas com raciocinio clinico, ciencia e cautela etica.',
    intent: 'Reconhecer profissionais que elevam a qualidade das discussoes.',
  },
  {
    name: 'Referencia SYNAP',
    minScore: 360,
    description: 'Reconhecimento editorial para contribuicoes de alto impacto.',
    intent: 'Destacar contribuicao tecnica validada, nao fama ou alcance.',
  },
];

const badges: CommunityBadgeDefinition[] = [
  {
    id: 'referencia-coluna',
    label: 'Referencia em Coluna',
    description: 'Contribuicoes qualificadas em dor, coluna e funcao.',
    criteria:
      'Respostas uteis recorrentes em discussoes de coluna com referencias ou criterios clinicos claros.',
    review: 'editorial',
  },
  {
    id: 'mentor-tecnico',
    label: 'Mentor Tecnico',
    description: 'Ajuda colegas a estruturar raciocinio e condutas.',
    criteria:
      'Historico de respostas tecnicas, cuidadosas e reconhecidas pela comunidade.',
    review: 'editorial',
  },
  {
    id: 'colaborador-cientifico',
    label: 'Colaborador Cientifico',
    description: 'Compartilha artigos, guidelines e leitura critica.',
    criteria:
      'Recursos cientificos aprovados por moderacao e usados em discussoes relevantes.',
    review: 'moderated',
  },
  {
    id: 'discussao-clinica-destaque',
    label: 'Discussao Clinica Destaque',
    description: 'Publica casos e perguntas tecnicas com boa estrutura.',
    criteria:
      'Discussoes anonimizadas, objetivas e capazes de gerar respostas aplicaveis.',
    review: 'moderated',
  },
  {
    id: 'compartilhador-evidencias',
    label: 'Compartilhador de Evidencias',
    description: 'Conecta pratica clinica a referencias confiaveis.',
    criteria:
      'Compartilhamento recorrente de evidencias com resumo de aplicabilidade clinica.',
    review: 'moderated',
  },
  {
    id: 'apoio-comunidade',
    label: 'Apoio a Comunidade',
    description: 'Mantem postura acolhedora, tecnica e colaborativa.',
    criteria:
      'Agradecimentos, respostas uteis e baixa incidencia de intervencao moderadora.',
    review: 'automatic',
  },
  {
    id: 'referencia-neurofuncional',
    label: 'Referencia em Neurofuncional',
    description: 'Contribui tecnicamente em funcionalidade e reabilitacao neurologica.',
    criteria:
      'Participacao consistente em neurofuncional com respostas uteis e postura etica.',
    review: 'editorial',
  },
];

const recognitionSurfaces: CommunityRecognitionSurface[] = [
  {
    title: 'Destaque semanal',
    description:
      'Evidencia contribuicoes recentes que ajudaram colegas, melhoraram discussoes ou trouxeram referencias relevantes.',
    cadence: 'Semanal',
    rankingBehavior: 'Lista editorial com poucos destaques, sem placar publico.',
  },
  {
    title: 'Destaque mensal',
    description:
      'Reconhece consistencia tecnica, postura profissional e valor educacional acumulado no mes.',
    cadence: 'Mensal',
    rankingBehavior: 'Ordenacao curada por qualidade, nao por volume bruto.',
  },
  {
    title: 'Colaboradores por categoria',
    description:
      'Ajuda profissionais a encontrar referencias tecnicas por area de atuacao.',
    cadence: 'Continuo',
    rankingBehavior: 'Agrupamento por especialidade, sem comparacao comercial.',
  },
];

export function getCommunityReputationModel(): CommunityReputationModel {
  return {
    version: communityReputationVersion,
    updatedAt: communityReputationUpdatedAt,
    principles: [
      'Reconhecer contribuicao tecnica, ciencia, apoio aos colegas e cuidado etico.',
      'Priorizar respostas uteis, referencias e discussoes que elevam o raciocinio clinico.',
      'Evitar dinamicas de rede social baseadas em popularidade, volume ou polemica.',
      'Usar moderacao humana para badges sensiveis, penalidades e destaques editoriais.',
    ],
    exclusions: [
      'Quantidade de pacientes atendidos.',
      'Faturamento, agenda, ticket medio ou metricas comerciais.',
      'Numero bruto de seguidores, visualizacoes ou curtidas isoladas.',
      'Conteudo promocional, captacao indevida ou comparacao entre profissionais.',
    ],
    rules,
    levels,
    badges,
    recognitionSurfaces,
    safeguards: [
      'Limite diario para sinais leves como agradecimentos, reduzindo incentivo a troca artificial.',
      'Penalidades aplicadas somente apos revisao, com auditoria e possibilidade de recurso.',
      'Badges editoriais exigem historico consistente e aderencia as diretrizes da comunidade.',
      'Destaques publicos devem explicar a contribuicao reconhecida, nao apenas exibir pontuacao.',
      'Conteudos com dados sensiveis ou risco clinico entram em fluxo de moderacao antes de destaque.',
    ],
  };
}
