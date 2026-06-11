import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../ai/openai.service';
import { PacienteExame } from '../pacientes/entities/paciente-exame.entity';
import { readExameFile } from '../pacientes/exame-storage';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { logOperationalEvent } from '../../common/observability/operational-logging';
import type {
  LaudoReferenceCategory,
  LaudoReferenceItem,
  LaudoReferenceSuggestionResponse,
  LaudoReferenceUpdate,
} from './laudo-references.service';

export type LaudoExamInsight = {
  nomeOriginal: string;
  tipoExame: string;
  dataExame: Date | null;
  mimeType: string;
  observacao: string;
  uploadedAt: Date;
  aiInterpretacao?: string;
};

export type ClinicalAreaSummary = {
  regiao: string;
  lado?: string;
  vista?: string;
  observacao?: string;
  resumo: string;
};

export type ClinicalReasoningSummary = {
  queixaPrincipal: string;
  areasPrioritarias: string[];
  areasSelecionadasDetalhadas: ClinicalAreaSummary[];
  observacoesAreas: string[];
  pontosAnamnesePreenchidos: string[];
  ancorasEspecificidade: string[];
  irritabilidade: 'BAIXA' | 'MODERADA' | 'ALTA' | 'NAO_DEFINIDA';
  hipotesesFuncionais: string[];
  fatoresRelevantes: string[];
  riscosOuAlertas: string[];
  metasPaciente: string[];
  evolucaoRecente: string[];
  evidenciasDisponiveis: string[];
  lacunasClinicas: string[];
  confidenceBase: 'BAIXA' | 'MODERADA' | 'ALTA';
};

export type GenerateLaudoSuggestionInput = {
  paciente: {
    nomeCompleto: string;
    idade: number | null;
    sexo: string;
    profissao: string;
  };
  anamnese: {
    motivoBusca: string;
    areasAfetadas: unknown;
    intensidadeDor: number;
    descricaoSintomas: string;
    tempoProblema: string;
    horaIntensifica?: string;
    inicioProblema: string;
    eventoEspecifico?: string;
    fatorAlivio: string;
    fatoresPiora: string;
    mecanismoLesao: string;
    problemaAnterior?: boolean | null;
    quandoProblemaAnterior?: string;
    tratamentosAnteriores?: string[];
    lesoesPrevias: string;
    usoMedicamentos: string;
    dorRepouso?: boolean | null;
    dorNoturna?: boolean | null;
    irradiacao?: boolean | null;
    localIrradiacao?: string;
    tipoDor?: string;
    fenotipoDorEvidencias?: Record<string, boolean>;
    sinaisSensibilizacaoCentral?: string;
    redFlags?: string[];
    yellowFlags?: string[];
    limitacoesFuncionais?: string;
    atividadesQuePioram?: string;
    metaPrincipalPaciente?: string;
    horasSonoMedia?: string;
    qualidadeSono?: number | null;
    nivelEstresse?: number | null;
    humorPredominante?: string;
    energiaDiaria?: number | null;
    atividadeFisicaRegular?: boolean | null;
    frequenciaAtividadeFisica?: string;
    apoioEmocional?: number | null;
    observacoesEstiloVida?: string;
  } | null;
  evolucoes: Array<{
    data: Date;
    avaliacaoClinica: string;
    planoSessao: string;
    observacoes: string;
  }>;
  exameFisicoResumo?: string | null;
  exames: LaudoExamInsight[];
  clinicalReasoning: ClinicalReasoningSummary;
  referenciasClinicas?: LaudoReferenceSuggestionResponse;
};

type LaudoSuggestionAiResponse = Record<string, unknown>;

