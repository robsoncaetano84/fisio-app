// ==========================================
// EXAME FISICO MODEL HELPERS
// ==========================================
import { Anamnese } from "../types";
import {
  ClinicalScoringProfile,
  CONFIDENCE_RULES,
  getProfileRegionWeight,
  getWeightedPositiveScore,
} from "./physicalExamScoring";

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

export type TestResult = "NAO_TESTADO" | "POSITIVO" | "NEGATIVO";

export interface RegionalTest {
  nome: string;
  resultado: TestResult;
  selecionado: boolean;
}

export interface RegionalTestGroup {
  regiao:
    | "CERVICAL"
    | "TORACICA"
    | "LOMBAR"
    | "SACROILIACA"
    | "QUADRIL"
    | "JOELHO"
    | "TORNOZELO_PE"
    | "OMBRO"
    | "COTOVELO"
    | "PUNHO_MAO";
  titulo: string;
  testes: RegionalTest[];
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
    edema: string;
    atrofiaMuscular: string;
    marcha: string;
  };
  movimento: {
    ativo: string;
    passivo: string;
    resistido: string;
    reproduzDor: string;
    qualidadeMovimento: string;
    compensacoes: string;
    dorNoMovimento: string;
  };
  padraoDor: {
    local: string;
    irradiada: string;
    comportamento: string;
  };
  palpacao: {
    pontosDolorosos: string;
    muscular: string;
    articular: string;
    pontosGatilho: string;
    dinamicaVertebral: string;
    temperatura: string;
    tonusMuscular: string;
    estruturasEspecificas: string;
    hipomobilidadeArticular: string;
    hipomobilidadeSegmentar: {
      cervical: string;
      toracica: string;
      lombar: string;
      sacro: string;
      iliacoDireito: string;
      iliacoEsquerdo: string;
    };
  };
  testesFuncionais: {
    agachamento: string;
    agachamentoUnilateral: string;
    salto: string;
    corrida: string;
    estabilidade: string;
    controleMotor: string;
  };
  testes: {
    biomecanicos: string;
    ortopedicos: string;
    neurologicos: string;
    imagem: string;
  };
  neurologico: {
    forca: string;
    sensibilidade: string;
    reflexos: string;
    dermatomos: string;
    miotomos: string;
  };
  avaliacaoRegioes: RegionalTestGroup[];
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
    confiancaHipotese: "BAIXA" | "MODERADA" | "ALTA";
    scoreEvidencia: number;
    perfilScoring: ClinicalScoringProfile;
  };
  raciocinioClinico: {
    origemProvavelDor: string;
    estruturaEnvolvida: string;
    tipoLesao: string;
    fatorBiomecanicoAssociado: string;
    relacaoComEsporte: string;
  };
  diagnosticoFuncionalIa: {
    disfuncaoPrincipal: string;
    cadeiaEnvolvida: string;
    compensacoes: string;
  };
  condutaIa: {
    tecnicaManualIndicada: string;
    ajusteArticular: string;
    exercicioCorretivo: string;
    liberacaoMiofascial: string;
    progressaoEsportiva: string;
  };
  redFlags: RedFlagBlock;
}

const buildHipomobilidadeSummary = (segmentar: {
  cervical?: string;
  toracica?: string;
  lombar?: string;
  sacro?: string;
  iliacoDireito?: string;
  iliacoEsquerdo?: string;
}): string =>
  [
    `Cervical: ${safeText(segmentar.cervical)}`,
    `Toracica: ${safeText(segmentar.toracica)}`,
    `Lombar: ${safeText(segmentar.lombar)}`,
    `Sacro: ${safeText(segmentar.sacro)}`,
    `Iliaco D: ${safeText(segmentar.iliacoDireito)}`,
    `Iliaco E: ${safeText(segmentar.iliacoEsquerdo)}`,
  ].join(" | ");

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

