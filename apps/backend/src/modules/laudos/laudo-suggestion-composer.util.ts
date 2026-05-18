import { CreateLaudoDto } from './dto/create-laudo.dto';
import {
  ClinicalAreaSummary,
  ClinicalReasoningSummary,
  GenerateLaudoSuggestionInput,
  LaudoExamInsight,
} from './laudo-ai-suggestion.service';
import type { LaudoReferenceSuggestionResponse } from './laudo-references.service';

type SuggestionPaciente = {
  nomeCompleto: string;
  dataNascimento: Date;
  sexo: string;
  profissao?: string | null;
};

type SuggestionAnamnese = {
  motivoBusca: string;
  areasAfetadas: Array<{
    regiao?: string | null;
    lado?: string | null;
    vista?: string | null;
    intensidade?: number | null;
    observacao?: string | null;
  }>;
  intensidadeDor: number;
  descricaoSintomas?: string | null;
  tempoProblema?: string | null;
  horaIntensifica?: string | null;
  inicioProblema?: string | null;
  eventoEspecifico?: string | null;
  fatorAlivio?: string | null;
  fatoresPiora?: string | null;
  mecanismoLesao?: string | null;
  problemaAnterior?: boolean | null;
  quandoProblemaAnterior?: string | null;
  tratamentosAnteriores?: string[] | null;
  lesoesPrevias?: string | null;
  usoMedicamentos?: string | null;
  dorRepouso?: boolean | null;
  dorNoturna?: boolean | null;
  irradiacao?: boolean | null;
  localIrradiacao?: string | null;
  tipoDor?: string | null;
  fenotipoDorEvidencias?: Record<string, boolean> | null;
  sinaisSensibilizacaoCentral?: string | null;
  redFlags?: string[] | null;
  yellowFlags?: string[] | null;
  limitacoesFuncionais?: string | null;
  atividadesQuePioram?: string | null;
  metaPrincipalPaciente?: string | null;
  horasSonoMedia?: string | null;
  qualidadeSono?: number | null;
  nivelEstresse?: number | null;
  humorPredominante?: string | null;
  energiaDiaria?: number | null;
  atividadeFisicaRegular?: boolean | null;
  frequenciaAtividadeFisica?: string | null;
  apoioEmocional?: number | null;
  observacoesEstiloVida?: string | null;
};

type SuggestionEvolucao = {
  data: Date;
  avaliacao?: string | null;
  plano?: string | null;
  observacoes?: string | null;
};

export type LaudoSuggestionContext = {
  paciente: SuggestionPaciente;
  anamneses: SuggestionAnamnese[];
  evolucoes: SuggestionEvolucao[];
  exames: LaudoExamInsight[];
  exameFisicoResumo?: string | null;
};

export type LaudoSuggestionPreview = {
  source: 'ai' | 'rules';
  examesConsiderados: number;
  examesComLeituraIa: number;
  sugestaoGeradaEm: string;
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  reason: string;
  evidenceFields: string[];
} & Partial<CreateLaudoDto>;

