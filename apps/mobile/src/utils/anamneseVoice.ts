import {
  AreaAfetada,
  InicioProblema,
  MecanismoLesao,
  MotivoBusca,
  TipoDor,
} from "../types";

export type QuickAnamneseVoiceInsight = {
  motivoBusca?: MotivoBusca;
  area?: AreaAfetada;
  intensidadeDor?: number;
  descricaoSintomas?: string;
  tempoProblema?: string;
  horaIntensifica: string[];
  inicioProblema?: InicioProblema;
  eventoEspecifico?: string;
  fatorAlivio: string[];
  mecanismoLesao?: MecanismoLesao;
  fatoresPiora: string[];
  dorRepouso?: boolean;
  dorNoturna?: boolean;
  irradiacao?: boolean;
  localIrradiacao?: string;
  tipoDor?: TipoDor;
  limitacoesFuncionais: string[];
  atividadesQuePioram: string[];
  metaPrincipalPaciente?: string;
  redFlags: string[];
  yellowFlags: string[];
  appliedFields: string[];
};

const VOICE_NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
};

const normalizeVoiceText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesVoiceTerm = (normalizedText: string, rawTerm: string) => {
  const term = normalizeVoiceText(rawTerm);
  if (!term) return false;
  if (/^[a-z0-9]+$/.test(term) && term.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(?=$|[^a-z0-9])`).test(
      normalizedText,
    );
  }
  return normalizedText.includes(term);
};

const includesAnyVoiceTerm = (normalizedText: string, terms: string[]) =>
  terms.some((term) => includesVoiceTerm(normalizedText, term));

export const uniqueVoiceValues = (values: string[]) =>
  values.filter((value, index, list) => value && list.indexOf(value) === index);

export const appendUniqueClinicalText = (current: string, next: string) => {
  const trimmedNext = next.trim();
  if (!trimmedNext) return current;
  const trimmedCurrent = current.trim();
  if (!trimmedCurrent) return trimmedNext;
  if (
    normalizeVoiceText(trimmedCurrent).includes(normalizeVoiceText(trimmedNext))
  ) {
    return current;
  }
  return `${trimmedCurrent} ${trimmedNext}`;
};

export const mergePresetText = (current: string, nextValues: string[]) => {
  const currentValues = current
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return uniqueVoiceValues([...currentValues, ...nextValues]).join(", ");
};

const parseVoiceNumber = (value: string) => {
  const normalized = normalizeVoiceText(value);
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return VOICE_NUMBER_WORDS[normalized];
};

const extractVoiceDuration = (text: string) => {
  const normalized = normalizeVoiceText(text);
  const match = normalized.match(
    /(?:ha|a|faz|tem|desde|iniciou ha|comecou ha)\s+(?:cerca de\s+)?(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+(dia|dias|semana|semanas|mes|meses|ano|anos)/,
  );
  if (!match) return "";

  const amount = parseVoiceNumber(match[1]);
  if (!Number.isFinite(amount)) return "";

  return `${amount} ${match[2]}`;
};

const extractVoicePainIntensity = (text: string) => {
  const normalized = normalizeVoiceText(text);
  const contextualMatch =
    normalized.match(
      /(?:dor|intensidade|nota)\s*(?:de|nota)?\s*(\d{1,2})(?:\s*(?:\/|de)\s*10)?/,
    ) || normalized.match(/(\d{1,2})\s*(?:\/|de)\s*10/);
  const wordMatch = normalized.match(
    /(?:dor|intensidade|nota)\s*(?:de|nota)?\s*(zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)(?:\s*(?:\/|de)\s*(?:10|dez))?/,
  );
  const rawValue = contextualMatch?.[1] || wordMatch?.[1];
  if (rawValue) {
    const value = parseVoiceNumber(rawValue);
    if (Number.isFinite(value)) return Math.max(0, Math.min(10, value));
  }

  if (includesAnyVoiceTerm(normalized, ["dor forte", "dor intensa"])) return 8;
  if (includesAnyVoiceTerm(normalized, ["dor moderada"])) return 5;
  if (includesAnyVoiceTerm(normalized, ["dor leve", "pouca dor"])) return 2;
  return undefined;
};

const VOICE_AREA_PATTERNS: Array<{
  regiao: string;
  terms: string[];
}> = [
  { regiao: "joelho", terms: ["joelho", "patela", "patelar"] },
  { regiao: "ombro", terms: ["ombro", "manguito"] },
  {
    regiao: "coluna_lombar",
    terms: ["lombar", "coluna lombar", "costas", "lombo"],
  },
  { regiao: "coluna_cervical", terms: ["cervical", "pescoco", "nuca"] },
  {
    regiao: "coluna_toracica",
    terms: ["toracica", "dorsal", "meio das costas"],
  },
  { regiao: "quadril", terms: ["quadril", "coxofemoral"] },
  { regiao: "gluteo", terms: ["gluteo", "nadega"] },
  { regiao: "coxa", terms: ["coxa", "anterior da coxa"] },
  { regiao: "posterior_coxa", terms: ["posterior da coxa", "isquiotibiais"] },
  {
    regiao: "tornozelo_pe",
    terms: ["tornozelo", "pe", "calcanhar", "fascia plantar"],
  },
  { regiao: "punho_mao", terms: ["punho", "mao", "dedos"] },
  { regiao: "cotovelo", terms: ["cotovelo"] },
  { regiao: "braco", terms: ["braco", "biceps", "triceps"] },
  { regiao: "antebraco", terms: ["antebraco"] },
  { regiao: "panturrilha", terms: ["panturrilha"] },
  { regiao: "torax", terms: ["torax", "peitoral"] },
  { regiao: "abdomen", terms: ["abdomen", "abdominal"] },
];

const inferVoiceSide = (
  normalizedText: string,
): AreaAfetada["lado"] | undefined => {
  if (
    /\b(bilateral|ambos|ambas)\b/.test(normalizedText) ||
    /\b(os dois|as duas)\s+(joelhos|ombros|punhos|tornozelos|pes|maos)\b/.test(
      normalizedText,
    )
  ) {
    return "ambos";
  }
  if (/\b(direito|direita|lado direito|lado direita)\b/.test(normalizedText)) {
    return "direito";
  }
  if (
    /\b(esquerdo|esquerda|lado esquerdo|lado esquerda)\b/.test(normalizedText)
  ) {
    return "esquerdo";
  }
  return undefined;
};

const inferVoiceArea = (text: string): AreaAfetada | undefined => {
  const normalized = normalizeVoiceText(text);
  const matched = VOICE_AREA_PATTERNS.find((item) =>
    includesAnyVoiceTerm(normalized, item.terms),
  );
  if (!matched) return undefined;
  return {
    regiao: matched.regiao,
    lado: inferVoiceSide(normalized),
    observacao: text.trim(),
  };
};

const inferVoicePresetMatches = (
  normalizedText: string,
  mapping: Array<{ value: string; terms: string[] }>,
) =>
  mapping
    .filter((item) => includesAnyVoiceTerm(normalizedText, item.terms))
    .map((item) => item.value);

export const inferQuickAnamneseVoiceInsight = (
  text: string,
): QuickAnamneseVoiceInsight => {
  const normalized = normalizeVoiceText(text);
  const tempoProblema = extractVoiceDuration(text);
  const intensidadeDor = extractVoicePainIntensity(text);
  const area = inferVoiceArea(text);
  const fatorAlivio = inferVoicePresetMatches(normalized, [
    { value: "Repouso", terms: ["repouso", "descanso", "parar"] },
    { value: "Calor", terms: ["calor", "bolsa quente"] },
    { value: "Frio", terms: ["frio", "gelo", "compressa fria"] },
    { value: "Alongamento", terms: ["alongamento", "alongar"] },
    {
      value: "Medicamento",
      terms: ["medicamento", "remedio", "analgesico", "anti inflamatorio"],
    },
    { value: "Massagem", terms: ["massagem", "liberacao"] },
    {
      value: "Mudança de posição",
      terms: ["mudar de posicao", "mudanca de posicao"],
    },
    {
      value: "Movimento leve",
      terms: ["movimento leve", "andar leve", "caminhada leve"],
    },
  ]);
  const fatoresPiora = inferVoicePresetMatches(normalized, [
    {
      value: "Esforço físico",
      terms: ["esforco", "atividade fisica", "treino", "exercicio"],
    },
    {
      value: "Carga repetitiva",
      terms: ["repetitivo", "repeticao", "sobrecarga"],
    },
    {
      value: "Postura mantida",
      terms: ["postura mantida", "ficar parado", "mesma posicao"],
    },
    { value: "Impacto", terms: ["impacto", "correr", "salto", "pulo"] },
    { value: "Movimento brusco", terms: ["movimento brusco", "virada brusca"] },
    { value: "Sedentarismo", terms: ["sedentarismo", "parado muito tempo"] },
    { value: "Estresse", terms: ["estresse", "ansiedade", "nervoso"] },
  ]);
  const limitacoesFuncionais = inferVoicePresetMatches(normalized, [
    { value: "Sentar", terms: ["sentar", "sentado"] },
    { value: "Caminhar", terms: ["caminhar", "andar"] },
    { value: "Dormir", terms: ["dormir", "sono"] },
    { value: "Trabalhar", terms: ["trabalhar", "trabalho"] },
    { value: "Subir escadas", terms: ["subir escada", "escada"] },
    { value: "Dirigir", terms: ["dirigir"] },
    { value: "Agachar", terms: ["agachar", "agachamento"] },
    { value: "Esporte", terms: ["esporte", "jogar", "competir"] },
  ]);
  const atividadesQuePioram = inferVoicePresetMatches(normalized, [
    {
      value: "Levantar peso",
      terms: ["levantar peso", "carregar peso", "pegar peso"],
    },
    { value: "Ficar sentado", terms: ["ficar sentado", "sentado muito tempo"] },
    { value: "Ficar em pé", terms: ["ficar em pe", "em pe muito tempo"] },
    { value: "Caminhar", terms: ["caminhar", "andar"] },
    { value: "Subir escadas", terms: ["subir escada", "escada"] },
    { value: "Exercício", terms: ["exercicio", "treino", "atividade fisica"] },
    { value: "Dirigir", terms: ["dirigir"] },
    { value: "Esporte", terms: ["esporte", "jogo", "competicao"] },
  ]);
  const horaIntensifica = inferVoicePresetMatches(normalized, [
    { value: "Intermitente", terms: ["intermitente", "vai e volta", "oscila"] },
    { value: "Ao acordar", terms: ["ao acordar", "quando acorda"] },
    { value: "Manhã", terms: ["manha"] },
    { value: "Tarde", terms: ["tarde"] },
    { value: "Noite", terms: ["noite", "noturna"] },
    { value: "Fim do dia", terms: ["fim do dia", "final do dia"] },
    { value: "Após esforço", terms: ["apos esforco", "depois do esforco"] },
    { value: "Após trabalho", terms: ["apos trabalho", "depois do trabalho"] },
  ]);

  const hasTrauma = includesAnyVoiceTerm(normalized, [
    "trauma",
    "queda",
    "caiu",
    "acidente",
    "batida",
    "torcao",
    "entorse",
  ]);
  const hasOverload = includesAnyVoiceTerm(normalized, [
    "sobrecarga",
    "repetitivo",
    "treino",
    "exercicio",
    "corrida",
    "carga",
  ]);
  const hasNegatedIrradiation = includesAnyVoiceTerm(normalized, [
    "nao irradia",
    "sem irradiacao",
    "nao desce",
    "nao corre",
  ]);
  const hasIrradiation =
    !hasNegatedIrradiation &&
    includesAnyVoiceTerm(normalized, [
      "irradia",
      "irradiacao",
      "desce",
      "sobe",
      "corre para",
      "vai para",
      "formiga",
      "formigamento",
      "dormencia",
    ]);
  const hasNeuropathic = includesAnyVoiceTerm(normalized, [
    "choque",
    "formigamento",
    "dormencia",
    "queimacao",
    "ardencia",
  ]);
  const hasInflammatory = includesAnyVoiceTerm(normalized, [
    "inchaco",
    "edema",
    "calor local",
    "vermelh",
    "dor noturna",
    "acorda a noite",
  ]);
  const hasNegatedRestPain = includesAnyVoiceTerm(normalized, [
    "sem dor em repouso",
    "nao sente dor em repouso",
    "nao tem dor em repouso",
  ]);
  const hasRestPain = includesAnyVoiceTerm(normalized, [
    "dor em repouso",
    "mesmo em repouso",
  ]);
  const hasNegatedNightPain = includesAnyVoiceTerm(normalized, [
    "sem dor noturna",
    "nao acorda a noite",
    "nao acorda de noite",
  ]);
  const hasNightPain = includesAnyVoiceTerm(normalized, [
    "dor noturna",
    "dor a noite",
    "dor durante a noite",
    "acorda a noite",
    "acorda de noite",
  ]);
  const redFlags = inferVoicePresetMatches(normalized, [
    { value: "Febre", terms: ["febre"] },
    { value: "Perda de peso inexplicada", terms: ["perda de peso"] },
    { value: "Historico de cancer", terms: ["cancer", "tumor"] },
    {
      value: "Trauma grave",
      terms: ["trauma grave", "acidente grave", "queda forte"],
    },
    {
      value: "Deficit neurologico",
      terms: ["perda de forca", "deficit neurologico", "perda de sensibilidade"],
    },
  ]);
  const yellowFlags = inferVoicePresetMatches(normalized, [
    { value: "Medo de movimento", terms: ["medo de movimento", "medo de mexer"] },
    { value: "Ansiedade", terms: ["ansiedade", "ansioso"] },
    { value: "Estresse", terms: ["estresse", "estressado"] },
    { value: "Baixa adesão prévia", terms: ["nao fez exercicio", "baixa adesao"] },
  ]);

  const appliedFields = [
    "descrição",
    area ? "área" : "",
    typeof intensidadeDor === "number" ? "dor" : "",
    tempoProblema ? "tempo" : "",
    horaIntensifica.length ? "período" : "",
    fatorAlivio.length ? "melhora" : "",
    fatoresPiora.length ? "piora" : "",
    limitacoesFuncionais.length ? "limitações" : "",
    hasIrradiation ? "irradiação" : "",
    hasTrauma || hasOverload ? "mecanismo" : "",
  ].filter(Boolean);

  return {
    motivoBusca: MotivoBusca.SINTOMA_EXISTENTE,
    area,
    intensidadeDor,
    descricaoSintomas: text.trim(),
    tempoProblema,
    horaIntensifica,
    inicioProblema: hasTrauma ? InicioProblema.APOS_EVENTO : undefined,
    eventoEspecifico: hasTrauma ? text.trim() : undefined,
    fatorAlivio,
    mecanismoLesao: hasTrauma
      ? MecanismoLesao.TRAUMA
      : hasOverload
        ? MecanismoLesao.SOBRECARGA
        : undefined,
    fatoresPiora,
    dorRepouso: hasNegatedRestPain ? false : hasRestPain ? true : undefined,
    dorNoturna: hasNegatedNightPain ? false : hasNightPain ? true : undefined,
    irradiacao: hasNegatedIrradiation ? false : hasIrradiation ? true : undefined,
    localIrradiacao: hasIrradiation ? text.trim() : undefined,
    tipoDor: hasNeuropathic
      ? TipoDor.NEUROPATICA
      : hasInflammatory
        ? TipoDor.INFLAMATORIA
        : fatoresPiora.length || fatorAlivio.length
          ? TipoDor.MECANICA
          : undefined,
    limitacoesFuncionais,
    atividadesQuePioram,
    metaPrincipalPaciente: includesAnyVoiceTerm(normalized, [
      "voltar",
      "retornar",
      "objetivo",
      "meta",
    ])
      ? text.trim()
      : undefined,
    redFlags,
    yellowFlags,
    appliedFields,
  };
};
