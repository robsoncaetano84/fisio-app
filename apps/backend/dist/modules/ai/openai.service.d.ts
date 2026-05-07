type OpenAiUserContent = string | Array<Record<string, unknown>>;
type OpenAiJsonResponseInput = {
    model: string;
    systemPrompt: string;
    userContent: OpenAiUserContent;
    temperature?: number;
    timeoutMs: number;
    operation: string;
};
type OpenAiJsonResponse = {
    parsed: Record<string, unknown>;
    outputText: string;
    model: string;
};
export declare class OpenAiService {
    private readonly logger;
    isConfigured(): boolean;
    isEnabled(envKey: string, fallback?: boolean): boolean;
    resolveModel(envKeys: string[], fallback: string): string;
    getPositiveIntegerEnv(key: string, fallback: number, max: number): number;
    createJsonResponse(input: OpenAiJsonResponseInput): Promise<OpenAiJsonResponse | null>;
    private getApiKey;
    private postResponse;
    private extractOutputText;
    private extractJsonObject;
}
export {};
