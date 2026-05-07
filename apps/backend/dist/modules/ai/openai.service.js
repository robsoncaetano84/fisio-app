"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
let OpenAiService = OpenAiService_1 = class OpenAiService {
    logger = new common_1.Logger(OpenAiService_1.name);
    isConfigured() {
        return this.getApiKey().length > 0;
    }
    isEnabled(envKey, fallback = true) {
        const raw = process.env[envKey];
        if (raw == null || String(raw).trim() === '')
            return fallback;
        return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
    }
    resolveModel(envKeys, fallback) {
        for (const key of envKeys) {
            const value = String(process.env[key] || '').trim();
            if (value)
                return value;
        }
        return fallback;
    }
    getPositiveIntegerEnv(key, fallback, max) {
        const parsed = Number.parseInt(String(process.env[key] || ''), 10);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return fallback;
        return Math.min(parsed, max);
    }
    async createJsonResponse(input) {
        const apiKey = this.getApiKey();
        if (!apiKey)
            return null;
        const model = input.model.trim();
        if (!model)
            return null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);
        try {
            const body = {
                model,
                input: [
                    { role: 'system', content: input.systemPrompt },
                    { role: 'user', content: input.userContent },
                ],
            };
            if (typeof input.temperature === 'number') {
                body.temperature = input.temperature;
            }
            let response = await this.postResponse(apiKey, body, controller.signal);
            if (!response.ok &&
                typeof body.temperature === 'number' &&
                [400, 422].includes(response.status)) {
                const retryBody = { ...body };
                delete retryBody.temperature;
                response = await this.postResponse(apiKey, retryBody, controller.signal);
            }
            if (!response.ok) {
                this.logger.warn(`OpenAI ${input.operation} failed with status ${response.status}`);
                return null;
            }
            const data = (await response.json());
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'unknown OpenAI request error';
            this.logger.warn(`OpenAI ${input.operation} failed: ${message}`);
            return null;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    getApiKey() {
        return String(process.env.OPENAI_API_KEY || '').trim();
    }
    postResponse(apiKey, body, signal) {
        return fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal,
        });
    }
    extractOutputText(data) {
        return (data.output_text ||
            data.output
                ?.flatMap((item) => item.content || [])
                .map((content) => content.text || '')
                .join('\n') ||
            '');
    }
    extractJsonObject(raw) {
        const trimmed = raw.trim();
        const withoutFence = trimmed
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '');
        const start = withoutFence.indexOf('{');
        const end = withoutFence.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start)
            return null;
        try {
            return JSON.parse(withoutFence.slice(start, end + 1));
        }
        catch {
            return null;
        }
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = OpenAiService_1 = __decorate([
    (0, common_1.Injectable)()
], OpenAiService);
//# sourceMappingURL=openai.service.js.map