const buildBiomechanicalFactorsSummary = (anamnese?: Anamnese): string => {
  const piora = String(anamnese?.fatoresPiora || "").trim();
  const alivio = String(anamnese?.fatorAlivio || "").trim();
  if (piora && alivio) return `Piora: ${piora}. Melhora/alivio: ${alivio}.`;
  if (piora) return piora;
  if (alivio) return `Melhora/alivio: ${alivio}.`;
  return "Nao informado";
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

const makeTests = (names: string[]): RegionalTest[] =>
  names.map((nome) => ({ nome, resultado: "NAO_TESTADO", selecionado: false }));

const normalizeTestKey = (value?: string | null): string =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();

const LEGACY_TEST_NAME_ALIASES: Record<string, string[]> = {
  [normalizeTestKey("Teste de Roos (desfiladeiro toracico)")]: ["Teste de Roos"],
  [normalizeTestKey("Teste de extensao lombar (Kemp)")]: ["Kemp (extensao lombar)"],
  [normalizeTestKey("Teste de fluido sacral")]: ["Fluido sacral"],
  [normalizeTestKey("Teste sacro extensao de perna")]: ["Sacro extensao perna"],
  [normalizeTestKey("Teste de flexao em pe (D/E)")]: ["Flexao em pe D/E"],
  [normalizeTestKey("Teste de flexao de joelho (Gillet)")]: ["Gillet (flexao de joelho)"],
  [normalizeTestKey("Golfer's elbow test")]: ["Golfer's elbow"],
};

const getDefaultRegionalTests = (): RegionalTestGroup[] => [
  {
    regiao: "CERVICAL",
    titulo: "Coluna cervical",
    testes: makeTests([
      "Sharp Purser",
      "Dekleyn",
      "Spurling",
      "Distração cervical",
      "Compressão cervical",
      "Teste de Jackson",
      "Teste de Roos (desfiladeiro toracico)",
      "Teste de Adson",
    ]),
  },
  {
    regiao: "TORACICA",
    titulo: "Coluna torácica",
    testes: makeTests([
      "Expansão torácica",
      "Mobilidade segmentar",
      "Rotação torácica",
      "Inclinação lateral",
      "Sinal de Schepelmann",
    ]),
  },
  {
    regiao: "LOMBAR",
    titulo: "Coluna lombar",
    testes: makeTests([
      "Lasègue (SLR)",
      "Slump test",
      "Schober",
      "Teste de extensao lombar (Kemp)",
      "Instabilidade lombar",
      "Elevação bilateral das pernas",
    ]),
  },
  {
    regiao: "SACROILIACA",
    titulo: "Sacroilíaca",
    testes: makeTests([
      "FABER (Patrick)",
      "Gaenslen",
      "Compressão pélvica",
      "Distração pélvica",
      "Thigh thrust",
      "Sacral thrust",
      "Teste de fluido sacral",
      "Teste sacro extensao de perna",
      "Teste de flexao em pe (D/E)",
      "Teste de flexao de joelho (Gillet)",
      "Funning test",
    ]),
  },
  {
    regiao: "QUADRIL",
    titulo: "Quadril (coxo-femoral)",
    testes: makeTests([
      "FADIR",
      "FABER",
      "Thomas",
      "Ober",
      "Trendelenburg",
      "Ely",
      "Log roll",
    ]),
  },
  {
    regiao: "JOELHO",
    titulo: "Joelho",
    testes: makeTests([
      "Lachman",
      "Gaveta anterior",
      "Gaveta posterior",
      "Pivot shift",
      "McMurray",
      "Apley",
      "Estresse em valgo",
      "Estresse em varo",
      "Clarke (patelofemoral)",
    ]),
  },
  {
    regiao: "TORNOZELO_PE",
    titulo: "Tornozelo e pé",
    testes: makeTests([
      "Gaveta anterior do tornozelo",
      "Inclinação talar",
      "Thompson (Aquiles)",
      "Kleiger",
      "Compressão da fíbula",
      "Windlass",
      "Navicular drop",
    ]),
  },
  {
    regiao: "OMBRO",
    titulo: "Ombro",
    testes: makeTests([
      "Neer",
      "Hawkins-Kennedy",
      "Jobe (Empty can)",
      "Drop arm",
      "Speed",
      "Yergason",
      "Apprehension",
      "Relocation",
      "Lift-off",
      "Belly press",
    ]),
  },
  {
    regiao: "COTOVELO",
    titulo: "Cotovelo",
    testes: makeTests([
      "Cozen",
      "Mill",
      "Golfer's elbow test",
      "Tinel (ulnar)",
      "Estresse em valgo (LCM)",
    ]),
  },
  {
    regiao: "PUNHO_MAO",
    titulo: "Punho e mão",
    testes: makeTests([
      "Phalen",
      "Tinel",
      "Finkelstein",
      "Compressão do carpo",
      "Watson",
    ]),
  },
];

const normalizeRegionalTests = (
  incoming?: RegionalTestGroup[] | null,
): RegionalTestGroup[] => {
  const defaults = getDefaultRegionalTests();
  if (!Array.isArray(incoming) || incoming.length === 0) return defaults;

  return defaults.map((baseGroup) => {
    const foundGroup = incoming.find((g) => g?.regiao === baseGroup.regiao);
    if (!foundGroup) return baseGroup;
    const foundTests = Array.isArray(foundGroup.testes) ? foundGroup.testes : [];
    const foundByKey = new Map(
      foundTests
        .filter((test) => test?.nome)
        .map((test) => [normalizeTestKey(test.nome), test] as const),
    );
    return {
      ...baseGroup,
      testes: baseGroup.testes.map((baseTest) => {
        const baseKey = normalizeTestKey(baseTest.nome);
        const aliasKeys = (LEGACY_TEST_NAME_ALIASES[baseKey] || []).map((alias) =>
          normalizeTestKey(alias),
        );
        const found =
          foundByKey.get(baseKey) ||
          aliasKeys.map((key) => foundByKey.get(key)).find(Boolean);
        if (!found) return baseTest;
        const resultado: TestResult =
          found.resultado === "POSITIVO" || found.resultado === "NEGATIVO"
            ? found.resultado
            : "NAO_TESTADO";
        return {
          ...baseTest,
          resultado,
          selecionado: found.selecionado === true || resultado !== "NAO_TESTADO",
        };
      }),
    };
  });
};

export function buildStructuredExameFromAnamnese(
  anamnese?: Anamnese,
): ExameFisicoStructured {
  const areas = anamnese?.areasAfetadas?.map((a) => a.regiao).filter(Boolean) || [];
  const areaPrincipal = areas[0] || "Regiao principal nao definida";
  const map = mapAnamneseTipo(anamnese?.tipoDor || null);
  const inferredRegion = inferRegionFromAnamnese(anamnese);
  const inferredProfile = inferScoringProfileFromRegion(inferredRegion);
  const onsetHint =
    anamnese?.inicioProblema === "REPENTINO"
      ? "início agudo"
      : anamnese?.inicioProblema === "GRADUAL"
        ? "início insidioso"
        : anamnese?.inicioProblema === "APOS_EVENTO"
          ? "início após evento específico"
          : null;
  const originBase =
    anamnese?.mecanismoLesao === "TRAUMA"
      ? "Dor relacionada a evento traumatico"
      : anamnese?.mecanismoLesao === "SOBRECARGA"
        ? "Dor relacionada a sobrecarga funcional"
        : "Origem da dor a definir apos integracao de achados";
  const initialOrigin = onsetHint ? `${originBase}, com ${onsetHint}.` : `${originBase}.`;

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

  const baseExam: ExameFisicoStructured = {
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
      edema: "Nao informado",
      atrofiaMuscular: "Nao informado",
      marcha: "Nao informado",
    },
    movimento: {
      ativo: `Testar movimentos ativos da regiao ${areaPrincipal}.`,
      passivo: "Comparar amplitude e qualidade com ativo.",
      resistido: "Testar grupos motores principais e reproducao de sintomas.",
      reproduzDor: "Identificar movimento-chave que reproduz dor.",
      qualidadeMovimento: "Nao informado",
      compensacoes: "Nao informado",
      dorNoMovimento: "Nao informado",
    },
    padraoDor: {
      local: safeText(anamnese?.descricaoSintomas, areaPrincipal),
      irradiada: boolLabel(anamnese?.irradiacao) + (anamnese?.localIrradiacao ? ` (${anamnese.localIrradiacao})` : ""),
      comportamento: safeText(anamnese?.tempoProblema, "Comportamento temporal nao informado."),
    },
    palpacao: {
      pontosDolorosos: "Mapear pontos dolorosos por regiao e profundidade.",
      muscular: "Identificar hipertonia, dor a pressao e consistencia tecidual.",
      articular: "Avaliar dor segmentar e mobilidade acessoria.",
      pontosGatilho: "Pesquisar pontos gatilho ativos/latentes.",
      dinamicaVertebral: "Palpacao dinamica para disfuncao segmentar e resposta a movimento.",
      temperatura: "Nao informado",
      tonusMuscular: "Nao informado",
      estruturasEspecificas: "Nao informado",
      hipomobilidadeArticular:
        "Cervical (C1-C7), toracica (T1-T12), lombar (L1-L5), sacro, iliacos D/E.",
      hipomobilidadeSegmentar: {
        cervical: "Nao informado",
        toracica: "Nao informado",
        lombar: "Nao informado",
        sacro: "Nao informado",
        iliacoDireito: "Nao informado",
        iliacoEsquerdo: "Nao informado",
      },
    },
    testesFuncionais: {
      agachamento: "Nao testado",
      agachamentoUnilateral: "Nao testado",
      salto: "Nao testado",
      corrida: "Nao testado",
      estabilidade: "Nao testado",
      controleMotor: "Nao testado",
    },
    testes: {
      biomecanicos: "Selecionar testes funcionais de carga e controle motor.",
      ortopedicos: "Selecionar conforme hipotese principal e diferencial.",
      neurologicos: "Dermatomo, miotomo e reflexos profundos.",
      imagem: "Correlacionar exames de imagem com quadro clinico (se disponiveis).",
    },
    neurologico: {
      forca: "Nao informado",
      sensibilidade: "Nao informado",
      reflexos: "Nao informado",
      dermatomos: "Nao informado",
      miotomos: "Nao informado",
    },
    avaliacaoRegioes: getDefaultRegionalTests(),
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
      confiancaHipotese: "BAIXA",
      scoreEvidencia: 0,
      perfilScoring: inferredProfile,
    },
    raciocinioClinico: {
      origemProvavelDor: initialOrigin,
      estruturaEnvolvida: areaPrincipal,
      tipoLesao:
        anamnese?.tipoDor === "INFLAMATORIA"
          ? "Inflamatoria"
          : anamnese?.tipoDor === "NEUROPATICA"
            ? "Neural"
            : "Mecanica",
      fatorBiomecanicoAssociado: safeText(
        buildBiomechanicalFactorsSummary(anamnese),
        "Nao informado",
      ),
      relacaoComEsporte: safeText(
        anamnese?.historicoEsportivo,
        "Nao informado",
      ),
    },
    diagnosticoFuncionalIa: {
      disfuncaoPrincipal: "A definir com base nos testes positivos e movimento-chave.",
      cadeiaEnvolvida: "A definir com base na cadeia cinetica.",
      compensacoes: "A definir com base na observacao e movimento.",
    },
    condutaIa: {
      tecnicaManualIndicada: "A definir conforme estrutura e irritabilidade tecidual.",
      ajusteArticular: "A definir conforme hipomobilidade segmentar relevante.",
      exercicioCorretivo: "A definir conforme deficit funcional identificado.",
      liberacaoMiofascial: "A definir conforme pontos de gatilho e tonus.",
      progressaoEsportiva: "A definir conforme controle motor e resposta clinica.",
    },
    redFlags: deriveRedFlagMeta(redFlags),
  };
  return applySuggestedRegionalTests(baseExam, anamnese, true);
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

