// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PLANO-TERAPEUTICO-AI.SERVICE
// Motor de recomendacao de exercicios a partir da anamnese + exame fisico.
// Nucleo deterministico (regras, custo zero, sem dado saindo do servidor).
// Camada de IA generativa e OPCIONAL: so e usada quando OPENAI_PLANO_TERAPEUTICO
// estiver habilitada; caso contrario o resultado vem 100% das regras locais.
// ==========================================
import { Injectable } from '@nestjs/common';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Exercicio } from './entities/exercicio.entity';
import { ExercicioMidia } from './entities/exercicio-midia.entity';
import { OpenAiService } from '../ai/openai.service';

export type PlanoTerapeuticoItem = {
  exercicioId: string;
  exercicioNome: string;
  regiaoCorporal: string;
  categoria: string;
  nivel: string;
  ordem: number;
  series: number;
  repeticoes: number | null;
  tempoSegundos: number | null;
  frequenciaSemanal: number;
  justificativa: string;
  progressao: string;
  imagemUrl: string | null;
  imagemTipo: string | null;
  score: number;
};

export type PlanoTerapeuticoResult = {
  itens: PlanoTerapeuticoItem[];
  regioesAlvo: string[];
  observacaoClinica: string;
  redFlags: string[];
  bloqueadoPorRedFlag: boolean;
  source: 'rules' | 'ai';
  model?: string;
  referencias: string[];
};

export type RecomendarPlanoOptions = {
  maxExercicios?: number;
  regioesFoco?: string[];
};

type DoseRegra = {
  series: number;
  repeticoes: number | null;
  tempoSegundos: number | null;
  frequenciaSemanal: number;
  evitarComDorAlta?: boolean;
};

const MAX_EXERCICIOS_PADRAO = 6;
const MAX_EXERCICIOS_TETO = 10;
const MAX_POR_CATEGORIA = 3;
const DOR_ALTA = 7;

@Injectable()
export class PlanoTerapeuticoAiService {
  constructor(private readonly openAiService?: OpenAiService) {}

  // Mapa palavra-chave clinica -> token de regiao usado no catalogo.
  // O token e casado por substring contra exercicio.regiaoCorporal, entao
  // 'LOMBAR' cobre 'LOMBAR', 'LOMBAR_QUADRIL' e 'TORACICA_LOMBAR_CORE'.
  private readonly regiaoKeywordMap: Array<{
    token: string;
    termos: string[];
  }> = [
    { token: 'OMBRO', termos: ['ombro', 'manguito', 'escapul', 'deltoide'] },
    {
      token: 'CERVICAL',
      termos: ['cervical', 'pescoco', 'cefaleia', 'nuca', 'atm', 'mandibul'],
    },
    {
      token: 'LOMBAR',
      termos: ['lombar', 'lombo', 'ciatic', 'lombalgia', 'core'],
    },
    {
      token: 'JOELHO',
      termos: ['joelho', 'patelar', 'quadriceps', 'menisco'],
    },
    {
      token: 'QUADRIL',
      termos: ['quadril', 'coxofemoral', 'gluteo', 'pelve', 'pelvico'],
    },
    {
      token: 'TORNOZELO',
      termos: [
        'tornozelo',
        'retrope',
        'calcanhar',
        'panturrilha',
        'fascite',
        'pe ',
      ],
    },
    {
      token: 'PUNHO',
      termos: ['punho', 'carpal', 'preensao', 'dedo', 'mao '],
    },
    {
      token: 'COTOVELO',
      termos: ['cotovelo', 'epicondil', 'antebraco'],
    },
    { token: 'TORACICA', termos: ['toracica', 'dorsal', 'postura'] },
    {
      token: 'EQUILIBRIO',
      termos: ['equilibrio', 'marcha', 'queda', 'propriocep'],
    },
  ];