export function buildGenerateLaudoSuggestionInput(
  context: LaudoSuggestionContext,
  referenciasClinicas?: LaudoReferenceSuggestionResponse,
): GenerateLaudoSuggestionInput {
  const latestAnamnese = context.anamneses[0];
  const clinicalReasoning = buildClinicalReasoningSummary(context);

  return {
    paciente: {
      nomeCompleto: context.paciente.nomeCompleto,
      idade: calculateAge(context.paciente.dataNascimento),
      sexo: context.paciente.sexo,
      profissao: context.paciente.profissao ?? '',
    },
    anamnese: latestAnamnese
      ? {
          motivoBusca: latestAnamnese.motivoBusca,
          areasAfetadas: latestAnamnese.areasAfetadas,
          intensidadeDor: latestAnamnese.intensidadeDor,
          descricaoSintomas: latestAnamnese.descricaoSintomas ?? '',
          tempoProblema: latestAnamnese.tempoProblema ?? '',
          horaIntensifica: latestAnamnese.horaIntensifica ?? '',
          inicioProblema: latestAnamnese.inicioProblema ?? '',
          eventoEspecifico: latestAnamnese.eventoEspecifico ?? '',
          fatorAlivio: latestAnamnese.fatorAlivio ?? '',
          fatoresPiora: latestAnamnese.fatoresPiora ?? '',
          mecanismoLesao: latestAnamnese.mecanismoLesao ?? '',
          problemaAnterior: latestAnamnese.problemaAnterior ?? null,
          quandoProblemaAnterior: latestAnamnese.quandoProblemaAnterior ?? '',
          tratamentosAnteriores: latestAnamnese.tratamentosAnteriores ?? [],
          lesoesPrevias: latestAnamnese.lesoesPrevias ?? '',
          usoMedicamentos: latestAnamnese.usoMedicamentos ?? '',
          dorRepouso: latestAnamnese.dorRepouso ?? null,
          dorNoturna: latestAnamnese.dorNoturna ?? null,
          irradiacao: latestAnamnese.irradiacao ?? null,
          localIrradiacao: latestAnamnese.localIrradiacao ?? '',
          tipoDor: latestAnamnese.tipoDor ?? '',
          fenotipoDorEvidencias: latestAnamnese.fenotipoDorEvidencias ?? {},
          sinaisSensibilizacaoCentral:
            latestAnamnese.sinaisSensibilizacaoCentral ?? '',
          redFlags: latestAnamnese.redFlags ?? [],
          yellowFlags: latestAnamnese.yellowFlags ?? [],
          limitacoesFuncionais: latestAnamnese.limitacoesFuncionais ?? '',
          atividadesQuePioram: latestAnamnese.atividadesQuePioram ?? '',
          metaPrincipalPaciente: latestAnamnese.metaPrincipalPaciente ?? '',
          horasSonoMedia: latestAnamnese.horasSonoMedia ?? '',
          qualidadeSono: latestAnamnese.qualidadeSono ?? null,
          nivelEstresse: latestAnamnese.nivelEstresse ?? null,
          humorPredominante: latestAnamnese.humorPredominante ?? '',
          energiaDiaria: latestAnamnese.energiaDiaria ?? null,
          atividadeFisicaRegular: latestAnamnese.atividadeFisicaRegular ?? null,
          frequenciaAtividadeFisica:
            latestAnamnese.frequenciaAtividadeFisica ?? '',
          apoioEmocional: latestAnamnese.apoioEmocional ?? null,
          observacoesEstiloVida: latestAnamnese.observacoesEstiloVida ?? '',
        }
      : null,
    evolucoes: context.evolucoes.map((evolucao) => ({
      data: evolucao.data,
      avaliacaoClinica: evolucao.avaliacao ?? '',
      planoSessao: evolucao.plano ?? '',
      observacoes: evolucao.observacoes ?? '',
    })),
    exameFisicoResumo: context.exameFisicoResumo,
    exames: context.exames.map((exame) => ({
      nomeOriginal: exame.nomeOriginal,
      tipoExame: exame.tipoExame ?? '',
      dataExame: exame.dataExame ?? null,
      mimeType: exame.mimeType,
      observacao: exame.observacao ?? '',
      uploadedAt: exame.uploadedAt,
      aiInterpretacao: exame.aiInterpretacao,
    })),
    clinicalReasoning,
    referenciasClinicas,
  };
}

export function buildCreateLaudoDraft(params: {
  pacienteId: string;
  context: LaudoSuggestionContext;
  aiSuggestion: Partial<CreateLaudoDto>;
  referenciasClinicas?: LaudoReferenceSuggestionResponse;
}): {
  payload: CreateLaudoDto;
  source: 'ai' | 'rules';
  examesConsiderados: number;
  examesComLeituraIa: number;
} {
  const { pacienteId, context, aiSuggestion, referenciasClinicas } = params;
  const clinicalReasoning = buildClinicalReasoningSummary(context);
  const examesConsiderados = context.exames.length;
  const examesComLeituraIa = context.exames.filter(
    (e) => !!e.aiInterpretacao,
  ).length;
  const source: 'ai' | 'rules' = Object.keys(aiSuggestion).length
    ? 'ai'
    : 'rules';
  const exameFisicoHint = buildExameFisicoHint(context.exameFisicoResumo);
  const fallback = buildRuleBasedLaudoFields(clinicalReasoning, {
    examesConsiderados,
    exameFisicoHint,
  });

  return {
    source,
    examesConsiderados,
    examesComLeituraIa,
    payload: {
      pacienteId,
      diagnosticoFuncional:
        aiSuggestion.diagnosticoFuncional ?? fallback.diagnosticoFuncional,
      objetivosCurtoPrazo:
        aiSuggestion.objetivosCurtoPrazo ?? fallback.objetivosCurtoPrazo,
      objetivosMedioPrazo:
        aiSuggestion.objetivosMedioPrazo ?? fallback.objetivosMedioPrazo,
      frequenciaSemanal: aiSuggestion.frequenciaSemanal,
      duracaoSemanas: aiSuggestion.duracaoSemanas,
      condutas: aiSuggestion.condutas ?? fallback.condutas,
      planoTratamentoIA: appendSuggestedReferencesToPlan(
        aiSuggestion.planoTratamentoIA ?? fallback.planoTratamentoIA,
        referenciasClinicas,
      ),
      criteriosAlta: aiSuggestion.criteriosAlta ?? fallback.criteriosAlta,
    },
  };
}

