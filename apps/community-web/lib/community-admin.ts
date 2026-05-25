export type CommunityAdminTone = 'primary' | 'secondary' | 'accent' | 'neutral';

export type CommunityAdminMetric = {
  label: string;
  value: string;
  description: string;
  tone: CommunityAdminTone;
};

export type CommunityAdminQueue = {
  title: string;
  description: string;
  href: string;
  ownerRole: 'MODERATOR' | 'ADMIN';
  status: 'local' | 'planned' | 'contract-ready';
};

export type CommunityAdminRole = {
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  description: string;
  permissions: string[];
};

export type CommunityAdminAuditEvent = {
  event: string;
  description: string;
  retention: string;
};

export type CommunityAdminApiContract = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  purpose: string;
};

export const communityAdminMetrics: CommunityAdminMetric[] = [
  {
    label: 'Rotas publicas',
    value: '20',
    description: 'Paginas SSR/estaticas preparadas para SEO e navegacao.',
    tone: 'primary',
  },
  {
    label: 'Filas operacionais',
    value: '9',
    description:
      'Moderacao, recursos, perfis, contratos, SEO, IA, SSO, status e seguranca.',
    tone: 'secondary',
  },
  {
    label: 'Perfis de acesso',
    value: '3',
    description: 'USER, MODERATOR e ADMIN preparados para RBAC.',
    tone: 'accent',
  },
  {
    label: 'Eventos auditaveis',
    value: '8+',
    description: 'Base para rastrear moderacao, IA, SSO e conteudo.',
    tone: 'neutral',
  },
];

export const communityAdminQueues: CommunityAdminQueue[] = [
  {
    title: 'Denuncias e revisao de conteudo',
    description:
      'Fila para spam, dados sensiveis, conduta inadequada e risco clinico.',
    href: '/moderacao',
    ownerRole: 'MODERATOR',
    status: 'local',
  },
  {
    title: 'Recursos cientificos em revisao',
    description:
      'Artigos, referencias e links devem passar por validacao de fonte e escopo.',
    href: '/novo-recurso',
    ownerRole: 'MODERATOR',
    status: 'contract-ready',
  },
  {
    title: 'Perfis profissionais',
    description:
      'Sincronizacao futura de nome, profissao, especialidade, plano e status da conta.',
    href: '/profissionais',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
  {
    title: 'Saude de indexacao',
    description:
      'Monitoramento de sitemap, robots, metadados e conteudos publicos indexaveis.',
    href: '/sitemap.xml',
    ownerRole: 'ADMIN',
    status: 'planned',
  },
  {
    title: 'Contratos tecnicos',
    description:
      'Mapa de APIs REST e entidades PostgreSQL planejadas para o backend.',
    href: '/contratos',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
  {
    title: 'IA responsavel',
    description:
      'Contratos para resumo, classificacao, referencias e triagem com auditoria.',
    href: '/ia',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
  {
    title: 'Status e observabilidade',
    description:
      'Contratos de health checks, metricas, logs e eventos operacionais.',
    href: '/status',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
  {
    title: 'Sessao e SSO',
    description:
      'Fluxo de token curto, cookie seguro e sincronizacao de perfil profissional.',
    href: '/sessao',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
  {
    title: 'Seguranca',
    description:
      'Headers, RBAC, CSRF, rate limit, anti-spam e upload seguro.',
    href: '/seguranca',
    ownerRole: 'ADMIN',
    status: 'contract-ready',
  },
];

export const communityAdminRoles: CommunityAdminRole[] = [
  {
    role: 'USER',
    description: 'Participante autenticado da comunidade.',
    permissions: [
      'Criar discussoes e respostas',
      'Salvar conteudos',
      'Denunciar conteudo inadequado',
      'Compartilhar recursos para revisao',
    ],
  },
  {
    role: 'MODERATOR',
    description: 'Responsavel por qualidade tecnica, conduta e seguranca.',
    permissions: [
      'Revisar denuncias',
      'Ocultar ou restaurar conteudo',
      'Marcar conteudo como revisado',
      'Sugerir suspensao para administradores',
    ],
  },
  {
    role: 'ADMIN',
    description: 'Responsavel por configuracao, seguranca e governanca.',
    permissions: [
      'Gerenciar categorias e tags',
      'Gerenciar papeis e permissoes',
      'Consultar auditoria',
      'Configurar SEO, integracoes e politicas de IA',
    ],
  },
];

export const communityAdminAuditEvents: CommunityAdminAuditEvent[] = [
  {
    event: 'COMMUNITY_CONTENT_CREATED',
    description: 'Discussao, resposta ou recurso criado por usuario.',
    retention: '5 anos',
  },
  {
    event: 'COMMUNITY_CONTENT_REPORTED',
    description: 'Conteudo denunciado para moderacao.',
    retention: '5 anos',
  },
  {
    event: 'COMMUNITY_MODERATION_STATUS_CHANGED',
    description: 'Status de denuncia ou conteudo alterado por moderador.',
    retention: '5 anos',
  },
  {
    event: 'COMMUNITY_PROFILE_SYNCED',
    description: 'Perfil sincronizado a partir do ecossistema SYNAP.',
    retention: '2 anos',
  },
  {
    event: 'COMMUNITY_SSO_EXCHANGED',
    description: 'Token curto trocado por sessao segura da comunidade.',
    retention: '1 ano',
  },
  {
    event: 'COMMUNITY_AI_SUGGESTION_REQUESTED',
    description: 'Recurso de IA acionado para apoio editorial ou moderacao.',
    retention: '5 anos',
  },
  {
    event: 'COMMUNITY_AI_SUGGESTION_ACCEPTED',
    description: 'Sugestao de IA aceita ou aplicada apos revisao humana.',
    retention: '5 anos',
  },
  {
    event: 'COMMUNITY_PERMISSION_CHANGED',
    description: 'Papel ou permissao de usuario alterado por administrador.',
    retention: '5 anos',
  },
];

export const communityAdminApiContracts: CommunityAdminApiContract[] = [
  {
    method: 'GET',
    path: '/api/community/admin/overview',
    purpose: 'Resumo operacional para dashboard administrativo.',
  },
  {
    method: 'GET',
    path: '/api/community/admin/audit-logs',
    purpose: 'Consulta paginada de auditoria por evento, usuario e periodo.',
  },
  {
    method: 'PATCH',
    path: '/api/community/admin/users/:userId/role',
    purpose: 'Alteracao controlada de papel com auditoria obrigatoria.',
  },
  {
    method: 'GET',
    path: '/api/community/admin/seo-health',
    purpose: 'Saude de sitemap, metadados, indexacao e rotas publicas.',
  },
  {
    method: 'PATCH',
    path: '/api/community/admin/categories/:categoryId',
    purpose: 'Governanca de categorias, ordem, descricao e visibilidade.',
  },
];

export function getCommunityAdminStatusLabel(
  status: CommunityAdminQueue['status'],
): string {
  if (status === 'contract-ready') return 'Contrato preparado';
  if (status === 'local') return 'Local nesta etapa';
  return 'Planejado';
}
