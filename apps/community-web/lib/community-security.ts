export type CommunitySecurityTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral';

export type CommunitySecurityControl = {
  title: string;
  description: string;
  status: 'active' | 'planned' | 'contract-ready';
  owner: 'Frontend' | 'Backend' | 'Infra';
  tone: CommunitySecurityTone;
};

export type CommunityRateLimitPolicy = {
  scope: string;
  window: string;
  limit: string;
  action: string;
};

export type CommunityCsrfPolicy = {
  surface: string;
  strategy: string;
  notes: string;
};

export type CommunityRbacPolicy = {
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  allowed: string[];
  denied: string[];
};

export type CommunitySecurityHeader = {
  header: string;
  value: string;
  purpose: string;
};

export const communitySecurityControls: CommunitySecurityControl[] = [
  {
    title: 'Headers defensivos',
    description:
      'Headers globais para reduzir risco de MIME sniffing, clickjacking, vazamento de referer e permissoes indevidas.',
    status: 'active',
    owner: 'Frontend',
    tone: 'primary',
  },
  {
    title: 'Markdown seguro',
    description:
      'Preview de Markdown renderiza texto escapado e nao executa HTML inserido por usuarios.',
    status: 'active',
    owner: 'Frontend',
    tone: 'primary',
  },
  {
    title: 'Areas operacionais noindex',
    description:
      'Admin, moderacao, criacao, salvos, notificacoes, status e seguranca ficam fora do indice publico.',
    status: 'active',
    owner: 'Frontend',
    tone: 'secondary',
  },
  {
    title: 'RBAC',
    description:
      'Contratos para USER, MODERATOR e ADMIN. A aplicacao real depende do backend e de sessao segura.',
    status: 'contract-ready',
    owner: 'Backend',
    tone: 'secondary',
  },
  {
    title: 'CSRF',
    description:
      'Mutacoes autenticadas devem usar cookie HttpOnly com protecao SameSite e token CSRF quando necessario.',
    status: 'planned',
    owner: 'Backend',
    tone: 'neutral',
  },
  {
    title: 'Rate limit e anti-spam',
    description:
      'Publicacao, respostas, denuncias, SSO e IA devem ter throttling por usuario, IP e contexto.',
    status: 'planned',
    owner: 'Backend',
    tone: 'neutral',
  },
  {
    title: 'Upload seguro',
    description:
      'Anexos devem usar URL assinada, validacao de MIME, limite de tamanho e revisao de moderacao.',
    status: 'planned',
    owner: 'Infra',
    tone: 'accent',
  },
];

export const communitySecurityHeaders: CommunitySecurityHeader[] = [
  {
    header: 'X-Content-Type-Options',
    value: 'nosniff',
    purpose: 'Evita interpretacao indevida de tipos de arquivo.',
  },
  {
    header: 'X-Frame-Options',
    value: 'DENY',
    purpose: 'Reduz risco de clickjacking fora do WebView nativo.',
  },
  {
    header: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    purpose: 'Limita vazamento de URLs internas para origens externas.',
  },
  {
    header: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    purpose: 'Bloqueia APIs de navegador nao usadas pela comunidade.',
  },
  {
    header: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    purpose: 'Isola contexto de navegacao contra interacoes cross-origin.',
  },
  {
    header: 'Content-Security-Policy-Report-Only',
    value: 'default-src self; object-src none; frame-ancestors none',
    purpose:
      'Prepara endurecimento de CSP sem bloquear scripts do Next nesta etapa.',
  },
];

export const communityRateLimitPolicies: CommunityRateLimitPolicy[] = [
  {
    scope: 'Criar discussao',
    window: '10 minutos',
    limit: '5 tentativas por usuario',
    action: 'Bloquear temporariamente e auditar quando exceder.',
  },
  {
    scope: 'Responder discussao',
    window: '5 minutos',
    limit: '10 respostas por usuario',
    action: 'Aplicar cooldown e elevar suspeita se houver repeticao.',
  },
  {
    scope: 'Denunciar conteudo',
    window: '15 minutos',
    limit: '8 denuncias por usuario',
    action: 'Bloquear abuso de denuncias e manter auditoria.',
  },
  {
    scope: 'SSO',
    window: '1 minuto',
    limit: '6 trocas por usuario/IP',
    action: 'Invalidar tokens excedentes e registrar tentativa suspeita.',
  },
  {
    scope: 'IA futura',
    window: '1 hora',
    limit: 'Uso por plano e papel',
    action: 'Controlar custo, abuso e revisao obrigatoria.',
  },
];

export const communityCsrfPolicies: CommunityCsrfPolicy[] = [
  {
    surface: 'Rotas publicas SSR',
    strategy: 'Somente leitura; sem token CSRF.',
    notes: 'Nao fazem mutacao de estado autenticado.',
  },
  {
    surface: 'Mutacoes autenticadas',
    strategy: 'Cookie HttpOnly + SameSite=Lax + token CSRF por requisicao.',
    notes: 'Aplicar em posts, respostas, recursos, bookmarks e notificacoes.',
  },
  {
    surface: 'Admin e moderacao',
    strategy: 'CSRF obrigatorio + RBAC + auditoria.',
    notes: 'Toda acao sensivel deve gravar ator, alvo, IP e requestId.',
  },
  {
    surface: 'SSO',
    strategy: 'Token one-time curto + validacao de origem + expiracao.',
    notes: 'Nao persistir token de troca no cliente apos sessao criada.',
  },
];

export const communityRbacPolicies: CommunityRbacPolicy[] = [
  {
    role: 'USER',
    allowed: [
      'Criar discussoes',
      'Responder',
      'Salvar conteudos',
      'Denunciar conteudo',
    ],
    denied: ['Resolver denuncias', 'Gerenciar categorias', 'Alterar papeis'],
  },
  {
    role: 'MODERATOR',
    allowed: [
      'Revisar denuncias',
      'Ocultar conteudo',
      'Restaurar conteudo',
      'Marcar recurso como revisado',
    ],
    denied: ['Alterar papeis', 'Configurar integracoes', 'Gerenciar billing'],
  },
  {
    role: 'ADMIN',
    allowed: [
      'Gerenciar categorias',
      'Consultar auditoria',
      'Configurar integracoes',
      'Alterar papeis administrativos',
    ],
    denied: ['Alterar conteudo clinico sem trilha de auditoria'],
  },
];

export function getCommunitySecurityStatusLabel(
  status: CommunitySecurityControl['status'],
): string {
  if (status === 'active') return 'Ativo';
  if (status === 'contract-ready') return 'Contrato preparado';
  return 'Planejado';
}