@Injectable()
export class LaudoAiSuggestionService {
  private readonly logger = new Logger(LaudoAiSuggestionService.name);
  private readonly laudoPromptVersion = 'laudo-suggestion-v2026-06-07';
  private readonly referencesPromptVersion = 'laudo-references-v2026-06-07';
  private readonly examPromptVersion = 'exam-interpretation-v2026-06-07';
  private readonly clinicalReferenceDomains = [
    'pubmed.ncbi.nlm.nih.gov',
    'pmc.ncbi.nlm.nih.gov',
    'ncbi.nlm.nih.gov',
    'cochrane.org',
    'cochranelibrary.com',
    'jospt.org',
    'orthopt.org',
    'bjsm.bmj.com',
    'bmj.com',
    'apta.org',
    'aaos.org',
    'nice.org.uk',
    'iasp-pain.org',
    'who.int',
  ];

  constructor(private readonly openAiService: OpenAiService) {}

  async buildExamInsights(
    exames: PacienteExame[],
  ): Promise<LaudoExamInsight[]> {
    const recent = exames.slice(0, 3);
    const result: LaudoExamInsight[] = [];

    for (const exame of recent) {
      const base = {
        nomeOriginal: exame.nomeOriginal,
        tipoExame: exame.tipoExame ?? '',
        dataExame: exame.dataExame ?? null,
        mimeType: exame.mimeType,
        observacao: exame.observacao ?? '',
        uploadedAt: exame.createdAt,
      };

      if (!this.isAiReadableExamMime(exame.mimeType)) {
        result.push(base);
        continue;
      }

      try {
        const fileBuffer = await readExameFile(exame.caminhoArquivo);
        const aiInterpretacao = await this.interpretExamWithAI({
          nomeOriginal: exame.nomeOriginal,
          mimeType: exame.mimeType,
          observacao: exame.observacao ?? '',
          fileBuffer,
        });
        result.push({
          ...base,
          ...(aiInterpretacao ? { aiInterpretacao } : {}),
        });
      } catch (error) {
        logOperationalEvent(
          this.logger,
          'exam.ai_interpretation.failed',
          {
            mimeType: exame.mimeType,
            promptVersion: this.examPromptVersion,
            reason: error instanceof Error ? error.message : 'UNKNOWN',
          },
          { severity: 'warning' },
        );
        result.push(base);
      }
    }

    return result;
  }

