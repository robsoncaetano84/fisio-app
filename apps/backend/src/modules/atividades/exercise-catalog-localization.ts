export const EXERCISE_TRANSLATION_LANGUAGES = ['pt', 'en', 'es'] as const;

export type ExerciseTranslationLanguage =
  (typeof EXERCISE_TRANSLATION_LANGUAGES)[number];

export type ExerciseTranslationFields = {
  nome?: string;
  objetivo?: string;
  descricao?: string;
  instrucoesPadrao?: string;
  cuidados?: string;
  contraindicacoes?: string;
};

export type ExerciseTranslations = Partial<
  Record<ExerciseTranslationLanguage, ExerciseTranslationFields>
>;

type ExerciseLocalizationInput = {
  nome: string;
  slug: string;
  regiaoCorporal: string;
  categoria: string;
  nivel: string;
  objetivo: string;
  descricao?: string | null;
  instrucoesPadrao: string;
  cuidados?: string | null;
  contraindicacoes?: string | null;
};

type ExerciseLocalizationOutput = {
  pt: Required<ExerciseTranslationFields>;
  translations: ExerciseTranslations;
};

type Replacement = readonly [string, string];

const PT_REPLACEMENTS: Replacement[] = [
  ['joelho a parede', 'joelho à parede'],
  ['lombo-pelvico', 'lombo-pélvico'],
  ['lombopelvico', 'lombopélvico'],
  ['controle motor', 'controle motor'],
  ['mobilidade neural', 'mobilidade neural'],
  ['propriocepcao', 'propriocepção'],
  ['coordenacao', 'coordenação'],
  ['respiracao', 'respiração'],
  ['avaliacao', 'avaliação'],
  ['prescricao', 'prescrição'],
  ['indicacao', 'indicação'],
  ['orientacao', 'orientação'],
  ['liberacao', 'liberação'],
  ['aprovacao', 'aprovação'],
  ['revisao', 'revisão'],
  ['clinica', 'clínica'],
  ['clinico', 'clínico'],
  ['catalogo', 'catálogo'],
  ['exercicio', 'exercício'],
  ['proprio', 'próprio'],
  ['fisioterapeutica', 'fisioterapêutica'],
  ['neurologicos', 'neurológicos'],
  ['neurologicas', 'neurológicas'],
  ['neurologico', 'neurológico'],
  ['neurologica', 'neurológica'],
  ['contraindicacoes', 'contraindicações'],
  ['compensacoes', 'compensações'],
  ['compensacao', 'compensação'],
  ['repeticoes', 'repetições'],
  ['posicao', 'posição'],
  ['crianca', 'criança'],
  ['obstaculo', 'obstáculo'],
  ['chao', 'chão'],
  ['corrimao', 'corrimão'],
  ['tensao', 'tensão'],
  ['tracao', 'tração'],
  ['contracao', 'contração'],
  ['forca', 'força'],
  ['forcada', 'forçada'],
  ['forcado', 'forçado'],
  ['rapidos', 'rápidos'],
  ['rapido', 'rápido'],
  ['apos', 'após'],
  ['ate', 'até'],
  ['nao', 'não'],
  ['necessario', 'necessário'],
  ['necessaria', 'necessária'],
  ['possivel', 'possível'],
  ['sensivel', 'sensível'],
  ['irritacao', 'irritação'],
  ['inflamacao', 'inflamação'],
  ['deficit', 'déficit'],
  ['intensao', 'intensão'],
  ['toracica', 'torácica'],
  ['toracico', 'torácico'],
  ['torax', 'tórax'],
  ['cervical', 'cervical'],
  ['lombar', 'lombar'],
  ['pelvica', 'pélvica'],
  ['pelvico', 'pélvico'],
  ['escapula', 'escápula'],
  ['escapulas', 'escápulas'],
  ['suboccipital', 'suboccipital'],
  ['latissimo', 'latíssimo'],
  ['gluteos', 'glúteos'],
  ['gluteo', 'glúteo'],
  ['quadriceps', 'quadríceps'],
  ['gastrocnemio', 'gastrocnêmio'],
  ['soleo', 'sóleo'],
  ['isquiotibiais', 'isquiotibiais'],
  ['ciatica', 'ciática'],
  ['ciatico', 'ciático'],
  ['fascia', 'fáscia'],
  ['abdomen', 'abdômen'],
  ['abdominais', 'abdominais'],
  ['abdominal', 'abdominal'],
  ['flexao', 'flexão'],
  ['extensao', 'extensão'],
  ['elevacao', 'elevação'],
  ['rotacao', 'rotação'],
  ['retracao', 'retração'],
  ['protracao', 'protração'],
  ['protrusao', 'protrusão'],
  ['inclinacao', 'inclinação'],
  ['abducao', 'abdução'],
  ['aducao', 'adução'],
  ['oposicao', 'oposição'],
  ['pronacao', 'pronação'],
  ['supinacao', 'supinação'],
  ['dorsiflexao', 'dorsiflexão'],
  ['eversao', 'eversão'],
  ['inversao', 'inversão'],
  ['antepe', 'antepé'],
  ['hallux', 'hálux'],
  ['mobilizacao', 'mobilização'],
  ['bascula', 'báscula'],
  ['maos', 'mãos'],
  ['mao', 'mão'],
  ['bracos', 'braços'],
  ['braco', 'braço'],
  ['antebraco', 'antebraço'],
  ['cabeca', 'cabeça'],
  ['pescoco', 'pescoço'],
  ['pes', 'pés'],
  ['pe', 'pé'],
  ['estavel', 'estável'],
  ['toleravel', 'tolerável'],
  ['confortavel', 'confortável'],
  ['irritavel', 'irritável'],
  ['dinamico', 'dinâmico'],
  ['isometrica', 'isométrica'],
  ['isometrico', 'isométrico'],
  ['diafragmatica', 'diafragmática'],
  ['semicerrados', 'semicerrados'],
  ['retrogada', 'retrógrada'],
  ['retrograda', 'retrógrada'],
  ['regiao', 'região'],
  ['direcao', 'direção'],
  ['coracao', 'coração'],
];

