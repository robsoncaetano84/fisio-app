import { Anamnese, TipoDor } from '../anamneses/entities/anamnese.entity';

export type CharlesDorPrincipal =
  | 'NOCICEPTIVA'
  | 'NEUROPATICA'
  | 'NOCIPLASTICA'
  | 'INFLAMATORIA'
  | 'VISCERAL'
  | null;

export type CharlesDorSubtipo =
  | 'MECANICA'
  | 'DISCAL'
  | 'NEURAL'
  | 'REFERIDA'
  | 'INFLAMATORIA'
  | 'MIOFASCIAL'
  | 'FACETARIA'
  | 'NAO_MECANICA'
  | null;

export type CharlesDorClassificationSuggestion = {
  principal: CharlesDorPrincipal;
  subtipo: CharlesDorSubtipo;
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  reason: string;
  evidenceFields: string[];
};

type DorCandidate = {
  principal: Exclude<CharlesDorPrincipal, null>;
  subtipo: Exclude<CharlesDorSubtipo, null>;
  evidence: string[];
  reason: string;
  fields: string[];
};

export function inferDorClassificationFromAnamnese(
  anamnese?: Partial<Anamnese> | null,
): CharlesDorClassificationSuggestion {
  if (!anamnese) {
    return {
      principal: null,
      subtipo: null,
      confidence: 'BAIXA',
      reason: 'Sem anamnese disponivel para inferencia.',
      evidenceFields: [],
    };
  }

  if (anamnese.tipoDor === TipoDor.NEUROPATICA) {
    return directClassification('NEUROPATICA', 'NEURAL');
  }
  if (anamnese.tipoDor === TipoDor.INFLAMATORIA) {
    return directClassification('INFLAMATORIA', 'INFLAMATORIA');
  }
  if (anamnese.tipoDor === TipoDor.MECANICA) {
    return directClassification('NOCICEPTIVA', 'MECANICA');
  }
  if (anamnese.tipoDor === TipoDor.MISTA) {
    return directClassification('NOCIPLASTICA', 'MIOFASCIAL');
  }

  const sintomas = normalizeClinicalText(anamnese.descricaoSintomas);
  const piora = normalizeClinicalText(anamnese.fatoresPiora);
  const atividadesPiora = normalizeClinicalText(anamnese.atividadesQuePioram);
  const alivio = normalizeClinicalText(anamnese.fatorAlivio);
  const sinaisCentral = normalizeClinicalText(
    anamnese.sinaisSensibilizacaoCentral,
  );
  const evento = normalizeClinicalText(anamnese.eventoEspecifico);
  const lesoesPrevias = normalizeClinicalText(anamnese.lesoesPrevias);
  const sono = normalizeClinicalText(anamnese.horasSonoMedia);
  const observacoesEstiloVida = normalizeClinicalText(
    anamnese.observacoesEstiloVida,
  );
  const yellowFlags = (anamnese.yellowFlags || [])
    .map((flag) => normalizeClinicalText(flag))
    .join(' ');
  const affectedAreas = anamnese.areasAfetadas || [];
  const hasIrradiacao =
    anamnese.irradiacao === true ||
    String(anamnese.localIrradiacao || '').trim().length > 0;
  const hasInflammatoryBehavior =
    anamnese.dorRepouso === true || anamnese.dorNoturna === true;

  const nociceptiveEvidence: string[] = [];
  const neuropathicEvidence: string[] = [];
  const nociplasticEvidence: string[] = [];
  const fenotipoDorEvidencias = anamnese.fenotipoDorEvidencias || {};
  const hasFenotipoEvidence = (key: string) =>
    fenotipoDorEvidencias[key] === true;

  collectExplicitFenotipoEvidence({
    hasFenotipoEvidence,
    nociceptiveEvidence,
    neuropathicEvidence,
    nociplasticEvidence,
  });

  if (
    affectedAreas.length === 1 ||
    includesAny(sintomas, ['localiz', 'pontual', 'exatamente onde', 'apontar'])
  ) {
    nociceptiveEvidence.push('dor localizada');
  }
  if (
    includesAny(`${piora} ${atividadesPiora}`, [
      'moviment',
      'esforc',
      'carga',
      'agach',
      'correr',
      'saltar',
      'subir escada',
      'levantar peso',
    ])
  ) {
    nociceptiveEvidence.push('piora com movimento/esforco');
  }
  if (includesAny(alivio, ['repous', 'descans', 'parar', 'sem carga'])) {
    nociceptiveEvidence.push('melhora com repouso');
  }
  if (
    String(anamnese.inicioProblema) === 'APOS_EVENTO' ||
    String(anamnese.mecanismoLesao) === 'TRAUMA' ||
    String(anamnese.mecanismoLesao) === 'SOBRECARGA' ||
    includesAny(`${evento} ${lesoesPrevias}`, [
      'trauma',
      'queda',
      'torcao',
      'lesao',
      'esforc',
      'sobrecarga',
    ])
  ) {
    nociceptiveEvidence.push('inicio apos esforco/lesao');
  }
  if (includesAny(sintomas, ['apert', 'pressao', 'palpac', 'toque reproduz'])) {
    nociceptiveEvidence.push('dor reproduzida por pressao/palpacao');
  }

  if (hasIrradiacao) {
    neuropathicEvidence.push('dor irradiada');
  }
  if (
    includesAny(`${sintomas} ${piora}`, [
      'choque',
      'formig',
      'queima',
      'dorm',
      'parestes',
      'agulhada',
    ])
  ) {
    neuropathicEvidence.push('choque/formigamento/queimacao/dormencia');
  }
  if (
    includesAny(`${sintomas} ${piora}`, [
      'desce',
      'sobe',
      'corre',
      'irradia',
      'braco',
      'perna',
    ])
  ) {
    neuropathicEvidence.push('trajeto neural referido');
  }
  if (
    includesAny(`${piora} ${atividadesPiora}`, [
      'sentar',
      'dobrar',
      'virar',
      'flexao',
      'extensao',
      'postura',
    ])
  ) {
    neuropathicEvidence.push('piora com posicoes especificas');
  }

  if (
    affectedAreas.length > 1 ||
    includesAny(`${sintomas} ${sinaisCentral}`, [
      'dor difusa',
      'dor generalizada',
      'varias regioes',
      'muda de lugar',
      'migratoria',
    ])
  ) {
    nociplasticEvidence.push('dor difusa/multirregional');
  }
  if (
    includesAny(`${sintomas} ${sinaisCentral}`, [
      'desproporcional',
      'maior do que o esperado',
      'nao melhora',
      'persistente',
      'sensibilizacao',
      'hipersens',
    ])
  ) {
    nociplasticEvidence.push('dor desproporcional ou persistente');
  }
  if (
    (typeof anamnese.qualidadeSono === 'number' &&
      anamnese.qualidadeSono <= 4) ||
    includesAny(`${sono} ${observacoesEstiloVida}`, [
      'sono ruim',
      'acorda cansado',
      'insonia',
    ])
  ) {
    nociplasticEvidence.push('sono ruim/nao reparador');
  }
  if (
    (typeof anamnese.nivelEstresse === 'number' &&
      anamnese.nivelEstresse >= 7) ||
    (typeof anamnese.energiaDiaria === 'number' &&
      anamnese.energiaDiaria <= 4) ||
    includesAny(`${sinaisCentral} ${yellowFlags} ${observacoesEstiloVida}`, [
      'estresse',
      'cansaco',
      'fadiga',
      'catastrof',
      'medo',
    ])
  ) {
    nociplasticEvidence.push('estresse/fadiga/yellow flags');
  }
  if (
    includesAny(`${sintomas} ${sinaisCentral}`, [
      'exame normal',
      'exames normais',
    ])
  ) {
    nociplasticEvidence.push('exames normais com dor persistente');
  }

  const candidates = buildDorCandidates({
    nociceptiveEvidence,
    neuropathicEvidence,
    nociplasticEvidence,
  }).sort((a, b) => b.evidence.length - a.evidence.length);

  const best = candidates[0];
  const second = candidates[1];
  if (
    best.evidence.length >= 2 &&
    best.evidence.length > second.evidence.length
  ) {
    return {
      principal: best.principal,
      subtipo: best.subtipo,
      confidence: best.evidence.length >= 4 ? 'ALTA' : 'MODERADA',
      reason: `${best.reason} Evidencias: ${best.evidence.join('; ')}.`,
      evidenceFields: best.fields,
    };
  }

  if (
    best.evidence.length >= 2 &&
    best.evidence.length === second.evidence.length
  ) {
    return {
      principal: 'NOCIPLASTICA',
      subtipo: 'MIOFASCIAL',
      confidence: 'MODERADA',
      reason: `Fenotipo misto/inconsistente com sinais de sensibilizacao. Integrar exame fisico antes de fechar conduta. Evidencias: ${best.evidence
        .concat(second.evidence)
        .join('; ')}.`,
      evidenceFields: Array.from(new Set(best.fields.concat(second.fields))),
    };
  }

  if (
    hasInflammatoryBehavior ||
    sintomas.includes('rigidez matinal') ||
    sinaisCentral.includes('inflama')
  ) {
    return {
      principal: 'INFLAMATORIA',
      subtipo: 'INFLAMATORIA',
      confidence: 'MODERADA',
      reason: 'Padrao em repouso/noturno sugere componente inflamatorio.',
      evidenceFields: ['dorRepouso', 'dorNoturna', 'descricaoSintomas'],
    };
  }

  if (piora.length > 0 || alivio.length > 0) {
    return {
      principal: 'NOCICEPTIVA',
      subtipo: 'MECANICA',
      confidence: 'MODERADA',
      reason: 'Fatores de piora/alivio com movimento sugerem dor mecanica.',
      evidenceFields: ['fatoresPiora', 'fatorAlivio'],
    };
  }

  return {
    principal: null,
    subtipo: null,
    confidence: 'BAIXA',
    reason:
      'Dados insuficientes na anamnese para sugerir classificacao com seguranca.',
    evidenceFields: [],
  };
}