  async generateSuggestion(
    input: GenerateLaudoSuggestionInput,
  ): Promise<Partial<CreateLaudoDto>> {
    const startedAt = Date.now();
    if (!this.openAiService.isConfigured()) {
      logOperationalEvent(this.logger, 'laudo.ai_suggestion.fallback', {
        reason: 'OPENAI_NOT_CONFIGURED',
        promptVersion: this.laudoPromptVersion,
        inputSummary: this.summarizeSuggestionInput(input),
      });
      return {};
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-5-mini',
    );
    const systemPrompt =
      'Voce e um assistente clinico para fisioterapeutas. Gere um rascunho tecnico, objetivo, prudente e rastreavel. Nao invente dados ausentes. Todo plano deve estar ancorado em achados, limitacoes, metas e lacunas clinicas do caso.';
    const userPrompt = `
Retorne SOMENTE JSON valido com as chaves:
motivoAvaliacao (string),
historicoClinico (string),
achadosClinicos (string),
diagnosticoFuncional (string),
objetivosCurtoPrazo (string),
objetivosMedioPrazo (string),
frequenciaSemanal (number 1-7),
duracaoSemanas (number 1-52),
conclusao (string),
condutas (string),
planoTratamentoIA (string com plano por fases/semanas),
criteriosAlta (string),
evidenciasUsadas (array de strings),
lacunasClinicas (array de strings),
referenciasUsadas (array de ids escolhidos SOMENTE da lista referenciasClinicas).

Regras clinicas:
- Use como fonte primaria o exame fisico estruturado (quando disponivel) e correlacione com anamnese/evolucao.
- Quando o exame fisico trouxer avaliacao postural, plano frontal, plano sagital ou Teste de Adams, esses achados devem influenciar achadosClinicos, diagnosticoFuncional, condutas, planoTratamentoIA e criteriosAlta/reavaliacao.
- No Teste de Adams, use resultado, regiao, intensidade e ATR/escoliometro quando presentes. Se houver assimetria, intensidade moderada/importante ou ATR >= 5 graus, inclua monitoramento objetivo, prudencia na progressao e necessidade de correlacao/reavaliacao clinica; nao trate como achado neutro.
- Para plano frontal/sagital, conecte desvios, assimetrias ou alteracoes posturais a controle motor, mobilidade, forca, estrategia de carga e criterio de reavaliacao. Se estiver "Nao avaliado", declare lacuna em vez de criar conduta baseada nele.
- Trate areasAfetadas como eixo central do raciocinio: para cada area selecionada, considere regiao, lado, vista e observacao clinica escrita.
- Use intensidadeDor como a unica escala numerica de dor do paciente; nao infira intensidade por area/regiao.
- As observacoes escritas em cada area selecionada tem prioridade alta: use-as para orientar diagnostico funcional, hipoteses, condutas e criterios de progressao.
- Quando houver multiplas areas selecionadas, diferencie area principal e areas associadas; nao compacte tudo em uma queixa generica.
- Se uma area foi selecionada sem observacao clinica, use apenas regiao/lado/vista e declare lacuna em vez de inventar achados.
- Use explicitamente os campos da anamnese: inicioProblema, mecanismoLesao, fatorAlivio, fatoresPiora, lesoesPrevias e usoMedicamentos.
- Use tambem dorRepouso, dorNoturna, irradiacao, tipoDor, limitacoesFuncionais, atividadesQuePioram, metaPrincipalPaciente e fatores biopsicossociais quando estiverem presentes.
- Use pontosAnamnesePreenchidos como checklist dos dados que realmente existem; cada ponto preenchido deve influenciar ao menos diagnostico, conduta, plano, criterio de progressao ou lacuna.
- Se algum desses campos estiver vazio, declare a lacuna clinica em vez de supor informacao.
- Considere os exames anexados (tipoExame, observacao, dataExame, mimeType e aiInterpretacao quando houver) para orientar diagnostico funcional, condutas e plano.
- Nao invente achados de imagem nao descritos no contexto.
- Se houver informacao insuficiente dos exames, explicite a limitacao e mantenha conduta prudente.
- Em caso de conflito entre exames e achados clinicos, priorize seguranca e recomende correlacao clinica/reavaliacao.
- Em condutas e planoTratamentoIA, descreva progressao por fases (ex.: controle de dor -> ganho funcional -> retorno progressivo) e inclua criterio objetivo de progressao.
- Em condutas, para cada intervencao proposta, descreva em texto curto a evidencia clinica correspondente (achado, teste positivo/negativo relevante, deficit funcional ou fator de risco).
- Em condutas e recomendacoes, inclua "educacao em dor" com objetivo clinico, relacao com achados do caso, orientacao de autocuidado e criterio de progressao; nao use como termo isolado.
- Em planoTratamentoIA, estruture por fases com: objetivo da fase, condutas, criterio de progressao e evidencia que sustenta a fase.
- Em planoTratamentoIA, quando houver achado postural/Adams, inclua uma linha de reavaliacao objetiva dizendo o que sera monitorado e qual achado precisa estabilizar/melhorar antes de aumentar carga, complexidade ou retorno funcional.
- Em planoTratamentoIA, cite como cada area selecionada sera monitorada ou reavaliada quando houver mais de uma regiao marcada.
- Evite termos vagos; relacione cada bloco a achados (dor, funcao, testes positivos/deficits funcionais).
- Em diagnosticoFuncional, identifique (quando possivel) origem provavel da dor, estrutura envolvida, tipo de lesao (mecanica/inflamatoria/neural) e fator biomecanico associado.
- Se houver red flag, nao proponha progressao terapeutica como prioridade; destaque encaminhamento/reavaliacao e seguranca.
- Use referenciasClinicas apenas como suporte bibliografico. Nao invente artigos, livros, autores, URLs ou recomendacoes fora da lista.
- Quando o caso envolver uma regiao especifica, priorize as referencias do perfil correspondente (ex.: OMBRO para dor no ombro/manguito/escapula).
- Exames medicos anexados sao fonte complementar. Nunca trate leitura de exame por IA como diagnostico final sem correlacao com avaliacao fisica, anamnese e validacao do profissional.
- A resposta e uma sugestao tecnica para revisao profissional; nao escreva como decisao automatica ou diagnostico definitivo.

Regras de especificidade obrigatorias:
- Use ancorasEspecificidade como contrato de escrita. Cada campo textual deve citar achados concretos do caso, nao frases genericas.
- diagnosticoFuncional deve conter: area/lado/vista quando houver, intensidadeDor/irritabilidade, observacao escrita da area, comportamento da dor, limitacao funcional e achado de exame fisico quando disponivel.
- objetivosCurtoPrazo e objetivosMedioPrazo devem ser mensuraveis e vinculados a area/funcao/meta do paciente; evite "melhorar funcao" sem dizer qual funcao.
- condutas deve usar formato por item: "Conduta: ... | Evidencia do caso: ... | Criterio de progressao: ...".
- planoTratamentoIA deve ser dividido em fases e, em cada fase, citar objetivo, condutas, regiao/area monitorada, criterio de progressao e evidencia do caso.
- criteriosAlta deve ser objetivo e verificavel: dor esperada, funcao-alvo, tolerancia a carga/movimento e independencia no plano domiciliar, todos adaptados ao caso.
- Nao use condutas soltas como "alongamento", "fortalecimento", "terapia manual", "cinesioterapia", "analgesia" ou "educacao em dor" sem especificar regiao, objetivo clinico, motivo e progressao.
- Se faltar dado para ser especifico, declare a lacuna clinica explicitamente e diga qual avaliacao precisa ser feita.
- motivoAvaliacao deve explicar por que o laudo esta sendo emitido, usando queixa, finalidade, encaminhamento ou contexto clinico quando existirem.
- historicoClinico deve resumir inicio, tempo de evolucao, fatores de melhora/piora, tratamentos, exames e impacto na rotina, sem inventar dados ausentes.
- achadosClinicos deve registrar o que foi observado na avaliacao clinica e exame fisico; se houver lacunas, indique que precisam ser avaliadas.
- conclusao deve fechar tecnicamente o laudo, descrevendo condicao funcional/clinica observada e impacto no paciente, sem substituir decisao profissional.

Regras para PDF e entendimento do paciente:
- Escreva como um documento que o paciente conseguira entender, mantendo precisao clinica.
- Explique termos tecnicos brevemente entre parenteses quando forem importantes.
- Evite jargoes isolados; troque "cinesioterapia" por "exercicios terapeuticos para..." e indique o objetivo.
- Organize textos longos com frases curtas, quebras de linha e marcadores quando fizer sentido.
- Em objetivos, deixe claro o que o paciente deve perceber no dia a dia.
- Em planoTratamentoIA, use fases nomeadas e legiveis: "Fase 1 - Controle de sintomas", "Fase 2 - Recuperacao de movimento/forca", "Fase 3 - Retorno a funcao".
- Em criteriosAlta, escreva criterios que o paciente possa reconhecer e o profissional possa medir.

Exemplo de nivel de especificidade esperado:
"Para ombro direito anterior com dor geral 6/10 e observacao de dor ao elevar o braco, iniciar exercicios ativos-assistidos em amplitude toleravel; evidencia do caso: area ombro direito + intensidadeDor 6/10 + piora em elevacao; progressao: elevar amplitude sem piora sustentada por 24h."

Resumo clinico priorizado para raciocinio:
${JSON.stringify(input.clinicalReasoning, null, 2)}

Areas selecionadas detalhadas:
${JSON.stringify(input.clinicalReasoning.areasSelecionadasDetalhadas, null, 2)}

Ancoras obrigatorias de especificidade:
${JSON.stringify(input.clinicalReasoning.ancorasEspecificidade, null, 2)}

Referencias clinicas permitidas:
${JSON.stringify(input.referenciasClinicas || null, null, 2)}

Resumo do exame fisico estruturado:
${input.exameFisicoResumo || 'Nao informado'}

Contexto do paciente:
${JSON.stringify(input, null, 2)}
`;

    try {
      const timeoutMs = this.openAiService.getPositiveIntegerEnv(
        'OPENAI_LAUDO_TIMEOUT_MS',
        15000,
        120000,
      );
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt,
        userContent: userPrompt,
        temperature: 0.1,
        timeoutMs,
        operation: 'laudo suggestion',
      });

