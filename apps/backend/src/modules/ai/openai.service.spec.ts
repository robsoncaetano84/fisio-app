import { OpenAiService } from './openai.service';

const originalEnv = process.env;

const makeResponse = (
  status: number,
  body: Record<string, unknown> = {},
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn(async () => body),
  }) as unknown as Response;

describe('OpenAiService', () => {
  let fetchMock: jest.Mock;
  let service: OpenAiService;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Garante ambiente limpo: AI_API_KEY tem prioridade sobre OPENAI_API_KEY.
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new OpenAiService();
  });

  const chatBody = (content: string) => ({
    choices: [{ message: { content } }],
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('reports configuration from OPENAI_API_KEY', () => {
    delete process.env.OPENAI_API_KEY;
    expect(service.isConfigured()).toBe(false);

    process.env.OPENAI_API_KEY = ' sk-test ';
    expect(service.isConfigured()).toBe(true);
  });

  it('prioritizes AI_API_KEY and routes to AI_BASE_URL/chat/completions', async () => {
    process.env.OPENAI_API_KEY = 'sk-openai';
    process.env.AI_API_KEY = 'gsk-groq';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1/';
    fetchMock.mockResolvedValueOnce(makeResponse(200, chatBody('{"ok":true}')));

    await service.createJsonResponse({
      model: 'llama-test',
      systemPrompt: 'system',
      userContent: 'user',
      timeoutMs: 1000,
      operation: 'unit test',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer gsk-groq',
    );
  });

  it('supportsWebSearch only for OpenAI base URLs', () => {
    expect(service.supportsWebSearch()).toBe(true); // default openai.com
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';
    expect(service.supportsWebSearch()).toBe(false);
  });

  it('resolves enabled flags and model fallbacks from env', () => {
    expect(service.isEnabled('MISSING_FLAG', false)).toBe(false);
    expect(service.isEnabled('MISSING_FLAG', true)).toBe(true);

    process.env.FEATURE_FLAG = 'yes';
    process.env.MODEL_PRIMARY = '  ';
    process.env.MODEL_FALLBACK = 'gpt-test';

    expect(service.isEnabled('FEATURE_FLAG', false)).toBe(true);
    expect(
      service.resolveModel(['MODEL_PRIMARY', 'MODEL_FALLBACK'], 'default'),
    ).toBe('gpt-test');
    expect(service.resolveModel(['MODEL_PRIMARY'], 'default')).toBe('default');
  });

  it('bounds positive integer env values', () => {
    process.env.TIMEOUT_MS = '5000';
    expect(service.getPositiveIntegerEnv('TIMEOUT_MS', 1000, 3000)).toBe(3000);

    process.env.TIMEOUT_MS = 'invalid';
    expect(service.getPositiveIntegerEnv('TIMEOUT_MS', 1000, 3000)).toBe(1000);
  });

  it('does not call fetch when the api key or model is missing', async () => {
    await expect(
      service.createJsonResponse({
        model: 'gpt-test',
        systemPrompt: 'system',
        userContent: 'user',
        timeoutMs: 1000,
        operation: 'unit test',
      }),
    ).resolves.toBeNull();

    process.env.OPENAI_API_KEY = 'sk-test';
    await expect(
      service.createJsonResponse({
        model: '  ',
        systemPrompt: 'system',
        userContent: 'user',
        timeoutMs: 1000,
        operation: 'unit test',
      }),
    ).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('parses JSON from message content, including fenced content', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValueOnce(
      makeResponse(200, chatBody('```json\n{"ok":true,"score":3}\n```')),
    );

    await expect(
      service.createJsonResponse({
        model: 'gpt-test',
        systemPrompt: 'system',
        userContent: 'user',
        timeoutMs: 1000,
        operation: 'unit test',
      }),
    ).resolves.toMatchObject({
      parsed: { ok: true, score: 3 },
      model: 'gpt-test',
    });
  });

  it('extracts JSON from message content surrounded by text', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValueOnce(
      makeResponse(200, chatBody('prefix {"source":"nested"} suffix')),
    );

    await expect(
      service.createJsonResponse({
        model: 'gpt-test',
        systemPrompt: 'system',
        userContent: 'user',
        timeoutMs: 1000,
        operation: 'unit test',
      }),
    ).resolves.toMatchObject({
      parsed: { source: 'nested' },
    });
  });

  it('retries without temperature when the model rejects temperature', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock
      .mockResolvedValueOnce(makeResponse(400))
      .mockResolvedValueOnce(makeResponse(200, chatBody('{"ok":true}')));

    await expect(
      service.createJsonResponse({
        model: 'gpt-test',
        systemPrompt: 'system',
        userContent: 'user',
        temperature: 0.2,
        timeoutMs: 1000,
        operation: 'unit test',
      }),
    ).resolves.toMatchObject({
      parsed: { ok: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;

    expect(firstBody.temperature).toBe(0.2);
    expect(secondBody.temperature).toBeUndefined();
  });

  it('passes tools and tool choice through to the request when provided', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValueOnce(makeResponse(200, chatBody('{"ok":true}')));

    await service.createJsonResponse({
      model: 'gpt-test',
      systemPrompt: 'system',
      userContent: 'user',
      tools: [
        {
          type: 'web_search',
          filters: { allowed_domains: ['pubmed.ncbi.nlm.nih.gov'] },
        },
      ],
      toolChoice: 'auto',
      timeoutMs: 1000,
      operation: 'unit test',
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;

    expect(body.tools).toEqual([
      {
        type: 'web_search',
        filters: { allowed_domains: ['pubmed.ncbi.nlm.nih.gov'] },
      },
    ]);
    expect(body.tool_choice).toBe('auto');
  });
});
