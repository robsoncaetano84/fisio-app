import { Injectable } from '@nestjs/common';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { OpenAiService } from '../ai/openai.service';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';

type AtividadeAiSuggestion = {
  titulo: string;
  descricao: string;
  instrucoesExecucao?: string;
  imagemUrl?: string;
  imagemTipo?: string;
  referencias?: string[];
  source: 'ai' | 'rules';
  model?: string;
};

type OpenAiActivityResponse = {
  titulo?: string;
  descricao?: string;
  instrucoesExecucao?: string;
  imagemTipo?: string;
  referencias?: string[];
  model?: string;
};

@Injectable()
export class AtividadeAiSuggestionService {
  constructor(private readonly openAiService?: OpenAiService) {}

  async generate(
    dto: GenerateAtividadeAiDto,
    paciente: Paciente,
    anamnese: Anamnese | null,
    laudo: Laudo | null = null,
  ): Promise<AtividadeAiSuggestion> {
    const fallback = this.buildRuleSuggestion(dto, anamnese, laudo);
    const ai = await this.generateWithOpenAI({
      paciente: {
        nomeCompleto: paciente.nomeCompleto,
        idade: this.getAgeInYears(paciente.dataNascimento),
        sexo: paciente.sexo,
        profissao: paciente.profissao || '',
      },
      anamnese: anamnese
        ? {
            motivoBusca: anamnese.motivoBusca,
            intensidadeDor: anamnese.intensidadeDor,
            descricaoSintomas: anamnese.descricaoSintomas,
            tempoProblema: anamnese.tempoProblema,
            fatorAlivio: anamnese.fatorAlivio,
            limitacoesFuncionais: anamnese.limitacoesFuncionais,
            atividadesQuePioram: anamnese.atividadesQuePioram,
            metaPrincipalPaciente: anamnese.metaPrincipalPaciente,
            qualidadeSono: anamnese.qualidadeSono,
            nivelEstresse: anamnese.nivelEstresse,
            observacoesEstiloVida: anamnese.observacoesEstiloVida,
          }
        : null,
      laudo: this.buildLaudoContext(laudo),
      rascunhoAtual: {
        titulo: dto.titulo || '',
        descricao: dto.descricao || '',
      },
    });

    if (!ai) return fallback;

    const referencias = this.normalizeReferences(ai.referencias);
    const descricaoComReferencias = this.appendReferencesToDescricao(
      ai.descricao || fallback.descricao,
      referencias,
    );

    return {
      titulo: ai.titulo || fallback.titulo,
      descricao: descricaoComReferencias,
      instrucoesExecucao: ai.instrucoesExecucao || fallback.instrucoesExecucao,
      imagemTipo:
        this.normalizeExerciseImageType(ai.imagemTipo) || fallback.imagemTipo,
      referencias,
      source: 'ai',
      model: ai.model,
    };
  }

  private getAgeInYears(dataNascimento?: Date | null): number | null {
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

  private sanitizeText(value: unknown, maxLen: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, maxLen);
  }

  private buildLaudoContext(
    laudo: Laudo | null,
  ): Record<string, unknown> | null {
    if (!laudo) return null;
    return {
      diagnosticoFuncional: this.sanitizeText(laudo.diagnosticoFuncional, 900),
      achadosClinicos: this.sanitizeText(laudo.achadosClinicos, 900),
      exameFisico: this.sanitizeText(laudo.exameFisico, 1200),
      condutas: this.sanitizeText(laudo.condutas, 900),
      planoTratamentoIA: this.sanitizeText(laudo.planoTratamentoIA, 900),
      criteriosAlta: this.sanitizeText(laudo.criteriosAlta, 700),
    };
  }

