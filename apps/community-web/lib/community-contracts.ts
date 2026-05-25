export type CommunityApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type CommunityApiDomain =
  | 'auth'
  | 'profiles'
  | 'content'
  | 'resources'
  | 'engagement'
  | 'moderation'
  | 'search'
  | 'admin'
  | 'ai'
  | 'observability';

export type CommunityApiContract = {
  domain: CommunityApiDomain;
  method: CommunityApiMethod;
  path: string;
  summary: string;
  auth: 'public' | 'user' | 'moderator' | 'admin' | 'service';
  status: 'planned' | 'frontend-ready' | 'requires-backend';
  request?: string[];
  response?: string[];
};

export type CommunityEntityContract = {
  table: string;
  purpose: string;
  ownership: 'auth' | 'profile' | 'content' | 'engagement' | 'moderation' | 'system';
  keyFields: string[];
  indexes: string[];
  relations: string[];
  softDelete: boolean;
  audit: boolean;
};

export const communityApiContracts: CommunityApiContract[] = [
  {
    domain: 'auth',
    method: 'POST',
    path: '/api/auth/community-sso',
    summary: 'Cria token curto one-time para abrir community.synap.app ja autenticado.',
    auth: 'user',
    status: 'requires-backend',
    request: ['synapUserId', 'returnTo?', 'deviceContext?'],
    response: ['oneTimeToken', 'expiresAt', 'redirectUrl'],
  },
  {
    domain: 'auth',
    method: 'POST',
    path: '/api/community/session/exchange',
    summary: 'Troca token curto por cookie HttpOnly, Secure e SameSite=Lax.',
    auth: 'public',
    status: 'requires-backend',
    request: ['oneTimeToken'],
    response: ['profile', 'permissions', 'sessionExpiresAt'],
  },
  {
    domain: 'profiles',
    method: 'GET',
    path: '/api/community/profiles',
    summary: 'Lista perfis profissionais por busca, especialidade, area e ordenacao.',
    auth: 'public',
    status: 'frontend-ready',
    request: ['q?', 'specialty?', 'area?', 'sort?', 'page?', 'limit?'],
    response: ['items', 'total', 'specialties', 'areas'],
  },
  {
    domain: 'profiles',
    method: 'GET',
    path: '/api/community/profiles/:username',
    summary: 'Detalhe publico e indexavel de perfil profissional.',
    auth: 'public',
    status: 'frontend-ready',
    response: ['profile', 'badges', 'recentActivity', 'metrics'],
  },
  {
    domain: 'content',
    method: 'GET',
    path: '/api/community/feed',
    summary: 'Feed com filtros recent, relevant e unanswered.',
    auth: 'public',
    status: 'frontend-ready',
    request: ['category?', 'tag?', 'q?', 'sort?', 'page?', 'limit?'],
    response: ['items', 'total', 'page', 'totalPages'],
  },
  {
    domain: 'content',
    method: 'POST',
    path: '/api/community/posts',
    summary: 'Cria discussao com Markdown, categoria, tags, referencias e anexos.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['title', 'contentMarkdown', 'categoryId', 'tags', 'references[]', 'attachmentsMetadata[]'],
    response: ['postId', 'slug', 'moderationStatus'],
  },
  {
    domain: 'content',
    method: 'GET',
    path: '/api/community/posts/:slug',
    summary: 'Detalhe de discussao com respostas e JSON-LD publico.',
    auth: 'public',
    status: 'frontend-ready',
    response: ['post', 'replies', 'references', 'attachmentsMetadata'],
  },
  {
    domain: 'content',
    method: 'POST',
    path: '/api/community/posts/:postId/replies',
    summary: 'Cria resposta com Markdown e confirmacao etica.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['contentMarkdown', 'ethicsAccepted'],
    response: ['replyId', 'moderationStatus'],
  },
  {
    domain: 'content',
    method: 'PATCH',
    path: '/api/community/posts/:postId/useful-reply',
    summary: 'Marca resposta recomendada/mais util sem ranking competitivo.',
    auth: 'user',
    status: 'planned',
    request: ['replyId'],
    response: ['postId', 'usefulReplyId', 'contributionAwarded'],
  },
  {
    domain: 'resources',
    method: 'GET',
    path: '/api/community/resources',
    summary: 'Lista artigos e referencias compartilhados.',
    auth: 'public',
    status: 'frontend-ready',
    request: ['kind?', 'tag?', 'q?', 'page?', 'limit?'],
    response: ['items', 'total', 'page', 'totalPages'],
  },
  {
    domain: 'resources',
    method: 'POST',
    path: '/api/community/resources',
    summary: 'Compartilha artigo, guideline, livro ou referencia para moderacao.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['kind', 'title', 'summary', 'sourceName', 'sourceUrl?', 'doi?', 'clinicalUse'],
    response: ['resourceId', 'slug', 'moderationStatus'],
  },
  {
    domain: 'resources',
    method: 'POST',
    path: '/api/community/uploads/presign',
    summary: 'Cria URL assinada S3 para anexos anonimizados.',
    auth: 'user',
    status: 'planned',
    request: ['fileName', 'contentType', 'sizeBytes', 'purpose'],
    response: ['uploadUrl', 'storageKey', 'expiresAt'],
  },
  {
    domain: 'engagement',
    method: 'POST',
    path: '/api/community/bookmarks',
    summary: 'Salva discussao, artigo ou referencia para o usuario.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['targetType', 'targetId'],
    response: ['bookmarkId'],
  },
  {
    domain: 'engagement',
    method: 'GET',
    path: '/api/community/contributors/highlights',
    summary: 'Retorna destaques semanais, mensais e por categoria.',
    auth: 'public',
    status: 'frontend-ready',
    response: ['weekly', 'monthly', 'byCategory', 'levels'],
  },
  {
    domain: 'engagement',
    method: 'GET',
    path: '/api/community/contributions/rules',
    summary: 'Retorna regras versionadas de contribuicao, niveis, badges e salvaguardas.',
    auth: 'public',
    status: 'frontend-ready',
    response: ['version', 'updatedAt', 'rules', 'levels', 'badges', 'recognitionSurfaces', 'safeguards'],
  },
  {
    domain: 'engagement',
    method: 'GET',
    path: '/api/community/contributions/me',
    summary: 'Retorna extrato privado de contribuicao do usuario autenticado.',
    auth: 'user',
    status: 'planned',
    response: ['score', 'currentLevel', 'nextLevel', 'badges', 'recentEvents'],
  },
  {
    domain: 'moderation',
    method: 'POST',
    path: '/api/community/moderation/reports',
    summary: 'Registra denuncia de discussao, resposta ou recurso.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['targetType', 'targetId', 'reason', 'details'],
    response: ['reportId', 'status'],
  },
  {
    domain: 'moderation',
    method: 'PATCH',
    path: '/api/community/moderation/reports/:reportId',
    summary: 'Atualiza status de denuncia com trilha de auditoria.',
    auth: 'moderator',
    status: 'frontend-ready',
    request: ['status', 'resolutionNote?'],
    response: ['reportId', 'status', 'auditLogId'],
  },
  {
    domain: 'search',
    method: 'GET',
    path: '/api/community/search',
    summary: 'Busca global por discussoes, recursos, categorias, tags e perfis.',
    auth: 'public',
    status: 'frontend-ready',
    request: ['q', 'type?', 'page?', 'limit?'],
    response: ['discussions', 'resources', 'categories', 'tags', 'profiles', 'total'],
  },
  {
    domain: 'admin',
    method: 'GET',
    path: '/api/community/admin/overview',
    summary: 'Resumo operacional para administradores.',
    auth: 'admin',
    status: 'frontend-ready',
    response: ['metrics', 'queues', 'security', 'seoHealth'],
  },
  {
    domain: 'ai',
    method: 'POST',
    path: '/api/community/ai/content/classification',
    summary: 'Sugere categoria, tags e risco de privacidade com revisao humana.',
    auth: 'user',
    status: 'frontend-ready',
    request: ['title', 'contentMarkdown', 'resourceKind?', 'authorRole'],
    response: ['categorySlug', 'tags', 'privacyRiskLevel', 'reasoning'],
  },
  {
    domain: 'observability',
    method: 'GET',
    path: '/api/community/health',
    summary: 'Health check do contrato local da comunidade e dependencias planejadas.',
    auth: 'public',
    status: 'frontend-ready',
    response: ['status', 'dependencies', 'version', 'timestamp'],
  },
];