  private readonly doseRegras: Record<string, DoseRegra> = {
    MOBILIDADE: {
      series: 2,
      repeticoes: 10,
      tempoSegundos: null,
      frequenciaSemanal: 6,
    },
    MOBILIDADE_NEURAL: {
      series: 1,
      repeticoes: 8,
      tempoSegundos: null,
      frequenciaSemanal: 5,
    },
    CONTROLE_MOTOR: {
      series: 2,
      repeticoes: 10,
      tempoSegundos: null,
      frequenciaSemanal: 5,
    },
    PROPRIOCEPCAO: {
      series: 2,
      repeticoes: null,
      tempoSegundos: 30,
      frequenciaSemanal: 4,
    },
    FUNCIONAL: {
      series: 2,
      repeticoes: 10,
      tempoSegundos: null,
      frequenciaSemanal: 4,
    },
    FORTALECIMENTO: {
      series: 3,
      repeticoes: 12,
      tempoSegundos: null,
      frequenciaSemanal: 3,
    },
    PLIOMETRIA: {
      series: 3,
      repeticoes: 8,
      tempoSegundos: null,
      frequenciaSemanal: 2,
      evitarComDorAlta: true,
    },
  };

  private readonly doseFallback: DoseRegra = {
    series: 2,
    repeticoes: 10,
    tempoSegundos: null,
    frequenciaSemanal: 4,
  };

  /**
   * Infere regioes-alvo a partir da anamnese + laudo. Retorna lista vazia
   * quando nada e identificado (o orquestrador usa o catalogo inteiro).
   */
  inferirRegioes(anamnese: Anamnese | null, laudo: Laudo | null): string[] {
    const contexto = this.contextoClinico(anamnese, laudo);
    const regioes = this.regiaoKeywordMap
      .filter(({ termos }) => termos.some((termo) => contexto.includes(termo)))
      .map(({ token }) => token);
    return Array.from(new Set(regioes));
  }

  /**
   * Detecta sinais de alerta que contraindicam prescricao de exercicio antes
   * de reavaliacao. Conservador por design (seguranca > sensibilidade).
   */
  detectarRedFlags(anamnese: Anamnese | null, laudo: Laudo | null): string[] {
    const contexto = this.contextoClinico(anamnese, laudo);
    const flags: string[] = [];
    const add = (termos: string[], descricao: string) => {
      if (termos.some((termo) => contexto.includes(termo)))
        flags.push(descricao);
    };

    add(
      ['perda de forca', 'fraqueza progressiva', 'paresia', 'plegia'],
      'Perda de forca / deficit motor progressivo',
    );
    add(
      [
        'formigamento progressivo',
        'parestesia progressiva',
        'dormencia que piora',
      ],
      'Alteracao neurologica progressiva',
    );
    add(
      [
        'incontinencia',
        'retencao urinaria',
        'anestesia em sela',
        'cauda equina',
      ],
      'Sinais de sindrome da cauda equina',
    );
    add(
      [
        'perda de peso',
        'emagrecimento',
        'febre',
        'sudorese noturna',
        'cancer',
        'tumor',
      ],
      'Sinais sistemicos (red flag oncologica/infecciosa)',
    );
    add(
      ['dor toracica', 'falta de ar', 'dispneia', 'palpitacao'],
      'Sintomas cardiorrespiratorios',
    );
    add(
      ['trauma recente', 'fratura', 'queda de altura'],
      'Trauma recente / suspeita de fratura',
    );

    if (anamnese?.dorNoturna && (anamnese?.intensidadeDor ?? 0) >= 8) {
      flags.push('Dor noturna intensa e incapacitante');
    }

    return Array.from(new Set(flags));
  }

  /**
   * Gera o plano terapeutico recomendado. NAO persiste nada: a saida e uma
   * sugestao para revisao do fisioterapeuta.
   */
  async recomendar(
    paciente: Paciente,
    anamnese: Anamnese | null,
    laudo: Laudo | null,
    candidatos: Exercicio[],
    options: RecomendarPlanoOptions = {},
  ): Promise<PlanoTerapeuticoResult> {
    const regioesAlvo = (
      options.regioesFoco?.length
        ? options.regioesFoco.map((r) => r.trim().toUpperCase()).filter(Boolean)
        : this.inferirRegioes(anamnese, laudo)
    ).slice(0, 6);

    const redFlags = this.detectarRedFlags(anamnese, laudo);
    if (redFlags.length) {
      return {
        itens: [],
        regioesAlvo,
        observacaoClinica:
          'Sinais de alerta identificados na anamnese/exame fisico. Prescricao de exercicios suspensa ate reavaliacao clinica presencial.',
        redFlags,
        bloqueadoPorRedFlag: true,
        source: 'rules',
        referencias: this.referencias(),
      };
    }

    const max = this.clampMax(options.maxExercicios);
    const itens = this.selecionarPorRegras(anamnese, laudo, candidatos, max);
    const observacaoClinica = this.montarObservacao(
      anamnese,
      regioesAlvo,
      itens,
    );

    // Camada de IA OPCIONAL: so refina ordem/justificativa quando explicitamente
    // habilitada (custo). Desligada => resultado 100% deterministico e gratuito.
    const refino = await this.refinarComIa(anamnese, laudo, itens);
    if (refino) {
      return {
        itens: refino.itens,
        regioesAlvo,
        observacaoClinica: refino.observacaoClinica || observacaoClinica,
        redFlags: [],
        bloqueadoPorRedFlag: false,
        source: 'ai',
        model: refino.model,
        referencias: this.referencias(),
      };
    }

    return {
      itens,
      regioesAlvo,
      observacaoClinica,
      redFlags: [],
      bloqueadoPorRedFlag: false,
      source: 'rules',
      referencias: this.referencias(),
    };
  }