const isMeaningfulText = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) return false;
  const lowered = text.toLowerCase();
  return !(
    lowered === "nao informado" ||
    lowered === "a definir com base nos testes positivos e movimento-chave." ||
    lowered === "a definir com base na cadeia cinetica." ||
    lowered === "a definir com base na observacao e movimento." ||
    lowered === "a definir conforme estrutura e irritabilidade tecidual." ||
    lowered === "a definir conforme hipomobilidade segmentar relevante." ||
    lowered === "a definir conforme deficit funcional identificado." ||
    lowered === "a definir conforme pontos de gatilho e tonus." ||
    lowered === "a definir conforme controle motor e resposta clinica."
  );
};

const pickText = (
  current: string,
  suggestion: string,
  overwrite: boolean,
): string => {
  if (overwrite) return suggestion;
  return isMeaningfulText(current) ? current : suggestion;
};

const inferRegionFromAnamnese = (
  anamnese?: Anamnese,
): RegionalTestGroup["regiao"] | null => {
  const text = [
    ...(anamnese?.areasAfetadas || []).map((a) => a.regiao),
    anamnese?.descricaoSintomas,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text) return null;
  if (text.includes("cerv")) return "CERVICAL";
  if (text.includes("torac")) return "TORACICA";
  if (text.includes("lomb")) return "LOMBAR";
  if (text.includes("sacro") || text.includes("iliac")) return "SACROILIACA";
  if (text.includes("quadril") || text.includes("coxo")) return "QUADRIL";
  if (text.includes("joelho") || text.includes("patel")) return "JOELHO";
  if (text.includes("tornoz") || text.includes("pe ")) return "TORNOZELO_PE";
  if (text.includes("ombro")) return "OMBRO";
  if (text.includes("cotovelo")) return "COTOVELO";
  if (text.includes("punho") || text.includes("mao")) return "PUNHO_MAO";
  return null;
};

const inferScoringProfileFromRegion = (
  region: RegionalTestGroup["regiao"] | null,
): ClinicalScoringProfile => {
  if (!region) return "GERAL";
  if (
    region === "CERVICAL" ||
    region === "TORACICA" ||
    region === "LOMBAR" ||
    region === "SACROILIACA"
  ) {
    return "COLUNA";
  }
  if (region === "QUADRIL" || region === "JOELHO" || region === "TORNOZELO_PE") {
    return "MEMBRO_INFERIOR";
  }
  if (region === "OMBRO" || region === "COTOVELO" || region === "PUNHO_MAO") {
    return "MEMBRO_SUPERIOR";
  }
  return "GERAL";
};

const REGION_SUGGESTED_TEST_INDEXES: Record<RegionalTestGroup["regiao"], number[]> = {
  CERVICAL: [2, 3, 4, 5],
  TORACICA: [0, 1, 2],
  LOMBAR: [0, 1, 2, 3],
  SACROILIACA: [0, 1, 4, 5],
  QUADRIL: [0, 1, 2, 4],
  JOELHO: [0, 1, 4, 6],
  TORNOZELO_PE: [0, 1, 2, 3],
  OMBRO: [0, 1, 2, 6],
  COTOVELO: [0, 1, 2],
  PUNHO_MAO: [0, 1, 2],
};

const applySuggestedRegionalTests = (
  exam: ExameFisicoStructured,
  anamnese?: Anamnese,
  overwrite = false,
): ExameFisicoStructured => {
  const targetRegion = inferRegionFromAnamnese(anamnese);
  if (!targetRegion) return exam;

  const suggested = new Set(REGION_SUGGESTED_TEST_INDEXES[targetRegion] || []);
  if (!suggested.size) return exam;

  const baseExam: ExameFisicoStructured = {
    ...exam,
    avaliacaoRegioes: exam.avaliacaoRegioes.map((group) => {
      if (group.regiao !== targetRegion) return group;
      return {
        ...group,
        testes: group.testes.map((test, index) => {
          if (!suggested.has(index)) return test;
          if (!overwrite && test.selecionado) return test;
          return { ...test, selecionado: true };
        }),
      };
    }),
  };
  return baseExam;
};

const regionLabels: Record<RegionalTestGroup["regiao"], string> = {
  CERVICAL: "Coluna cervical",
  TORACICA: "Coluna toracica",
  LOMBAR: "Coluna lombar",
  SACROILIACA: "Sacroiliaca",
  QUADRIL: "Quadril",
  JOELHO: "Joelho",
  TORNOZELO_PE: "Tornozelo e pe",
  OMBRO: "Ombro",
  COTOVELO: "Cotovelo",
  PUNHO_MAO: "Punho e mao",
};

const inferChainByRegion = (region: RegionalTestGroup["regiao"]) => {
  switch (region) {
    case "CERVICAL":
    case "TORACICA":
      return "Cadeia axial superior";
    case "LOMBAR":
    case "SACROILIACA":
      return "Cadeia lombo-pelvica";
    case "QUADRIL":
    case "JOELHO":
    case "TORNOZELO_PE":
      return "Cadeia de membro inferior";
    case "OMBRO":
    case "COTOVELO":
    case "PUNHO_MAO":
      return "Cadeia de membro superior";
    default:
      return "Cadeia funcional global";
  }
};

const REGION_CONDUTA_HINTS: Record<
  RegionalTestGroup["regiao"],
  {
    tecnicaManual: string;
    ajuste: string;
    exercicio: string;
    progressao: string;
  }
