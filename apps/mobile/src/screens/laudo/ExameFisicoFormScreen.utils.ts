import type { ExameFisicoStructured } from "../../services/physicalExamModel";

const EXAM_FIELD_SUGGESTION_HINTS: Record<string, string> = {
  "observacao.postura": "Avaliar alinhamento global e estrategias posturais.",
  "observacao.assimetria": "Comparar hemicorpos e desvios relevantes.",
  "observacao.padraoMovimento": "Observar estrategia antalgica durante tarefas funcionais.",
  "movimento.ativo": "Testar movimentos ativos da regiao",
  "movimento.passivo": "Comparar amplitude e qualidade com ativo.",
  "movimento.resistido": "Testar grupos motores principais e reproducao de sintomas.",
  "movimento.reproduzDor": "Identificar movimento-chave que reproduz dor.",
  "palpacao.pontosDolorosos": "Mapear pontos dolorosos por regiao e profundidade.",
  "palpacao.muscular": "Identificar hipertonia, dor a pressao e consistencia tecidual.",
  "palpacao.articular": "Avaliar dor segmentar e mobilidade acessoria.",
  "palpacao.dinamicaVertebral": "Palpacao dinamica para disfuncao segmentar e resposta a movimento.",
  "testes.biomecanicos": "Selecionar testes funcionais de carga e controle motor.",
  "testes.ortopedicos": "Selecionar conforme hipotese principal e diferencial.",
  "testes.imagem": "Correlacionar exames de imagem com quadro clinico (se disponiveis).",
  "cadeiaCinetica.quadril": "Avaliar mobilidade e controle coxofemoral.",
  "cadeiaCinetica.pelve": "Avaliar alinhamento e dissociacao pelvica.",
  "cadeiaCinetica.colunaToracica": "Avaliar mobilidade toracica e impacto em cadeia.",
  "cadeiaCinetica.pe": "Avaliar apoio plantar e estrategia de propulsao.",
};

const EXAM_FIELD_SUGGESTION_LABELS: Record<string, string> = {
  "observacao.postura": "Avaliar alinhamento global e compensacoes",
  "observacao.assimetria": "Comparar hemicorpos e desvios relevantes",
  "observacao.padraoMovimento": "Observar estrategia antalgica durante tarefas funcionais",
  "movimento.ativo": "Testar movimentos ativos da regiao principal",
  "movimento.passivo": "Comparar amplitude e qualidade com ativo",
  "movimento.resistido": "Testar grupos motores principais e reproducao de sintomas",
  "movimento.reproduzDor": "Identificar movimento-chave que reproduz dor",
  "palpacao.pontosDolorosos": "Mapear pontos dolorosos por regiao e profundidade",
  "palpacao.muscular": "Identificar hipertonia, dor a pressao e consistencia tecidual",
  "palpacao.articular": "Avaliar dor segmentar e mobilidade acessoria",
  "palpacao.dinamicaVertebral": "Palpacao dinamica para disfuncao segmentar e resposta a movimento",
  "testes.biomecanicos": "Selecionar testes funcionais de carga e controle motor",
  "testes.ortopedicos": "Selecionar conforme hipotese principal e diferencial",
  "testes.imagem": "Correlacionar exame de imagem com quadro clinico",
  "cadeiaCinetica.quadril": "Avaliar mobilidade e controle coxofemoral",
  "cadeiaCinetica.pelve": "Avaliar alinhamento e dissociacao pelvica",
  "cadeiaCinetica.colunaToracica": "Avaliar mobilidade toracica e impacto em cadeia",
  "cadeiaCinetica.pe": "Avaliar apoio plantar e estrategia de propulsao",
};

export type HipomobilidadeSegmentarField =
  | "cervical"
  | "toracica"
  | "lombar"
  | "sacro"
  | "iliacoDireito"
  | "iliacoEsquerdo";

export const prettyEnum = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

export const prettyEvidenceField = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

const isNoInfoText = (value?: string | null) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "nao informado" ||
    normalized === "n\u00e3o informado" ||
    normalized === "n\u00c3\u00a3o informado" ||
    normalized === "nao definida" ||
    normalized === "n\u00e3o definida" ||
    normalized === "n\u00c3\u00a3o definida" ||
    normalized === "n/a"
  );
};

const normalizeNoInfoText = (value?: string | null) => {
  const parsed = String(value || "").trim();
  if (!parsed) return "";
  return isNoInfoText(parsed) ? "" : parsed;
};

