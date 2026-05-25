export type CommunityServiceStatus = 'operational' | 'degraded' | 'planned';

export type CommunityStatusCheck = {
  name: string;
  description: string;
  status: CommunityServiceStatus;
  owner: 'Frontend' | 'Backend' | 'Infra' | 'Moderacao';
  check: string;
};

export type CommunityMetricContract = {
  metric: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram';
  labels: string[];
};

export type CommunityLogContract = {
  event: string;
  level: 'info' | 'warn' | 'error';
  description: string;
  fields: string[];
};

export const communityStatusChecks: CommunityStatusCheck[] = [
  {
    name: 'NextJS community-web',
    description: 'Renderizacao SSR/estatica, rotas publicas e assets.',
    status: 'operational',
    owner: 'Frontend',
    check: 'GET /api/health',
  },
  {
    name: 'API da comunidade',
    description: 'Contrato REST para feed, perfis, recursos e moderacao.',
    status: 'planned',
    owner: 'Backend',
    check: 'GET /api/community/health',
  },
  {
    name: 'SSO SYNAP',
    description: 'Troca de token curto por sessao segura HttpOnly.',
    status: 'planned',
    owner: 'Backend',
    check: 'POST /api/auth/community-sso',
  },
  {
    name: 'Busca',
    description: 'PostgreSQL full text search inicialmente, OpenSearch futuro.',
    status: 'planned',
    owner: 'Backend',
    check: 'GET /api/community/search?q=',
  },
  {
    name: 'Storage de anexos',
    description: 'Upload futuro via URL assinada compativel com S3.',
    status: 'planned',
    owner: 'Infra',
    check: 'POST /api/community/uploads/presign',
  },
  {
    name: 'Fila de moderacao',
    description: 'Denuncias locais existem; fila persistente depende da API.',
    status: 'degraded',
    owner: 'Moderacao',
    check: 'GET /api/community/moderation/reports',
  },
];

export const communityMetricContracts: CommunityMetricContract[] = [
  {
    metric: 'community_http_request_duration_ms',
    description: 'Latencia das rotas publicas e APIs da comunidade.',
    type: 'histogram',
    labels: ['route', 'method', 'status_code'],
  },
  {
    metric: 'community_content_created_total',
    description: 'Discussoes, respostas e recursos criados.',
    type: 'counter',
    labels: ['content_type', 'category_slug'],
  },
  {
    metric: 'community_moderation_reports_total',
    description: 'Denuncias abertas, revisadas e resolvidas.',
    type: 'counter',
    labels: ['reason', 'target_type', 'status'],
  },
  {
    metric: 'community_search_requests_total',
    description: 'Consultas feitas na busca global.',
    type: 'counter',
    labels: ['source', 'has_results'],
  },
  {
    metric: 'community_ai_requests_total',
    description: 'Uso futuro de IA por capacidade e resultado.',
    type: 'counter',
    labels: ['capability', 'status', 'review_required'],
  },
  {
    metric: 'community_sso_exchange_total',
    description: 'Tentativas de troca de token SSO.',
    type: 'counter',
    labels: ['result', 'failure_reason'],
  },
];

export const communityLogContracts: CommunityLogContract[] = [
  {
    event: 'community.route.error',
    level: 'error',
    description: 'Erro capturado por boundary de pagina.',
    fields: ['route', 'digest?', 'message', 'userId?', 'requestId?'],
  },
  {
    event: 'community.content.local_saved',
    level: 'info',
    description: 'Rascunho ou preview local salvo no navegador.',
    fields: ['contentType', 'localId', 'hasAttachments', 'hasReferences'],
  },
  {
    event: 'community.moderation.report_created',
    level: 'warn',
    description: 'Conteudo denunciado para revisao.',
    fields: ['targetType', 'targetId', 'reason', 'reporterId?'],
  },
  {
    event: 'community.sso.exchange_failed',
    level: 'warn',
    description: 'Falha na troca de token curto por sessao.',
    fields: ['reason', 'tokenAgeSeconds?', 'requestId?'],
  },
  {
    event: 'community.ai.suggestion_reviewed',
    level: 'info',
    description: 'Sugestao futura de IA aceita, editada ou rejeitada.',
    fields: ['capability', 'action', 'reviewerId', 'contentId'],
  },
];

export function getCommunityStatusLabel(status: CommunityServiceStatus): string {
  if (status === 'operational') return 'Operacional';
  if (status === 'degraded') return 'Parcial';
  return 'Planejado';
}
