import type {
  DorClassificacaoPrincipal,
  DorSubtipoClinico,
  ExameFisicoStructured,
  RedFlagKey,
  RegionalTestGroup,
  TestResult,
} from "../../services/physicalExamModel";

export const DOR_PRINCIPAL_OPTIONS: DorClassificacaoPrincipal[] = [
  "NOCICEPTIVA",
  "NEUROPATICA",
  "NOCIPLASTICA",
  "INFLAMATORIA",
  "VISCERAL",
];

export const DOR_SUBTIPO_OPTIONS: DorSubtipoClinico[] = [
  "MECANICA",
  "DISCAL",
  "NEURAL",
  "REFERIDA",
  "INFLAMATORIA",
  "MIOFASCIAL",
  "FACETARIA",
  "NAO_MECANICA",
];

export const PRIORIDADE_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["prioridade"][] =
  ["BAIXA", "MEDIA", "ALTA", "ENCAMINHAMENTO_IMEDIATO"];

export const CONFIANCA_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["confiancaHipotese"][] =
  ["BAIXA", "MODERADA", "ALTA"];

export const SCORING_PROFILE_OPTIONS: ExameFisicoStructured["cruzamentoFinal"]["perfilScoring"][] =
  ["GERAL", "COLUNA", "MEMBRO_INFERIOR", "MEMBRO_SUPERIOR", "ESPORTIVO"];

export const RED_FLAG_LABELS: Record<RedFlagKey, string> = {
  CAUDA_EQUINA: "Cauda equina",
  FRATURA: "Fratura",
  INFECCAO: "Infecção",
  ONCOLOGICO: "Oncológico",
  NAO_MECANICA: "Dor não mecânica",
  DEFICIT_NEURO_PROGRESSIVO: "Déficit neuro progressivo",
  VASCULAR: "Vascular",
};

export const TEST_RESULT_OPTIONS: Array<{
  label: string;
  value: TestResult;
}> = [
  { label: "NAO_TESTADO", value: "NAO_TESTADO" },
  { label: "Negativo", value: "NEGATIVO" },
  { label: "Positivo", value: "POSITIVO" },
];

export type ExamPreset = {
  id: string;
  label: string;
  regions: RegionalTestGroup["regiao"][];
};

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: "COLUNA",
    label: "Coluna",
    regions: ["CERVICAL", "TORACICA", "LOMBAR", "SACROILIACA"],
  },
  {
    id: "MMII",
    label: "Membro inferior",
    regions: ["LOMBAR", "QUADRIL", "JOELHO", "TORNOZELO_PE"],
  },
  {
    id: "MMSS",
    label: "Membro superior",
    regions: ["CERVICAL", "OMBRO", "COTOVELO", "PUNHO_MAO"],
  },
  {
    id: "ESPORTIVO",
    label: "Esportivo",
    regions: ["LOMBAR", "QUADRIL", "JOELHO", "TORNOZELO_PE"],
  },
];

export const TIPO_LESAO_OPTIONS = [
  "Mecanica",
  "Inflamatoria",
  "Neural",
  "Mista",
];

export const CADEIA_OPTIONS = [
  "Cadeia axial superior",
  "Cadeia lombo-pelvica",
  "Cadeia de membro inferior",
  "Cadeia de membro superior",
  "Cadeia funcional global",
];

export const CONDUTA_PRESETS = {
  tecnicaManual: [
    "Mobilizacao articular",
    "Tecnicas de tecido mole",
    "Manipulacao de baixa amplitude",
    "Sem tecnica manual no momento",
  ],
  ajusteArticular: [
    "Ajuste segmentar cervical",
    "Ajuste segmentar toracico",
    "Ajuste segmentar lombo-pelvico",
    "Nao indicado no momento",
  ],
  exercicio: [
    "Controle motor",
    "Estabilidade lombo-pelvica",
    "Fortalecimento progressivo",
    "Mobilidade funcional",
  ],
  miofascial: [
    "Liberacao miofascial",
    "Liberacao de cadeia posterior",
    "Liberacao de cadeia anterior",
    "Nao indicado no momento",
  ],
  progressao: [
    "Progressao por dor e funcao",
    "Progressao por tolerancia a carga",
    "Progressao por controle motor",
    "Manter fase atual",
  ],
};