function directClassification(
  principal: Exclude<CharlesDorPrincipal, null>,
  subtipo: Exclude<CharlesDorSubtipo, null>,
): CharlesDorClassificationSuggestion {
  return {
    principal,
    subtipo,
    confidence: 'ALTA',
    reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
    evidenceFields: ['tipoDor'],
  };
}

function collectExplicitFenotipoEvidence(args: {
  hasFenotipoEvidence: (key: string) => boolean;
  nociceptiveEvidence: string[];
  neuropathicEvidence: string[];
  nociplasticEvidence: string[];
}): void {
  const {
    hasFenotipoEvidence,
    nociceptiveEvidence,
    neuropathicEvidence,
    nociplasticEvidence,
  } = args;

  if (hasFenotipoEvidence('dorLocalizada')) {
    nociceptiveEvidence.push('dor localizada');
  }
  if (hasFenotipoEvidence('pioraMovimentoEsforco')) {
    nociceptiveEvidence.push('piora com movimento/esforco');
  }
  if (hasFenotipoEvidence('melhoraRepouso')) {
    nociceptiveEvidence.push('melhora com repouso');
  }
  if (hasFenotipoEvidence('inicioAposEsforcoLesao')) {
    nociceptiveEvidence.push('inicio apos esforco/lesao');
  }
  if (hasFenotipoEvidence('dorReproduzidaPalpacao')) {
    nociceptiveEvidence.push('dor reproduzida por pressao/palpacao');
  }

  if (hasFenotipoEvidence('irradiacaoTrajeto')) {
    neuropathicEvidence.push('dor irradiada');
  }
  if (hasFenotipoEvidence('choqueFormigamentoQueimacao')) {
    neuropathicEvidence.push('choque/formigamento/queimacao');
  }
  if (hasFenotipoEvidence('dormenciaAlteracaoToque')) {
    neuropathicEvidence.push('dormencia ou alteracao ao toque');
  }
  if (hasFenotipoEvidence('pioraPosicaoNeural')) {
    neuropathicEvidence.push('piora com posicoes especificas');
  }

  if (hasFenotipoEvidence('dorMultirregionalMigratoria')) {
    nociplasticEvidence.push('dor difusa/multirregional');
  }
  if (hasFenotipoEvidence('dorDesproporcionalPersistente')) {
    nociplasticEvidence.push('dor desproporcional ou persistente');
  }
  if (hasFenotipoEvidence('sonoRuimNaoReparador')) {
    nociplasticEvidence.push('sono ruim/nao reparador');
  }
  if (hasFenotipoEvidence('cansacoFrequente')) {
    nociplasticEvidence.push('cansaco/fadiga frequente');
  }
  if (hasFenotipoEvidence('estresseElevado')) {
    nociplasticEvidence.push('estresse elevado');
  }
  if (hasFenotipoEvidence('examesNormaisDorPersistente')) {
    nociplasticEvidence.push('exames normais com dor persistente');
  }
}