  private normalizeForMatch(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private buildTherapeuticExerciseFocus(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
  ): string {
    const context = this.normalizeForMatch(
      [
        anamnese?.descricaoSintomas,
        anamnese?.limitacoesFuncionais,
        anamnese?.atividadesQuePioram,
        anamnese?.metaPrincipalPaciente,
        laudo?.diagnosticoFuncional,
        laudo?.achadosClinicos,
        laudo?.exameFisico,
        laudo?.condutas,
        laudo?.planoTratamentoIA,
      ].join(' '),
    );

    const hasAny = (terms: string[]) =>
      terms.some((term) => context.includes(term));
    if (hasAny(['ombro', 'manguito', 'escapul'])) {
      return 'Exercicios terapeuticos: mobilidade ativa-assistida de ombro em amplitude toleravel, controle escapular e fortalecimento inicial de manguito sem reproduzir dor sustentada.';
    }
    if (hasAny(['cervical', 'pescoco', 'cefaleia'])) {
      return 'Exercicios terapeuticos: controle cervical profundo, mobilidade cervical/toracica leve e estabilizacao escapular com pausas para higiene postural.';
    }
    if (hasAny(['lombar', 'lombo', 'ciatic', 'lombalgia'])) {
      return 'Exercicios terapeuticos: mobilidade lombo-pelvica, ativacao de controle motor do tronco e ponte curta, com exposicao gradual a flexao/carga conforme tolerancia.';
    }
    if (hasAny(['joelho', 'patelar', 'quadriceps', 'agachamento'])) {
      return 'Exercicios terapeuticos: ativacao de quadriceps e gluteos, controle de valgo dinamico e agachamento parcial assistido dentro de faixa sem piora sustentada.';
    }
    if (hasAny(['quadril', 'coxofemoral', 'gluteo'])) {
      return 'Exercicios terapeuticos: mobilidade de quadril, fortalecimento de gluteos e treino de controle pelvico em apoio, progredindo para tarefas funcionais.';
    }
    if (hasAny(['tornozelo', 'pe ', 'retrope', 'apoio'])) {
      return 'Exercicios terapeuticos: mobilidade de tornozelo/pe, controle de apoio, propriocepcao bipodal e progressao para apoio unipodal conforme estabilidade.';
    }
    if (hasAny(['cotovelo', 'epicondil', 'antebraco'])) {
      return 'Exercicios terapeuticos: carga isometrica toleravel de flexores/extensores do antebraco, mobilidade de cotovelo/punho e progressao para resistencia leve.';
    }
    if (hasAny(['punho', 'mao', 'carpal', 'preensao'])) {
      return 'Exercicios terapeuticos: mobilidade de punho/mao, controle motor fino e fortalecimento gradual de preensao sem aumento persistente dos sintomas.';
    }
    return 'Exercicios terapeuticos: mobilidade ativa da regiao sintomatica, controle motor de baixa carga e progressao funcional guiada por dor, qualidade de movimento e tolerancia em 24h.';
  }

  private getExerciseImageTypes(): string[] {
    return [
      'MOBILIDADE_GERAL',
      'MOBILIDADE_LOMBAR',
      'CONTROLE_CERVICAL',
      'OMBRO_MANGUITO',
      'JOELHO_AGACHAMENTO',
      'QUADRIL_GLUTEOS',
      'TORNOZELO_EQUILIBRIO',
      'PUNHO_PREENSAO',
    ];
  }

  private normalizeExerciseImageType(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toUpperCase();
    return this.getExerciseImageTypes().includes(normalized)
      ? normalized
      : undefined;
  }

  private inferExerciseImageType(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
  ): string {
    const context = this.normalizeForMatch(
      [
        anamnese?.descricaoSintomas,
        anamnese?.limitacoesFuncionais,
        anamnese?.atividadesQuePioram,
        anamnese?.metaPrincipalPaciente,
        laudo?.diagnosticoFuncional,
        laudo?.achadosClinicos,
        laudo?.exameFisico,
        laudo?.condutas,
        laudo?.planoTratamentoIA,
      ].join(' '),
    );

    const hasAny = (terms: string[]) =>
      terms.some((term) => context.includes(term));
    if (hasAny(['ombro', 'manguito', 'escapul'])) return 'OMBRO_MANGUITO';
    if (hasAny(['cervical', 'pescoco', 'cefaleia'])) return 'CONTROLE_CERVICAL';
    if (hasAny(['lombar', 'lombo', 'ciatic', 'lombalgia']))
      return 'MOBILIDADE_LOMBAR';
    if (hasAny(['joelho', 'patelar', 'quadriceps', 'agachamento']))
      return 'JOELHO_AGACHAMENTO';
    if (hasAny(['quadril', 'coxofemoral', 'gluteo'])) return 'QUADRIL_GLUTEOS';
    if (hasAny(['tornozelo', 'pe ', 'retrope', 'apoio']))
      return 'TORNOZELO_EQUILIBRIO';
    if (hasAny(['punho', 'mao', 'carpal', 'preensao', 'cotovelo']))
      return 'PUNHO_PREENSAO';
    return 'MOBILIDADE_GERAL';
  }

  private buildExecutionInstructions(exerciseFocus: string): string {
    const cleanFocus = exerciseFocus
      .replace(/^Exercicios terapeuticos:\s*/i, '')
      .replace(/\.$/, '');
    return [
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.',
      `2. Execute ${cleanFocus}, sempre em amplitude confortavel e sem compensacoes bruscas.`,
      '3. Mantenha respiracao calma, velocidade controlada e pausas curtas entre as series.',
      '4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento novo, perda de forca ou piora de dor que persista por 24h.',
    ].join('\n');
  }

  private buildRuleSuggestion(
    dto: GenerateAtividadeAiDto,
    anamnese: Anamnese | null,
    laudo: Laudo | null,
  ): AtividadeAiSuggestion & { source: 'rules'; referencias: string[] } {
    const objetivo = anamnese?.metaPrincipalPaciente?.trim();
    const limitacoes = anamnese?.limitacoesFuncionais?.trim();
    const piora = anamnese?.atividadesQuePioram?.trim();
    const alivio = anamnese?.fatorAlivio?.trim();
    const diagnostico = this.sanitizeText(laudo?.diagnosticoFuncional, 260);
    const exameFisico = this.sanitizeText(laudo?.exameFisico, 280);
    const condutas = this.sanitizeText(
      laudo?.condutas || laudo?.planoTratamentoIA,
      280,
    );
    const exerciseFocus = this.buildTherapeuticExerciseFocus(anamnese, laudo);
    const imagemTipo = this.inferExerciseImageType(anamnese, laudo);

    const titulo =
      dto.titulo?.trim() ||
      (objetivo ? `Plano inicial: ${objetivo}` : 'Plano terapêutico funcional');

    const referencias = this.getDefaultBibliographicReferences().slice(0, 3);
    const descricaoBase =
      dto.descricao?.trim() ||
      [
        'Prescrição sugerida com base na anamnese mais recente.',
        objetivo ? `Meta principal: ${objetivo}.` : undefined,
        limitacoes ? `Limitações funcionais: ${limitacoes}.` : undefined,
        piora ? `Atenção para piora com: ${piora}.` : undefined,
        alivio ? `Estratégias que aliviam: ${alivio}.` : undefined,
        'Executar com progressão gradual e monitorar resposta clínica.',
      ]
        .filter(Boolean)
        .join(' ')
        .slice(0, 1000);
    const descricaoBaseContextual = dto.descricao?.trim()
      ? descricaoBase
      : [
          descricaoBase,
          diagnostico ? `Diagnostico funcional: ${diagnostico}.` : undefined,
          exameFisico ? `Exame fisico relevante: ${exameFisico}.` : undefined,
          condutas ? `Condutas/plano registrados: ${condutas}.` : undefined,
          exerciseFocus,
          'Dose inicial: 1 a 2 series, 6 a 10 repeticoes ou 30 a 45 segundos, em intensidade toleravel. Progredir quando nao houver piora sustentada por 24h.',
        ]
          .filter(Boolean)
          .join(' ')
          .slice(0, 760);
    const descricao = this.appendReferencesToDescricao(
      descricaoBaseContextual,
      referencias,
    );

    return {
      titulo: titulo.slice(0, 140),
      descricao,
      instrucoesExecucao: this.buildExecutionInstructions(exerciseFocus),
      imagemTipo,
      referencias,
      source: 'rules',
    };
  }

  private async generateWithOpenAI(input: {
    paciente: {
      nomeCompleto: string;
      idade: number | null;
      sexo: string;
      profissao: string;
    };
    anamnese: Record<string, unknown> | null;
    laudo: Record<string, unknown> | null;
    rascunhoAtual: {
      titulo: string;
      descricao: string;
    };
  }): Promise<OpenAiActivityResponse | null> {
    if (!this.openAiService?.isConfigured()) return null;

    const model = this.openAiService.resolveModel(
      ['OPENAI_ATIVIDADE_MODEL'],
      'gpt-5-mini',
    );
    const referenciasCanonicas = this.getDefaultBibliographicReferences();
    const systemPrompt =
      'Você é um assistente clínico de fisioterapia tradicional. Gere prescrição de atividade segura, objetiva e executável. Baseie-se em literatura técnica e não invente dados ausentes.';
    const activityRulesPrompt = `
Regras:
- Use anamnese e laudo/exameFisico quando existirem; nao gere prescricao generica se houver diagnostico funcional, condutas ou plano registrado.
- A descricao deve trazer exercicios terapeuticos com regiao-alvo, objetivo clinico, dose inicial, criterio de progressao e alerta de piora sustentada por 24h.
- Se houver red flag, dor progressiva sem explicacao ou piora neurologica, priorize orientacao de seguranca e reavaliacao antes de exercicios de carga.
- Mantenha linguagem executavel para o paciente e revisavel pelo fisioterapeuta.
`;
    const userPrompt = `
${activityRulesPrompt}
Retorne SOMENTE JSON válido com as chaves:
titulo (string até 140 chars),
descricao (string até 1000 chars),
referencias (array de 2 a 4 strings, escolhidas SOMENTE da lista de referências abaixo, sem inventar novas).

Lista de referências permitidas:
Inclua tambem no JSON:
instrucoesExecucao (string com 3 a 5 passos claros para o paciente executar em casa, ate 1500 chars),
imagemTipo (uma das opcoes permitidas: ${this.getExerciseImageTypes().join(', ')}),
nao retorne URL de imagem; use somente imagemTipo para selecionar ilustracao propria do catalogo Synap.

${referenciasCanonicas.map((r, index) => `${index + 1}. ${r}`).join('\n')}

Contexto clínico:
${JSON.stringify(input, null, 2)}
`;

    try {
      const timeoutMs = this.openAiService.getPositiveIntegerEnv(
        'OPENAI_ATIVIDADE_TIMEOUT_MS',
        8000,
        120000,
      );
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt,
        userContent: userPrompt,
        temperature: 0.2,
        timeoutMs,
        operation: 'activity suggestion',
      });
      if (!response) return null;
      const parsed = response.parsed;

      return {
        titulo: this.sanitizeText(parsed.titulo, 140),
        descricao: this.sanitizeText(parsed.descricao, 1000),
        instrucoesExecucao: this.sanitizeText(parsed.instrucoesExecucao, 1500),
        imagemTipo: this.normalizeExerciseImageType(parsed.imagemTipo),
        referencias: Array.isArray(parsed.referencias)
          ? parsed.referencias
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        model,
      };
    } catch {
      return null;
    }
  }

  private getDefaultBibliographicReferences(): string[] {
    return [
      'Kisner C, Colby LA, Borstad J. Exercicios terapeuticos: fundamentos e tecnicas.',
      'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
      'Magee DJ. Avaliacao musculoesqueletica.',
      'APTA/JOSPT. Clinical Practice Guidelines for Physical Therapy (musculoskeletal conditions).',
      'World Physiotherapy. Standards and policy statements for physiotherapy practice.',
    ];
  }

  private normalizeReferences(referencias?: string[]): string[] {
    const allowed = new Set(this.getDefaultBibliographicReferences());
    if (!referencias?.length)
      return this.getDefaultBibliographicReferences().slice(0, 2);

    const unique = Array.from(
      new Set(
        referencias
          .map((item) => item.trim())
          .filter((item) => allowed.has(item)),
      ),
    );

    if (!unique.length)
      return this.getDefaultBibliographicReferences().slice(0, 2);
    return unique.slice(0, 4);
  }

  private appendReferencesToDescricao(
    descricao: string,
    referencias: string[],
  ): string {
    const base = (descricao || '').trim();
    if (!referencias.length) return base.slice(0, 1000);
    const blocoReferencias = ` Referencias: ${referencias.join(' | ')}`;
    return `${base}${blocoReferencias}`.slice(0, 1000);
  }
}