export function buildSuggestionPreview(
  context: LaudoSuggestionContext,
  aiSuggestion: Partial<CreateLaudoDto>,
  referenciasClinicas?: LaudoReferenceSuggestionResponse,
): LaudoSuggestionPreview {
  const source = Object.keys(aiSuggestion).length ? 'ai' : 'rules';
  const clinicalReasoning = buildClinicalReasoningSummary(context);
  const examesConsiderados = context.exames.length;
  const examesComLeituraIa = context.exames.filter(
    (e) => !!e.aiInterpretacao,
  ).length;
  const evidenceScore = [
    !!context.anamneses[0],
    !!context.exameFisicoResumo,
    context.evolucoes.length > 0,
    examesConsiderados > 0,
  ].filter(Boolean).length;
  const confidence: 'BAIXA' | 'MODERADA' | 'ALTA' =
    source === 'ai' && evidenceScore >= 3
      ? 'ALTA'
      : source === 'ai' || evidenceScore >= 2
        ? 'MODERADA'
        : 'BAIXA';
  const reason =
    source === 'ai'
      ? `Sugestao de plano gerada por IA com base em ${clinicalReasoning.evidenciasDisponiveis.join(', ') || 'dados clinicos limitados'}.`
      : `Sugestao de plano gerada por regras clinicas com confianca ${clinicalReasoning.confidenceBase.toLowerCase()}.`;
  const evidenceFields = [
    ...(context.anamneses.length > 0 ? ['anamnese'] : []),
    ...(clinicalReasoning.areasSelecionadasDetalhadas.length > 0
      ? ['areasAfetadas']
      : []),
    ...(clinicalReasoning.observacoesAreas.length > 0
      ? ['observacoesArea']
      : []),
    ...(context.evolucoes.length > 0 ? ['evolucoes'] : []),
    ...(context.exameFisicoResumo ? ['exameFisico'] : []),
    ...(examesConsiderados > 0 ? ['exames'] : []),
  ];
  const exameFisicoHint = buildExameFisicoHint(context.exameFisicoResumo);
  const fallback = buildRuleBasedLaudoFields(clinicalReasoning, {
    examesConsiderados,
    exameFisicoHint,
  });

  return {
    source,
    examesConsiderados,
    examesComLeituraIa,
    sugestaoGeradaEm: new Date().toISOString(),
    confidence,
    reason,
    evidenceFields,
    diagnosticoFuncional:
      aiSuggestion.diagnosticoFuncional ?? fallback.diagnosticoFuncional,
    objetivosCurtoPrazo:
      aiSuggestion.objetivosCurtoPrazo ?? fallback.objetivosCurtoPrazo,
    objetivosMedioPrazo:
      aiSuggestion.objetivosMedioPrazo ?? fallback.objetivosMedioPrazo,
    frequenciaSemanal: aiSuggestion.frequenciaSemanal ?? 2,
    duracaoSemanas: aiSuggestion.duracaoSemanas ?? 8,
    condutas: aiSuggestion.condutas ?? fallback.condutas,
    planoTratamentoIA: appendSuggestedReferencesToPlan(
      aiSuggestion.planoTratamentoIA ?? fallback.planoTratamentoIA,
      referenciasClinicas,
    ),
    criteriosAlta: aiSuggestion.criteriosAlta ?? fallback.criteriosAlta,
  };
}

