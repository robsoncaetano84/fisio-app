import type { Metadata } from 'next';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FileText,
  Server,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  communityLogContracts,
  communityMetricContracts,
  communityStatusChecks,
  getCommunityStatusLabel,
  type CommunityLogContract,
  type CommunityMetricContract,
  type CommunityServiceStatus,
  type CommunityStatusCheck,
} from '@/lib/community-observability';

export const metadata: Metadata = {
  title: 'Status operacional | SYNAP Comunidade',
  description:
    'Status operacional, contratos de metricas, logs e observabilidade da comunidade SYNAP.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommunityStatusPage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Observabilidade</Badge>
                  <Badge tone="secondary">Health checks</Badge>
                  <Badge tone="accent">Logs</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Status operacional da comunidade
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                  Visao preparada para monitorar frontend, APIs, SSO, busca,
                  anexos e moderacao. Nesta etapa, apenas o health check do app
                  web esta ativo.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Activity className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/api/health" variant="secondary">
                Abrir health check
              </Button>
              <Button href="/admin" variant="ghost">
                Voltar ao admin
              </Button>
            </div>
          </div>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Server className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Checks planejados
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {communityStatusChecks.map((check) => (
                <StatusCard check={check} key={check.name} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Contratos de metricas
              </h2>
            </div>
            <div className="mt-4 divide-y divide-synap-border">
              {communityMetricContracts.map((metric) => (
                <MetricRow key={metric.metric} metric={metric} />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Estado atual
              </h2>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-synap-primary">
              Frontend ok
            </p>
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              O app NextJS responde em `/api/health`. As demais integracoes
              ficam em modo planejado ate o backend da comunidade ser liberado.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <FileText className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Contratos de logs
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {communityLogContracts.map((log) => (
                <LogCard key={log.event} log={log} />
              ))}
            </div>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function StatusCard({ check }: { check: CommunityStatusCheck }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-synap-text">
            {check.name}
          </h3>
          <p className="mt-1 text-xs font-semibold text-synap-muted">
            {check.owner}
          </p>
        </div>
        <Badge tone={getStatusTone(check.status)}>
          {getCommunityStatusLabel(check.status)}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-synap-muted">
        {check.description}
      </p>
      <p className="mt-3 break-words rounded-synap bg-white p-3 text-xs font-bold text-synap-text">
        {check.check}
      </p>
    </article>
  );
}

function MetricRow({ metric }: { metric: CommunityMetricContract }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="break-words text-sm font-extrabold text-synap-text">
            {metric.metric}
          </p>
          <p className="mt-1 text-sm leading-6 text-synap-muted">
            {metric.description}
          </p>
        </div>
        <Badge tone="secondary">{metric.type}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {metric.labels.map((label) => (
          <Badge key={label} tone="neutral">
            {label}
          </Badge>
        ))}
      </div>
    </article>
  );
}

function LogCard({ log }: { log: CommunityLogContract }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="break-words text-xs font-extrabold text-synap-text">
          {log.event}
        </p>
        <Badge tone={log.level === 'error' ? 'accent' : 'neutral'}>
          {log.level}
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-synap-muted">
        {log.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {log.fields.map((field) => (
          <Badge key={field} tone="neutral">
            {field}
          </Badge>
        ))}
      </div>
    </article>
  );
}

function getStatusTone(
  status: CommunityServiceStatus,
): 'primary' | 'secondary' | 'neutral' {
  if (status === 'operational') return 'primary';
  if (status === 'degraded') return 'secondary';
  return 'neutral';
}