> = {
  CERVICAL: {
    tecnicaManual: "Mobilizacao cervical e liberacao miofascial de cintura escapular.",
    ajuste: "Considerar ajuste segmentar cervical conforme irritabilidade.",
    exercicio: "Controle cervical profundo e estabilidade escapular.",
    progressao: "Progressao por tolerancia cervical, funcao e dor.",
  },
  TORACICA: {
    tecnicaManual: "Mobilizacao toracica e tecido mole peri-escapular.",
    ajuste: "Considerar ajuste toracico em segmentos hipomoveis.",
    exercicio: "Mobilidade toracica associada a controle postural.",
    progressao: "Progressao por ganho de mobilidade e funcao respiratoria/postural.",
  },
  LOMBAR: {
    tecnicaManual: "Tecnicas manuais lombo-pelvicas e modulacao de dor.",
    ajuste: "Considerar ajuste lombo-pelvico conforme exame segmentar.",
    exercicio: "Estabilidade lombo-pelvica e controle motor funcional.",
    progressao: "Progressao de carga por resposta clinica e qualidade de movimento.",
  },
  SACROILIACA: {
    tecnicaManual: "Mobilizacao sacroiliaca e liberacao miofascial regional.",
    ajuste: "Considerar ajuste sacroiliaco/iliaco conforme disfuncao.",
    exercicio: "Controle de pelve e estabilizacao de cadeia posterior/anterior.",
    progressao: "Progressao por simetria funcional e tolerancia a carga.",
  },
  QUADRIL: {
    tecnicaManual: "Mobilizacao coxo-femoral e tecidos periarticulares.",
    ajuste: "Ajuste articular de quadril conforme restricao encontrada.",
    exercicio: "Fortalecimento de gluteos e controle de valgo dinamico.",
    progressao: "Progressao para tarefas funcionais e gesto esportivo.",
  },
  JOELHO: {
    tecnicaManual: "Tecnicas para controle de dor e mobilidade tibiofemoral/patelar.",
    ajuste: "Ajuste articular conforme avaliacao de alinhamento e mobilidade.",
    exercicio: "Estabilidade de joelho, quadriceps e cadeia posterior.",
    progressao: "Progressao por estabilidade, dor e funcao em carga.",
  },
  TORNOZELO_PE: {
    tecnicaManual: "Mobilizacao de tornozelo/pe e liberacao de cadeia distal.",
    ajuste: "Ajuste de tornozelo/retrope conforme bloqueio encontrado.",
    exercicio: "Propriocepcao, controle de apoio e estabilidade distal.",
    progressao: "Progressao por controle de apoio e retorno funcional.",
  },
  OMBRO: {
    tecnicaManual: "Mobilizacao glenoumeral e liberacao miofascial escapular.",
    ajuste: "Ajuste articular de ombro/escapula conforme hipomobilidade.",
    exercicio: "Fortalecimento de manguito e controle escapular.",
    progressao: "Progressao por arco funcional e tolerancia de carga.",
  },
  COTOVELO: {
    tecnicaManual: "Tecnicas de tecido mole para extensores/flexores do antebraco.",
    ajuste: "Ajuste de cotovelo/PRUJ conforme restricao funcional.",
    exercicio: "Fortalecimento progressivo e controle de carga distal.",
    progressao: "Progressao por dor, forca e tolerancia ao uso repetitivo.",
  },
  PUNHO_MAO: {
    tecnicaManual: "Tecnicas manuais de punho e deslizamento neural distal.",
    ajuste: "Ajuste carpal conforme avaliacao mecanica.",
    exercicio: "Controle motor fino, forca de preensao e mobilidade neural.",
    progressao: "Progressao por tolerancia funcional manual.",
  },
};