const EN_PHRASES: Replacement[] = [
  ['exercicio novo', 'new exercise'],
  ['em decubito dorsal', 'supine'],
  ['em decubito ventral', 'prone'],
  ['em decubito lateral', 'side-lying'],
  ['em quatro apoios', 'in quadruped'],
  ['em pe', 'standing'],
  ['na parede', 'against wall'],
  ['no rolo', 'on roller'],
  ['na bancada', 'on bench'],
  ['na porta', 'in doorway'],
  ['com apoio', 'with support'],
  ['com faixa', 'with band'],
  ['com bastao', 'with dowel'],
  ['com toalha', 'with towel'],
  ['com bola', 'with ball'],
  ['com halter', 'with dumbbell'],
  ['sentada', 'seated'],
  ['sentado', 'seated'],
  ['meio ajoelhado', 'half-kneeling'],
  ['ponta dos pes', 'tiptoes'],
  ['ponta do pe', 'toe'],
  ['dedos do pe', 'toes'],
  ['puncao', 'puncture'],
];

const ES_PHRASES: Replacement[] = [
  ['exercicio novo', 'ejercicio nuevo'],
  ['em decubito dorsal', 'en decúbito supino'],
  ['em decubito ventral', 'en decúbito prono'],
  ['em decubito lateral', 'en decúbito lateral'],
  ['em quatro apoios', 'en cuadrupedia'],
  ['em pe', 'de pie'],
  ['na parede', 'en la pared'],
  ['no rolo', 'en rodillo'],
  ['na bancada', 'en banco'],
  ['na porta', 'en puerta'],
  ['com apoio', 'con apoyo'],
  ['com faixa', 'con banda'],
  ['com bastao', 'con bastón'],
  ['com toalha', 'con toalla'],
  ['com bola', 'con pelota'],
  ['com halter', 'con mancuerna'],
  ['sentada', 'sentado'],
  ['sentado', 'sentado'],
  ['meio ajoelhado', 'medio arrodillado'],
  ['ponta dos pes', 'puntas de los pies'],
  ['ponta do pe', 'punta del pie'],
  ['dedos do pe', 'dedos del pie'],
];

