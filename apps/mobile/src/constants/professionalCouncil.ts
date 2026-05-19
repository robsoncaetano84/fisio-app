export const PROFESSIONAL_COUNCILS = [
  "CREFITO",
  "CRM",
  "COREN",
  "CREFONO",
  "CREF",
  "CRP",
  "CRN",
  "CRO",
  "OUTRO",
] as const;

type ProfessionalCouncil = (typeof PROFESSIONAL_COUNCILS)[number];

type CouncilRegionOption = {
  value: string;
  label: string;
  ufs: readonly string[];
};

export const BRAZILIAN_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const createRegionOption = (
  council: string,
  value: string,
  ufs: readonly string[],
): CouncilRegionOption => ({
  value,
  label:
    council === "CREF"
      ? `${council}${value}`
      : `${council}-${value} (${ufs.join(", ")})`,
  ufs,
});

const COUNCIL_REGION_OPTIONS: Partial<
  Record<ProfessionalCouncil, readonly CouncilRegionOption[]>
> = {
  CREFITO: [
    createRegionOption("CREFITO", "1", ["PE", "PB", "AL", "RN"]),
    createRegionOption("CREFITO", "2", ["RJ"]),
    createRegionOption("CREFITO", "3", ["SP"]),
    createRegionOption("CREFITO", "4", ["MG"]),
    createRegionOption("CREFITO", "5", ["RS"]),
    createRegionOption("CREFITO", "6", ["CE"]),
    createRegionOption("CREFITO", "7", ["BA"]),
    createRegionOption("CREFITO", "8", ["PR"]),
    createRegionOption("CREFITO", "9", ["MT"]),
    createRegionOption("CREFITO", "10", ["SC"]),
    createRegionOption("CREFITO", "11", ["DF"]),
    createRegionOption("CREFITO", "12", ["PA", "TO", "AP"]),
    createRegionOption("CREFITO", "13", ["MS"]),
    createRegionOption("CREFITO", "14", ["PI"]),
    createRegionOption("CREFITO", "15", ["ES"]),
    createRegionOption("CREFITO", "16", ["MA"]),
    createRegionOption("CREFITO", "17", ["SE"]),
    createRegionOption("CREFITO", "18", ["RO", "AC"]),
    createRegionOption("CREFITO", "19", ["GO"]),
    createRegionOption("CREFITO", "20", ["AM", "RR"]),
  ],
  CREFONO: [
    createRegionOption("CREFONO", "1", ["RJ"]),
    createRegionOption("CREFONO", "2", ["SP"]),
    createRegionOption("CREFONO", "3", ["PR", "SC"]),
    createRegionOption("CREFONO", "4", ["AL", "BA", "PB", "PE", "SE"]),
    createRegionOption("CREFONO", "5", ["DF", "GO", "MS", "MT", "TO"]),
    createRegionOption("CREFONO", "6", ["ES", "MG"]),
    createRegionOption("CREFONO", "7", ["RS"]),
    createRegionOption("CREFONO", "8", ["CE", "MA", "PI", "RN"]),
    createRegionOption("CREFONO", "9", ["AC", "AM", "AP", "PA", "RO", "RR"]),
  ],
  CREF: [
    createRegionOption("CREF", "1/RJ", ["RJ"]),
    createRegionOption("CREF", "2/RS", ["RS"]),
    createRegionOption("CREF", "3/SC", ["SC"]),
    createRegionOption("CREF", "4/SP", ["SP"]),
    createRegionOption("CREF", "5/CE", ["CE"]),
    createRegionOption("CREF", "6/MG", ["MG"]),
    createRegionOption("CREF", "7/DF", ["DF"]),
    createRegionOption("CREF", "8/AM-AC-RO-RR", ["AM", "AC", "RO", "RR"]),
    createRegionOption("CREF", "9/PR", ["PR"]),
    createRegionOption("CREF", "10/PB", ["PB"]),
    createRegionOption("CREF", "11/MS", ["MS"]),
    createRegionOption("CREF", "12/PE", ["PE"]),
    createRegionOption("CREF", "13/BA", ["BA"]),
    createRegionOption("CREF", "14/GO-TO", ["GO", "TO"]),
    createRegionOption("CREF", "15/PI", ["PI"]),
    createRegionOption("CREF", "16/RN", ["RN"]),
    createRegionOption("CREF", "17/MT", ["MT"]),
    createRegionOption("CREF", "18/PA-AP", ["PA", "AP"]),
    createRegionOption("CREF", "19/AL", ["AL"]),
    createRegionOption("CREF", "20/SE", ["SE"]),
    createRegionOption("CREF", "21/MA", ["MA"]),
    createRegionOption("CREF", "22/ES", ["ES"]),
  ],
  CRP: [
    createRegionOption("CRP", "01", ["DF"]),
    createRegionOption("CRP", "02", ["PE"]),
    createRegionOption("CRP", "03", ["BA"]),
    createRegionOption("CRP", "04", ["MG"]),
    createRegionOption("CRP", "05", ["RJ"]),
    createRegionOption("CRP", "06", ["SP"]),
    createRegionOption("CRP", "07", ["RS"]),
    createRegionOption("CRP", "08", ["PR"]),
    createRegionOption("CRP", "09", ["GO"]),
    createRegionOption("CRP", "10", ["PA", "AP"]),
    createRegionOption("CRP", "11", ["CE"]),
    createRegionOption("CRP", "12", ["SC"]),
    createRegionOption("CRP", "13", ["PB"]),
    createRegionOption("CRP", "14", ["MS"]),
    createRegionOption("CRP", "15", ["AL"]),
    createRegionOption("CRP", "16", ["ES"]),
    createRegionOption("CRP", "17", ["RN"]),
    createRegionOption("CRP", "18", ["MT"]),
    createRegionOption("CRP", "19", ["SE"]),
    createRegionOption("CRP", "20", ["AM", "RR"]),
    createRegionOption("CRP", "21", ["PI"]),
    createRegionOption("CRP", "22", ["MA"]),
    createRegionOption("CRP", "23", ["TO"]),
    createRegionOption("CRP", "24", ["AC", "RO"]),
  ],
  CRN: [
    createRegionOption("CRN", "1", ["DF", "GO", "MT", "TO"]),
    createRegionOption("CRN", "2", ["RS"]),
    createRegionOption("CRN", "3", ["SP", "MS"]),
    createRegionOption("CRN", "4", ["ES", "RJ"]),
    createRegionOption("CRN", "5", ["BA", "SE"]),
    createRegionOption("CRN", "6", ["AL", "PB", "PE", "RN"]),
    createRegionOption("CRN", "7", ["AC", "AM", "AP", "PA", "RO", "RR"]),
    createRegionOption("CRN", "8", ["PR"]),
    createRegionOption("CRN", "9", ["MG"]),
    createRegionOption("CRN", "10", ["SC"]),
    createRegionOption("CRN", "11", ["CE", "MA", "PI"]),
  ],
};

