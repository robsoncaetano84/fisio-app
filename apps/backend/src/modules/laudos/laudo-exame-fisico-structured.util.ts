import { BadRequestException } from '@nestjs/common';

export const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V2__';
export const LEGACY_STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';

type RegionalGroup = {
  regiao?: string;
  titulo?: string;
  adm?: string;
  testes?: Array<{
    nome?: string;
    resultado?: string;
    selecionado?: boolean;
  }>;
};

export type StructuredExameData = {
  dorPrincipal?: string;
  dorSubtipo?: string;
  observacao?: {
    postura?: string;
    assimetria?: string;
    edema?: string;
    atrofiaMuscular?: string;
    marcha?: string;
    padraoMovimento?: string;
  };
  padraoDor?: {
    local?: string;
    irradiada?: string;
  };
  movimento?: {
    ativo?: string;
    passivo?: string;
    resistido?: string;
    reproduzDor?: string;
    qualidadeMovimento?: string;
  };
  palpacao?: {
    muscular?: string;
    articular?: string;
    dinamicaVertebral?: string;
    pontosDolorosos?: string;
    temperatura?: string;
    tonusMuscular?: string;
    hipomobilidadeArticular?: string;
    hipomobilidadeSegmentar?: {
      cervical?: string;
      toracica?: string;
      lombar?: string;
      sacro?: string;
      iliacoDireito?: string;
      iliacoEsquerdo?: string;
    };
  };
  testesFuncionais?: {
    agachamento?: string;
    agachamentoUnilateral?: string;
    salto?: string;
    corrida?: string;
    estabilidade?: string;
    controleMotor?: string;
  };
  testes?: {
    biomecanicos?: string;
    ortopedicos?: string;
    imagem?: string;
  };
  avaliacaoRegioes?: RegionalGroup[];
  cruzamentoFinal?: {
    hipotesePrincipal?: string;
    hipotesesSecundarias?: string;
    inconsistencias?: string;
    condutaDirecionada?: string;
    prioridade?: string;
    confiancaHipotese?: string;
    scoreEvidencia?: string | number;
    perfilScoring?: string;
  };
  raciocinioClinico?: {
    origemProvavelDor?: string;
    estruturaEnvolvida?: string;
    tipoLesao?: string;
    fatorBiomecanicoAssociado?: string;
    relacaoComEsporte?: string;
  };
  diagnosticoFuncionalIa?: {
    disfuncaoPrincipal?: string;
    cadeiaEnvolvida?: string;
  };
  condutaIa?: {
    tecnicaManualIndicada?: string;
    ajusteArticular?: string;
    exercicioCorretivo?: string;
    liberacaoMiofascial?: string;
    progressaoEsportiva?: string;
  };
  redFlags?: {
    answers?: Array<{
      positive?: boolean;
      question?: string;
      key?: string;
    }>;
    criticalTriggered?: boolean;
    referralDestination?: string;
    referralReason?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function formatExameFisicoForDisplay(value?: string | null): string {
  const parsed = parseStructuredExame(value);
  if (!parsed) return value?.trim() || 'Nao informado';

  const rfPositivas = (parsed.redFlags?.answers || [])
    .filter((item) => item.positive)
    .map((item) => '- ' + String(item.question || item.key || 'Red flag'))
    .join('\n');

  const regionalGroups = parsed.avaliacaoRegioes || [];
  const allRegionalTests = regionalGroups.flatMap((group) =>
    Array.isArray(group?.testes) ? group.testes : [],
  );
  const regionalPositiveCount = allRegionalTests.filter(
    (test) => String(test?.resultado || '') === 'POSITIVO',
  ).length;
  const regionalNegativeCount = allRegionalTests.filter(
    (test) => String(test?.resultado || '') === 'NEGATIVO',
  ).length;
  const regionalNotTestedCount = allRegionalTests.filter(
    (test) => String(test?.resultado || 'NAO_TESTADO') === 'NAO_TESTADO',
  ).length;

  const lines = [
    'Classificacao de dor',
    'Principal: ' + String(parsed.dorPrincipal || 'Nao informado'),
    'Subtipo clinico: ' + String(parsed.dorSubtipo || 'Nao informado'),
    '',
    'Inspecao/observacao',
    'Postura global: ' + String(parsed.observacao?.postura || 'Nao informado'),
    'Assimetrias: ' + String(parsed.observacao?.assimetria || 'Nao informado'),
    'Edema: ' + String(parsed.observacao?.edema || 'Nao informado'),
    'Atrofia muscular: ' +
      String(parsed.observacao?.atrofiaMuscular || 'Nao informado'),
    'Alteracoes de marcha: ' +
      String(parsed.observacao?.marcha || 'Nao informado'),
    'Padrao de movimento observado: ' +
      String(parsed.observacao?.padraoMovimento || 'Nao informado'),
    '',
    'Padrao de dor',
    'Dor local: ' + String(parsed.padraoDor?.local || 'Nao informado'),
    'Dor irradiada: ' + String(parsed.padraoDor?.irradiada || 'Nao informado'),
    'Movimento (chave)',
    'Ativo: ' + String(parsed.movimento?.ativo || 'Nao informado'),
    'Passivo: ' + String(parsed.movimento?.passivo || 'Nao informado'),
    'Resistido: ' + String(parsed.movimento?.resistido || 'Nao informado'),
    'Reproduz dor: ' + String(parsed.movimento?.reproduzDor || 'Nao informado'),
    'Qualidade do movimento: ' +
      String(parsed.movimento?.qualidadeMovimento || 'Nao informado'),
    'Palpacao',
    'Muscular: ' + String(parsed.palpacao?.muscular || 'Nao informado'),
    'Articular: ' + String(parsed.palpacao?.articular || 'Nao informado'),
    'Palpacao dinamica vertebral: ' +
      String(parsed.palpacao?.dinamicaVertebral || 'Nao informado'),
    'Pontos dolorosos: ' +
      String(parsed.palpacao?.pontosDolorosos || 'Nao informado'),
    'Temperatura: ' + String(parsed.palpacao?.temperatura || 'Nao informado'),
    'Tonus muscular: ' +
      String(parsed.palpacao?.tonusMuscular || 'Nao informado'),
    'Hipomobilidade articular: ' +
      String(parsed.palpacao?.hipomobilidadeArticular || 'Nao informado'),
    'Hipomobilidade segmentar - Cervical: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.cervical || 'Nao informado',
      ),
    'Hipomobilidade segmentar - Toracica: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.toracica || 'Nao informado',
      ),
    'Hipomobilidade segmentar - Lombar: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.lombar || 'Nao informado',
      ),
    'Hipomobilidade segmentar - Sacro: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.sacro || 'Nao informado',
      ),
    'Hipomobilidade segmentar - Iliaco D: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.iliacoDireito ||
          'Nao informado',
      ),
    'Hipomobilidade segmentar - Iliaco E: ' +
      String(
        parsed.palpacao?.hipomobilidadeSegmentar?.iliacoEsquerdo ||
          'Nao informado',
      ),
    '',
    'Testes funcionais',
    'Agachamento: ' +
      String(parsed.testesFuncionais?.agachamento || 'Nao informado'),
    'Agachamento unilateral: ' +
      String(parsed.testesFuncionais?.agachamentoUnilateral || 'Nao informado'),
    'Salto: ' + String(parsed.testesFuncionais?.salto || 'Nao informado'),
    'Corrida: ' + String(parsed.testesFuncionais?.corrida || 'Nao informado'),
    'Estabilidade: ' +
      String(parsed.testesFuncionais?.estabilidade || 'Nao informado'),
    'Controle motor: ' +
      String(parsed.testesFuncionais?.controleMotor || 'Nao informado'),
    '',
    'Testes',
    'Biomecanicos: ' + String(parsed.testes?.biomecanicos || 'Nao informado'),
    'Ortopedicos: ' + String(parsed.testes?.ortopedicos || 'Nao informado'),
    'Imagem: ' + String(parsed.testes?.imagem || 'Nao informado'),
    '',
    'Avaliacao por regioes',
    `Resumo: ${regionalPositiveCount} positivo(s), ${regionalNegativeCount} negativo(s), ${regionalNotTestedCount} nao testado(s).`,
    ...regionalGroups.flatMap((group) => {
      const groupTitle = String(group?.titulo || 'Regiao');
      const tests = Array.isArray(group?.testes) ? group.testes : [];
      const selectedOrTested = tests.filter(
        (test) =>
          String(test?.resultado || '') !== 'NAO_TESTADO' ||
          test?.selecionado === true,
      );
      const admLine = `- ADM: ${String(group?.adm || 'Nao informado')}`;
      if (!selectedOrTested.length) {
        return [groupTitle, admLine, '- Sem testes marcados'];
      }
      const entries = selectedOrTested.map((test) => {
        const name = String(test?.nome || 'Teste');
        const result = String(test?.resultado || 'NAO_TESTADO');
        if (result === 'NAO_TESTADO') {
          return `- ${name}: Selecionado`;
        }
        return `- ${name}: ${result === 'POSITIVO' ? 'Positivo' : 'Negativo'}`;
      });
      return [groupTitle, admLine, ...entries];
    }),
    '',
    'Cruzamento final',
    'Hipotese principal: ' +
      String(parsed.cruzamentoFinal?.hipotesePrincipal || 'Nao informado'),
    'Hipoteses secundarias: ' +
      String(parsed.cruzamentoFinal?.hipotesesSecundarias || 'Nao informado'),
    'Inconsistencias: ' +
      String(parsed.cruzamentoFinal?.inconsistencias || 'Nao informado'),
    'Direcao de conduta: ' +
      String(parsed.cruzamentoFinal?.condutaDirecionada || 'Nao informado'),
    'Prioridade: ' +
      String(parsed.cruzamentoFinal?.prioridade || 'Nao informado'),
    'Confianca da hipotese: ' +
      String(parsed.cruzamentoFinal?.confiancaHipotese || 'Nao informado'),
    'Score de evidencia: ' +
      String(parsed.cruzamentoFinal?.scoreEvidencia ?? 'Nao informado'),
    'Perfil de scoring: ' +
      String(parsed.cruzamentoFinal?.perfilScoring || 'Nao informado'),
    '',
    'Raciocinio clinico',
    'Origem provavel da dor: ' +
      String(parsed.raciocinioClinico?.origemProvavelDor || 'Nao informado'),
    'Estrutura envolvida: ' +
      String(parsed.raciocinioClinico?.estruturaEnvolvida || 'Nao informado'),
    'Tipo de lesao: ' +
      String(parsed.raciocinioClinico?.tipoLesao || 'Nao informado'),
    'Fator biomecanico associado: ' +
      String(
        parsed.raciocinioClinico?.fatorBiomecanicoAssociado || 'Nao informado',
      ),
    'Relacao com atividade/gesto: ' +
      String(parsed.raciocinioClinico?.relacaoComEsporte || 'Nao informado'),
    '',
    'Diagnostico funcional',
    'Disfuncao principal: ' +
      String(
        parsed.diagnosticoFuncionalIa?.disfuncaoPrincipal || 'Nao informado',
      ),
    'Cadeia envolvida: ' +
      String(parsed.diagnosticoFuncionalIa?.cadeiaEnvolvida || 'Nao informado'),
    '',
    'Conduta direcionada',
    'Tecnica manual indicada: ' +
      String(parsed.condutaIa?.tecnicaManualIndicada || 'Nao informado'),
    'Ajuste articular: ' +
      String(parsed.condutaIa?.ajusteArticular || 'Nao informado'),
    'Exercicio corretivo: ' +
      String(parsed.condutaIa?.exercicioCorretivo || 'Nao informado'),
    'Liberacao miofascial: ' +
      String(parsed.condutaIa?.liberacaoMiofascial || 'Nao informado'),
    'Progressao esportiva: ' +
      String(parsed.condutaIa?.progressaoEsportiva || 'Nao informado'),
    '',
    'Red flags positivas',
    rfPositivas || 'Nenhuma red flag positiva',
    parsed.redFlags?.criticalTriggered
      ? 'ALERTA: red flag critica detectada; encaminhamento imediato recomendado.'
      : 'Sem red flag critica na triagem.',
    parsed.redFlags?.referralDestination
      ? 'Destino encaminhamento: ' + String(parsed.redFlags.referralDestination)
      : '',
    parsed.redFlags?.referralReason
      ? 'Justificativa: ' + String(parsed.redFlags.referralReason)
      : '',
  ].filter(Boolean);

  return lines.join('\n');
}

