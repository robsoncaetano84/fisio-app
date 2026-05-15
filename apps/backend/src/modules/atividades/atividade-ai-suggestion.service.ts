import { Injectable } from '@nestjs/common';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { OpenAiService } from '../ai/openai.service';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';

type AtividadeAiSuggestion = {
  titulo: string;
  descricao: string;
  referencias?: string[];
  source: 'ai' | 'rules';
  model?: string;
};

type OpenAiActivityResponse = {
  titulo?: string;
  descricao?: string;
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
  ): Promise<AtividadeAiSuggestion> {
    const fallback = this.buildRuleSuggestion(dto, anamnese);
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

  private buildRuleSuggestion(
    dto: GenerateAtividadeAiDto,
    anamnese: Anamnese | null,
  ): AtividadeAiSuggestion & { source: 'rules'; referencias: string[] } {
    const objetivo = anamnese?.metaPrincipalPaciente?.trim();
    const limitacoes = anamnese?.limitacoesFuncionais?.trim();
    const piora = anamnese?.atividadesQuePioram?.trim();
    const alivio = anamnese?.fatorAlivio?.trim();

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
    const descricao = this.appendReferencesToDescricao(
      descricaoBase,
      referencias,
    );

    return {
      titulo: titulo.slice(0, 140),
      descricao,
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
    const userPrompt = `
Retorne SOMENTE JSON válido com as chaves:
titulo (string até 140 chars),
descricao (string até 1000 chars),
referencias (array de 2 a 4 strings, escolhidas SOMENTE da lista de referências abaixo, sem inventar novas).

Lista de referências permitidas:
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
