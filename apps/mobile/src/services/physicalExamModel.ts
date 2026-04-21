// ==========================================
// EXAME FISICO MODEL HELPERS
// ==========================================
import { Anamnese } from "../types";

export type DorClassificacaoPrincipal =
  | "NOCICEPTIVA"
  | "NEUROPATICA"
  | "NOCIPLASTICA"
  | "INFLAMATORIA"
  | "VISCERAL";

export type DorSubtipoClinico =
  | "MECANICA"
  | "DISCAL"
  | "NEURAL"
  | "REFERIDA"
  | "INFLAMATORIA"
  | "MIOFASCIAL"
  | "FACETARIA"
  | "NAO_MECANICA";

export type RedFlagKey =
  | "CAUDA_EQUINA"
  | "FRATURA"
  | "INFECCAO"
  | "ONCOLOGICO"
  | "NAO_MECANICA"
  | "DEFICIT_NEURO_PROGRESSIVO"
  | "VASCULAR";

export interface RedFlagAnswer {
  key: RedFlagKey;
  question: string;
  positive: boolean;
}

export interface RedFlagBlock {
  answers: RedFlagAnswer[];
  criticalTriggered: boolean;
  criticalReasons: RedFlagKey[];
  referralRequired: boolean;
  referralDestination?: string;
  referralReason?: string;
}

export interface ExameFisicoStructured {
  version: 1;
  source: "rule-based" | "manual";
  generatedAt: string;
  dorPrincipal: DorClassificacaoPrincipal;
  dorSubtipo: DorSubtipoClinico;
  observacao: {
    postura: string;
    assimetria: string;
    protecao: string;
    padraoMovimento: string;
  };
  movimento: {
    ativo: string;
    passivo: string;
    resistido: string;
    reproduzDor: string;
  };
  padraoDor: {
    local: string;
    irradiada: string;
    comportamento: string;
  };
  palpacao: {
    muscular: string;
    articular: string;
    pontosGatilho: string;
    dinamicaVertebral: string;
  };
  testes: {
    biomecanicos: string;
    ortopedicos: string;
    neurologicos: string;
    imagem: string;
  };
  cadeiaCinetica: {
    quadril: string;
    pelve: string;
    colunaToracica: string;
    pe: string;
  };
  cruzamentoFinal: {
    hipotesePrincipal: string;
    hipotesesSecundarias: string;
    inconsistencias: string;
    condutaDirecionada: string;
    prioridade: "BAIXA" | "MEDIA" | "ALTA" | "ENCAMINHAMENTO_IMEDIATO";
  };
  redFlags: RedFlagBlock;
}

export const STRUCTURED_EXAME_PREFIX = "__EXAME_FISICO_STRUCTURED_V1__";

const boolLabel = (value?: boolean | null) => {
  if (value === true) return "Sim";
  if (value === false) return "Nao";
  return "Nao informado";
};

const safeText = (value?: string | null, fallback = "Nao informado") => {
  const parsed = String(value || "").trim();
  return parsed || fallback;
};

const initialRedFlagAnswers = (): RedFlagAnswer[] => [
  { key: "CAUDA_EQUINA", question: "Perda de controle urinario/fecal, anestesia em sela ou fraqueza progressiva?", positive: false },
  { key: "FRATURA", question: "Trauma recente com dor intensa localizada, osteoporose ou corticoide cronico?", positive: false },
  { key: "INFECCAO", question: "Febre/calafrios, dor progressiva constante, imunossupressao ou infeccao recente?", positive: false },
  { key: "ONCOLOGICO", question: "Historico oncologico, perda de peso sem causa, dor noturna persistente?", positive: false },
  { key: "NAO_MECANICA", question: "Dor nao muda com movimento, sem alivio postural e constante em repouso?", positive: false },
  { key: "DEFICIT_NEURO_PROGRESSIVO", question: "Perda de forca progressiva, pe caido ou piora de marcha?", positive: false },
  { key: "VASCULAR", question: "Dor lombar/abdominal subita intensa com suspeita vascular?", positive: false },
];

const deriveRedFlagMeta = (answers: RedFlagAnswer[]): RedFlagBlock => {
  const positives = answers.filter((a) => a.positive).map((a) => a.key);
  const critical = positives.filter((key) => key !== "NAO_MECANICA");
  return {
    answers,
    criticalTriggered: critical.length > 0,
    criticalReasons: critical,
    referralRequired: critical.length > 0,
  };
};