export function buildClinicalReasoningSummary(
  context: LaudoSuggestionContext,
): ClinicalReasoningSummary {
  const latestAnamnese = context.anamneses[0];
  const areasSelecionadasDetalhadas = buildSelectedAreaSummaries(
    latestAnamnese?.areasAfetadas || [],
  );
  const areasPrioritarias = areasSelecionadasDetalhadas
    .map((area) => area.resumo)
    .slice(0, 6);
  const observacoesAreas = uniqueStrings(
    areasSelecionadasDetalhadas
      .map((area) =>
        area.observacao ? `${area.regiao}: ${area.observacao}` : '',
      )
      .filter(Boolean),
  ).slice(0, 8);
  const pontosAnamnesePreenchidos = buildFilledAnamneseFields(
    latestAnamnese,
    areasSelecionadasDetalhadas,
  );
  const redFlags = normalizeStringArray(latestAnamnese?.redFlags);
  const yellowFlags = normalizeStringArray(latestAnamnese?.yellowFlags);
  const exameFisicoResumo = shortText(context.exameFisicoResumo, 260);
  const latestEvolucoes = context.evolucoes.slice(0, 2);
  const examesComIa = context.exames.filter((exame) => !!exame.aiInterpretacao);
  const intensidadeDor =
    typeof latestAnamnese?.intensidadeDor === 'number'
      ? latestAnamnese.intensidadeDor
      : null;
  const irritabilidade = inferIrritability({
    intensidadeDor,
    dorRepouso: latestAnamnese?.dorRepouso,
    dorNoturna: latestAnamnese?.dorNoturna,
    irradiacao: latestAnamnese?.irradiacao,
  });

  const queixaPrincipal =
    safeText(latestAnamnese?.descricaoSintomas) ||
    safeText(latestAnamnese?.motivoBusca) ||
    areasPrioritarias[0] ||
    'Queixa principal ainda nao definida';

  const hipotesesFuncionais = uniqueStrings(
    [
      areasPrioritarias.length
        ? `Regiao prioritaria: ${areasPrioritarias.join(', ')}`
        : '',
      ...areasSelecionadasDetalhadas.map(
        (area) => `Area selecionada na anamnese: ${area.resumo}`,
      ),
      observacoesAreas.length
        ? `Observacoes clinicas por area: ${observacoesAreas.join(' | ')}`
        : '',
      latestAnamnese?.tipoDor
        ? `Padrao de dor informado: ${latestAnamnese.tipoDor}`
        : '',
      latestAnamnese?.inicioProblema || latestAnamnese?.mecanismoLesao
        ? `Inicio/mecanismo: ${safeText(latestAnamnese?.inicioProblema, 'nao informado')} / ${safeText(latestAnamnese?.mecanismoLesao, 'nao informado')}`
        : '',
      exameFisicoResumo ? `Exame fisico: ${exameFisicoResumo}` : '',
      latestAnamnese?.limitacoesFuncionais
        ? `Limitacao funcional: ${shortText(latestAnamnese.limitacoesFuncionais, 180)}`
        : '',
    ].filter(Boolean),
  );

  const fatoresRelevantes = uniqueStrings(
    [
      intensidadeDor != null ? `Dor referida: ${intensidadeDor}/10` : '',
      latestAnamnese?.fatoresPiora
        ? `Piora com: ${shortText(latestAnamnese.fatoresPiora, 180)}`
        : '',
      latestAnamnese?.fatorAlivio
        ? `Alivia com: ${shortText(latestAnamnese.fatorAlivio, 180)}`
        : '',
      latestAnamnese?.irradiacao
        ? `Irradiacao: ${safeText(latestAnamnese.localIrradiacao, 'local nao informado')}`
        : '',
      latestAnamnese?.atividadesQuePioram
        ? `Atividades que pioram: ${shortText(latestAnamnese.atividadesQuePioram, 180)}`
        : '',
      observacoesAreas.length
        ? `Observacoes das areas selecionadas: ${observacoesAreas.join(' | ')}`
        : '',
      buildLifestyleFactor(latestAnamnese),
    ].filter(Boolean),
  );

  const riscosOuAlertas = uniqueStrings(
    [
      ...redFlags.map((flag) => `Red flag: ${flag}`),
      latestAnamnese?.dorNoturna ? 'Dor noturna referida' : '',
      latestAnamnese?.dorRepouso ? 'Dor em repouso referida' : '',
      ...yellowFlags.map((flag) => `Yellow flag: ${flag}`),
    ].filter(Boolean),
  );

  const metasPaciente = uniqueStrings(
    [
      latestAnamnese?.metaPrincipalPaciente
        ? `Meta do paciente: ${shortText(latestAnamnese.metaPrincipalPaciente, 180)}`
        : '',
      latestAnamnese?.limitacoesFuncionais
        ? `Funcao-alvo: ${shortText(latestAnamnese.limitacoesFuncionais, 180)}`
        : '',
    ].filter(Boolean),
  );

  const evolucaoRecente = latestEvolucoes
    .map((evolucao) =>
      [
        evolucao.avaliacao
          ? `Avaliacao: ${shortText(evolucao.avaliacao, 140)}`
          : '',
        evolucao.plano ? `Plano: ${shortText(evolucao.plano, 140)}` : '',
        evolucao.observacoes
          ? `Obs: ${shortText(evolucao.observacoes, 140)}`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean);
  const ancorasEspecificidade = buildCaseSpecificityAnchors({
    latestAnamnese,
    areasSelecionadasDetalhadas,
    observacoesAreas,
    exameFisicoResumo,
    evolucaoRecente,
    examesComIa,
  });

  const evidenciasDisponiveis = [
    latestAnamnese ? 'anamnese' : '',
    areasSelecionadasDetalhadas.length ? 'areas selecionadas' : '',
    observacoesAreas.length ? 'observacoes clinicas por area' : '',
    exameFisicoResumo ? 'exame fisico estruturado' : '',
    context.evolucoes.length ? 'evolucoes' : '',
    context.exames.length ? 'exames anexados' : '',
    examesComIa.length ? 'leitura IA de exames' : '',
  ].filter(Boolean);

  const lacunasClinicas = buildClinicalGaps({
    latestAnamnese,
    hasExameFisico: !!exameFisicoResumo,
    hasEvolucao: context.evolucoes.length > 0,
    hasExamInsight: examesComIa.length > 0,
  });
  const confidenceBase = inferConfidenceBase(evidenciasDisponiveis.length);

  return {
    queixaPrincipal,
    areasPrioritarias,
    areasSelecionadasDetalhadas,
    observacoesAreas,
    pontosAnamnesePreenchidos,
    ancorasEspecificidade,
    irritabilidade,
    hipotesesFuncionais,
    fatoresRelevantes,
    riscosOuAlertas,
    metasPaciente,
    evolucaoRecente,
    evidenciasDisponiveis,
    lacunasClinicas,
    confidenceBase,
  };
}

function buildRuleBasedLaudoFields(
  summary: ClinicalReasoningSummary,
  options: {
    examesConsiderados: number;
    exameFisicoHint: string;
  },
): Pick<
  CreateLaudoDto,
  | 'diagnosticoFuncional'
  | 'objetivosCurtoPrazo'
  | 'objetivosMedioPrazo'
  | 'condutas'
  | 'planoTratamentoIA'
  | 'criteriosAlta'
> {
  const hasRedFlag = summary.riscosOuAlertas.some((item) =>
    item.toLowerCase().includes('red flag'),
  );
  const evidence = summary.evidenciasDisponiveis.length
    ? summary.evidenciasDisponiveis.join(', ')
    : 'dados clinicos limitados';
  const lacunas = summary.lacunasClinicas.length
    ? ` Lacunas para revisar: ${summary.lacunasClinicas.join('; ')}.`
    : '';
  const examSuffix = buildExamCorrelationSuffix(options.examesConsiderados);
  const areaObservationSuffix = summary.observacoesAreas.length
    ? ` Observacoes por area: ${summary.observacoesAreas.join(' | ')}.`
    : '';
  const filledFieldsSuffix = summary.pontosAnamnesePreenchidos.length
    ? ` Pontos preenchidos da anamnese considerados: ${summary.pontosAnamnesePreenchidos.join(', ')}.`
    : '';
  const anchorSuffix = summary.ancorasEspecificidade.length
    ? ` Ancoras especificas do caso: ${summary.ancorasEspecificidade.join(' | ')}.`
    : '';
  const primaryArea = summary.areasSelecionadasDetalhadas[0]?.resumo;
  const primaryGoal = summary.metasPaciente[0];
  const relevantFactors = summary.fatoresRelevantes.slice(0, 4).join(' | ');
  const progressCriterion =
    summary.irritabilidade === 'ALTA'
      ? 'sem aumento de dor em repouso/noturna e sem piora sustentada por 24h'
      : 'dor toleravel durante a tarefa e retorno ao basal em ate 24h';

  return {
    diagnosticoFuncional: joinSentences([
      `Hipotese funcional inicial: ${summary.queixaPrincipal}.`,
      summary.areasPrioritarias.length
        ? `Regioes prioritarias: ${summary.areasPrioritarias.join(', ')}.`
        : '',
      summary.hipotesesFuncionais.length
        ? `Raciocinio: ${summary.hipotesesFuncionais.join(' | ')}.`
        : '',
      areaObservationSuffix,
      `Base de evidencia: ${evidence}.`,
      `${anchorSuffix}${filledFieldsSuffix}${lacunas}${examSuffix}${options.exameFisicoHint}`,
    ]),
    objetivosCurtoPrazo: hasRedFlag
      ? 'Garantir seguranca clinica, revisar red flags e definir encaminhamento antes de progressao terapeutica.'
      : joinSentences([
          summary.irritabilidade === 'ALTA'
            ? `Reduzir irritabilidade em ${primaryArea || 'regiao sintomatica'} mantendo ${progressCriterion}.`
            : `Reduzir sintomas em ${primaryArea || 'regiao sintomatica'} e melhorar controle motor inicial com ${progressCriterion}.`,
          relevantFactors
            ? `Dosar pelo comportamento: ${relevantFactors}.`
            : '',
          summary.metasPaciente[0] || '',
        ]),
    objetivosMedioPrazo: joinSentences([
      primaryArea
        ? `Restaurar tolerancia a carga/movimento em ${primaryArea} com resposta estavel entre sessoes.`
        : 'Restaurar funcao progressiva com tolerancia a carga e autonomia.',
      summary.metasPaciente.length
        ? `Direcionar para ${summary.metasPaciente.join(' | ')}.`
        : '',
    ]),
    condutas: joinSentences([
      hasRedFlag
        ? 'Priorizar orientacao de seguranca, encaminhamento/reavaliacao e suspender progressao de carga ate liberacao clinica.'
        : '',
      'Educacao em dor e manejo de carga conforme irritabilidade do caso.',
      summary.fatoresRelevantes.length
        ? `Dosar condutas considerando: ${summary.fatoresRelevantes.join(' | ')}.`
        : '',
      summary.areasSelecionadasDetalhadas.length
        ? `Priorizar avaliacao e resposta terapeutica por area selecionada: ${summary.areasSelecionadasDetalhadas.map((area) => area.resumo).join(' | ')}.`
        : '',
      `Conduta: exercicios terapeuticos progressivos para ${primaryArea || 'regiao sintomatica'} | Evidencia do caso: ${summary.ancorasEspecificidade.slice(0, 4).join(' | ') || evidence} | Criterio de progressao: ${progressCriterion}.`,
      relevantFactors
        ? `Conduta: manejo de carga e educacao direcionada | Evidencia do caso: ${relevantFactors} | Criterio de progressao: execucao das atividades-alvo sem piora sustentada.`
        : '',
      summary.evolucaoRecente.length
        ? `Ajustar pela evolucao recente: ${summary.evolucaoRecente.join(' / ')}.`
        : '',
      `Evidencias usadas: ${evidence}.`,
    ]),
    planoTratamentoIA: [
      `Fase 1: controlar irritabilidade (${summary.irritabilidade}) em ${primaryArea || 'regiao sintomatica'} e confirmar lacunas clinicas. Condutas: educacao direcionada, ajuste de carga e movimento toleravel. Evidencia: ${summary.ancorasEspecificidade.slice(0, 3).join(' | ') || evidence}. Criterio: ${progressCriterion}.`,
      `Fase 2: progredir mobilidade, controle motor e forca em ${primaryArea || 'regiao prioritaria'}. Condutas: tarefas graduadas vinculadas a ${primaryGoal || 'funcao-alvo do paciente'}. Evidencia: ${relevantFactors || evidence}. Criterio: melhora funcional objetiva e resposta estavel entre sessoes.`,
      `Fase 3: retorno funcional especifico para ${primaryGoal || 'atividade-alvo'} e prevencao de recidiva. Condutas: exposicao progressiva a demandas do caso e plano domiciliar. Criterio: tarefa-alvo executada com independencia e baixa reatividade.`,
      summary.areasSelecionadasDetalhadas.length
        ? `Monitoramento por area: ${summary.areasSelecionadasDetalhadas.map((area) => area.resumo).join(' | ')}.`
        : '',
      summary.riscosOuAlertas.length
        ? `Alertas a monitorar: ${summary.riscosOuAlertas.join(' | ')}.`
        : '',
      summary.lacunasClinicas.length
        ? `Pendencias de avaliacao: ${summary.lacunasClinicas.join(' | ')}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    criteriosAlta: joinSentences([
      `Dor controlada em ${primaryArea || 'regiao sintomatica'} e sem piora sustentada apos atividades funcionais.`,
      primaryGoal
        ? `${primaryGoal} atingida ou funcionalmente compensada.`
        : 'Meta funcional do paciente atingida ou funcionalmente compensada.',
      `Autonomia no autocuidado/plano domiciliar, com progressao baseada em ${progressCriterion}.`,
      summary.areasPrioritarias.length
        ? `Reavaliar regioes prioritarias antes da alta: ${summary.areasPrioritarias.join(', ')}.`
        : '',
    ]),
  };
}

function calculateAge(dataNascimento: Date): number | null {
  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function buildExamCorrelationSuffix(examesCount: number): string {
  if (examesCount <= 0) return '';
  return ` Correlacionar com ${examesCount} exame(s) anexado(s).`;
}

function buildExameFisicoHint(exameFisicoResumo?: string | null): string {
  const raw = String(exameFisicoResumo || '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/\s+/g, ' ');
  const short =
    normalized.length > 240 ? `${normalized.slice(0, 240)}...` : normalized;
  return ` Baseado no exame fisico: ${short}`;
}

function appendSuggestedReferencesToPlan(
  text: string | undefined,
  referenciasClinicas?: LaudoReferenceSuggestionResponse,
): string | undefined {
  const base = safeText(text);
  if (!base || !referenciasClinicas) return base || undefined;
  const references = [
    ...referenciasClinicas.laudoReferences,
    ...referenciasClinicas.planoReferences,
  ];
  const unique = Array.from(
    new Map(references.map((item) => [item.id, item])).values(),
  ).slice(0, 6);
  if (!unique.length) return base;

  const block = [
    '',
    'Referencias clinicas sugeridas para revisao profissional:',
    ...unique.map((item) => {
      const year = item.year ? `, ${item.year}` : '';
      return `- [${item.category}] ${item.title} (${item.source}${year}). ${item.rationale}`;
    }),
  ].join('\n');

  return `${base}${block}`;
}

function safeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized || fallback;
}

function shortText(value: unknown, maxLen: number): string {
  const normalized = safeText(value);
  if (!normalized) return '';
  return normalized.length > maxLen
    ? `${normalized.slice(0, Math.max(0, maxLen - 3))}...`
    : normalized;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = safeText(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return uniqueStrings(values.map((value) => safeText(value)).filter(Boolean));
}

function buildSelectedAreaSummaries(
  areas: SuggestionAnamnese['areasAfetadas'],
): ClinicalAreaSummary[] {
  return areas
    .map((area) => {
      const regiao = safeText(area.regiao);
      if (!regiao) return null;
      const lado = safeText(area.lado) || undefined;
      const vista = safeText(area.vista) || undefined;
      const observacao = shortText(area.observacao, 180) || undefined;
      const intensidade =
        typeof area.intensidade === 'number' ? area.intensidade : null;
      const summary: ClinicalAreaSummary = {
        regiao,
        ...(lado ? { lado } : {}),
        ...(vista ? { vista } : {}),
        intensidade,
        ...(observacao ? { observacao } : {}),
        resumo: formatAffectedArea({
          regiao,
          lado,
          vista,
          intensidade,
          observacao,
        }),
      };
      return summary;
    })
    .filter((area): area is ClinicalAreaSummary => !!area);
}

function buildFilledAnamneseFields(
  anamnese: SuggestionAnamnese | undefined,
  areasSelecionadasDetalhadas: ClinicalAreaSummary[],
): string[] {
  if (!anamnese) return [];
  const fields = [
    anamnese.motivoBusca ? 'motivoBusca' : '',
    areasSelecionadasDetalhadas.length ? 'areasAfetadas' : '',
    areasSelecionadasDetalhadas.some((area) => area.observacao)
      ? 'areasAfetadas.observacao'
      : '',
    typeof anamnese.intensidadeDor === 'number' ? 'intensidadeDor' : '',
    safeText(anamnese.descricaoSintomas) ? 'descricaoSintomas' : '',
    safeText(anamnese.tempoProblema) ? 'tempoProblema' : '',
    safeText(anamnese.inicioProblema) ? 'inicioProblema' : '',
    safeText(anamnese.eventoEspecifico) ? 'eventoEspecifico' : '',
    safeText(anamnese.mecanismoLesao) ? 'mecanismoLesao' : '',
    safeText(anamnese.fatorAlivio) ? 'fatorAlivio' : '',
    safeText(anamnese.fatoresPiora) ? 'fatoresPiora' : '',
    anamnese.dorRepouso != null ? 'dorRepouso' : '',
    anamnese.dorNoturna != null ? 'dorNoturna' : '',
    anamnese.irradiacao != null ? 'irradiacao' : '',
    safeText(anamnese.localIrradiacao) ? 'localIrradiacao' : '',
    safeText(anamnese.tipoDor) ? 'tipoDor' : '',
    normalizeStringArray(anamnese.redFlags).length ? 'redFlags' : '',
    normalizeStringArray(anamnese.yellowFlags).length ? 'yellowFlags' : '',
    safeText(anamnese.lesoesPrevias) ? 'lesoesPrevias' : '',
    safeText(anamnese.usoMedicamentos) ? 'usoMedicamentos' : '',
    safeText(anamnese.limitacoesFuncionais) ? 'limitacoesFuncionais' : '',
    safeText(anamnese.atividadesQuePioram) ? 'atividadesQuePioram' : '',
    safeText(anamnese.metaPrincipalPaciente) ? 'metaPrincipalPaciente' : '',
    typeof anamnese.qualidadeSono === 'number' ? 'qualidadeSono' : '',
    typeof anamnese.nivelEstresse === 'number' ? 'nivelEstresse' : '',
    typeof anamnese.energiaDiaria === 'number' ? 'energiaDiaria' : '',
    typeof anamnese.apoioEmocional === 'number' ? 'apoioEmocional' : '',
    safeText(anamnese.observacoesEstiloVida) ? 'observacoesEstiloVida' : '',
  ];
  return uniqueStrings(fields.filter(Boolean));
}

function buildCaseSpecificityAnchors(input: {
  latestAnamnese?: SuggestionAnamnese;
  areasSelecionadasDetalhadas: ClinicalAreaSummary[];
  observacoesAreas: string[];
  exameFisicoResumo: string;
  evolucaoRecente: string[];
  examesComIa: LaudoExamInsight[];
}): string[] {
  const anamnese = input.latestAnamnese;
  const intensidadeDor =
    typeof anamnese?.intensidadeDor === 'number'
      ? `Dor ${anamnese.intensidadeDor}/10`
      : '';
  const examInsight = input.examesComIa
    .map((exame) =>
      shortText(
        [exame.tipoExame, exame.aiInterpretacao].filter(Boolean).join(': '),
        180,
      ),
    )
    .filter(Boolean);

  return uniqueStrings(
    [
      ...input.areasSelecionadasDetalhadas.map(
        (area) => `Area selecionada: ${area.resumo}`,
      ),
      ...input.observacoesAreas.map(
        (observacao) => `Observacao de area: ${observacao}`,
      ),
      safeText(anamnese?.descricaoSintomas)
        ? `Sintomas: ${shortText(anamnese?.descricaoSintomas, 180)}`
        : '',
      intensidadeDor,
      safeText(anamnese?.tempoProblema)
        ? `Tempo do problema: ${shortText(anamnese?.tempoProblema, 120)}`
        : '',
      safeText(anamnese?.inicioProblema)
        ? `Inicio: ${safeText(anamnese?.inicioProblema)}`
        : '',
      safeText(anamnese?.mecanismoLesao)
        ? `Mecanismo: ${safeText(anamnese?.mecanismoLesao)}`
        : '',
      safeText(anamnese?.fatoresPiora)
        ? `Piora: ${shortText(anamnese?.fatoresPiora, 160)}`
        : '',
      safeText(anamnese?.fatorAlivio)
        ? `Alivio: ${shortText(anamnese?.fatorAlivio, 160)}`
        : '',
      safeText(anamnese?.atividadesQuePioram)
        ? `Atividades que pioram: ${shortText(anamnese?.atividadesQuePioram, 160)}`
        : '',
      safeText(anamnese?.limitacoesFuncionais)
        ? `Limitacao funcional: ${shortText(anamnese?.limitacoesFuncionais, 180)}`
        : '',
      safeText(anamnese?.metaPrincipalPaciente)
        ? `Meta do paciente: ${shortText(anamnese?.metaPrincipalPaciente, 160)}`
        : '',
      safeText(anamnese?.tipoDor)
        ? `Tipo de dor: ${safeText(anamnese?.tipoDor)}`
        : '',
      anamnese?.irradiacao
        ? `Irradiacao: ${safeText(anamnese.localIrradiacao, 'local nao informado')}`
        : '',
      anamnese?.dorRepouso ? 'Dor em repouso informada' : '',
      anamnese?.dorNoturna ? 'Dor noturna informada' : '',
      input.exameFisicoResumo ? `Exame fisico: ${input.exameFisicoResumo}` : '',
      ...input.evolucaoRecente.map((evolucao) => `Evolucao: ${evolucao}`),
      ...examInsight.map((exame) => `Exame anexado: ${exame}`),
    ].filter(Boolean),
  ).slice(0, 14);
}

function formatAffectedArea(
  area: SuggestionAnamnese['areasAfetadas'][number],
): string {
  const regiao = safeText(area.regiao);
  if (!regiao) return '';
  const details = [
    area.lado ? safeText(area.lado) : '',
    area.vista ? safeText(area.vista) : '',
    typeof area.intensidade === 'number' ? `dor ${area.intensidade}/10` : '',
    area.observacao ? shortText(area.observacao, 80) : '',
  ].filter(Boolean);
  return details.length ? `${regiao} (${details.join(', ')})` : regiao;
}

function inferIrritability(input: {
  intensidadeDor: number | null;
  dorRepouso?: boolean | null;
  dorNoturna?: boolean | null;
  irradiacao?: boolean | null;
}): ClinicalReasoningSummary['irritabilidade'] {
  if (input.dorRepouso || input.dorNoturna) return 'ALTA';
  if (typeof input.intensidadeDor === 'number') {
    if (input.intensidadeDor >= 7) return 'ALTA';
    if (input.intensidadeDor >= 4) return 'MODERADA';
    return 'BAIXA';
  }
  if (input.irradiacao) return 'MODERADA';
  return 'NAO_DEFINIDA';
}

function buildLifestyleFactor(anamnese?: SuggestionAnamnese): string {
  if (!anamnese) return '';
  const factors = [
    typeof anamnese.qualidadeSono === 'number'
      ? `sono ${anamnese.qualidadeSono}/10`
      : '',
    typeof anamnese.nivelEstresse === 'number'
      ? `estresse ${anamnese.nivelEstresse}/10`
      : '',
    typeof anamnese.energiaDiaria === 'number'
      ? `energia ${anamnese.energiaDiaria}/10`
      : '',
    typeof anamnese.apoioEmocional === 'number'
      ? `apoio emocional ${anamnese.apoioEmocional}/10`
      : '',
    anamnese.observacoesEstiloVida
      ? shortText(anamnese.observacoesEstiloVida, 140)
      : '',
  ].filter(Boolean);
  return factors.length
    ? `Fatores biopsicossociais: ${factors.join(', ')}`
    : '';
}

function buildClinicalGaps(input: {
  latestAnamnese?: SuggestionAnamnese;
  hasExameFisico: boolean;
  hasEvolucao: boolean;
  hasExamInsight: boolean;
}): string[] {
  const gaps: string[] = [];
  const anamnese = input.latestAnamnese;
  if (!anamnese) {
    return [
      'anamnese ausente',
      'exame fisico estruturado ausente',
      'evolucao clinica ausente',
    ];
  }
  if (!anamnese.areasAfetadas?.length)
    gaps.push('areas afetadas nao informadas');
  if (
    anamnese.areasAfetadas?.length &&
    !anamnese.areasAfetadas.some((area) => safeText(area.observacao))
  ) {
    gaps.push('observacoes clinicas por area ausentes');
  }
  if (!safeText(anamnese.inicioProblema))
    gaps.push('inicio do problema ausente');
  if (!safeText(anamnese.mecanismoLesao))
    gaps.push('mecanismo de lesao ausente');
  if (!safeText(anamnese.fatorAlivio)) gaps.push('fator de alivio ausente');
  if (!safeText(anamnese.fatoresPiora)) gaps.push('fatores de piora ausentes');
  if (!safeText(anamnese.limitacoesFuncionais)) {
    gaps.push('limitacoes funcionais pouco definidas');
  }
  if (!input.hasExameFisico) gaps.push('exame fisico estruturado ausente');
  if (!input.hasEvolucao) gaps.push('evolucao clinica ausente');
  if (!input.hasExamInsight) gaps.push('exames sem leitura clinica por IA');
  return gaps;
}

function inferConfidenceBase(
  evidenciasDisponiveisCount: number,
): ClinicalReasoningSummary['confidenceBase'] {
  if (evidenciasDisponiveisCount >= 4) return 'ALTA';
  if (evidenciasDisponiveisCount >= 2) return 'MODERADA';
  return 'BAIXA';
}

function joinSentences(parts: Array<string | undefined>): string {
  return parts
    .map((part) => safeText(part))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