export function parseStructuredExame(
  value?: string | null,
): StructuredExameData | null {
  const raw = String(value || '').trim();
  const prefix = raw.startsWith(STRUCTURED_EXAME_PREFIX)
    ? STRUCTURED_EXAME_PREFIX
    : raw.startsWith(LEGACY_STRUCTURED_EXAME_PREFIX)
      ? LEGACY_STRUCTURED_EXAME_PREFIX
      : null;
  if (!prefix) return null;
  const json = raw.slice(prefix.length);
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return null;
    return parsed as StructuredExameData;
  } catch {
    return null;
  }
}

export function validateStructuredExameInput(value?: string | null): void {
  const parsed = parseStructuredExame(value);
  if (!parsed) return;

  const groups = Array.isArray(parsed.avaliacaoRegioes)
    ? parsed.avaliacaoRegioes
    : [];
  const hasRegionalResult = groups.some(
    (group) =>
      Array.isArray(group?.testes) &&
      group.testes.some(
        (test) =>
          String(test?.resultado || '') === 'POSITIVO' ||
          String(test?.resultado || '') === 'NEGATIVO',
      ),
  );

  if (!hasRegionalResult) {
    throw new BadRequestException(
      'Marque ao menos um teste regional como positivo ou negativo antes de salvar o exame fisico.',
    );
  }
}
