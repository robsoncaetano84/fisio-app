export type ProfessionalCouncilFields = {
  conselhoSigla?: string | null;
  conselhoUf?: string | null;
  conselhoProf?: string | null;
};

type CouncilRegionOption = {
  value: string;
  ufs: readonly string[];
};

const BRAZILIAN_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const region = (
  value: string,
  ufs: readonly string[],
): CouncilRegionOption => ({ value, ufs });

const COUNCIL_REGION_OPTIONS: Record<string, readonly CouncilRegionOption[]> = {
  CREFITO: [
    region('1', ['PE', 'PB', 'AL', 'RN']),
    region('2', ['RJ']),
    region('3', ['SP']),
    region('4', ['MG']),
    region('5', ['RS']),
    region('6', ['CE']),
    region('7', ['BA']),
    region('8', ['PR']),
    region('9', ['MT']),
    region('10', ['SC']),
    region('11', ['DF']),
    region('12', ['PA', 'TO', 'AP']),
    region('13', ['MS']),
    region('14', ['PI']),
    region('15', ['ES']),
    region('16', ['MA']),
    region('17', ['SE']),
    region('18', ['RO', 'AC']),
    region('19', ['GO']),
    region('20', ['AM', 'RR']),
  ],
  CREFONO: [
    region('1', ['RJ']),
    region('2', ['SP']),
    region('3', ['PR', 'SC']),
    region('4', ['AL', 'BA', 'PB', 'PE', 'SE']),
    region('5', ['DF', 'GO', 'MS', 'MT', 'TO']),
    region('6', ['ES', 'MG']),
    region('7', ['RS']),
    region('8', ['CE', 'MA', 'PI', 'RN']),
    region('9', ['AC', 'AM', 'AP', 'PA', 'RO', 'RR']),
  ],
  CREF: [
    region('1/RJ', ['RJ']),
    region('2/RS', ['RS']),
    region('3/SC', ['SC']),
    region('4/SP', ['SP']),
    region('5/CE', ['CE']),
    region('6/MG', ['MG']),
    region('7/DF', ['DF']),
    region('8/AM-AC-RO-RR', ['AM', 'AC', 'RO', 'RR']),
    region('9/PR', ['PR']),
    region('10/PB', ['PB']),
    region('11/MS', ['MS']),
    region('12/PE', ['PE']),
    region('13/BA', ['BA']),
    region('14/GO-TO', ['GO', 'TO']),
    region('15/PI', ['PI']),
    region('16/RN', ['RN']),
    region('17/MT', ['MT']),
    region('18/PA-AP', ['PA', 'AP']),
    region('19/AL', ['AL']),
    region('20/SE', ['SE']),
    region('21/MA', ['MA']),
    region('22/ES', ['ES']),
  ],
  CRP: [
    region('01', ['DF']),
    region('02', ['PE']),
    region('03', ['BA']),
    region('04', ['MG']),
    region('05', ['RJ']),
    region('06', ['SP']),
    region('07', ['RS']),
    region('08', ['PR']),
    region('09', ['GO']),
    region('10', ['PA', 'AP']),
    region('11', ['CE']),
    region('12', ['SC']),
    region('13', ['PB']),
    region('14', ['MS']),
    region('15', ['AL']),
    region('16', ['ES']),
    region('17', ['RN']),
    region('18', ['MT']),
    region('19', ['SE']),
    region('20', ['AM', 'RR']),
    region('21', ['PI']),
    region('22', ['MA']),
    region('23', ['TO']),
    region('24', ['AC', 'RO']),
  ],
  CRN: [
    region('1', ['DF', 'GO', 'MT', 'TO']),
    region('2', ['RS']),
    region('3', ['SP', 'MS']),
    region('4', ['ES', 'RJ']),
    region('5', ['BA', 'SE']),
    region('6', ['AL', 'PB', 'PE', 'RN']),
    region('7', ['AC', 'AM', 'AP', 'PA', 'RO', 'RR']),
    region('8', ['PR']),
    region('9', ['MG']),
    region('10', ['SC']),
    region('11', ['CE', 'MA', 'PI']),
  ],
};

export function isCrefitoCouncil(conselhoSigla?: string | null): boolean {
  return normalizeCouncilText(conselhoSigla) === 'CREFITO';
}

export function usesRegionalCouncil(conselhoSigla?: string | null): boolean {
  return !!COUNCIL_REGION_OPTIONS[normalizeCouncilText(conselhoSigla)];
}

export function normalizeProfessionalCouncilFields(
  fields: ProfessionalCouncilFields,
): { conselhoSigla: string; conselhoUf: string; conselhoProf: string } {
  const conselhoSigla = normalizeCouncilText(fields.conselhoSigla);
  const rawRegionOrUf = fields.conselhoUf || fields.conselhoProf || '';
  const conselhoUf = usesRegionalCouncil(conselhoSigla)
    ? normalizeRegionalCouncilValue(conselhoSigla, rawRegionOrUf)
    : normalizeUfValue(conselhoSigla, rawRegionOrUf);
  const conselhoProf = formatProfessionalCouncil(conselhoSigla, conselhoUf);

  return {
    conselhoSigla,
    conselhoUf,
    conselhoProf,
  };
}

export function normalizeCrefitoRegion(value?: string | null): string {
  return normalizeRegionalCouncilValue('CREFITO', value);
}

function formatProfessionalCouncil(conselhoSigla: string, conselhoUf: string) {
  if (!conselhoSigla || !conselhoUf) return '';
  return conselhoSigla === 'CREF'
    ? `${conselhoSigla}${conselhoUf}`
    : `${conselhoSigla}-${conselhoUf}`;
}

function normalizeRegionalCouncilValue(
  conselhoSigla: string,
  value?: string | null,
): string {
  const normalizedCouncil = normalizeCouncilText(conselhoSigla);
  const options = COUNCIL_REGION_OPTIONS[normalizedCouncil];
  if (!options) return '';

  const raw = stripCouncilPrefix(
    normalizedCouncil,
    normalizeRegionInput(value),
  );
  if (!raw) return '';

  const direct = options.find(
    (item) => normalizeRegionInput(item.value) === raw,
  );
  if (direct) return direct.value;

  const regionNumber = raw.match(/^0*(\d{1,2})(?:\/[A-Z-]+)?$/)?.[1];
  if (regionNumber) {
    const byNumber = options.find(
      (item) =>
        Number(item.value.match(/^\d{1,2}/)?.[0]) === Number(regionNumber),
    );
    if (byNumber) return byNumber.value;
  }

  const legacyUf = raw.match(/^[A-Z]{2}$/)?.[0];
  if (legacyUf) {
    return options.find((item) => item.ufs.includes(legacyUf))?.value || '';
  }

  return '';
}

function normalizeUfValue(
  conselhoSigla: string,
  value?: string | null,
): string {
  const raw = stripCouncilPrefix(conselhoSigla, normalizeRegionInput(value));
  return BRAZILIAN_UFS.includes(raw as (typeof BRAZILIAN_UFS)[number])
    ? raw
    : '';
}

function normalizeCouncilText(value?: string | null): string {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeRegionInput(value?: string | null): string {
  return normalizeCouncilText(value).replace(/\s+/g, '');
}

function stripCouncilPrefix(conselhoSigla: string, value: string): string {
  if (!conselhoSigla || !value) return value;
  return value
    .replace(new RegExp(`^${conselhoSigla}[-/]?`), '')
    .replace(/^CRFA[-/]?/, '');
}
