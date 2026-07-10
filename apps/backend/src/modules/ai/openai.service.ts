import { Injectable, Logger } from '@nestjs/common';

type OpenAiUserContent = string | Array<Record<string, unknown>>;

type OpenAiJsonResponseInput = {
  model: string;
  systemPrompt: string;
  userContent: OpenAiUserContent;
  tools?: Array<Record<string, unknown>>;
  toolChoice?: string | Record<string, unknown>;
  temperature?: number;
  timeoutMs: number;
  operation: string;
};

type OpenAiJsonResponse = {
  parsed: Record<string, unknown>;
  outputText: string;
  model: string;
};

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  isConfigured(): boolean {
    return this.getApiKey().length > 0;
  }

  // web_search e uma tool nativa da OpenAI; provedores compativeis (Groq etc.)
  // nao a suportam. Quem chama deve omitir a tool quando isto for false.
  supportsWebSearch(): boolean {
    try {
      const host = new URL(this.getBaseUrl()).host.toLowerCase();
      return host === 'api.openai.com' || host.endsWith('.openai.com');
    } catch {
      return false;
    }
  }

  isEnabled(envKey: string, fallback = true): boolean {
    const raw = process.env[envKey];
    if (raw == null || String(raw).trim() === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(
      String(raw).trim().toLowerCase(),
    );
  }

  resolveModel(envKeys: string[], fallback: string): string {
    for (const key of envKeys) {
      const value = String(process.env[key] || '').trim();
      if (value) return value;
    }
    return fallback;
  }

  getPositiveIntegerEnv(key: string, fallback: number, max: number): number {
    const parsed = Number.parseInt(String(process.env[key] || ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, max);
  }

  async createJsonResponse(
    input: OpenAiJsonResponseInput,
  ): Promise<OpenAiJsonResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const model = input.model.trim();
    if (!model) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userContent },
        ],
        response_format: { type: 'json_object' },
      };
      if (input.tools?.length) {
        body.tools = input.tools;
      }
      if (input.toolChoice) {
        body.tool_choice = input.toolChoice;
      }
      if (typeof input.temperature === 'number') {
        body.temperature = input.temperature;
      }

      let response = await this.postResponse(apiKey, body, controller.signal);
      // Alguns provedores/modelos rejeitam temperature ou response_format:
      // tenta de novo sem esses campos opcionais (o extractJsonObject cobre o resto).
      if (!response.ok && [400, 422].includes(response.status)) {
        const retryBody = { ...body };
        delete retryBody.temperature;
        delete retryBody.response_format;
        response = await this.postResponse(
          apiKey,
          retryBody,
          controller.signal,
        );
      }

      if (!response.ok) {
        this.logger.warn(
          `OpenAI ${input.operation} failed with status ${response.status}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const outputText = this.extractOutputText(data);
      const parsed = this.extractJsonObject(outputText);
      if (!parsed) {
        this.logger.warn(`OpenAI ${input.operation} returned invalid JSON`);
        return null;
      }

      return {
        parsed,
        outputText,
        model,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown OpenAI request error';
      this.logger.warn(`OpenAI ${input.operation} failed: ${message}`);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getApiKey(): string {
    // AI_API_KEY (provedor atual, ex.: Groq) tem prioridade; OPENAI_API_KEY fica
    // como compatibilidade/producao.
    return String(
      process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
    ).trim();
  }

  private getBaseUrl(): string {
    // Endpoint compativel com OpenAI Chat Completions. Troca de provedor
    // (Groq/OpenAI/Ollama/etc.) e so setar AI_BASE_URL — sem mexer no codigo.
    return String(process.env.AI_BASE_URL || 'https://api.openai.com/v1')
      .trim()
      .replace(/\/$/, '');
  }

  private postResponse(
    apiKey: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  }

  private extractOutputText(data: {
    choices?: Array<{ message?: { content?: string } }>;
  }): string {
    return data.choices?.[0]?.message?.content || '';
  }

  private extractJsonObject(raw: string): Record<string, unknown> | null {
    const trimmed = raw.trim();
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(withoutFence.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
    } catch {
      return null;
    }
  }
}