const TEST_STRUCTURE_HINTS: Array<{
  token: string;
  estrutura: string;
  tipoLesao: "Mecanica" | "Inflamatoria" | "Neural";
}> = [
  { token: "Sharp", estrutura: "Estabilidade atlanto-axial", tipoLesao: "Neural" },
  { token: "Dekleyn", estrutura: "Componente vertebrobasilar cervical", tipoLesao: "Neural" },
  { token: "Spurling", estrutura: "Raiz neural cervical/disco cervical", tipoLesao: "Neural" },
  { token: "Distra", estrutura: "Componente compressivo cervical", tipoLesao: "Neural" },
  { token: "Compressao cervical", estrutura: "Compressao foraminal/facetaria cervical", tipoLesao: "Neural" },
  { token: "Jackson", estrutura: "Forame intervertebral cervical", tipoLesao: "Neural" },
  { token: "Roos", estrutura: "Desfiladeiro toracico neurovascular", tipoLesao: "Neural" },
  { token: "Adson", estrutura: "Desfiladeiro toracico vascular/neural", tipoLesao: "Neural" },
  { token: "Expansao toracica", estrutura: "Mecanica costal e mobilidade toracica global", tipoLesao: "Mecanica" },
  { token: "Mobilidade segmentar", estrutura: "Hipomobilidade segmentar toracica", tipoLesao: "Mecanica" },
  { token: "Rotacao toracica", estrutura: "Controle rotacional toracico", tipoLesao: "Mecanica" },
  { token: "Inclinacao lateral", estrutura: "Controle lateral toracico", tipoLesao: "Mecanica" },
  { token: "Schepelmann", estrutura: "Componente costovertebral toracico", tipoLesao: "Mecanica" },
  { token: "Las", estrutura: "Componente neural lombossacro", tipoLesao: "Neural" },
  { token: "Slump", estrutura: "Tecido neural mecanossensivel", tipoLesao: "Neural" },
  { token: "Schober", estrutura: "Mobilidade lombar segmentar", tipoLesao: "Mecanica" },
  { token: "Kemp", estrutura: "Complexo facetario lombar", tipoLesao: "Mecanica" },
  { token: "Instabilidade lombar", estrutura: "Estabilidade segmentar lombar", tipoLesao: "Mecanica" },
  { token: "Elevacao bilateral", estrutura: "Controle lombopelvico em cadeia posterior", tipoLesao: "Mecanica" },
  { token: "FABER", estrutura: "Quadril/SI em cadeia lombo-pelvica", tipoLesao: "Mecanica" },
  { token: "Compressao pelvica", estrutura: "Articulacao sacroiliaca", tipoLesao: "Mecanica" },
  { token: "Distracao pelvica", estrutura: "Articulacao sacroiliaca", tipoLesao: "Mecanica" },
  { token: "Gaenslen", estrutura: "Articulacao sacroiliaca", tipoLesao: "Mecanica" },
  { token: "Thigh thrust", estrutura: "Articulacao sacroiliaca", tipoLesao: "Mecanica" },
  { token: "Sacral thrust", estrutura: "Complexo sacroiliaco posterior", tipoLesao: "Mecanica" },
  { token: "fluido sacral", estrutura: "Mobilidade do fluido sacral e mecanica sacroiliaca", tipoLesao: "Mecanica" },
  { token: "sacro extensao", estrutura: "Componente sacroiliaco em extensao de membro inferior", tipoLesao: "Mecanica" },
  { token: "flexao em pe", estrutura: "Dinamica lombo-pelvica em flexao ortostatica", tipoLesao: "Mecanica" },
  { token: "Gillet", estrutura: "Dinamica sacroiliaca funcional", tipoLesao: "Mecanica" },
  { token: "Funning", estrutura: "Integracao funcional sacroiliaca", tipoLesao: "Mecanica" },
  { token: "FADIR", estrutura: "Conflito femoroacetabular/labrum", tipoLesao: "Mecanica" },
  { token: "Thomas", estrutura: "Flexores de quadril e cadeia anterior", tipoLesao: "Mecanica" },
  { token: "Ober", estrutura: "Banda iliotibial/cadeia lateral", tipoLesao: "Mecanica" },
  { token: "Trendelenburg", estrutura: "Complexo abdutor do quadril", tipoLesao: "Mecanica" },
  { token: "Ely", estrutura: "Quadriceps/reto femoral em cadeia anterior", tipoLesao: "Mecanica" },
  { token: "Log roll", estrutura: "Capsula/labrum do quadril", tipoLesao: "Mecanica" },
  { token: "Lachman", estrutura: "Ligamento cruzado anterior", tipoLesao: "Mecanica" },
  { token: "Gaveta anterior", estrutura: "Complexo anterior ligamentar", tipoLesao: "Mecanica" },
  { token: "Gaveta posterior", estrutura: "Ligamento cruzado posterior", tipoLesao: "Mecanica" },
  { token: "Pivot", estrutura: "Instabilidade anterolateral do joelho", tipoLesao: "Mecanica" },
  { token: "McMurray", estrutura: "Menisco", tipoLesao: "Mecanica" },
  { token: "Apley", estrutura: "Menisco/superficie articular", tipoLesao: "Mecanica" },
  { token: "Clarke", estrutura: "Componente patelofemoral", tipoLesao: "Inflamatoria" },
  { token: "valgo", estrutura: "Ligamento colateral medial", tipoLesao: "Mecanica" },
  { token: "varo", estrutura: "Ligamento colateral lateral", tipoLesao: "Mecanica" },
  { token: "Thompson", estrutura: "Tendao de Aquiles", tipoLesao: "Mecanica" },
  { token: "Gaveta anterior do tornozelo", estrutura: "Ligamento talofibular anterior", tipoLesao: "Mecanica" },
  { token: "Kleiger", estrutura: "Complexo sindesmotico/medial do tornozelo", tipoLesao: "Mecanica" },
  { token: "Inclinacao talar", estrutura: "Complexo ligamentar lateral do tornozelo", tipoLesao: "Mecanica" },
  { token: "Compressao da fibula", estrutura: "Sindesmose tibiofibular distal", tipoLesao: "Mecanica" },
  { token: "Windlass", estrutura: "Fascia plantar/arco longitudinal medial", tipoLesao: "Mecanica" },
  { token: "Navicular drop", estrutura: "Controle do arco plantar", tipoLesao: "Mecanica" },
  { token: "Neer", estrutura: "Espaco subacromial", tipoLesao: "Inflamatoria" },
  { token: "Hawkins", estrutura: "Manguito rotador/subacromial", tipoLesao: "Inflamatoria" },
  { token: "Jobe", estrutura: "Manguito rotador (supraespinal)", tipoLesao: "Mecanica" },
  { token: "Drop arm", estrutura: "Manguito rotador", tipoLesao: "Mecanica" },
  { token: "Speed", estrutura: "Tendao da cabeca longa do biceps", tipoLesao: "Inflamatoria" },
  { token: "Yergason", estrutura: "Tendao da cabeca longa do biceps", tipoLesao: "Inflamatoria" },
  { token: "Apprehension", estrutura: "Instabilidade glenoumeral anterior", tipoLesao: "Mecanica" },
  { token: "Relocation", estrutura: "Instabilidade glenoumeral", tipoLesao: "Mecanica" },
  { token: "Lift-off", estrutura: "Subescapular", tipoLesao: "Mecanica" },
  { token: "Belly press", estrutura: "Subescapular", tipoLesao: "Mecanica" },
  { token: "Cozen", estrutura: "Extensores do punho (epicondilo lateral)", tipoLesao: "Inflamatoria" },
  { token: "Mill", estrutura: "Complexo extensor lateral do cotovelo", tipoLesao: "Inflamatoria" },
  { token: "Golfer", estrutura: "Flexores-pronadores mediais do cotovelo", tipoLesao: "Inflamatoria" },
  { token: "Estresse em valgo (LCM)", estrutura: "Ligamento colateral medial do cotovelo", tipoLesao: "Mecanica" },
  { token: "Phalen", estrutura: "Tunel do carpo", tipoLesao: "Neural" },
  { token: "Tinel", estrutura: "Estrutura neural periferica", tipoLesao: "Neural" },
  { token: "Finkelstein", estrutura: "Tendao abdutor/extensor do polegar", tipoLesao: "Inflamatoria" },
  { token: "Compressao do carpo", estrutura: "Tunel do carpo", tipoLesao: "Neural" },
  { token: "Watson", estrutura: "Instabilidade escafolunar", tipoLesao: "Mecanica" },
];

const isFunctionalDeficit = (value?: string | null): boolean => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  if (text === "nao testado" || text === "não testado") return false;
  const negativeTokens = [
    "alter",
    "compens",
    "dor",
    "instab",
    "limit",
    "reduz",
    "fraco",
    "assimetr",
    "dific",
  ];
  return negativeTokens.some((token) => text.includes(token));
};