export const communityEntityContracts: CommunityEntityContract[] = [
  {
    table: 'community_users',
    purpose: 'Conta local sincronizada do ecossistema SYNAP.',
    ownership: 'auth',
    keyFields: ['id', 'synap_user_id', 'email', 'role', 'status', 'plan_snapshot'],
    indexes: ['unique(synap_user_id)', 'unique(email)', 'idx_role_status'],
    relations: ['1:1 community_profiles', '1:N community_posts', '1:N audit_logs'],
    softDelete: false,
    audit: true,
  },
  {
    table: 'community_profiles',
    purpose: 'Perfil profissional publico e indexavel.',
    ownership: 'profile',
    keyFields: ['id', 'user_id', 'username', 'display_name', 'profession', 'specialty', 'city_state'],
    indexes: ['unique(username)', 'idx_profession_specialty', 'gin(to_tsvector(display_name, bio))'],
    relations: ['N:1 community_users', 'N:M community_badges'],
    softDelete: false,
    audit: true,
  },
  {
    table: 'community_categories',
    purpose: 'Taxonomia tecnica oficial da comunidade.',
    ownership: 'content',
    keyFields: ['id', 'slug', 'name', 'description', 'group', 'sort_order', 'is_active'],
    indexes: ['unique(slug)', 'idx_group_sort_order'],
    relations: ['1:N community_posts', '1:N community_resources'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_tags',
    purpose: 'Tags tecnicas reutilizadas em discussoes e recursos.',
    ownership: 'content',
    keyFields: ['id', 'slug', 'name', 'usage_count'],
    indexes: ['unique(slug)', 'idx_usage_count'],
    relations: ['N:M community_posts', 'N:M community_resources'],
    softDelete: false,
    audit: false,
  },
  {
    table: 'community_posts',
    purpose: 'Discussoes tecnicas, casos anonimizados e perguntas clinicas.',
    ownership: 'content',
    keyFields: ['id', 'slug', 'author_id', 'category_id', 'title', 'content_markdown', 'moderation_status'],
    indexes: ['unique(slug)', 'idx_category_activity', 'gin(to_tsvector(title, content_markdown))'],
    relations: ['N:1 users', 'N:1 categories', '1:N replies', '1:N reports', '1:N attachments'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_replies',
    purpose: 'Respostas tecnicas e complementos em discussoes.',
    ownership: 'content',
    keyFields: ['id', 'post_id', 'author_id', 'content_markdown', 'is_useful', 'score'],
    indexes: ['idx_post_created_at', 'idx_author_created_at', 'idx_is_useful'],
    relations: ['N:1 posts', 'N:1 users', '1:N reports'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_resources',
    purpose: 'Artigos, referencias bibliograficas, guidelines e livros.',
    ownership: 'content',
    keyFields: ['id', 'kind', 'slug', 'title', 'source_name', 'source_url', 'doi', 'clinical_use'],
    indexes: ['unique(slug)', 'idx_kind_shared_at', 'idx_doi', 'gin(to_tsvector(title, summary, clinical_use))'],
    relations: ['N:1 users', 'N:1 categories', 'N:M tags'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_attachments',
    purpose: 'Metadados de anexos anonimizados armazenados em S3.',
    ownership: 'content',
    keyFields: ['id', 'owner_type', 'owner_id', 'storage_key', 'content_type', 'size_bytes', 'privacy_status'],
    indexes: ['idx_owner', 'idx_storage_key', 'idx_privacy_status'],
    relations: ['N:1 posts or resources'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_moderation_reports',
    purpose: 'Denuncias e revisao de conteudo.',
    ownership: 'moderation',
    keyFields: ['id', 'target_type', 'target_id', 'reporter_id', 'reason', 'status', 'resolution_note'],
    indexes: ['idx_status_created_at', 'idx_target', 'idx_reason'],
    relations: ['N:1 users', 'N:1 target content', '1:N audit_logs'],
    softDelete: false,
    audit: true,
  },
  {
    table: 'community_notifications',
    purpose: 'Notificacoes de respostas, mencoes, moderacao e recursos.',
    ownership: 'engagement',
    keyFields: ['id', 'user_id', 'type', 'title', 'href', 'read_at', 'created_at'],
    indexes: ['idx_user_read_created', 'idx_type_created_at'],
    relations: ['N:1 users'],
    softDelete: true,
    audit: false,
  },
  {
    table: 'community_contributions',
    purpose: 'Pontuacao saudavel por contribuicao tecnica.',
    ownership: 'engagement',
    keyFields: ['id', 'user_id', 'event_type', 'points', 'source_type', 'source_id'],
    indexes: ['idx_user_created_at', 'idx_event_type', 'idx_source'],
    relations: ['N:1 users', 'N:1 source content'],
    softDelete: false,
    audit: true,
  },
  {
    table: 'community_badges',
    purpose: 'Badges editoriais e tecnicos nao competitivos.',
    ownership: 'engagement',
    keyFields: ['id', 'slug', 'label', 'description', 'category_slug'],
    indexes: ['unique(slug)', 'idx_category_slug'],
    relations: ['N:M profiles'],
    softDelete: true,
    audit: true,
  },
  {
    table: 'community_audit_logs',
    purpose: 'Trilha de auditoria para seguranca, moderacao, admin, SSO e IA.',
    ownership: 'system',
    keyFields: ['id', 'actor_user_id', 'event', 'target_type', 'target_id', 'metadata_json', 'created_at'],
    indexes: ['idx_event_created_at', 'idx_actor_created_at', 'idx_target'],
    relations: ['N:1 users'],
    softDelete: false,
    audit: false,
  },
];

export function getCommunityMethodTone(
  method: CommunityApiMethod,
): 'primary' | 'secondary' | 'accent' | 'neutral' {
  if (method === 'GET') return 'primary';
  if (method === 'POST') return 'secondary';
  if (method === 'PATCH') return 'accent';
  return 'neutral';
}

export function getCommunityContractStatusLabel(
  status: CommunityApiContract['status'],
): string {
  if (status === 'frontend-ready') return 'Frontend pronto';
  if (status === 'requires-backend') return 'Aguardando backend';
  return 'Planejado';
}