      if (!response) {
        logOperationalEvent(
          this.logger,
          'laudo.ai_suggestion.fallback',
          {
            reason: 'AI_EMPTY_RESPONSE',
            model,
            promptVersion: this.laudoPromptVersion,
            durationMs: Date.now() - startedAt,
            inputSummary: this.summarizeSuggestionInput(input),
          },
          { severity: 'warning' },
        );
        return {};
      }
      const normalized = this.normalizeLaudoSuggestionResponse(response.parsed);
      logOperationalEvent(this.logger, 'laudo.ai_suggestion.succeeded', {
        model: response.model,
        promptVersion: this.laudoPromptVersion,
        durationMs: Date.now() - startedAt,
        inputSummary: this.summarizeSuggestionInput(input),
        outputSummary: this.summarizeSuggestionOutput(normalized),
      });
      return normalized;
    } catch (error) {
      logOperationalEvent(
        this.logger,
        'laudo.ai_suggestion.fallback',
        {
          reason: error instanceof Error ? error.message : 'UNKNOWN',
          model,
          promptVersion: this.laudoPromptVersion,
          durationMs: Date.now() - startedAt,
          inputSummary: this.summarizeSuggestionInput(input),
        },
        { severity: 'warning', captureToSentry: true },
      );
      return {};
    }
  }

  private normalizeLaudoSuggestionResponse(
    parsed: LaudoSuggestionAiResponse,
  ): Partial<CreateLaudoDto> {
    return {
      motivoAvaliacao: this.normalizeSuggestionText(
        parsed.motivoAvaliacao,
        2500,
      ),
      historicoClinico: this.normalizeSuggestionText(
        parsed.historicoClinico,
        3500,
      ),
      achadosClinicos: this.normalizeSuggestionText(
        parsed.achadosClinicos,
        4500,
      ),
      diagnosticoFuncional: this.normalizeSuggestionText(
        parsed.diagnosticoFuncional,
        2500,
      ),
      objetivosCurtoPrazo: this.normalizeSuggestionText(
        parsed.objetivosCurtoPrazo,
        2000,
      ),
      objetivosMedioPrazo: this.normalizeSuggestionText(
        parsed.objetivosMedioPrazo,
        2000,
      ),
      frequenciaSemanal: this.normalizeSuggestionInteger(
        parsed.frequenciaSemanal,
        1,
        7,
      ),
      duracaoSemanas: this.normalizeSuggestionInteger(
        parsed.duracaoSemanas,
        1,
        52,
      ),
      conclusao: this.normalizeSuggestionText(parsed.conclusao, 2500),
      condutas: this.normalizeSuggestionText(parsed.condutas, 5000),
      planoTratamentoIA: this.normalizeSuggestionText(
        parsed.planoTratamentoIA,
        5000,
      ),
      criteriosAlta: this.normalizeSuggestionText(parsed.criteriosAlta, 2500),
    };
  }

  async findUpdatedClinicalReferences(
    input: GenerateLaudoSuggestionInput,
  ): Promise<LaudoReferenceUpdate | null> {
    const startedAt = Date.now();
    if (!this.openAiService.isConfigured()) {
      return null;
    }
    if (
      !this.openAiService.isEnabled('OPENAI_LAUDO_WEB_REFERENCES_ENABLED', true)
    ) {
      return null;
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_LAUDO_REFERENCE_MODEL', 'OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-5-mini',
    );
    const currentYear = new Date().getFullYear();
    const systemPrompt =
      'Voce e um assistente de revisao bibliografica clinica para fisioterapeutas. Busque fontes confiaveis e atuais. Nao invente estudos, autores, anos, periodicos ou URLs.';
    const userPrompt = `
Use busca web para encontrar estudos, revisoes sistematicas, diretrizes ou consensos clinicos atualizados e relevantes para o caso.

Retorne SOMENTE JSON valido com as chaves:
laudoReferences (array),
planoReferences (array).

Formato de cada item:
id (string curta unica),
title (string),
category ("ARTIGO" ou "GUIDELINE"),
source (periodico, entidade ou base),
year (number quando disponivel),
authors (string opcional),
url (URL direta da fonte consultada),
rationale (por que essa referencia ajuda neste caso).

Regras:
- Priorize fontes dos ultimos 5 anos (${currentYear - 5}-${currentYear}) quando existirem.
- Aceite fontes de ate 10 anos apenas se forem diretrizes, revisoes sistematicas ou referencias ainda centrais para o tema.
- Priorize PubMed/PMC, Cochrane, JOSPT/APTA, BJSM/BMJ, NICE, AAOS, WHO e IASP.
- Selecione no maximo 3 referencias para diagnostico/raciocinio em laudoReferences e no maximo 4 para plano/reabilitacao em planoReferences.
- Use areasSelecionadasDetalhadas e observacoesAreas como principais termos de busca.
- Se houver varias areas, busque referencias para a area principal e para regioes associadas clinicamente relevantes.
- Nao use blogs, conteudo comercial, fontes sem URL verificavel ou material sem relacao direta com o caso.
- Se nao encontrar fonte confiavel, retorne arrays vazios.

Resumo clinico:
${JSON.stringify(input.clinicalReasoning, null, 2)}

Anamnese preenchida:
${JSON.stringify(input.anamnese, null, 2)}

Referencias curadas ja disponiveis, para evitar duplicidade:
${JSON.stringify(input.referenciasClinicas || null, null, 2)}
`;

    try {
      const timeoutMs = this.openAiService.getPositiveIntegerEnv(
        'OPENAI_LAUDO_REFERENCES_TIMEOUT_MS',
        20000,
        90000,
      );
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt,
        userContent: userPrompt,
        tools: [
          {
            type: 'web_search',
            filters: {
              allowed_domains: this.clinicalReferenceDomains,
            },
            search_context_size: 'medium',
            external_web_access: true,
          },
        ],
        toolChoice: 'auto',
        temperature: 0.1,
        timeoutMs,
        operation: 'laudo clinical reference web search',
      });

      if (!response) return null;
      const normalized = this.normalizeReferenceUpdate(response.parsed);
      logOperationalEvent(this.logger, 'laudo.references_ai.succeeded', {
        model: response.model,
        promptVersion: this.referencesPromptVersion,
        durationMs: Date.now() - startedAt,
        inputSummary: this.summarizeSuggestionInput(input),
        laudoReferences: normalized?.laudoReferences?.length ?? 0,
        planoReferences: normalized?.planoReferences?.length ?? 0,
      });
      return normalized;
    } catch (error) {
      logOperationalEvent(
        this.logger,
        'laudo.references_ai.failed',
        {
          reason: error instanceof Error ? error.message : 'UNKNOWN',
          model,
          promptVersion: this.referencesPromptVersion,
          durationMs: Date.now() - startedAt,
        },
        { severity: 'warning', captureToSentry: true },
      );
      return null;
    }
  }

  private normalizeSuggestionText(
    value: unknown,
    maxLen: number,
  ): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!normalized) return undefined;
    return normalized.slice(0, maxLen);
  }

  private normalizeSuggestionInteger(
    value: unknown,
    min: number,
    max: number,
  ): number | undefined {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (!Number.isFinite(parsed)) return undefined;
    return Math.min(max, Math.max(min, Math.round(parsed)));
  }

  private normalizeReferenceUpdate(
    parsed: Record<string, unknown>,
  ): LaudoReferenceUpdate | null {
    const laudoReferences = this.normalizeReferenceItems(
      parsed.laudoReferences,
      3,
    );
    const planoReferences = this.normalizeReferenceItems(
      parsed.planoReferences,
      4,
    );
    if (!laudoReferences.length && !planoReferences.length) return null;
    return { laudoReferences, planoReferences };
  }

  private normalizeReferenceItems(
    value: unknown,
    maxItems: number,
  ): LaudoReferenceItem[] {
    if (!Array.isArray(value)) return [];
    const currentYear = new Date().getFullYear();
    const seen = new Set<string>();
    const result: LaudoReferenceItem[] = [];

    for (const item of value) {
      if (!this.isRecord(item)) continue;
      const title = this.safeShortText(item.title, 220);
      const source = this.safeShortText(item.source, 160);
      const url = this.safeShortText(item.url, 500);
      const rationale = this.safeShortText(item.rationale, 360);
      if (!title || !source || !url || !rationale) continue;
      if (!this.isAllowedClinicalReferenceUrl(url)) continue;

      const category = this.normalizeReferenceCategory(item.category);
      const year = this.normalizeReferenceYear(item.year, currentYear);
      const id =
        this.safeShortText(item.id, 90) ||
        `updated-${this.slugifyReferenceId(title)}`;
      const key = `${title.toLowerCase()}|${url.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        id,
        title,
        category,
        source,
        ...(year ? { year } : {}),
        ...(this.safeShortText(item.authors, 220)
          ? { authors: this.safeShortText(item.authors, 220) }
          : {}),
        url,
        rationale,
      });
      if (result.length >= maxItems) break;
    }

    return result;
  }

  private normalizeReferenceCategory(value: unknown): LaudoReferenceCategory {
    return value === 'GUIDELINE' ? 'GUIDELINE' : 'ARTIGO';
  }

  private normalizeReferenceYear(
    value: unknown,
    currentYear: number,
  ): number | undefined {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (!Number.isFinite(parsed)) return undefined;
    if (parsed < 1900 || parsed > currentYear + 1) return undefined;
    return parsed;
  }

  private isAllowedClinicalReferenceUrl(rawUrl: string): boolean {
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase();
      return this.clinicalReferenceDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
    } catch {
      return false;
    }
  }

  private safeShortText(value: unknown, maxLen: number): string {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const normalized = String(value).trim().replace(/\s+/g, ' ');
    return normalized.slice(0, maxLen);
  }

  private slugifyReferenceId(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isAiReadableExamMime(mimeType: string): boolean {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  private async interpretExamWithAI(input: {
    nomeOriginal: string;
    mimeType: string;
    observacao: string;
    fileBuffer: Buffer;
  }): Promise<string | null> {
    const startedAt = Date.now();
    if (!this.openAiService.isConfigured()) return null;
    if (!this.openAiService.isEnabled('OPENAI_EXAM_AI_ENABLED', true)) {
      return null;
    }
    if (!this.isAiReadableExamMime(input.mimeType)) return null;

    const model = this.openAiService.resolveModel(
      ['OPENAI_EXAM_MODEL', 'OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-4.1-mini',
    );

    const systemPrompt =
      'Voce e um assistente clinico para fisioterapia. Leia exames de imagem com prudencia. Nao invente achados.';

    const userPrompt = `Analise este exame (imagem ou PDF) e retorne SOMENTE JSON com:
achadosPrincipais (array de strings),
impressaoClinica (string curta),
sinaisAlarme (array de strings),
observacoesLimitacao (string curta).

Contexto adicional informado pelo profissional:
${input.observacao || 'Sem observacao adicional.'}
`;

    try {
      const base64 = input.fileBuffer.toString('base64');
      const dataUrl = `data:${input.mimeType};base64,${base64}`;
      const content: Array<Record<string, unknown>> = [
        { type: 'input_text', text: userPrompt },
      ];

      if (input.mimeType.startsWith('image/')) {
        content.push({ type: 'input_image', image_url: dataUrl });
      } else if (input.mimeType === 'application/pdf') {
        content.push({
          type: 'input_file',
          filename: input.nomeOriginal || 'exame.pdf',
          file_data: dataUrl,
        });
      } else {
        return null;
      }

      const timeoutMs = this.openAiService.getPositiveIntegerEnv(
        'OPENAI_EXAM_TIMEOUT_MS',
        30000,
        120000,
      );
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt,
        userContent: content,
        temperature: 0.1,
        timeoutMs,
        operation: 'exam interpretation',
      });
      if (!response) return null;
      const parsed = response.parsed;

      const achados = Array.isArray(parsed.achadosPrincipais)
        ? parsed.achadosPrincipais
            .filter((v) => typeof v === 'string')
            .slice(0, 5)
            .map((v) => `- ${v}`)
            .join('\n')
        : '';
      const impressao =
        typeof parsed.impressaoClinica === 'string'
          ? parsed.impressaoClinica
          : '';
      const sinaisAlarme = Array.isArray(parsed.sinaisAlarme)
        ? parsed.sinaisAlarme
            .filter((v) => typeof v === 'string')
            .slice(0, 4)
            .map((v) => `- ${v}`)
            .join('\n')
        : '';
      const limitacao =
        typeof parsed.observacoesLimitacao === 'string'
          ? parsed.observacoesLimitacao
          : '';

      const output = [
        `Exame: ${input.nomeOriginal}`,
        achados ? `Achados principais:\n${achados}` : '',
        impressao ? `Impressao clinica: ${impressao}` : '',
        sinaisAlarme ? `Sinais de alerta:\n${sinaisAlarme}` : '',
        limitacao ? `Limitacoes: ${limitacao}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      logOperationalEvent(this.logger, 'exam.ai_interpretation.succeeded', {
        model: response.model,
        promptVersion: this.examPromptVersion,
        mimeType: input.mimeType,
        durationMs: Date.now() - startedAt,
        outputSummary: {
          achadosCount: achados ? achados.split('\n').length : 0,
          hasImpressao: !!impressao,
          sinaisAlarmeCount: sinaisAlarme ? sinaisAlarme.split('\n').length : 0,
          hasLimitacao: !!limitacao,
        },
      });

      return output;
    } catch (error) {
      logOperationalEvent(
        this.logger,
        'exam.ai_interpretation.failed',
        {
          promptVersion: this.examPromptVersion,
          mimeType: input.mimeType,
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error ? error.message : 'UNKNOWN',
        },
        { severity: 'warning', captureToSentry: true },
      );
      return null;
    }
  }

  private summarizeSuggestionInput(input: GenerateLaudoSuggestionInput) {
    return {
      hasAnamnese: !!input.anamnese,
      evolucoesCount: input.evolucoes.length,
      examesCount: input.exames.length,
      examesComLeituraIa: input.exames.filter((item) => !!item.aiInterpretacao)
        .length,
      hasExameFisico: !!input.exameFisicoResumo?.trim(),
      areasSelecionadas:
        input.clinicalReasoning.areasSelecionadasDetalhadas.length,
      redFlagsCount: input.anamnese?.redFlags?.length ?? 0,
      yellowFlagsCount: input.anamnese?.yellowFlags?.length ?? 0,
      confidenceBase: input.clinicalReasoning.confidenceBase,
      referencesCount:
        (input.referenciasClinicas?.laudoReferences.length ?? 0) +
        (input.referenciasClinicas?.planoReferences.length ?? 0),
    };
  }

  private summarizeSuggestionOutput(output: Partial<CreateLaudoDto>) {
    const filledFields = Object.entries(output)
      .filter(([, value]) =>
        typeof value === 'string'
          ? value.trim().length > 0
          : typeof value === 'number',
      )
      .map(([key]) => key);

    return {
      filledFields,
      filledFieldsCount: filledFields.length,
      hasPlanoTratamento: !!output.planoTratamentoIA?.trim(),
      hasCriteriosAlta: !!output.criteriosAlta?.trim(),
    };
  }
}