export function enrichStructuredExameWithClinicalLogic(
  exam: ExameFisicoStructured,
  anamnese?: Anamnese,
  options?: { overwrite?: boolean; recalculateDecision?: boolean },
): ExameFisicoStructured {
  const overwrite = options?.overwrite === true;
  const recalculateDecision = options?.recalculateDecision === true;
  const preparedExam = applySuggestedRegionalTests(exam, anamnese, false);
  const scoringProfile =
    preparedExam.cruzamentoFinal.perfilScoring || "GERAL";
  const regionSignals = preparedExam.avaliacaoRegioes
    .map((group) => {
      const positivos = group.testes.filter((test) => test.resultado === "POSITIVO");
      const selecionados = group.testes.filter(
        (test) => test.selecionado && test.resultado === "NAO_TESTADO",
      );
      const scorePositivos = positivos.reduce(
        (acc, current) => acc + getWeightedPositiveScore(current.nome),
        0,
      );
      const weighted =
        (scorePositivos + selecionados.length) *
        getProfileRegionWeight(scoringProfile, group.regiao);
      const score = Math.round(weighted);
      return { regiao: group.regiao, titulo: group.titulo, positivos, selecionados, score };
    })
    .filter((item) => item.score > 0);

  const positiveGroups = regionSignals
    .map((group) => ({
      regiao: group.regiao,
      titulo: group.titulo,
      positivos: group.positivos,
    }))
    .filter((item) => item.positivos.length > 0);

  const primaryRegion =
    regionSignals.sort((a, b) => b.score - a.score)[0]
      ?.regiao || inferRegionFromAnamnese(anamnese);

  const primaryRegionLabel = primaryRegion
    ? regionLabels[primaryRegion]
    : "Regiao nao definida";
  const positiveTestsSummary = positiveGroups
    .flatMap((group) =>
      group.positivos.map((test) => `${regionLabels[group.regiao]}: ${test.nome}`),
    )
    .slice(0, 6)
    .join("; ");
  const pendingSuggestedTestsSummary = regionSignals
    .flatMap((group) =>
      group.selecionados.map(
        (test) => `${regionLabels[group.regiao]}: ${test.nome}`,
      ),
    )
    .slice(0, 6)
    .join("; ");

  const testsPositiveCount = positiveGroups.reduce(
    (acc, item) => acc + item.positivos.length,
    0,
  );
  const functionalDeficitCount = [
    preparedExam.testesFuncionais.agachamento,
    preparedExam.testesFuncionais.agachamentoUnilateral,
    preparedExam.testesFuncionais.salto,
    preparedExam.testesFuncionais.corrida,
    preparedExam.testesFuncionais.estabilidade,
    preparedExam.testesFuncionais.controleMotor,
  ].reduce((acc, current) => (isFunctionalDeficit(current) ? acc + 1 : acc), 0);
  const functionalEvidenceScore = Math.min(functionalDeficitCount, 4);
  const totalEvidenceScore = regionSignals.reduce((acc, item) => acc + item.score, 0);
  const totalEvidenceScoreWithFunction = totalEvidenceScore + functionalEvidenceScore;
  const highComplexity = testsPositiveCount >= 4 || functionalDeficitCount >= 3;

  const riskPriority: ExameFisicoStructured["cruzamentoFinal"]["prioridade"] =
    preparedExam.redFlags.criticalTriggered
      ? "ENCAMINHAMENTO_IMEDIATO"
      : highComplexity
        ? "ALTA"
        : testsPositiveCount >= 2
          ? "MEDIA"
          : "BAIXA";
  const confidenceLevel: ExameFisicoStructured["cruzamentoFinal"]["confiancaHipotese"] =
    testsPositiveCount >= CONFIDENCE_RULES.highPositiveCount ||
    totalEvidenceScoreWithFunction >= CONFIDENCE_RULES.highScore
      ? "ALTA"
      : testsPositiveCount >= CONFIDENCE_RULES.moderatePositiveCount ||
          totalEvidenceScoreWithFunction >= CONFIDENCE_RULES.moderateScore
        ? "MODERADA"
        : "BAIXA";

  const estruturaBase =
    primaryRegionLabel +
    (testsPositiveCount > 0 ? ` com ${testsPositiveCount} teste(s) positivo(s)` : "");

  const relacaoEsporte = isMeaningfulText(anamnese?.historicoEsportivo)
    ? String(anamnese?.historicoEsportivo || "").trim()
    : "Sem relacao esportiva clara no momento.";

  const allPositiveTests = positiveGroups.flatMap((g) =>
    g.positivos.map((t) => ({ regiao: g.regiao, nome: t.nome })),
  );
  const structureHints = allPositiveTests
    .map((item) => {
      const hint = TEST_STRUCTURE_HINTS.find((h) => item.nome.includes(h.token));
      return hint ? { ...hint, regiao: item.regiao } : null;
    })
    .filter(Boolean) as Array<{
    token: string;
    estrutura: string;
    tipoLesao: "Mecanica" | "Inflamatoria" | "Neural";
    regiao: RegionalTestGroup["regiao"];
  }>;

  const structureSuggestion = structureHints[0]?.estrutura || estruturaBase;
  const neuralEvidence =
    structureHints.some((h) => h.tipoLesao === "Neural") ||
    anamnese?.tipoDor === "NEUROPATICA";
  const inflamEvidence =
    structureHints.some((h) => h.tipoLesao === "Inflamatoria") ||
    anamnese?.tipoDor === "INFLAMATORIA";
  const traumaEvidence = anamnese?.mecanismoLesao === "TRAUMA";
  const onsetHint =
    anamnese?.inicioProblema === "REPENTINO"
      ? "início agudo"
      : anamnese?.inicioProblema === "GRADUAL"
        ? "início insidioso"
        : anamnese?.inicioProblema === "APOS_EVENTO"
          ? "início após evento específico"
          : null;

  const tipoLesaoSuggestion = neuralEvidence
    ? "Neural"
    : inflamEvidence
      ? "Inflamatoria"
      : traumaEvidence
        ? "Mecanica pos-traumatica"
        : "Mecanica";

  const originBase = traumaEvidence
    ? `Origem provavel pos-traumatica em ${primaryRegionLabel.toLowerCase()}`
    : anamnese?.mecanismoLesao === "SOBRECARGA"
      ? `Origem provavel por sobrecarga funcional em ${primaryRegionLabel.toLowerCase()}`
      : `Origem provavel mecanico-funcional em ${primaryRegionLabel.toLowerCase()}`;
  const originSuggestion = onsetHint
    ? `${originBase}, com ${onsetHint}.`
    : `${originBase}.`;

  const condutaHint = primaryRegion
    ? REGION_CONDUTA_HINTS[primaryRegion]
    : {
        tecnicaManual: "Tecnica manual conforme irritabilidade e disfuncao principal.",
        ajuste: "Ajuste articular apenas se houver hipomobilidade relevante.",
        exercicio: "Exercicio corretivo orientado por deficits funcionais.",
        progressao: "Progressao por funcao, dor e tolerancia a carga.",
      };

  const baseExam: ExameFisicoStructured = {
    ...preparedExam,
    cruzamentoFinal: {
      ...preparedExam.cruzamentoFinal,
      hipotesePrincipal: pickText(
        preparedExam.cruzamentoFinal.hipotesePrincipal,
        `Disfuncao mecanico-funcional predominante em ${primaryRegionLabel}.`,
        overwrite,
      ),
      hipotesesSecundarias: pickText(
        preparedExam.cruzamentoFinal.hipotesesSecundarias,
        testsPositiveCount
          ? pendingSuggestedTestsSummary
            ? `Correlacionar positivos: ${positiveTestsSummary}. Proximos testes sugeridos: ${pendingSuggestedTestsSummary}.`
            : `Considerar correlacao com: ${positiveTestsSummary}.`
          : pendingSuggestedTestsSummary
            ? `Testes sugeridos pendentes para confirmar hipotese: ${pendingSuggestedTestsSummary}.`
            : "Hipoteses secundarias a definir conforme testes complementares.",
        overwrite,
      ),
      inconsistencias: pickText(
        preparedExam.cruzamentoFinal.inconsistencias,
        "Revisar sinais nao mecanicos e divergencias entre dor referida e testes.",
        overwrite,
      ),
      condutaDirecionada: pickText(
        preparedExam.cruzamentoFinal.condutaDirecionada,
        preparedExam.redFlags.criticalTriggered
          ? "Interromper fluxo terapeutico e encaminhar imediatamente."
          : functionalDeficitCount > 0
            ? `Priorizar intervencao na ${primaryRegionLabel.toLowerCase()} com foco em controle motor/estabilidade e reavaliacao funcional progressiva.`
            : `Priorizar intervencao na ${primaryRegionLabel.toLowerCase()} com reavaliacao funcional progressiva.`,
        overwrite,
      ),
      prioridade:
        overwrite || recalculateDecision
          ? riskPriority
          : preparedExam.cruzamentoFinal.prioridade,
      confiancaHipotese: overwrite || recalculateDecision
        ? confidenceLevel
        : preparedExam.cruzamentoFinal.confiancaHipotese,
      scoreEvidencia: totalEvidenceScoreWithFunction,
      perfilScoring: scoringProfile,
    },
    raciocinioClinico: {
      origemProvavelDor: pickText(
        preparedExam.raciocinioClinico.origemProvavelDor,
        originSuggestion,
        overwrite,
      ),
      estruturaEnvolvida: pickText(
        preparedExam.raciocinioClinico.estruturaEnvolvida,
        structureSuggestion,
        overwrite,
      ),
      tipoLesao: pickText(
        preparedExam.raciocinioClinico.tipoLesao,
        tipoLesaoSuggestion,
        overwrite,
      ),
      fatorBiomecanicoAssociado: pickText(
        preparedExam.raciocinioClinico.fatorBiomecanicoAssociado,
        isMeaningfulText(anamnese?.fatoresPiora) ||
        isMeaningfulText(anamnese?.fatorAlivio)
          ? buildBiomechanicalFactorsSummary(anamnese)
          : testsPositiveCount
            ? `Padrao alterado em ${primaryRegionLabel.toLowerCase()} com compensacoes associadas.`
            : "Sem fator biomecanico principal definido.",
        overwrite,
      ),
      relacaoComEsporte: pickText(
        preparedExam.raciocinioClinico.relacaoComEsporte,
        relacaoEsporte,
        overwrite,
      ),
    },
    diagnosticoFuncionalIa: {
      disfuncaoPrincipal: pickText(
        preparedExam.diagnosticoFuncionalIa.disfuncaoPrincipal,
        `Disfuncao funcional predominante em ${primaryRegionLabel}.`,
        overwrite,
      ),
      cadeiaEnvolvida: pickText(
        preparedExam.diagnosticoFuncionalIa.cadeiaEnvolvida,
        primaryRegion ? inferChainByRegion(primaryRegion) : "Cadeia funcional global",
        overwrite,
      ),
      compensacoes: pickText(
        preparedExam.diagnosticoFuncionalIa.compensacoes,
        testsPositiveCount || functionalDeficitCount
          ? "Compensacoes observadas em padrao de movimento e testes funcionais."
          : "Compensacoes ainda nao confirmadas.",
        overwrite,
      ),
    },
    condutaIa: {
      tecnicaManualIndicada: pickText(
        preparedExam.condutaIa.tecnicaManualIndicada,
        condutaHint.tecnicaManual,
        overwrite,
      ),
      ajusteArticular: pickText(
        preparedExam.condutaIa.ajusteArticular,
        condutaHint.ajuste,
        overwrite,
      ),
      exercicioCorretivo: pickText(
        preparedExam.condutaIa.exercicioCorretivo,
        condutaHint.exercicio,
        overwrite,
      ),
      liberacaoMiofascial: pickText(
        preparedExam.condutaIa.liberacaoMiofascial,
        "Liberacao miofascial em pontos gatilho e cadeias tensionais relevantes.",
        overwrite,
      ),
      progressaoEsportiva: pickText(
        preparedExam.condutaIa.progressaoEsportiva,
        condutaHint.progressao,
        overwrite,
      ),
    },
  };
  return baseExam;
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
    return {
      ...parsed,
      observacao: {
        ...parsed.observacao,
        edema: parsed.observacao?.edema || "Nao informado",
        atrofiaMuscular: parsed.observacao?.atrofiaMuscular || "Nao informado",
        marcha: parsed.observacao?.marcha || "Nao informado",
      },
      movimento: {
        ...parsed.movimento,
        qualidadeMovimento: parsed.movimento?.qualidadeMovimento || "Nao informado",
        compensacoes: parsed.movimento?.compensacoes || "Nao informado",
        dorNoMovimento: parsed.movimento?.dorNoMovimento || "Nao informado",
      },
      palpacao: {
        ...parsed.palpacao,
        hipomobilidadeSegmentar: {
          cervical:
            parsed.palpacao?.hipomobilidadeSegmentar?.cervical || "Nao informado",
          toracica:
            parsed.palpacao?.hipomobilidadeSegmentar?.toracica || "Nao informado",
          lombar:
            parsed.palpacao?.hipomobilidadeSegmentar?.lombar || "Nao informado",
          sacro:
            parsed.palpacao?.hipomobilidadeSegmentar?.sacro || "Nao informado",
          iliacoDireito:
            parsed.palpacao?.hipomobilidadeSegmentar?.iliacoDireito ||
            "Nao informado",
          iliacoEsquerdo:
            parsed.palpacao?.hipomobilidadeSegmentar?.iliacoEsquerdo ||
            "Nao informado",
        },
        pontosDolorosos:
          parsed.palpacao?.pontosDolorosos || "Nao informado",
        temperatura: parsed.palpacao?.temperatura || "Nao informado",
        tonusMuscular: parsed.palpacao?.tonusMuscular || "Nao informado",
        estruturasEspecificas: parsed.palpacao?.estruturasEspecificas || "Nao informado",
        hipomobilidadeArticular:
          parsed.palpacao?.hipomobilidadeArticular ||
          buildHipomobilidadeSummary(parsed.palpacao?.hipomobilidadeSegmentar || {}),
      },
      testesFuncionais: {
        agachamento: parsed.testesFuncionais?.agachamento || "Nao testado",
        agachamentoUnilateral:
          parsed.testesFuncionais?.agachamentoUnilateral || "Nao testado",
        salto: parsed.testesFuncionais?.salto || "Nao testado",
        corrida: parsed.testesFuncionais?.corrida || "Nao testado",
        estabilidade: parsed.testesFuncionais?.estabilidade || "Nao testado",
        controleMotor: parsed.testesFuncionais?.controleMotor || "Nao testado",
      },
      neurologico: {
        forca: parsed.neurologico?.forca || "Nao informado",
        sensibilidade: parsed.neurologico?.sensibilidade || "Nao informado",
        reflexos: parsed.neurologico?.reflexos || "Nao informado",
        dermatomos: parsed.neurologico?.dermatomos || "Nao informado",
        miotomos: parsed.neurologico?.miotomos || "Nao informado",
      },
      avaliacaoRegioes: normalizeRegionalTests(parsed.avaliacaoRegioes),
      cruzamentoFinal: {
        ...parsed.cruzamentoFinal,
        confiancaHipotese:
          parsed.cruzamentoFinal?.confiancaHipotese === "ALTA" ||
          parsed.cruzamentoFinal?.confiancaHipotese === "MODERADA"
            ? parsed.cruzamentoFinal.confiancaHipotese
            : "BAIXA",
        scoreEvidencia:
          typeof parsed.cruzamentoFinal?.scoreEvidencia === "number"
            ? parsed.cruzamentoFinal.scoreEvidencia
            : 0,
        perfilScoring:
          parsed.cruzamentoFinal?.perfilScoring === "COLUNA" ||
          parsed.cruzamentoFinal?.perfilScoring === "MEMBRO_INFERIOR" ||
          parsed.cruzamentoFinal?.perfilScoring === "MEMBRO_SUPERIOR" ||
          parsed.cruzamentoFinal?.perfilScoring === "ESPORTIVO"
            ? parsed.cruzamentoFinal.perfilScoring
            : "GERAL",
      },
      raciocinioClinico: {
        origemProvavelDor:
          parsed.raciocinioClinico?.origemProvavelDor || "Nao informado",
        estruturaEnvolvida:
          parsed.raciocinioClinico?.estruturaEnvolvida || "Nao informado",
        tipoLesao: parsed.raciocinioClinico?.tipoLesao || "Nao informado",
        fatorBiomecanicoAssociado:
          parsed.raciocinioClinico?.fatorBiomecanicoAssociado || "Nao informado",
        relacaoComEsporte:
          parsed.raciocinioClinico?.relacaoComEsporte || "Nao informado",
      },
      diagnosticoFuncionalIa: {
        disfuncaoPrincipal:
          parsed.diagnosticoFuncionalIa?.disfuncaoPrincipal || "Nao informado",
        cadeiaEnvolvida:
          parsed.diagnosticoFuncionalIa?.cadeiaEnvolvida || "Nao informado",
        compensacoes:
          parsed.diagnosticoFuncionalIa?.compensacoes || "Nao informado",
      },
      condutaIa: {
        tecnicaManualIndicada:
          parsed.condutaIa?.tecnicaManualIndicada || "Nao informado",
        ajusteArticular: parsed.condutaIa?.ajusteArticular || "Nao informado",
        exercicioCorretivo:
          parsed.condutaIa?.exercicioCorretivo || "Nao informado",
        liberacaoMiofascial:
          parsed.condutaIa?.liberacaoMiofascial || "Nao informado",
        progressaoEsportiva:
          parsed.condutaIa?.progressaoEsportiva || "Nao informado",
      },
    };
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
    `Edema: ${exam.observacao.edema}`,
    `Atrofia muscular: ${exam.observacao.atrofiaMuscular}`,
    `Marcha: ${exam.observacao.marcha}`,
    "",
    "Movimento",
    `Ativo: ${exam.movimento.ativo}`,
    `Passivo: ${exam.movimento.passivo}`,
    `Resistido: ${exam.movimento.resistido}`,
    `Reproduz dor: ${exam.movimento.reproduzDor}`,
    `Qualidade do movimento: ${exam.movimento.qualidadeMovimento}`,
    `Compensacoes: ${exam.movimento.compensacoes}`,
    `Dor no movimento: ${exam.movimento.dorNoMovimento}`,
    "",
    "Padrao de dor",
    `Local: ${exam.padraoDor.local}`,
    `Irradiada: ${exam.padraoDor.irradiada}`,
    `Comportamento: ${exam.padraoDor.comportamento}`,
    "",
    "Palpacao",
    `Pontos dolorosos: ${exam.palpacao.pontosDolorosos}`,
    `Muscular: ${exam.palpacao.muscular}`,
    `Articular: ${exam.palpacao.articular}`,
    `Pontos gatilho: ${exam.palpacao.pontosGatilho}`,
    `Palpacao dinamica vertebral: ${exam.palpacao.dinamicaVertebral}`,
    `Temperatura: ${exam.palpacao.temperatura}`,
    `Tonus muscular: ${exam.palpacao.tonusMuscular}`,
    `Estruturas especificas: ${exam.palpacao.estruturasEspecificas}`,
    `Hipomobilidade articular: ${exam.palpacao.hipomobilidadeArticular}`,
    `Hipomobilidade segmentar - Cervical: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.cervical)}`,
    `Hipomobilidade segmentar - Toracica: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.toracica)}`,
    `Hipomobilidade segmentar - Lombar: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.lombar)}`,
    `Hipomobilidade segmentar - Sacro: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.sacro)}`,
    `Hipomobilidade segmentar - Iliaco D: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.iliacoDireito)}`,
    `Hipomobilidade segmentar - Iliaco E: ${safeText(exam.palpacao.hipomobilidadeSegmentar?.iliacoEsquerdo)}`,
    "",
    "Testes funcionais",
    `Agachamento: ${exam.testesFuncionais.agachamento}`,
    `Agachamento unilateral: ${exam.testesFuncionais.agachamentoUnilateral}`,
    `Salto: ${exam.testesFuncionais.salto}`,
    `Corrida: ${exam.testesFuncionais.corrida}`,
    `Estabilidade: ${exam.testesFuncionais.estabilidade}`,
    `Controle motor: ${exam.testesFuncionais.controleMotor}`,
    "",
    "Testes",
    `Biomecanicos: ${exam.testes.biomecanicos}`,
    `Ortopedicos: ${exam.testes.ortopedicos}`,
    `Neurologicos: ${exam.testes.neurologicos}`,
    `Imagem: ${exam.testes.imagem}`,
    "",
    "Neurologico",
    `Forca: ${exam.neurologico.forca}`,
    `Sensibilidade: ${exam.neurologico.sensibilidade}`,
    `Reflexos: ${exam.neurologico.reflexos}`,
    `Dermatomos: ${exam.neurologico.dermatomos}`,
    `Miotomos: ${exam.neurologico.miotomos}`,
    "",
    "Avaliacao por regioes",
    ...exam.avaliacaoRegioes.flatMap((group) => {
      const lines = [`${group.titulo}`];
      const selectedOrTested = group.testes.filter(
        (t) => t.resultado !== "NAO_TESTADO" || t.selecionado,
      );
      if (!selectedOrTested.length) {
        lines.push("- Sem testes marcados");
        return lines;
      }
      selectedOrTested.forEach((t) => {
        if (t.resultado === "NAO_TESTADO") {
          lines.push(`- ${t.nome}: Selecionado`);
          return;
        }
        lines.push(`- ${t.nome}: ${t.resultado === "POSITIVO" ? "Positivo" : "Negativo"}`);
      });
      return lines;
    }),
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
    `Confianca da hipotese: ${exam.cruzamentoFinal.confiancaHipotese}`,
    `Score de evidencia: ${exam.cruzamentoFinal.scoreEvidencia}`,
    `Perfil de scoring: ${exam.cruzamentoFinal.perfilScoring}`,
    "",
    "Raciocinio clinico",
    `Origem provavel da dor: ${exam.raciocinioClinico.origemProvavelDor}`,
    `Estrutura envolvida: ${exam.raciocinioClinico.estruturaEnvolvida}`,
    `Tipo de lesao: ${exam.raciocinioClinico.tipoLesao}`,
    `Fator biomecanico associado: ${exam.raciocinioClinico.fatorBiomecanicoAssociado}`,
    `Relacao com esporte: ${exam.raciocinioClinico.relacaoComEsporte}`,
    "",
    "Diagnostico funcional",
    `Disfuncao principal: ${exam.diagnosticoFuncionalIa.disfuncaoPrincipal}`,
    `Cadeia envolvida: ${exam.diagnosticoFuncionalIa.cadeiaEnvolvida}`,
    `Compensacoes: ${exam.diagnosticoFuncionalIa.compensacoes}`,
    "",
    "Conduta direcionada",
    `Tecnica manual indicada: ${exam.condutaIa.tecnicaManualIndicada}`,
    `Ajuste articular: ${exam.condutaIa.ajusteArticular}`,
    `Exercicio corretivo: ${exam.condutaIa.exercicioCorretivo}`,
    `Liberacao miofascial: ${exam.condutaIa.liberacaoMiofascial}`,
    `Progressao esportiva: ${exam.condutaIa.progressaoEsportiva}`,
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
