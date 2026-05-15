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
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new OpenAiService();
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

  it('parses JSON from output_text, including fenced content', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValueOnce(
      makeResponse(200, {
        output_text: '```json\n{"ok":true,"score":3}\n```',
      }),
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

  it('extracts output text from nested response content', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValueOnce(
      makeResponse(200, {
        output: [
          {
            content: [
              { text: 'prefix ' },
              { text: '{"source":"nested"} suffix' },
            ],
          },
        ],
      }),
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
      .mockResolvedValueOnce(makeResponse(200, { output_text: '{"ok":true}' }));

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
});
