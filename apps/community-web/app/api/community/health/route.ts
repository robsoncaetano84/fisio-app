import { communityStatusChecks } from '@/lib/community-observability';

export const dynamic = 'force-dynamic';

export function GET() {
  const planned = communityStatusChecks.filter(
    (check) => check.status === 'planned',
  );
  const degraded = communityStatusChecks.filter(
    (check) => check.status === 'degraded',
  );

  return Response.json(
    {
      app: 'synap-community-api-contract',
      status: degraded.length > 0 || planned.length > 0 ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0-etapa-27',
      dependencies: communityStatusChecks.map((check) => ({
        name: check.name,
        owner: check.owner,
        status: check.status,
        check: check.check,
      })),
      notes: [
        'Endpoint local do community-web para validar contrato de health.',
        'Dependencias de backend permanecem planejadas nesta etapa.',
      ],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