const EN_WORDS: Record<string, string> = {
  abertura: 'opening',
  abducao: 'abduction',
  abdomen: 'abdomen',
  abdominal: 'abdominal',
  aducao: 'adduction',
  alcance: 'reach',
  alternada: 'alternating',
  alternado: 'alternating',
  alternados: 'alternating',
  anterior: 'anterior',
  anti: 'anti',
  apoio: 'support',
  apenas: 'only',
  arco: 'arch',
  assistida: 'assisted',
  assistido: 'assisted',
  ativa: 'active',
  ativo: 'active',
  atm: 'tmj',
  baixa: 'low',
  baixo: 'low',
  balance: 'balance',
  bilateral: 'bilateral',
  bird: 'bird',
  board: 'board',
  braco: 'arm',
  bracos: 'arms',
  calcanhar: 'heel',
  calcanhares: 'heels',
  caminhada: 'walking',
  cervical: 'cervical',
  ciatica: 'sciatic',
  ciatico: 'sciatic',
  circulos: 'circles',
  clamshell: 'clamshell',
  codman: 'Codman',
  coluna: 'spine',
  controle: 'control',
  controlada: 'controlled',
  controlado: 'controlled',
  coordenacao: 'coordination',
  core: 'core',
  costal: 'rib',
  coxa: 'thigh',
  crianca: 'child',
  cruzado: 'cross-body',
  curta: 'short',
  curto: 'short',
  dedos: 'fingers',
  descer: 'step down',
  descida: 'descent',
  deslizamento: 'glide',
  desvio: 'deviation',
  diafragmatica: 'diaphragmatic',
  diagonal: 'diagonal',
  do: 'of',
  dog: 'dog',
  doming: 'doming',
  dorsal: 'supine',
  dorsiflexao: 'dorsiflexion',
  dupla: 'dual',
  elevacao: 'raise',
  elevador: 'levator',
  equilibrio: 'balance',
  escapula: 'scapula',
  escapular: 'scapular',
  exercicio: 'exercise',
  estreita: 'narrow',
  eversao: 'eversion',
  expansao: 'expansion',
  extensao: 'extension',
  externa: 'external',
  fascia: 'fascia',
  fechamento: 'closing',
  flexao: 'flexion',
  flexores: 'flexors',
  foot: 'foot',
  frontal: 'front',
  funcional: 'functional',
  gato: 'cat',
  global: 'global',
  graus: 'degrees',
  hallux: 'hallux',
  hops: 'hops',
  inclinacao: 'tilt',
  inclinada: 'inclined',
  interna: 'internal',
  inversao: 'inversion',
  isolada: 'isolated',
  joelho: 'knee',
  joelhos: 'knees',
  labial: 'lip',
  labios: 'lips',
  lateral: 'lateral',
  latissimo: 'latissimus',
  levantar: 'stand up',
  leve: 'light',
  livro: 'book',
  lombar: 'lumbar',
  mandibular: 'jaw',
  marcha: 'march',
  mao: 'hand',
  maos: 'hands',
  manual: 'manual',
  mediano: 'median',
  menores: 'lesser',
  mobilidade: 'mobility',
  mobilizacao: 'mobilization',
  nervo: 'nerve',
  neural: 'neural',
  ocular: 'ocular',
  olhos: 'eyes',
  ombro: 'shoulder',
  ombros: 'shoulders',
  oposicao: 'opposition',
  panturrilha: 'calf',
  parcial: 'partial',
  parede: 'wall',
  passada: 'step',
  pe: 'foot',
  peito: 'chest',
  pelvica: 'pelvic',
  pelvico: 'pelvic',
  perna: 'leg',
  peso: 'weight',
  piriforme: 'piriformis',
  plantar: 'plantar',
  pliometria: 'plyometrics',
  polegar: 'thumb',
  ponte: 'bridge',
  posterior: 'posterior',
  press: 'press',
  progressivo: 'progressive',
  pronacao: 'pronation',
  propriocepcao: 'proprioception',
  protracao: 'protraction',
  protrusao: 'protrusion',
  punho: 'wrist',
  quadril: 'hip',
  radial: 'radial',
  reacao: 'reaction',
  relaxamento: 'relaxation',
  remada: 'row',
  respiracao: 'breathing',
  reta: 'straight',
  retracao: 'retraction',
  retrograda: 'backward',
  rolo: 'roller',
  rolamento: 'rolling',
  rotacao: 'rotation',
  sem: 'without',
  semi: 'semi',
  semicerrados: 'pursed',
  serratil: 'serratus',
  short: 'short',
  simples: 'simple',
  sentado: 'seated',
  sentada: 'seated',
  sentar: 'sit',
  sobre: 'over',
  soco: 'punch',
  step: 'step',
  subir: 'step up',
  suave: 'gentle',
  supinacao: 'supination',
  tarefa: 'task',
  tibial: 'tibial',
  toalha: 'towel',
  toque: 'touch',
  toracica: 'thoracic',
  tornozelo: 'ankle',
  transferencia: 'weight shift',
  treino: 'training',
  tronco: 'trunk',
  ulnar: 'ulnar',
  unilateral: 'single-leg',
  virada: 'turn',
};

