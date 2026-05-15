import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../ai/openai.service';
import { ClinicalPhoto } from './entities/clinical-photo.entity';

type ClinicalPhotoAnalysis = {
  qualityScore: number | null;
  summary: string;
  limitations: string;
  raw: Record<string, unknown>;
};

type ClinicalPhotoComparisonAnalysis = {
  summary: string;
  comparison: string;
  limitations: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class ClinicalPhotoAiService {
  constructor(private readonly openAiService: OpenAiService) {}

  async analyzePhoto(input: {
    photo: ClinicalPhoto;
    fileBuffer: Buffer;
  }): Promise<ClinicalPhotoAnalysis | null> {
    const prompt = `Analise a foto clinica de fisioterapia e retorne SOMENTE JSON com:
qualidadeImagemScore (numero de 0 a 100),
qualidadeImagem (string curta),
observacoesVisuais (array de strings),
assimetriasProvaveis (array de strings),
sugestoesExameFisico (array de strings),
redFlagsVisuais (array de strings),
limitacoes (string curta).

Contexto:
tipo=${input.photo.tipo}
vista=${input.photo.vista || 'nao informada'}
regiao=${input.photo.regiao || 'nao informada'}
lado=${input.photo.lado || 'nao informado'}
intensidadeDor=${input.photo.intensidadeDor ?? 'nao informada'}
observacao=${input.photo.observacao || 'sem observacao'}
`;

    const parsed = await this.callClinicalVisionAi({
      prompt,
      images: [{ mimeType: input.photo.mimeType, buffer: input.fileBuffer }],
    });
    if (!parsed) return null;

    const summaryParts = [
      this.asString(parsed.qualidadeImagem)
        ? `Qualidade: ${this.asString(parsed.qualidadeImagem)}`
        : '',
      ...this.asStringArray(parsed.observacoesVisuais).map(
        (item) => `Observacao: ${item}`,
      ),
      ...this.asStringArray(parsed.assimetriasProvaveis).map(
        (item) => `Assimetria provavel: ${item}`,
      ),
      ...this.asStringArray(parsed.sugestoesExameFisico).map(
        (item) => `Validar no exame fisico: ${item}`,
      ),
      ...this.asStringArray(parsed.redFlagsVisuais).map(
        (item) => `Alerta visual: ${item}`,
      ),
    ].filter(Boolean);

    return {
      qualityScore: this.asQualityScore(parsed.qualidadeImagemScore),
      summary:
        summaryParts.join('\n') ||
        'Analise visual concluida sem achados estruturados relevantes.',
      limitations:
        this.asString(parsed.limitacoes) ||
        'Foto clinica nao substitui exame fisico, medida objetiva ou julgamento profissional.',
      raw: parsed,
    };
  }

  async comparePhotos(input: {
    baseline: ClinicalPhoto;
    followup: ClinicalPhoto;
    baselineBuffer: Buffer;
    followupBuffer: Buffer;
    observacao: string;
  }): Promise<ClinicalPhotoComparisonAnalysis | null> {
    const prompt = `Compare duas fotos clinicas de fisioterapia: a primeira e ANTES/baseline, a segunda e DEPOIS/follow-up.
Retorne SOMENTE JSON com:
comparabilidade (string curta),
mudancasVisuais (array de strings),
melhoraPioraSemMudanca (string curta),
sugestaoSoapObjetivo (string curta),
recomendacaoRepetirFoto (string curta),
limitacoes (string curta).

Contexto:
baseline_tipo=${input.baseline.tipo}
followup_tipo=${input.followup.tipo}
baseline_vista=${input.baseline.vista || 'nao informada'}
followup_vista=${input.followup.vista || 'nao informada'}
regiao=${input.followup.regiao || input.baseline.regiao || 'nao informada'}
observacao=${input.observacao || 'sem observacao'}
`;

    const parsed = await this.callClinicalVisionAi({
      prompt,
      images: [
        { mimeType: input.baseline.mimeType, buffer: input.baselineBuffer },
        { mimeType: input.followup.mimeType, buffer: input.followupBuffer },
      ],
    });
    if (!parsed) return null;

    const changes = this.asStringArray(parsed.mudancasVisuais);
    const summary = [
      this.asString(parsed.comparabilidade)
        ? `Comparabilidade: ${this.asString(parsed.comparabilidade)}`
        : '',
      this.asString(parsed.melhoraPioraSemMudanca)
        ? `Evolucao visual: ${this.asString(parsed.melhoraPioraSemMudanca)}`
        : '',
      ...changes.map((item) => `Mudanca: ${item}`),
      this.asString(parsed.sugestaoSoapObjetivo)
        ? `SOAP objetivo: ${this.asString(parsed.sugestaoSoapObjetivo)}`
        : '',
    ].filter(Boolean);

    return {
      summary: summary.join('\n') || 'Comparacao visual concluida.',
      comparison:
        changes.join('\n') || this.asString(parsed.melhoraPioraSemMudanca),
      limitations:
        this.asString(parsed.limitacoes) ||
        this.asString(parsed.recomendacaoRepetirFoto) ||
        'Comparacao visual depende de mesma vista, distancia, iluminacao e postura inicial.',
      raw: parsed,
    };
  }

  private shouldUseExamAi(): boolean {
    return (process.env.OPENAI_EXAM_AI_ENABLED || 'true') !== 'false';
  }

  private buildOpenAiClinicalVisionRequest(input: {
    prompt: string;
    images: Array<{ mimeType: string; buffer: Buffer }>;
  }) {
    const content: Array<Record<string, unknown>> = [
      { type: 'input_text', text: input.prompt },
    ];
    for (const image of input.images) {
      content.push({
        type: 'input_image',
        image_url: `data:${image.mimeType};base64,${image.buffer.toString('base64')}`,
      });
    }
    return content;
  }

  private async callClinicalVisionAi(input: {
    prompt: string;
    images: Array<{ mimeType: string; buffer: Buffer }>;
  }): Promise<Record<string, unknown> | null> {
    if (!this.openAiService.isConfigured() || !this.shouldUseExamAi()) {
      return null;
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_EXAM_MODEL', 'OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-4.1-mini',
    );

    const timeoutMs = this.openAiService.getPositiveIntegerEnv(
      'OPENAI_EXAM_TIMEOUT_MS',
      30000,
      120000,
    );

    try {
      const response = await this.openAiService.createJsonResponse({
        model,
        systemPrompt:
          'Voce e um assistente clinico de fisioterapia. Analise fotos clinicas com prudencia, sem diagnosticar por imagem e sempre destacando limitacoes.',
        userContent: this.buildOpenAiClinicalVisionRequest(input),
        temperature: 0.1,
        timeoutMs,
        operation: 'clinical photo analysis',
      });
      return response?.parsed ?? null;
    } catch {
      return null;
    }
  }

  private asStringArray(value: unknown, maxItems = 6): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asQualityScore(value: unknown): number | null {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Math.max(0, Math.min(100, Math.round(numberValue)));
  }
}
