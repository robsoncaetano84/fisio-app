import { Injectable, Logger } from '@nestjs/common';
import { parseJsonObject } from '../../common/safe-json';
import { captureException } from '../../common/observability/sentry';
import { logOperationalEvent } from '../../common/observability/operational-logging';

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
    const startedAt = Date.now();
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const model = input.model.trim();
    if (!model) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const body: Record<string, unknown> = {
        model,
        input: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userContent },
        ],
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
      if (
        !response.ok &&
        typeof body.temperature === 'number' &&
        [400, 422].includes(response.status)
      ) {
        const retryBody = { ...body };
        delete retryBody.temperature;
        response = await this.postResponse(
          apiKey,
          retryBody,
          controller.signal,
        );
      }

      if (!response.ok) {
        logOperationalEvent(
          this.logger,
          'ai.request.failed',
          {
            operation: input.operation,
            model,
            status: response.status,
            durationMs: Date.now() - startedAt,
            reason: 'HTTP_STATUS',
          },
          { severity: 'warning', captureToSentry: response.status >= 500 },
        );
        return null;
      }

      const data = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string }> }>;
      };
      const outputText = this.extractOutputText(data);
      const parsed = this.extractJsonObject(outputText);
      if (!parsed) {
        logOperationalEvent(
          this.logger,
          'ai.request.failed',
          {
            operation: input.operation,
            model,
            durationMs: Date.now() - startedAt,
            reason: 'INVALID_JSON',
          },
          { severity: 'warning', captureToSentry: true },
        );
        return null;
      }

      logOperationalEvent(this.logger, 'ai.request.completed', {
        operation: input.operation,
        model,
        durationMs: Date.now() - startedAt,
        outputChars: outputText.length,
      });

      return {
        parsed,
        outputText,
        model,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown OpenAI request error';
      logOperationalEvent(
        this.logger,
        'ai.request.failed',
        {
          operation: input.operation,
          model,
          durationMs: Date.now() - startedAt,
          reason: 'EXCEPTION',
          message,
        },
        { severity: 'error', captureToSentry: true },
      );
      captureException(error, {
        operation: input.operation,
        model,
        durationMs: Date.now() - startedAt,
      });
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getApiKey(): string {
    return String(process.env.OPENAI_API_KEY || '').trim();
  }

  private postResponse(
    apiKey: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  }

  private extractOutputText(data: {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  }): string {
    return (
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .map((content) => content.text || '')
        .join('\n') ||
      ''
    );
  }

  private extractJsonObject(raw: string): Record<string, unknown> | null {
    const trimmed = raw.trim();
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    return parseJsonObject(withoutFence.slice(start, end + 1));
  }
}
