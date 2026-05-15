export const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';

export const CLINICAL_REGION_KEYS = [
  'CERVICAL',
  'TORACICA',
  'LOMBAR',
  'SACROILIACA',
  'QUADRIL',
  'JOELHO',
  'TORNOZELO_PE',
  'OMBRO',
  'COTOVELO',
  'PUNHO_MAO',
] as const;

export type ClinicalRegionKey = (typeof CLINICAL_REGION_KEYS)[number];

export type CharlesClinicalContext = {
  regioesPrioritarias: string[];
  regioesRelacionadas: string[];
  cadeiaProvavel: string | null;
};

type ClinicalContextSource = {
  areasAfetadas?: Array<{
    regiao?: string | null;
  }> | null;
};

const REGION_INFERENCE_RULES: Array<{
  regex: RegExp;
  region: ClinicalRegionKey;
}> = [
  { regex: /(cerv|pescoc|cabec)/, region: 'CERVICAL' },
  { regex: /(torac|torax)/, region: 'TORACICA' },
  { regex: /(lomb|abdomen)/, region: 'LOMBAR' },
  { regex: /(sacro|iliac|pelve)/, region: 'SACROILIACA' },
  { regex: /(quadril|glute|coxa)/, region: 'QUADRIL' },
  { regex: /(joelho|poplit)/, region: 'JOELHO' },
  { regex: /(tornoz|pe\b)/, region: 'TORNOZELO_PE' },
  { regex: /(cotovelo|antebraco)/, region: 'COTOVELO' },
  { regex: /(ombro|braco)/, region: 'OMBRO' },
  { regex: /(punho|mao)/, region: 'PUNHO_MAO' },
];

const CHAIN_REGION_MAP: Record<ClinicalRegionKey, ClinicalRegionKey[]> = {
  CERVICAL: ['CERVICAL', 'TORACICA', 'OMBRO', 'COTOVELO', 'PUNHO_MAO'],
  TORACICA: ['TORACICA', 'CERVICAL', 'OMBRO', 'LOMBAR'],
  LOMBAR: ['LOMBAR', 'SACROILIACA', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
  SACROILIACA: ['SACROILIACA', 'LOMBAR', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
  QUADRIL: ['QUADRIL', 'SACROILIACA', 'LOMBAR', 'JOELHO', 'TORNOZELO_PE'],
  JOELHO: ['JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR', 'TORNOZELO_PE'],
  TORNOZELO_PE: ['TORNOZELO_PE', 'JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR'],
  OMBRO: ['OMBRO', 'CERVICAL', 'TORACICA', 'COTOVELO', 'PUNHO_MAO'],
  COTOVELO: ['COTOVELO', 'OMBRO', 'PUNHO_MAO', 'CERVICAL'],
  PUNHO_MAO: ['PUNHO_MAO', 'COTOVELO', 'OMBRO', 'CERVICAL'],
};

export function hasStructuredExame(raw?: string | null): boolean {
  const value = String(raw || '').trim();
  if (!value) return false;
  return value.startsWith(STRUCTURED_EXAME_PREFIX) || value.length > 20;
}

export function hasCriticalRedFlag(redFlags?: unknown): boolean {
  if (!Array.isArray(redFlags) || redFlags.length === 0) return false;

  const ignored = new Set([
    'SEM_RED_FLAG_CRITICA',
    'NO_RED_FLAG',
    'NONE',
    'NENHUMA',
    'NAO',
    'NAO_INFORMADO',
  ]);

  return redFlags.some((item) => {
    const normalized = normalizeClinicalToken(item).replace(/\s+/g, '_');
    return !!normalized && !ignored.has(normalized);
  });
}

export function buildCharlesClinicalContext(
  anamnese?: ClinicalContextSource | null,
): CharlesClinicalContext {
  const regioesSet = new Set<ClinicalRegionKey>();
  for (const area of anamnese?.areasAfetadas || []) {
    const normalized = normalizeClinicalRegion(area.regiao || '');
    if (normalized) regioesSet.add(normalized);
  }

  const regioes = Array.from(regioesSet);
  const regiaoKey = regioes.join(' ').toLowerCase();
  let cadeiaProvavel: string | null = null;
  if (
    /(lombar|sacro|sacroiliaca|quadril|gluteo|joelho|tornozelo_pe)/.test(
      regiaoKey,
    )
  ) {
    cadeiaProvavel = 'CADEIA_LOWER';
  } else if (/(cervical|ombro|cotovelo|punho_mao|toracica)/.test(regiaoKey)) {
    cadeiaProvavel = 'CADEIA_UPPER';
  } else if (regioes.length > 0) {
    cadeiaProvavel = 'CADEIA_LOCAL';
  }

  const relacionadas = new Set<ClinicalRegionKey>();
  for (const regiao of regioes) {
    for (const related of CHAIN_REGION_MAP[regiao] || [regiao]) {
      relacionadas.add(related);
    }
  }

  return {
    regioesPrioritarias: regioes,
    regioesRelacionadas: Array.from(relacionadas),
    cadeiaProvavel,
  };
}

export function normalizeClinicalRegion(
  rawRegion: string | null | undefined,
): ClinicalRegionKey | null {
  const normalized = normalizeClinicalToken(rawRegion);

  if (!normalized) return null;
  if ((CLINICAL_REGION_KEYS as readonly string[]).includes(normalized)) {
    return normalized as ClinicalRegionKey;
  }
  if (
    normalized === 'SACRO' ||
    normalized === 'ILIACO' ||
    normalized === 'PELVIS'
  ) {
    return 'SACROILIACA';
  }
  if (normalized === 'PUNHO' || normalized === 'MAO') {
    return 'PUNHO_MAO';
  }
  if (normalized === 'TORNOZELO' || normalized === 'PE') {
    return 'TORNOZELO_PE';
  }

  const lower = normalized.toLowerCase();
  for (const rule of REGION_INFERENCE_RULES) {
    if (rule.regex.test(lower)) return rule.region;
  }
  return null;
}

function normalizeClinicalToken(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}
