import {
  communityApiContracts,
  type CommunityApiContract,
} from './community-contracts';

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
};

const domainDescription: Record<CommunityApiContract['domain'], string> = {
  auth: 'SSO e sessao integrada ao ecossistema SYNAP.',
  profiles: 'Perfis profissionais e sincronizacao de dados publicos.',
  content: 'Discussoes, respostas e resposta mais util.',
  resources: 'Artigos, referencias, anexos e upload futuro.',
  engagement: 'Bookmarks, contribuicoes, badges e destaques saudaveis.',
  moderation: 'Denuncias, revisao humana e auditoria.',
  search: 'Busca global e descoberta tecnica.',
  admin: 'Operacao administrativa, RBAC e auditoria.',
  ai: 'Contratos futuros de IA com revisao humana.',
  observability: 'Health checks, metricas e logs.',
};

export function getCommunityOpenApiDocument(): OpenApiDocument {
  const paths = communityApiContracts.reduce<OpenApiDocument['paths']>(
    (accumulator, contract) => {
      const path = normalizePathParams(contract.path);
      const method = contract.method.toLowerCase();

      accumulator[path] = {
        ...(accumulator[path] || {}),
        [method]: buildOperation(contract),
      };

      return accumulator;
    },
    {},
  );

  return {
    openapi: '3.1.0',
    info: {
      title: 'SYNAP Comunidade API',
      version: '0.1.0-etapa-27',
      description:
        'Contrato planejado para a comunidade profissional SYNAP. Nesta etapa, o documento orienta a implementacao futura sem alterar o backend atual.',
    },
    servers: [
      {
        url: 'https://api.synap.app',
        description: 'Backend SYNAP planejado',
      },
      {
        url: 'http://localhost:3000',
        description: 'Ambiente local planejado',
      },
    ],
    tags: Object.entries(domainDescription).map(([name, description]) => ({
      name,
      description,
    })),
    paths,
    components: {
      securitySchemes: {
        synapJwt: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT SYNAP ou cookie de sessao HttpOnly apos troca SSO.',
        },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            traceId: { type: 'string' },
          },
          required: ['code', 'message'],
        },
      },
    },
  };
}

function buildOperation(contract: CommunityApiContract): Record<string, unknown> {
  const pathParameters = getPathParameterNames(contract.path);
  const queryParameters =
    contract.method === 'GET'
      ? getFieldNames(contract.request || []).filter(
          (field) => !pathParameters.includes(field),
        )
      : [];

  return {
    tags: [contract.domain],
    summary: contract.summary,
    operationId: buildOperationId(contract),
    description: `Status de implementacao: ${contract.status}. Autorizacao: ${contract.auth}.`,
    security: contract.auth === 'public' ? [] : [{ synapJwt: [] }],
    parameters: [
      ...pathParameters.map((name) => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      })),
      ...queryParameters.map((name) => ({
        name,
        in: 'query',
        required: false,
        schema: { type: 'string' },
      })),
    ],
    requestBody:
      contract.method === 'GET' || !contract.request?.length
        ? undefined
        : {
            required: true,
            content: {
              'application/json': {
                schema: buildObjectSchema(contract.request),
              },
            },
          },
    responses: {
      '200': {
        description: 'Resposta planejada do contrato.',
        content: {
          'application/json': {
            schema: buildObjectSchema(contract.response || ['ok']),
          },
        },
      },
      '400': {
        description: 'Requisicao invalida.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
      '401': {
        description: 'Autenticacao ausente ou invalida.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
    },
  };
}

function buildObjectSchema(fields: string[]) {
  const normalizedFields = getFieldNames(fields);

  return {
    type: 'object',
    additionalProperties: true,
    properties: Object.fromEntries(
      normalizedFields.map((field) => [
        field,
        {
          type: field.endsWith('At') || field.endsWith('Url') ? 'string' : 'string',
        },
      ]),
    ),
  };
}

function normalizePathParams(path: string): string {
  return path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
}

function getPathParameterNames(path: string): string[] {
  return Array.from(path.matchAll(/:([A-Za-z][A-Za-z0-9_]*)/g)).map(
    (match) => match[1],
  );
}

function getFieldNames(fields: string[]): string[] {
  return fields.map((field) =>
    field
      .replace(/\?$/g, '')
      .replace(/\[\]$/g, '')
      .replace(/[^A-Za-z0-9_]/g, ''),
  );
}

function buildOperationId(contract: CommunityApiContract): string {
  const pathPart = contract.path
    .replace(/^\/api\//, '')
    .replace(/:([A-Za-z][A-Za-z0-9_]*)/g, 'by-$1')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(capitalize)
    .join('');

  return `${contract.method.toLowerCase()}${pathPart}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