const ES_WORDS: Record<string, string> = {
  abertura: 'apertura',
  abducao: 'abducción',
  abdomen: 'abdomen',
  abdominal: 'abdominal',
  aducao: 'aducción',
  alcance: 'alcance',
  alternada: 'alternada',
  alternado: 'alternado',
  alternados: 'alternados',
  anterior: 'anterior',
  anti: 'anti',
  apoio: 'apoyo',
  apenas: 'solo',
  arco: 'arco',
  assistida: 'asistida',
  assistido: 'asistido',
  ativa: 'activa',
  ativo: 'activo',
  atm: 'atm',
  baixa: 'baja',
  baixo: 'bajo',
  balance: 'balance',
  bilateral: 'bilateral',
  bird: 'bird',
  board: 'board',
  braco: 'brazo',
  bracos: 'brazos',
  calcanhar: 'talón',
  calcanhares: 'talones',
  caminhada: 'caminata',
  cervical: 'cervical',
  ciatica: 'ciática',
  ciatico: 'ciático',
  circulos: 'círculos',
  clamshell: 'clamshell',
  codman: 'Codman',
  coluna: 'columna',
  controle: 'control',
  controlada: 'controlada',
  controlado: 'controlado',
  coordenacao: 'coordinación',
  core: 'core',
  costal: 'costal',
  coxa: 'muslo',
  crianca: 'niño',
  cruzado: 'cruzado',
  curta: 'corta',
  curto: 'corto',
  dedos: 'dedos',
  descer: 'bajar',
  descida: 'descenso',
  deslizamento: 'deslizamiento',
  desvio: 'desviación',
  diafragmatica: 'diafragmática',
  diagonal: 'diagonal',
  do: 'del',
  dog: 'dog',
  doming: 'doming',
  dorsal: 'supino',
  dorsiflexao: 'dorsiflexión',
  dupla: 'doble',
  elevacao: 'elevación',
  elevador: 'elevador',
  equilibrio: 'equilibrio',
  escapula: 'escápula',
  escapular: 'escapular',
  exercicio: 'ejercicio',
  estreita: 'estrecha',
  eversao: 'eversión',
  expansao: 'expansión',
  extensao: 'extensión',
  externa: 'externa',
  fascia: 'fascia',
  fechamento: 'cierre',
  flexao: 'flexión',
  flexores: 'flexores',
  foot: 'foot',
  frontal: 'frontal',
  funcional: 'funcional',
  gato: 'gato',
  global: 'global',
  graus: 'grados',
  hallux: 'hallux',
  hops: 'saltos',
  inclinacao: 'inclinación',
  inclinada: 'inclinada',
  interna: 'interna',
  inversao: 'inversión',
  isolada: 'aislada',
  joelho: 'rodilla',
  joelhos: 'rodillas',
  labios: 'labios',
  lateral: 'lateral',
  latissimo: 'dorsal ancho',
  levantar: 'levantarse',
  leve: 'leve',
  livro: 'libro',
  lombar: 'lumbar',
  mandibular: 'mandibular',
  marcha: 'marcha',
  mao: 'mano',
  maos: 'manos',
  manual: 'manual',
  mediano: 'mediano',
  menores: 'menores',
  mobilidade: 'movilidad',
  mobilizacao: 'movilización',
  nervo: 'nervio',
  neural: 'neural',
  ocular: 'ocular',
  olhos: 'ojos',
  ombro: 'hombro',
  ombros: 'hombros',
  oposicao: 'oposición',
  panturrilha: 'pantorrilla',
  parcial: 'parcial',
  parede: 'pared',
  passada: 'paso',
  pe: 'pie',
  peito: 'pecho',
  pelvica: 'pélvica',
  pelvico: 'pélvico',
  perna: 'pierna',
  peso: 'peso',
  piriforme: 'piriforme',
  plantar: 'plantar',
  pliometria: 'pliometría',
  polegar: 'pulgar',
  ponte: 'puente',
  posterior: 'posterior',
  press: 'press',
  progressivo: 'progresivo',
  pronacao: 'pronación',
  propriocepcao: 'propiocepción',
  protracao: 'protracción',
  protrusao: 'protrusión',
  punho: 'muñeca',
  quadril: 'cadera',
  radial: 'radial',
  reacao: 'reacción',
  relaxamento: 'relajación',
  remada: 'remo',
  respiracao: 'respiración',
  reta: 'recta',
  retracao: 'retracción',
  retrograda: 'retrógrada',
  rolo: 'rodillo',
  rolamento: 'rodamiento',
  rotacao: 'rotación',
  sem: 'sin',
  semi: 'semi',
  semicerrados: 'semicerrados',
  serratil: 'serrato',
  short: 'short',
  simples: 'simple',
  sentado: 'sentado',
  sentada: 'sentada',
  sentar: 'sentarse',
  sobre: 'sobre',
  soco: 'empuje',
  step: 'step',
  subir: 'subir',
  suave: 'suave',
  supinacao: 'supinación',
  tarefa: 'tarea',
  tibial: 'tibial',
  toalha: 'toalla',
  toque: 'toque',
  toracica: 'torácica',
  tornozelo: 'tobillo',
  transferencia: 'transferencia',
  treino: 'entrenamiento',
  tronco: 'tronco',
  ulnar: 'cubital',
  unilateral: 'unilateral',
  virada: 'giro',
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyCase(match: string, replacement: string): string {
  if (match.toUpperCase() === match) return replacement.toUpperCase();
  if (match[0]?.toUpperCase() === match[0]) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function normalizeForDictionary(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function applyLiteralReplacements(
  value: string,
  replacements: readonly Replacement[],
): string {
  return replacements.reduce((text, [from, to]) => {
    const pattern = new RegExp(`\\b${escapeRegex(from)}\\b`, 'gi');
    return text.replace(pattern, (match) => applyCase(match, to));
  }, value);
}

export function accentPortugueseExerciseText(value?: string | null): string {
  if (!value) return '';
  return applyLiteralReplacements(value, PT_REPLACEMENTS);
}

function compactSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function capitalizeSentence(value: string): string {
  const text = compactSpaces(value);
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateNameByDictionary(
  value: string,
  phrases: readonly Replacement[],
  words: Record<string, string>,
): string {
  let normalized = ` ${normalizeForDictionary(value).replace(/[-/]+/g, ' ')} `;
  const orderedPhrases = [...phrases].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of orderedPhrases) {
    normalized = normalized.replace(
      new RegExp(`\\b${escapeRegex(from)}\\b`, 'g'),
      to,
    );
  }

  const translated = normalized
    .split(/\s+/g)
    .filter(Boolean)
    .map((token) => words[token] || token)
    .join(' ');

  return capitalizeSentence(translated);
}

export function translateExerciseName(
  name: string,
  language: Exclude<ExerciseTranslationLanguage, 'pt'>,
): string {
  if (language === 'en') {
    return translateNameByDictionary(name, EN_PHRASES, EN_WORDS);
  }
  return translateNameByDictionary(name, ES_PHRASES, ES_WORDS);
}

function buildTranslatedFields(
  item: ExerciseLocalizationInput,
  language: Exclude<ExerciseTranslationLanguage, 'pt'>,
): Required<ExerciseTranslationFields> {
  const name = translateExerciseName(item.nome, language);
  const lowerName = name.charAt(0).toLowerCase() + name.slice(1);

  if (language === 'en') {
    return {
      nome: name,
      objetivo: `Support clinical review and therapeutic prescription of ${lowerName}.`,
      descricao: `Synap exercise catalog item for ${lowerName}.`,
      instrucoesPadrao: [
        '1. Confirm the clinical indication, irritability level and need for supervision before prescribing.',
        `2. Perform ${lowerName} with comfortable range, controlled speed and safe support when needed.`,
        '3. Prioritize alignment, calm breathing and absence of abrupt compensations during the movement.',
        '4. Stop and contact the physiotherapist if dizziness, tingling, loss of strength, instability or symptoms that persist for 24 hours occur.',
      ].join('\n'),
      cuidados:
        'Clinical review is required before unrestricted prescription. Adjust range, load, support and progression to the patient.',
      contraindicacoes:
        'Do not prescribe without clinical review when there is severe acute pain, important instability, dizziness, recent unevaluated fall or progressive neurological symptoms.',
    };
  }

  return {
    nome: name,
    objetivo: `Apoyar la revisión clínica y la prescripción terapéutica de ${lowerName}.`,
    descricao: `Ejercicio del catálogo Synap para ${lowerName}.`,
    instrucoesPadrao: [
      '1. Confirme la indicación clínica, el nivel de irritabilidad y la necesidad de supervisión antes de prescribir.',
      `2. Realice ${lowerName} con rango cómodo, velocidad controlada y apoyo seguro cuando sea necesario.`,
      '3. Priorice la alineación, la respiración tranquila y la ausencia de compensaciones bruscas durante el movimiento.',
      '4. Suspenda y avise al fisioterapeuta si hay mareo, hormigueo, pérdida de fuerza, inestabilidad o síntomas que persistan por 24 horas.',
    ].join('\n'),
    cuidados:
      'Requiere revisión clínica antes de prescripción libre. Ajuste rango, carga, apoyo y progresión al paciente.',
    contraindicacoes:
      'No prescribir sin revisión clínica ante dolor agudo intenso, inestabilidad importante, mareo, caída reciente no evaluada o síntomas neurológicos progresivos.',
  };
}

export function buildExerciseLocalization(
  item: ExerciseLocalizationInput,
): ExerciseLocalizationOutput {
  const pt = {
    nome: accentPortugueseExerciseText(item.nome),
    objetivo: accentPortugueseExerciseText(item.objetivo),
    descricao: accentPortugueseExerciseText(item.descricao),
    instrucoesPadrao: accentPortugueseExerciseText(item.instrucoesPadrao),
    cuidados: accentPortugueseExerciseText(item.cuidados),
    contraindicacoes: accentPortugueseExerciseText(item.contraindicacoes),
  };

  return {
    pt,
    translations: {
      pt,
      en: buildTranslatedFields({ ...item, nome: pt.nome }, 'en'),
      es: buildTranslatedFields({ ...item, nome: pt.nome }, 'es'),
    },
  };
}

export function normalizeExerciseTranslations(
  translations: ExerciseTranslations | null | undefined,
  item: ExerciseLocalizationInput,
): ExerciseTranslations {
  const generated = buildExerciseLocalization(item).translations;
  const normalized: ExerciseTranslations = {};

  for (const language of EXERCISE_TRANSLATION_LANGUAGES) {
    const generatedFields = generated[language] ?? {};
    const inputFields = translations?.[language] ?? {};
    const fields: ExerciseTranslationFields = {};

    for (const key of [
      'nome',
      'objetivo',
      'descricao',
      'instrucoesPadrao',
      'cuidados',
      'contraindicacoes',
    ] as const) {
      const value = String(
        inputFields[key] || generatedFields[key] || '',
      ).trim();
      if (value) fields[key] = value;
    }

    normalized[language] = fields;
  }

  return normalized;
}
