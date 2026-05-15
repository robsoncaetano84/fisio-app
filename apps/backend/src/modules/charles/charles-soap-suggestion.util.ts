import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { hasStructuredExame } from './charles-clinical-context.util';

export type CharlesSoapSuggestionDraft = {
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  reason: string;
  evidenceFields: string[];
  subjetivo: string | null;
  objetivo: string | null;
  avaliacao: string | null;
  plano: string | null;
};

export type CharlesSoapClinicalContextArgs = {
  paciente: {
    dataNascimento?: Date | null;
    sexo?: string | null;
    profissao?: string | null;
  };
  anamnese?: Partial<Anamnese> | null;
  evolucao?: Partial<Evolucao> | null;
  laudo?: Partial<Laudo> | null;
  fallback: CharlesSoapSuggestionDraft;
};

export type CharlesSoapAiPrompt = {
  systemPrompt: string;
  userPrompt: string;
};

export const CHARLES_SOAP_AI_OPERATION = 'charles.evolucao_soap';

export function buildEvolucaoSoapAiPrompt(
  args: CharlesSoapClinicalContextArgs,
): CharlesSoapAiPrompt {
  return {
    systemPrompt:
      'Voce e Charles, um assistente clinico de apoio a fisioterapeutas. Gere sugestoes SOAP prudentes, rastreaveis e revisaveis. Nao invente dados ausentes e nunca substitua validacao profissional.',
    userPrompt: `
Retorne SOMENTE JSON valido com as chaves:
confidence ("BAIXA" | "MODERADA" | "ALTA"),
reason (string ate 240 caracteres),
evidenceFields (array de strings escolhidas dos campos do contexto),
subjetivo (string ou null),
objetivo (string ou null),
avaliacao (string ou null),
plano (string ou null).

Regras:
- Escreva em portugues do Brasil, direto para o prontuario do profissional.
- Use SOAP: S deve refletir relato/sintomas; O deve pedir ou registrar medidas objetivas; A deve correlacionar evolucao, irritabilidade, funcao e hipotese; P deve orientar proxima conduta.
- Se houver sinais de alerta ou lacunas, registre no campo avaliacao ou plano de forma prudente.
- Nao use nome do paciente, nao prometa cura e nao mencione que foi gerado por IA.
- Se os dados forem insuficientes, retorne confidence "BAIXA" e mantenha null nos campos que nao puder sustentar.
- Preserve revisao profissional: textos devem ser rascunhos editaveis.

Contexto clinico:
${JSON.stringify(buildEvolucaoSoapAiContext(args), null, 2)}
`,
  };
}