  /**
   * Refinamento opcional por IA generativa. Reordena os exercicios ja
   * selecionados pelas regras e reescreve a justificativa clinica — SEM nunca
   * introduzir exercicio fora da lista deterministica (anti-alucinacao).
   * Retorna null (e o plano fica 100% por regras) quando:
   *  - OPENAI_API_KEY nao configurada; ou
   *  - a flag OPENAI_PLANO_TERAPEUTICO nao esta habilitada; ou
   *  - a IA falha/retorna algo invalido.
   */
  private async refinarComIa(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
    itens: PlanoTerapeuticoItem[],
  ): Promise<{
    itens: PlanoTerapeuticoItem[];
    observacaoClinica?: string;
    model: string;
  } | null> {
    if (!itens.length) return null;
    if (this.openAiService?.isConfigured() !== true) return null;
    if (!this.openAiService.isEnabled('OPENAI_PLANO_TERAPEUTICO', false)) {
      return null;
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_PLANO_TERAPEUTICO_MODEL'],
      'gpt-5-mini',
    );
    const idsPermitidos = new Set(itens.map((item) => item.exercicioId));
    const systemPrompt =
      'Voce e um assistente clinico de fisioterapia. Ordene e justifique exercicios JA selecionados. Nunca invente exercicios nem use ids fora da lista.';
    const userContent = `
Contexto clinico:
${JSON.stringify(this.contextoParaIa(anamnese, laudo), null, 2)}

Exercicios selecionados (use SOMENTE estes ids):
${JSON.stringify(
  itens.map((item) => ({
    id: item.exercicioId,
    nome: item.exercicioNome,
    regiao: item.regiaoCorporal,
    categoria: item.categoria,
  })),
  null,
  2,
)}

Retorne SOMENTE JSON valido:
{
  "ordem": [ids na melhor sequencia terapeutica],
  "justificativas": { "<id>": "justificativa clinica curta ate 400 chars" },
  "observacaoClinica": "sintese ate 600 chars"
}`;

    try {
      const timeoutMs = this.openAiService.getPositiveIntegerEnv(
        'OPENAI_PLANO_TERAPEUTICO_TIMEOUT_MS',
        8000,
        120000,
      );
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt,
        userContent,
        temperature: 0.2,
        timeoutMs,
        operation: 'plano terapeutico',
      });
      if (!response) return null;

      const parsed = response.parsed as {
        ordem?: unknown;
        justificativas?: Record<string, unknown>;
        observacaoClinica?: unknown;
      };

      const ordem = Array.isArray(parsed.ordem)
        ? parsed.ordem.filter(
            (id): id is string =>
              typeof id === 'string' && idsPermitidos.has(id),
          )
        : [];
      if (!ordem.length) return null;

      const porId = new Map(itens.map((item) => [item.exercicioId, item]));
      const reordenados: PlanoTerapeuticoItem[] = [];
      const usados = new Set<string>();
      for (const id of ordem) {
        const item = porId.get(id);
        if (!item || usados.has(id)) continue;
        usados.add(id);
        const justificativa = parsed.justificativas?.[id];
        reordenados.push({
          ...item,
          ordem: reordenados.length + 1,
          justificativa:
            typeof justificativa === 'string' && justificativa.trim()
              ? justificativa.trim().slice(0, 600)
              : item.justificativa,
        });
      }
      // Mantem eventuais itens que a IA nao citou, preservando a selecao segura.
      for (const item of itens) {
        if (usados.has(item.exercicioId)) continue;
        reordenados.push({ ...item, ordem: reordenados.length + 1 });
      }

