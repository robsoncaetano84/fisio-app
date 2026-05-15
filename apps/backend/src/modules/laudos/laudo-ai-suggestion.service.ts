import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../ai/openai.service';
import { PacienteExame } from '../pacientes/entities/paciente-exame.entity';
import { readExameFile } from '../pacientes/exame-storage';
import { CreateLaudoDto } from './dto/create-laudo.dto';

export type LaudoExamInsight = {
  nomeOriginal: string;
  tipoExame: string;
  dataExame: Date | null;
  mimeType: string;
  observacao: string;
  uploadedAt: Date;
  aiInterpretacao?: string;
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
    inicioProblema: string;
    fatorAlivio: string;
    fatoresPiora: string;
    mecanismoLesao: string;
    lesoesPrevias: string;
    usoMedicamentos: string;
  } | null;
  evolucoes: Array<{
    data: Date;
    avaliacaoClinica: string;
    planoSessao: string;
    observacoes: string;
  }>;
  exameFisicoResumo?: string | null;
  exames: LaudoExamInsight[];
};

@Injectable()
export class LaudoAiSuggestionService {
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
      } catch {
        result.push(base);
      }
    }

    return result;
  }

  async generateSuggestion(
    input: GenerateLaudoSuggestionInput,
  ): Promise<Partial<CreateLaudoDto>> {
    if (!this.openAiService.isConfigured()) {
      return {};
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-5-mini',
    );
    const systemPrompt =
      'Voce e um assistente clinico para fisioterapeutas. Gere um rascunho tecnico, objetivo e prudente. Nao invente dados ausentes. Priorize seguranca clinica e rastreabilidade da decisao.';
    const userPrompt = `
Retorne SOMENTE JSON valido com as chaves:
diagnosticoFuncional (string),
objetivosCurtoPrazo (string),
objetivosMedioPrazo (string),
frequenciaSemanal (number 1-7),
duracaoSemanas (number 1-52),
condutas (string),
planoTratamentoIA (string com plano por fases/semanas),
criteriosAlta (string).

Regras clinicas:
- Use como fonte primaria o exame fisico estruturado (quando disponivel) e correlacione com anamnese/evolucao.
- Use explicitamente os campos da anamnese: inicioProblema, mecanismoLesao, fatorAlivio, fatoresPiora, lesoesPrevias e usoMedicamentos.
- Se algum desses campos estiver vazio, declare a lacuna clinica em vez de supor informacao.
- Considere os exames anexados (tipoExame, observacao, dataExame, mimeType e aiInterpretacao quando houver) para orientar diagnostico funcional, condutas e plano.
- Nao invente achados de imagem nao descritos no contexto.
- Se houver informacao insuficiente dos exames, explicite a limitacao e mantenha conduta prudente.
- Em caso de conflito entre exames e achados clinicos, priorize seguranca e recomende correlacao clinica/reavaliacao.
- Em condutas e planoTratamentoIA, descreva progressao por fases (ex.: controle de dor -> ganho funcional -> retorno progressivo) e inclua criterio objetivo de progressao.
- Em condutas, para cada intervencao proposta, descreva em texto curto a evidencia clinica correspondente (achado, teste positivo/negativo relevante, deficit funcional ou fator de risco).
- Em planoTratamentoIA, estruture por fases com: objetivo da fase, condutas, criterio de progressao e evidencia que sustenta a fase.
- Evite termos vagos; relacione cada bloco a achados (dor, funcao, testes positivos/deficits funcionais).
- Em diagnosticoFuncional, identifique (quando possivel) origem provavel da dor, estrutura envolvida, tipo de lesao (mecanica/inflamatoria/neural) e fator biomecanico associado.

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
        temperature: 0.2,
        timeoutMs,
        operation: 'laudo suggestion',
      });

      if (!response) {
        return {};
      }
      const parsed = response.parsed;

      const freq =
        typeof parsed.frequenciaSemanal === 'number'
          ? Math.min(7, Math.max(1, Math.round(parsed.frequenciaSemanal)))
          : undefined;
      const dur =
        typeof parsed.duracaoSemanas === 'number'
          ? Math.min(52, Math.max(1, Math.round(parsed.duracaoSemanas)))
          : undefined;

      return {
        diagnosticoFuncional:
          typeof parsed.diagnosticoFuncional === 'string'
            ? parsed.diagnosticoFuncional
            : undefined,
        objetivosCurtoPrazo:
          typeof parsed.objetivosCurtoPrazo === 'string'
            ? parsed.objetivosCurtoPrazo
            : undefined,
        objetivosMedioPrazo:
          typeof parsed.objetivosMedioPrazo === 'string'
            ? parsed.objetivosMedioPrazo
            : undefined,
        frequenciaSemanal: freq,
        duracaoSemanas: dur,
        condutas:
          typeof parsed.condutas === 'string' ? parsed.condutas : undefined,
        planoTratamentoIA:
          typeof parsed.planoTratamentoIA === 'string'
            ? parsed.planoTratamentoIA
            : undefined,
        criteriosAlta:
          typeof parsed.criteriosAlta === 'string'
            ? parsed.criteriosAlta
            : undefined,
      };
    } catch {
      return {};
    }
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

      return [
        `Exame: ${input.nomeOriginal}`,
        achados ? `Achados principais:\n${achados}` : '',
        impressao ? `Impressao clinica: ${impressao}` : '',
        sinaisAlarme ? `Sinais de alerta:\n${sinaisAlarme}` : '',
        limitacao ? `Limitacoes: ${limitacao}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    } catch {
      return null;
    }
  }
}