function buildDorCandidates(args: {
  nociceptiveEvidence: string[];
  neuropathicEvidence: string[];
  nociplasticEvidence: string[];
}): DorCandidate[] {
  return [
    {
      principal: 'NOCICEPTIVA',
      subtipo: 'MECANICA',
      evidence: args.nociceptiveEvidence,
      reason:
        'Fenotipo mecanico: terapia manual, carga progressiva e controle inflamatorio conforme irritabilidade.',
      fields: [
        'areasAfetadas',
        'descricaoSintomas',
        'fatoresPiora',
        'fatorAlivio',
        'inicioProblema',
        'mecanismoLesao',
        'fenotipoDorEvidencias',
      ],
    },
    {
      principal: 'NEUROPATICA',
      subtipo: 'NEURAL',
      evidence: args.neuropathicEvidence,
      reason:
        'Fenotipo neural: terapia manual, mobilizacao neural, descompressao e modulacao conforme exame fisico.',
      fields: [
        'irradiacao',
        'localIrradiacao',
        'descricaoSintomas',
        'fatoresPiora',
        'fenotipoDorEvidencias',
      ],
    },
    {
      principal: 'NOCIPLASTICA',
      subtipo: 'MIOFASCIAL',
      evidence: args.nociplasticEvidence,
      reason:
        'Fenotipo de modulacao central: educacao em dor, exercicio graduado e estrategias de regulacao do sistema nervoso.',
      fields: [
        'sinaisSensibilizacaoCentral',
        'descricaoSintomas',
        'qualidadeSono',
        'nivelEstresse',
        'energiaDiaria',
        'yellowFlags',
        'fenotipoDorEvidencias',
      ],
    },
  ];
}

function normalizeClinicalText(value?: string | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesAny(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token));
}