export function inferEvolucaoSoapSuggestion(args: {
  anamnese?: Partial<Anamnese> | null;
  evolucao?: Partial<Evolucao> | null;
  laudo?: Partial<Laudo> | null;
}): CharlesSoapSuggestionDraft {
  const anamnese = args.anamnese;
  const evolucao = args.evolucao;
  const laudo = args.laudo;

  const queixa =
    String(anamnese?.descricaoSintomas || '').trim() ||
    String(anamnese?.metaPrincipalPaciente || '').trim();
  const piora = String(anamnese?.fatoresPiora || '').trim();
  const alivio = String(anamnese?.fatorAlivio || '').trim();
  const areas = (anamnese?.areasAfetadas || [])
    .map((area) => String(area.regiao || '').trim())
    .filter(Boolean);
  const exameTemplated = hasStructuredExame(laudo?.exameFisico);
  const hadPreviousEvolution = !!evolucao;

  if (!queixa && !areas.length && !exameTemplated) {
    return {
      confidence: 'BAIXA',
      reason:
        'Dados insuficientes (anamnese e exame fisico) para sugerir preenchimento de evolucao.',
      evidenceFields: [],
      subjetivo: null,
      objetivo: null,
      avaliacao: null,
      plano: null,
    };
  }

  const regionHint = areas.length
    ? `regiao ${areas.join(', ')}`
    : 'regiao principal';
  const dorHint = queixa ? queixa : 'queixa relatada pelo paciente';

  const subjetivo = hadPreviousEvolution
    ? 'Paciente refere evolucao em relacao a sessao anterior; validar tolerancia funcional e sintomas residuais.'
    : `Paciente relata ${dorHint}${piora ? `. Piora com ${piora}` : ''}${alivio ? ` e alivio com ${alivio}` : ''}.`;

  const objetivo = exameTemplated
    ? `Reavaliar achados objetivos da ${regionHint}, comparar ADM/forca/testes funcionais com baseline do exame fisico.`
    : `Registrar medidas objetivas da ${regionHint} (ADM, forca, teste funcional e dor evocada).`;

  const avaliacao = hadPreviousEvolution
    ? 'Evolucao clinica em acompanhamento; confirmar se houve ganho funcional e reducao da irritabilidade.'
    : 'Quadro em fase inicial de evolucao; correlacionar resposta da sessao com hipotese funcional.';

  const plano =
    'Manter conduta ativa com progressao graduada, reforcar orientacoes domiciliares e agendar nova reavaliacao.';

  const evidenceFields: string[] = [];
  if (queixa) evidenceFields.push('queixaPrincipal/descricaoSintomas');
  if (areas.length) evidenceFields.push('areasAfetadas');
  if (piora) evidenceFields.push('fatoresPiora');
  if (alivio) evidenceFields.push('fatorAlivio');
  if (exameTemplated) evidenceFields.push('laudo.exameFisico');
  if (hadPreviousEvolution) evidenceFields.push('evolucaoAnterior');

  return {
    confidence: evidenceFields.length >= 3 ? 'MODERADA' : 'BAIXA',
    reason:
      'Sugestao textual de evolucao (SOAP) baseada em anamnese, exame fisico e historico mais recente.',
    evidenceFields,
    subjetivo,
    objetivo,
    avaliacao,
    plano,
  };
}

export function buildEvolucaoSoapAiContext(
  args: CharlesSoapClinicalContextArgs,
) {
  const anamnese = args.anamnese;
  const evolucao = args.evolucao;
  const laudo = args.laudo;

  return {
    paciente: {
      idade: getAgeInYears(args.paciente.dataNascimento),
      sexo: args.paciente.sexo || null,
      profissao: truncateClinicalText(args.paciente.profissao, 120),
    },
    anamnese: anamnese
      ? {
          motivoBusca: truncateClinicalText(anamnese.motivoBusca, 500),
          areasAfetadas: anamnese.areasAfetadas || [],
          intensidadeDor: anamnese.intensidadeDor,
          descricaoSintomas: truncateClinicalText(
            anamnese.descricaoSintomas,
            900,
          ),
          inicioProblema: anamnese.inicioProblema || null,
          mecanismoLesao: anamnese.mecanismoLesao || null,
          fatorAlivio: truncateClinicalText(anamnese.fatorAlivio, 500),
          fatoresPiora: truncateClinicalText(anamnese.fatoresPiora, 500),
          atividadesQuePioram: truncateClinicalText(
            anamnese.atividadesQuePioram,
            500,
          ),
          limitacoesFuncionais: truncateClinicalText(
            anamnese.limitacoesFuncionais,
            700,
          ),
          metaPrincipalPaciente: truncateClinicalText(
            anamnese.metaPrincipalPaciente,
            500,
          ),
          tipoDor: anamnese.tipoDor || null,
          irradiacao: anamnese.irradiacao,
          localIrradiacao: truncateClinicalText(anamnese.localIrradiacao, 300),
          redFlags: anamnese.redFlags || [],
          yellowFlags: anamnese.yellowFlags || [],
          qualidadeSono: anamnese.qualidadeSono,
          nivelEstresse: anamnese.nivelEstresse,
        }
      : null,
    evolucaoAnterior: evolucao
      ? {
          data: evolucao.data,
          subjetivo: truncateClinicalText(evolucao.subjetivo, 700),
          objetivo: truncateClinicalText(evolucao.objetivo, 700),
          avaliacao: truncateClinicalText(evolucao.avaliacao, 700),
          plano: truncateClinicalText(evolucao.plano, 700),
          checkinDor: evolucao.checkinDor,
          checkinDificuldade: evolucao.checkinDificuldade,
          dorStatus: evolucao.dorStatus,
          funcaoStatus: evolucao.funcaoStatus,
          adesaoStatus: evolucao.adesaoStatus,
          statusEvolucao: evolucao.statusEvolucao,
          condutaStatus: evolucao.condutaStatus,
          observacoes: truncateClinicalText(evolucao.observacoes, 700),
        }
      : null,
    laudo: laudo
      ? {
          diagnosticoFuncional: truncateClinicalText(
            laudo.diagnosticoFuncional,
            900,
          ),
          condutas: truncateClinicalText(laudo.condutas, 900),
          planoTratamentoIA: truncateClinicalText(laudo.planoTratamentoIA, 900),
          criteriosAlta: truncateClinicalText(laudo.criteriosAlta, 700),
          exameFisico: truncateClinicalText(laudo.exameFisico, 1400),
          status: laudo.status,
        }
      : null,
    sugestaoDeterministicaFallback: args.fallback,
    camposPermitidosParaEvidenceFields: [
      'anamnese.descricaoSintomas',
      'anamnese.areasAfetadas',
      'anamnese.intensidadeDor',
      'anamnese.fatoresPiora',
      'anamnese.fatorAlivio',
      'anamnese.limitacoesFuncionais',
      'anamnese.metaPrincipalPaciente',
      'anamnese.redFlags',
      'anamnese.yellowFlags',
      'evolucaoAnterior',
      'laudo.diagnosticoFuncional',
      'laudo.exameFisico',
      'laudo.condutas',
      'laudo.planoTratamentoIA',
    ],
  };
}

