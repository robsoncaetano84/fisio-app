import { CreateLaudoDto } from './dto/create-laudo.dto';
import {
  GenerateLaudoSuggestionInput,
  LaudoExamInsight,
} from './laudo-ai-suggestion.service';

type SuggestionPaciente = {
  nomeCompleto: string;
  dataNascimento: Date;
  sexo: string;
  profissao?: string | null;
};

type SuggestionAnamnese = {
  motivoBusca: string;
  areasAfetadas: unknown;
  intensidadeDor: number;
  descricaoSintomas?: string | null;
  tempoProblema?: string | null;
  inicioProblema?: string | null;
  fatorAlivio?: string | null;
  fatoresPiora?: string | null;
  mecanismoLesao?: string | null;
  lesoesPrevias?: string | null;
  usoMedicamentos?: string | null;
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
): GenerateLaudoSuggestionInput {
  const latestAnamnese = context.anamneses[0];

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
          inicioProblema: latestAnamnese.inicioProblema ?? '',
          fatorAlivio: latestAnamnese.fatorAlivio ?? '',
          fatoresPiora: latestAnamnese.fatoresPiora ?? '',
          mecanismoLesao: latestAnamnese.mecanismoLesao ?? '',
          lesoesPrevias: latestAnamnese.lesoesPrevias ?? '',
          usoMedicamentos: latestAnamnese.usoMedicamentos ?? '',
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
  };
}

export function buildCreateLaudoDraft(params: {
  pacienteId: string;
  context: Pick<LaudoSuggestionContext, 'exames' | 'exameFisicoResumo'>;
  aiSuggestion: Partial<CreateLaudoDto>;
}): {
  payload: CreateLaudoDto;
  source: 'ai' | 'rules';
  examesConsiderados: number;
  examesComLeituraIa: number;
} {
  const { pacienteId, context, aiSuggestion } = params;
  const examesConsiderados = context.exames.length;
  const examesComLeituraIa = context.exames.filter(
    (e) => !!e.aiInterpretacao,
  ).length;
  const source: 'ai' | 'rules' = Object.keys(aiSuggestion).length
    ? 'ai'
    : 'rules';
  const exameFisicoHint = buildExameFisicoHint(context.exameFisicoResumo);

  return {
    source,
    examesConsiderados,
    examesComLeituraIa,
    payload: {
      pacienteId,
      diagnosticoFuncional:
        aiSuggestion.diagnosticoFuncional ??
        `Diagnostico funcional inicial a confirmar em consulta.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
      objetivosCurtoPrazo: aiSuggestion.objetivosCurtoPrazo,
      objetivosMedioPrazo: aiSuggestion.objetivosMedioPrazo,
      frequenciaSemanal: aiSuggestion.frequenciaSemanal,
      duracaoSemanas: aiSuggestion.duracaoSemanas,
      condutas:
        aiSuggestion.condutas ??
        `Plano inicial de cinesioterapia, educacao em dor e reavaliacao funcional semanal.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
      planoTratamentoIA:
        aiSuggestion.planoTratamentoIA ??
        `Semana 1-2: controle de dor e mobilidade.\nSemana 3-4: ganho de forca e estabilidade.\nSemana 5+: progressao funcional e prevencao de recidiva.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
      criteriosAlta: aiSuggestion.criteriosAlta,
    },
  };
}

export function buildSuggestionPreview(
  context: LaudoSuggestionContext,
  aiSuggestion: Partial<CreateLaudoDto>,
): LaudoSuggestionPreview {
  const source = Object.keys(aiSuggestion).length ? 'ai' : 'rules';
  const examesConsiderados = context.exames.length;
  const examesComLeituraIa = context.exames.filter(
    (e) => !!e.aiInterpretacao,
  ).length;
  const confidence: 'BAIXA' | 'MODERADA' | 'ALTA' =
    source === 'ai' && examesComLeituraIa > 0
      ? 'ALTA'
      : source === 'ai' || examesConsiderados > 0
        ? 'MODERADA'
        : 'BAIXA';
  const reason =
    source === 'ai'
      ? 'Sugestao de plano gerada por IA com base no historico clinico.'
      : 'Sugestao de plano gerada por regras clinicas (fallback).';
  const evidenceFields = [
    'anamnese',
    ...(context.evolucoes.length > 0 ? ['evolucoes'] : []),
    ...(context.exameFisicoResumo ? ['exameFisico'] : []),
    ...(examesConsiderados > 0 ? ['exames'] : []),
  ];
  const exameFisicoHint = buildExameFisicoHint(context.exameFisicoResumo);

  return {
    source,
    examesConsiderados,
    examesComLeituraIa,
    sugestaoGeradaEm: new Date().toISOString(),
    confidence,
    reason,
    evidenceFields,
    diagnosticoFuncional:
      aiSuggestion.diagnosticoFuncional ??
      `Diagnostico funcional inicial a confirmar em consulta.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
    objetivosCurtoPrazo:
      aiSuggestion.objetivosCurtoPrazo ??
      'Reduzir dor percebida e melhorar controle motor inicial.',
    objetivosMedioPrazo:
      aiSuggestion.objetivosMedioPrazo ??
      'Restabelecer funcao global e autonomia nas atividades diarias.',
    frequenciaSemanal: aiSuggestion.frequenciaSemanal ?? 2,
    duracaoSemanas: aiSuggestion.duracaoSemanas ?? 8,
    condutas:
      aiSuggestion.condutas ??
      `Exercicios terapeuticos progressivos, educacao em dor e reavaliacao funcional.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
    planoTratamentoIA:
      aiSuggestion.planoTratamentoIA ??
      `Semana 1-2: controle de dor e mobilidade.\nSemana 3-4: ganho de forca e estabilidade.\nSemana 5+: progressao funcional.${buildExamCorrelationSuffix(examesConsiderados)}${exameFisicoHint}`,
    criteriosAlta:
      aiSuggestion.criteriosAlta ??
      'Dor controlada, funcao satisfatoria e independencia para autocuidado.',
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