export const resolveInputSuggestionPresentation = (
  fieldKey: string,
  baseLabel: string,
  currentValue?: string,
) => {
  const raw = String(currentValue || "").trim();
  const hintStart = EXAM_FIELD_SUGGESTION_HINTS[fieldKey];
  const hintLabel = EXAM_FIELD_SUGGESTION_LABELS[fieldKey];
  if (!raw || !hintStart || !hintLabel) {
    return { label: baseLabel, value: currentValue ?? "" };
  }

  const startsWithHint = raw.toLowerCase().startsWith(hintStart.toLowerCase());
  if (!startsWithHint) {
    return { label: baseLabel, value: currentValue ?? "" };
  }

  return { label: `${baseLabel} (${hintLabel})`, value: "" };
};

export const buildHipomobilidadeSummary = (segmentar: {
  cervical?: string;
  toracica?: string;
  lombar?: string;
  sacro?: string;
  iliacoDireito?: string;
  iliacoEsquerdo?: string;
}) => {
  const pairs: Array<[string, string]> = [
    ["Cervical", normalizeNoInfoText(segmentar.cervical)],
    ["Toracica", normalizeNoInfoText(segmentar.toracica)],
    ["Lombar", normalizeNoInfoText(segmentar.lombar)],
    ["Sacro", normalizeNoInfoText(segmentar.sacro)],
    ["Iliaco D", normalizeNoInfoText(segmentar.iliacoDireito)],
    ["Iliaco E", normalizeNoInfoText(segmentar.iliacoEsquerdo)],
  ];
  const filled = pairs
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`);
  return filled.join(" | ");
};

export const sanitizeExamForForm = (
  source: ExameFisicoStructured,
): ExameFisicoStructured => {
  const hipomobilidadeSegmentar = {
    cervical: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.cervical),
    toracica: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.toracica),
    lombar: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.lombar),
    sacro: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.sacro),
    iliacoDireito: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.iliacoDireito),
    iliacoEsquerdo: normalizeNoInfoText(source.palpacao.hipomobilidadeSegmentar.iliacoEsquerdo),
  };

  return {
    ...source,
    version: 2,
    observacao: {
      ...source.observacao,
      edema: normalizeNoInfoText(source.observacao.edema),
      atrofiaMuscular: normalizeNoInfoText(source.observacao.atrofiaMuscular),
      marcha: normalizeNoInfoText(source.observacao.marcha),
    },
    movimento: {
      ativo: source.movimento.ativo,
      passivo: source.movimento.passivo,
      resistido: source.movimento.resistido,
      reproduzDor: source.movimento.reproduzDor,
      qualidadeMovimento: normalizeNoInfoText(source.movimento.qualidadeMovimento),
    },
    padraoDor: {
      local: source.padraoDor.local,
      irradiada: source.padraoDor.irradiada,
    },
    palpacao: {
      pontosDolorosos: normalizeNoInfoText(source.palpacao.pontosDolorosos),
      muscular: source.palpacao.muscular,
      articular: source.palpacao.articular,
      dinamicaVertebral: source.palpacao.dinamicaVertebral,
      temperatura: normalizeNoInfoText(source.palpacao.temperatura),
      tonusMuscular: normalizeNoInfoText(source.palpacao.tonusMuscular),
      hipomobilidadeArticular: buildHipomobilidadeSummary(hipomobilidadeSegmentar),
      hipomobilidadeSegmentar,
    },
    testes: {
      biomecanicos: source.testes.biomecanicos,
      ortopedicos: source.testes.ortopedicos,
      imagem: source.testes.imagem,
    },
    raciocinioClinico: {
      ...source.raciocinioClinico,
      origemProvavelDor: normalizeNoInfoText(source.raciocinioClinico.origemProvavelDor),
      estruturaEnvolvida: normalizeNoInfoText(source.raciocinioClinico.estruturaEnvolvida),
      tipoLesao: normalizeNoInfoText(source.raciocinioClinico.tipoLesao),
      fatorBiomecanicoAssociado: normalizeNoInfoText(source.raciocinioClinico.fatorBiomecanicoAssociado),
      relacaoComEsporte: normalizeNoInfoText(source.raciocinioClinico.relacaoComEsporte),
    },
    diagnosticoFuncionalIa: {
      disfuncaoPrincipal: normalizeNoInfoText(source.diagnosticoFuncionalIa.disfuncaoPrincipal),
      cadeiaEnvolvida: normalizeNoInfoText(source.diagnosticoFuncionalIa.cadeiaEnvolvida),
    },
    condutaIa: {
      ...source.condutaIa,
      tecnicaManualIndicada: normalizeNoInfoText(source.condutaIa.tecnicaManualIndicada),
      ajusteArticular: normalizeNoInfoText(source.condutaIa.ajusteArticular),
      exercicioCorretivo: normalizeNoInfoText(source.condutaIa.exercicioCorretivo),
      liberacaoMiofascial: normalizeNoInfoText(source.condutaIa.liberacaoMiofascial),
      progressaoEsportiva: normalizeNoInfoText(source.condutaIa.progressaoEsportiva),
    },
  };
};