      return {
        itens: reordenados,
        observacaoClinica:
          typeof parsed.observacaoClinica === 'string'
            ? parsed.observacaoClinica.trim().slice(0, 1000)
            : undefined,
        model,
      };
    } catch {
      return null;
    }
  }

  private contextoParaIa(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
  ): Record<string, unknown> {
    return {
      intensidadeDor: anamnese?.intensidadeDor ?? null,
      descricaoSintomas: anamnese?.descricaoSintomas ?? null,
      limitacoesFuncionais: anamnese?.limitacoesFuncionais ?? null,
      metaPrincipalPaciente: anamnese?.metaPrincipalPaciente ?? null,
      diagnosticoFuncional: laudo?.diagnosticoFuncional ?? null,
      exameFisico: laudo?.exameFisico ?? null,
    };
  }

  // ----------------------------------------------------------------------
  // Nucleo deterministico
  // ----------------------------------------------------------------------

  private selecionarPorRegras(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
    candidatos: Exercicio[],
    max: number,
  ): PlanoTerapeuticoItem[] {
    const contexto = this.contextoClinico(anamnese, laudo);
    const dorAlta = (anamnese?.intensidadeDor ?? 0) >= DOR_ALTA;

    const pontuados = candidatos
      .map((exercicio) => ({
        exercicio,
        score: this.pontuar(exercicio, contexto, dorAlta),
      }))
      .filter(
        (c) => c.score > 0 && !this.temContraindicacao(c.exercicio, contexto),
      )
      .sort((a, b) => b.score - a.score);

    const selecionados: Array<{ exercicio: Exercicio; score: number }> = [];
    const contadorCategoria = new Map<string, number>();
    for (const candidato of pontuados) {
      if (selecionados.length >= max) break;
      const categoria = candidato.exercicio.categoria;
      const usados = contadorCategoria.get(categoria) ?? 0;
      if (usados >= MAX_POR_CATEGORIA) continue;
      contadorCategoria.set(categoria, usados + 1);
      selecionados.push(candidato);
    }

    return selecionados.map((candidato, index) =>
      this.montarItem(candidato.exercicio, candidato.score, index + 1, dorAlta),
    );
  }

  private pontuar(
    exercicio: Exercicio,
    contexto: string,
    dorAlta: boolean,
  ): number {
    let score = 1; // candidato ja passou pelo filtro de regiao no catalogo

    for (const token of this.tokens(exercicio)) {
      if (contexto.includes(token)) score += token.length >= 8 ? 5 : 3;
    }

    // Preferencia clinica por fase: dor alta favorece descarga/controle;
    // dor baixa libera fortalecimento e tarefas de maior demanda.
    const categoria = exercicio.categoria;
    if (dorAlta) {
      if (
        ['MOBILIDADE', 'CONTROLE_MOTOR', 'MOBILIDADE_NEURAL'].includes(
          categoria,
        )
      )
        score += 6;
      if (['FORTALECIMENTO', 'PLIOMETRIA', 'FUNCIONAL'].includes(categoria))
        score -= 4;
    } else {
      if (['FORTALECIMENTO', 'FUNCIONAL', 'PROPRIOCEPCAO'].includes(categoria))
        score += 4;
    }

    if (exercicio.nivel?.toUpperCase() === 'INICIANTE') score += 1;

    return score;
  }

  private temContraindicacao(exercicio: Exercicio, contexto: string): boolean {
    const contra = this.normalizar(exercicio.contraindicacoes);
    if (!contra) return false;
    // Se o quadro do paciente reproduz um termo significativo listado como
    // contraindicacao do exercicio, descarta por seguranca.
    const termos = this.extrairTermos(contra).filter((t) => t.length >= 6);
    return termos.some((termo) => contexto.includes(termo));
  }

  private montarItem(
    exercicio: Exercicio,
    score: number,
    ordem: number,
    dorAlta: boolean,
  ): PlanoTerapeuticoItem {
    const dose = this.resolverDose(exercicio.categoria, dorAlta);
    return {
      exercicioId: exercicio.id,
      exercicioNome: exercicio.nome,
      regiaoCorporal: exercicio.regiaoCorporal,
      categoria: exercicio.categoria,
      nivel: exercicio.nivel,
      ordem,
      series: dose.series,
      repeticoes: dose.repeticoes,
      tempoSegundos: dose.tempoSegundos,
      frequenciaSemanal: dose.frequenciaSemanal,
      justificativa: this.montarJustificativa(exercicio, dorAlta),
      progressao:
        'Progredir volume/carga quando nao houver piora dos sintomas sustentada por 24h.',
      imagemUrl: this.getImageUrl(exercicio),
      imagemTipo: exercicio.imagemKey ?? null,
      score,
    };
  }

  private resolverDose(categoria: string, dorAlta: boolean): DoseRegra {
    const base = this.doseRegras[categoria?.toUpperCase()] ?? this.doseFallback;
    if (!dorAlta) return base;
    // Dor alta: reduz volume e nunca prescreve categoria de alta demanda.
    return {
      series: Math.max(1, base.series - 1),
      repeticoes:
        base.repeticoes != null ? Math.max(6, base.repeticoes - 2) : null,
      tempoSegundos:
        base.tempoSegundos != null
          ? Math.max(20, base.tempoSegundos - 10)
          : null,
      frequenciaSemanal: base.frequenciaSemanal,
    };
  }

  private montarJustificativa(exercicio: Exercicio, dorAlta: boolean): string {
    const objetivo = (exercicio.objetivo || '').trim().replace(/\.$/, '');
    const fase = dorAlta
      ? 'fase de dor elevada, priorizando descarga e controle do movimento'
      : 'progressao de carga conforme tolerancia';
    return `${objetivo}. Indicado para a regiao ${exercicio.regiaoCorporal.toLowerCase()} em ${fase}.`.slice(
      0,
      600,
    );
  }

  private montarObservacao(
    anamnese: Anamnese | null,
    regioesAlvo: string[],
    itens: PlanoTerapeuticoItem[],
  ): string {
    if (!itens.length) {
      return 'Nenhum exercicio do catalogo correspondeu ao quadro informado. Revise a anamnese/exame fisico ou amplie o catalogo de exercicios aprovados.';
    }
    const regioes = regioesAlvo.length
      ? regioesAlvo.join(', ').toLowerCase()
      : 'condicionamento geral';
    const meta = anamnese?.metaPrincipalPaciente?.trim();
    const partes = [
      `Plano com ${itens.length} exercicio(s) focado em ${regioes}.`,
      meta ? `Alinhado a meta do paciente: ${meta}.` : undefined,
      'Sugestao gerada por recomendacao algoritmica e sujeita a validacao do fisioterapeuta.',
    ];
    return partes.filter(Boolean).join(' ').slice(0, 1000);
  }

  // ----------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------

  private contextoClinico(
    anamnese: Anamnese | null,
    laudo: Laudo | null,
  ): string {
    return this.normalizar(
      [
        anamnese?.descricaoSintomas,
        anamnese?.limitacoesFuncionais,
        anamnese?.atividadesQuePioram,
        anamnese?.fatoresPiora,
        anamnese?.metaPrincipalPaciente,
        laudo?.diagnosticoFuncional,
        laudo?.achadosClinicos,
        laudo?.exameFisico,
        laudo?.condutas,
        laudo?.planoTratamentoIA,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  private tokens(exercicio: Exercicio): string[] {
    return this.extrairTermos(
      this.normalizar(
        [
          exercicio.nome,
          exercicio.regiaoCorporal,
          exercicio.categoria,
          exercicio.objetivo,
          ...(exercicio.tags || []),
        ].join(' '),
      ),
    );
  }

  private extrairTermos(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(/[^a-z0-9]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 4),
      ),
    );
  }

  private normalizar(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private getImageUrl(exercicio: Exercicio): string | null {
    if (!exercicio.imagemKey) return null;
    const primaria: ExercicioMidia | undefined = exercicio.midias?.find(
      (midia) => midia.ativo && midia.assetKey === exercicio.imagemKey,
    );
    return (
      primaria?.thumbnailUrl ||
      primaria?.imageUrl ||
      primaria?.sourceUrl ||
      null
    );
  }

  private clampMax(value?: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return MAX_EXERCICIOS_PADRAO;
    }
    return Math.min(MAX_EXERCICIOS_TETO, Math.max(1, Math.floor(value)));
  }

  private referencias(): string[] {
    return [
      'Kisner C, Colby LA, Borstad J. Exercicios terapeuticos: fundamentos e tecnicas.',
      'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
      'APTA/JOSPT. Clinical Practice Guidelines for Physical Therapy (musculoskeletal conditions).',
    ];
  }
}