const mapAnamneseTipo = (
  tipo?: Anamnese["tipoDor"] | null,
): { principal: DorClassificacaoPrincipal; subtipo: DorSubtipoClinico } => {
  if (tipo === "NEUROPATICA") {
    return { principal: "NEUROPATICA", subtipo: "NEURAL" };
  }
  if (tipo === "INFLAMATORIA") {
    return { principal: "INFLAMATORIA", subtipo: "INFLAMATORIA" };
  }
  if (tipo === "MECANICA") {
    return { principal: "NOCICEPTIVA", subtipo: "MECANICA" };
  }
  if (tipo === "MISTA") {
    return { principal: "NOCIPLASTICA", subtipo: "MIOFASCIAL" };
  }
  return { principal: "NOCICEPTIVA", subtipo: "MECANICA" };
};

export function buildStructuredExameFromAnamnese(
  anamnese?: Anamnese,
): ExameFisicoStructured {
  const areas = anamnese?.areasAfetadas?.map((a) => a.regiao).filter(Boolean) || [];
  const areaPrincipal = areas[0] || "Regiao principal nao definida";
  const map = mapAnamneseTipo(anamnese?.tipoDor || null);

  const redFlags = initialRedFlagAnswers();
  if (anamnese?.redFlags && anamnese.redFlags.length > 0) {
    for (const answer of redFlags) {
      const hit = anamnese.redFlags.some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(answer.key.toLowerCase().replace(/_/g, " ")),
      );
      if (hit) answer.positive = true;
    }
  }

  return {
    version: 1,
    source: "rule-based",
    generatedAt: new Date().toISOString(),
    dorPrincipal: map.principal,
    dorSubtipo: map.subtipo,
    observacao: {
      postura: "Avaliar alinhamento global e compensacoes.",
      assimetria: "Comparar hemicorpos e desvios relevantes.",
      protecao: safeText(anamnese?.atividadesQuePioram, "Sem protecao descrita."),
      padraoMovimento: "Observar estrategia antalgica durante tarefas funcionais.",
    },
    movimento: {
      ativo: `Testar movimentos ativos da regiao ${areaPrincipal}.`,
      passivo: "Comparar amplitude e qualidade com ativo.",
      resistido: "Testar grupos motores principais e reproducao de sintomas.",
      reproduzDor: "Identificar movimento-chave que reproduz dor.",
    },
    padraoDor: {
      local: safeText(anamnese?.descricaoSintomas, areaPrincipal),
      irradiada: boolLabel(anamnese?.irradiacao) + (anamnese?.localIrradiacao ? ` (${anamnese.localIrradiacao})` : ""),
      comportamento: safeText(anamnese?.tempoProblema, "Comportamento temporal nao informado."),
    },
    palpacao: {
      muscular: "Identificar hipertonia, dor a pressao e consistencia tecidual.",
      articular: "Avaliar dor segmentar e mobilidade acessoria.",
      pontosGatilho: "Pesquisar pontos gatilho ativos/latentes.",
      dinamicaVertebral: "Palpacao dinamica para disfuncao segmentar e resposta a movimento.",
    },
    testes: {
      biomecanicos: "Selecionar testes funcionais de carga e controle motor.",
      ortopedicos: "Selecionar conforme hipotese principal e diferencial.",
      neurologicos: "Dermatomo, miotomo e reflexos profundos.",
      imagem: "Correlacionar exames de imagem com quadro clinico (se disponiveis).",
    },
    cadeiaCinetica: {
      quadril: "Avaliar mobilidade e controle do quadril.",
      pelve: "Avaliar alinhamento e dissociacao pelvica.",
      colunaToracica: "Avaliar mobilidade toracica e impacto em cadeia.",
      pe: "Avaliar apoio plantar e estrategia de propulsao.",
    },
    cruzamentoFinal: {
      hipotesePrincipal: "Definir apos integracao dos achados objetivos.",
      hipotesesSecundarias: "Listar hipoteses diferenciais relevantes.",
      inconsistencias: "Marcar sinais/sintomas que nao sustentam a hipotese principal.",
      condutaDirecionada: "Definir proximo passo terapeutico ou encaminhamento.",
      prioridade: "MEDIA",
    },
    redFlags: deriveRedFlagMeta(redFlags),
  };
}