const STATE_COUNCILS = new Set(["CRM", "COREN", "CRO", "OUTRO"]);

export const isCrefitoCouncil = (council?: string | null) =>
  normalizeCouncilText(council) === "CREFITO";

export const usesRegionalCouncil = (council?: string | null) =>
  !!COUNCIL_REGION_OPTIONS[
    normalizeCouncilText(council) as ProfessionalCouncil
  ];

export const usesUfCouncil = (council?: string | null) =>
  STATE_COUNCILS.has(normalizeCouncilText(council));

export const normalizeCrefitoRegion = (value?: string | null) => {
  return normalizeRegionalCouncilValue("CREFITO", value);
};

export const resolveCouncilRegionOrUf = (
  council?: string | null,
  value?: string | null,
) => {
  const normalizedCouncil = normalizeCouncilText(council);
  if (usesRegionalCouncil(normalizedCouncil)) {
    return normalizeRegionalCouncilValue(normalizedCouncil, value);
  }
  return normalizeUfValue(normalizedCouncil, value);
};

export const getCouncilRegionOptions = (council?: string | null) =>
  COUNCIL_REGION_OPTIONS[
    normalizeCouncilText(council) as ProfessionalCouncil
  ]?.map((item) => item.value) || [...BRAZILIAN_UFS];

export const getCouncilRegionOptionLabel = (
  council: string | null | undefined,
  value: string,
) => {
  const normalizedCouncil = normalizeCouncilText(council);
  const options =
    COUNCIL_REGION_OPTIONS[normalizedCouncil as ProfessionalCouncil];
  if (!options) return value;
  const normalizedValue = normalizeRegionalCouncilValue(
    normalizedCouncil,
    value,
  );
  return (
    options.find((item) => item.value === normalizedValue)?.label ||
    normalizedValue ||
    value
  );
};

export const formatProfessionalCouncil = (
  council?: string | null,
  regionOrUf?: string | null,
) => {
  const normalizedCouncil = normalizeCouncilText(council);
  if (!normalizedCouncil) return "";
  const normalizedRegionOrUf = resolveCouncilRegionOrUf(
    normalizedCouncil,
    regionOrUf,
  );
  if (!normalizedRegionOrUf) return normalizedCouncil;
  return normalizedCouncil === "CREF"
    ? `${normalizedCouncil}${normalizedRegionOrUf}`
    : `${normalizedCouncil}-${normalizedRegionOrUf}`;
};

const normalizeCouncilText = (value?: string | null) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeRegionInput = (value?: string | null) =>
  normalizeCouncilText(value).replace(/\s+/g, "");

const normalizeRegionalCouncilValue = (
  council: string,
  value?: string | null,
) => {
  const normalizedCouncil = normalizeCouncilText(council);
  const options =
    COUNCIL_REGION_OPTIONS[normalizedCouncil as ProfessionalCouncil];
  if (!options) return "";

  const raw = stripCouncilPrefix(
    normalizedCouncil,
    normalizeRegionInput(value),
  );
  if (!raw) return "";

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
    return options.find((item) => item.ufs.includes(legacyUf))?.value || "";
  }

  return "";
};

const normalizeUfValue = (council: string, value?: string | null) => {
  const raw = stripCouncilPrefix(council, normalizeRegionInput(value));
  return BRAZILIAN_UFS.includes(raw as (typeof BRAZILIAN_UFS)[number])
    ? raw
    : "";
};

const stripCouncilPrefix = (council: string, value: string) => {
  if (!council || !value) return value;
  return value
    .replace(new RegExp(`^${council}[-/]?`), "")
    .replace(/^CRFA[-/]?/, "");
};