export function sanitizeAiSoapSuggestion(
  parsed: Record<string, unknown>,
): CharlesSoapSuggestionDraft | null {
  const subjetivo = normalizeAiText(parsed.subjetivo, 900);
  const objetivo = normalizeAiText(parsed.objetivo, 900);
  const avaliacao = normalizeAiText(parsed.avaliacao, 900);
  const plano = normalizeAiText(parsed.plano, 900);
  if (!subjetivo && !objetivo && !avaliacao && !plano) return null;

  return {
    confidence: normalizeConfidence(parsed.confidence),
    reason:
      normalizeAiText(parsed.reason, 240) ||
      'Sugestao SOAP contextual baseada nos dados clinicos disponiveis.',
    evidenceFields: normalizeEvidenceFields(parsed.evidenceFields),
    subjetivo,
    objetivo,
    avaliacao,
    plano,
  };
}

export function mergeSoapSuggestions(
  fallback: CharlesSoapSuggestionDraft,
  aiSuggestion: CharlesSoapSuggestionDraft,
): CharlesSoapSuggestionDraft {
  return {
    confidence: aiSuggestion.confidence || fallback.confidence,
    reason: aiSuggestion.reason || fallback.reason,
    evidenceFields: Array.from(
      new Set([...aiSuggestion.evidenceFields, ...fallback.evidenceFields]),
    ).slice(0, 10),
    subjetivo: aiSuggestion.subjetivo || fallback.subjetivo,
    objetivo: aiSuggestion.objetivo || fallback.objetivo,
    avaliacao: aiSuggestion.avaliacao || fallback.avaliacao,
    plano: aiSuggestion.plano || fallback.plano,
  };
}

function normalizeAiText(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]+/g, ' ');
  if (!normalized) return null;
  return normalized.slice(0, maxLen);
}

function truncateClinicalText(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLen);
}

function normalizeConfidence(
  value: unknown,
): CharlesSoapSuggestionDraft['confidence'] {
  const normalized =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const normalizedConfidence = normalized.trim().toUpperCase();
  if (normalizedConfidence === 'ALTA') return 'ALTA';
  if (normalizedConfidence === 'MODERADA') return 'MODERADA';
  return 'BAIXA';
}

function normalizeEvidenceFields(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getAgeInYears(dataNascimento?: Date | null): number | null {
  if (!dataNascimento) return null;
  const birth = new Date(dataNascimento);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}