export function updateRedFlagAnswer(
  exam: ExameFisicoStructured,
  key: RedFlagKey,
  positive: boolean,
): ExameFisicoStructured {
  const answers = exam.redFlags.answers.map((item) =>
    item.key === key ? { ...item, positive } : item,
  );
  return {
    ...exam,
    redFlags: {
      ...deriveRedFlagMeta(answers),
      referralDestination: exam.redFlags.referralDestination,
      referralReason: exam.redFlags.referralReason,
    },
  };
}

export function serializeStructuredExame(exam: ExameFisicoStructured): string {
  return `${STRUCTURED_EXAME_PREFIX}${JSON.stringify(exam)}`;
}

export function parseStructuredExame(raw?: string | null): ExameFisicoStructured | null {
  const text = String(raw || "").trim();
  if (!text.startsWith(STRUCTURED_EXAME_PREFIX)) return null;
  const json = text.slice(STRUCTURED_EXAME_PREFIX.length);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ExameFisicoStructured;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function renderStructuredExameToText(exam: ExameFisicoStructured): string {
  const redFlagsPositivas = exam.redFlags.answers
    .filter((item) => item.positive)
    .map((item) => `- ${item.question}`)
    .join("\n");

  return [
    "Classificacao de dor",
    `Principal: ${exam.dorPrincipal}`,
    `Subtipo clinico: ${exam.dorSubtipo}`,
    "",
    "Observacao",
    `Postura: ${exam.observacao.postura}`,
    `Assimetria: ${exam.observacao.assimetria}`,
    `Protecao: ${exam.observacao.protecao}`,
    `Padrao de movimento: ${exam.observacao.padraoMovimento}`,
    "",
    "Movimento",
    `Ativo: ${exam.movimento.ativo}`,
    `Passivo: ${exam.movimento.passivo}`,
    `Resistido: ${exam.movimento.resistido}`,
    `Reproduz dor: ${exam.movimento.reproduzDor}`,
    "",
    "Padrao de dor",
    `Local: ${exam.padraoDor.local}`,
    `Irradiada: ${exam.padraoDor.irradiada}`,
    `Comportamento: ${exam.padraoDor.comportamento}`,
    "",
    "Palpacao",
    `Muscular: ${exam.palpacao.muscular}`,
    `Articular: ${exam.palpacao.articular}`,
    `Pontos gatilho: ${exam.palpacao.pontosGatilho}`,
    `Palpacao dinamica vertebral: ${exam.palpacao.dinamicaVertebral}`,
    "",
    "Testes",
    `Biomecanicos: ${exam.testes.biomecanicos}`,
    `Ortopedicos: ${exam.testes.ortopedicos}`,
    `Neurologicos: ${exam.testes.neurologicos}`,
    `Imagem: ${exam.testes.imagem}`,
    "",
    "Cadeia cinetica",
    `Quadril: ${exam.cadeiaCinetica.quadril}`,
    `Pelve: ${exam.cadeiaCinetica.pelve}`,
    `Coluna toracica: ${exam.cadeiaCinetica.colunaToracica}`,
    `Pe: ${exam.cadeiaCinetica.pe}`,
    "",
    "Cruzamento final",
    `Hipotese principal: ${exam.cruzamentoFinal.hipotesePrincipal}`,
    `Hipoteses secundarias: ${exam.cruzamentoFinal.hipotesesSecundarias}`,
    `Inconsistencias: ${exam.cruzamentoFinal.inconsistencias}`,
    `Direcao de conduta: ${exam.cruzamentoFinal.condutaDirecionada}`,
    `Prioridade: ${exam.cruzamentoFinal.prioridade}`,
    "",
    "Red flags",
    redFlagsPositivas || "Nenhuma red flag positiva na triagem.",
    exam.redFlags.criticalTriggered
      ? "ALERTA: Red flag critica detectada. Encaminhamento imediato recomendado."
      : "Sem red flag critica no momento.",
    exam.redFlags.referralDestination
      ? `Destino de encaminhamento: ${exam.redFlags.referralDestination}`
      : "",
    exam.redFlags.referralReason
      ? `Justificativa do encaminhamento: ${exam.redFlags.referralReason}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
