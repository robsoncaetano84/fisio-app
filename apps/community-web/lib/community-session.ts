export type CommunitySessionStatus =
  | 'anonymous'
  | 'sso-token-received'
  | 'authenticated'
  | 'expired';

export type CommunitySsoTokenRecord = {
  tokenPreview: string;
  receivedAt: string;
  expiresAt: string;
  source: 'synap-app' | 'web' | 'unknown';
  returnTo: string;
  status: CommunitySessionStatus;
  userName?: string;
  userRole?: string;
};

export type CommunitySessionExchangeResponse = {
  profile: {
    id: string;
    nome: string;
    email: string;
    role: string;
    especialidade?: string | null;
  };
  permissions: {
    canPost: boolean;
    canModerate: boolean;
    canAdmin: boolean;
  };
  returnTo: string | null;
  session: {
    cookieName: string;
    httpOnly: boolean;
  };
};

export type CommunitySessionSyncField = {
  field: string;
  source: string;
  destination: string;
  required: boolean;
};

export type CommunitySessionContract = {
  step: string;
  responsibility: 'SYNAP app' | 'SYNAP backend' | 'Community web';
  description: string;
};

export const SSO_TOKEN_STORAGE_KEY = 'synap-community:sso-token';
export const SSO_RECORD_STORAGE_KEY = 'synap-community:sso-record';
export const SSO_RECEIVED_AT_STORAGE_KEY = 'synap-community:sso-received-at';

const communityApiUrl = (
  process.env.NEXT_PUBLIC_COMMUNITY_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

export const communitySessionSyncFields: CommunitySessionSyncField[] = [
  {
    field: 'name',
    source: 'SYNAP user profile',
    destination: 'community_profiles.display_name',
    required: true,
  },
  {
    field: 'email',
    source: 'SYNAP account',
    destination: 'community_users.email',
    required: true,
  },
  {
    field: 'avatar',
    source: 'SYNAP user profile',
    destination: 'community_profiles.avatar_url',
    required: false,
  },
  {
    field: 'profession',
    source: 'SYNAP professional profile',
    destination: 'community_profiles.profession',
    required: false,
  },
  {
    field: 'specialty',
    source: 'SYNAP professional profile',
    destination: 'community_profiles.specialty',
    required: false,
  },
  {
    field: 'plan',
    source: 'SYNAP subscription',
    destination: 'community_users.plan_snapshot',
    required: false,
  },
  {
    field: 'accountStatus',
    source: 'SYNAP auth',
    destination: 'community_users.status',
    required: true,
  },
];

export const communitySessionContracts: CommunitySessionContract[] = [
  {
    step: 'Criar token curto',
    responsibility: 'SYNAP backend',
    description:
      'Gerar token one-time com TTL de 60 segundos, amarrado ao usuario autenticado e ao destino community.synap.app.',
  },
  {
    step: 'Abrir comunidade',
    responsibility: 'SYNAP app',
    description:
      'Abrir /sso/callback com token curto e returnTo opcional em navegador ou WebView.',
  },
  {
    step: 'Receber token',
    responsibility: 'Community web',
    description:
      'Guardar metadados temporarios no cliente apenas ate a troca segura existir.',
  },
  {
    step: 'Trocar por sessao',
    responsibility: 'Community web',
    description:
      'Enviar token ao backend e receber cookie HttpOnly, Secure e SameSite=Lax.',
  },
  {
    step: 'Sincronizar perfil',
    responsibility: 'SYNAP backend',
    description:
      'Atualizar dados profissionais essenciais sem duplicar autenticacao.',
  },
];

export function createSsoTokenRecord(params: {
  token: string;
  returnTo?: string | null;
  source?: string | null;
}): CommunitySsoTokenRecord {
  const receivedAt = new Date();
  const expiresAt = new Date(receivedAt.getTime() + 60 * 1000);
  const source =
    params.source === 'synap-app' || params.source === 'web'
      ? params.source
      : 'unknown';

  return {
    tokenPreview: maskToken(params.token),
    receivedAt: receivedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source,
    returnTo: sanitizeReturnTo(params.returnTo),
    status: 'sso-token-received',
  };
}

export async function exchangeSsoToken(
  oneTimeToken: string,
): Promise<CommunitySessionExchangeResponse> {
  const response = await fetch(
    `${communityApiUrl}/community/session/exchange`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oneTimeToken }),
    },
  );

  if (!response.ok) {
    throw new Error(`Falha ao trocar token SSO (${response.status})`);
  }

  return response.json() as Promise<CommunitySessionExchangeResponse>;
}

export function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 12) return `${token.slice(0, 3)}...`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function sanitizeReturnTo(value?: string | null): string {
  if (!value || !value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}
