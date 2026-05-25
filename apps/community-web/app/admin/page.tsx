import type { Metadata } from "next";
import {
  Activity,
  Database,
  FileText,
  LockKeyhole,
  SearchCheck,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { CommunityShell } from "@/components/community/community-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOverviewPanel } from "@/features/admin/admin-overview-panel";
import { AuditLogPanel } from "@/features/admin/audit-log-panel";
import {
  communityAdminApiContracts,
  communityAdminAuditEvents,
  communityAdminMetrics,
  communityAdminQueues,
  communityAdminRoles,
  getCommunityAdminStatusLabel,
  type CommunityAdminApiContract,
  type CommunityAdminMetric,
  type CommunityAdminQueue,
  type CommunityAdminRole,
  type CommunityAdminTone,
} from "@/lib/community-admin";

export const metadata: Metadata = {
  title: "Admin | SYNAP Comunidade",
  description:
    "Painel administrativo preparado para governanca, RBAC, auditoria, SEO, moderacao e operacao da comunidade SYNAP.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Admin</Badge>
                  <Badge tone="secondary">RBAC</Badge>
                  <Badge tone="accent">Auditoria</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Painel administrativo da comunidade
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                  Visao operacional para governanca, moderacao, seguranca,
                  indexacao e integracoes futuras. O painel ja consulta metricas
                  reais quando a sessao ADMIN esta ativa.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/moderacao">Abrir moderacao</Button>
              <Button href="/ia" variant="secondary">
                Ver IA responsavel
              </Button>
              <Button href="/sitemap.xml" variant="ghost">
                Sitemap
              </Button>
              <Button href="/status" variant="ghost">
                Status
              </Button>
              <Button href="/seguranca" variant="ghost">
                Seguranca
              </Button>
              <Button href="/sessao" variant="ghost">
                Sessao
              </Button>
              <Button href="/contratos" variant="ghost">
                Contratos
              </Button>
            </div>
          </div>

          <AdminOverviewPanel />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {communityAdminMetrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Activity className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Filas operacionais
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {communityAdminQueues.map((queue) => (
                <QueueCard key={queue.title} queue={queue} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <LockKeyhole className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                RBAC planejado
              </h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {communityAdminRoles.map((role) => (
                <RoleCard key={role.role} role={role} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <FileText className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Contratos REST administrativos
              </h2>
            </div>
            <div className="mt-4 divide-y divide-synap-border">
              {communityAdminApiContracts.map((contract) => (
                <ContractRow
                  contract={contract}
                  key={`${contract.method}-${contract.path}`}
                />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <AuditLogPanel />

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Database className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Politica de auditoria
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {communityAdminAuditEvents.slice(0, 4).map((event) => (
                <div
                  className="rounded-synap border border-synap-border bg-synap-background p-3"
                  key={event.event}
                >
                  <p className="break-words text-xs font-extrabold text-synap-text">
                    {event.event}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-synap-muted">
                    {event.description}
                  </p>
                  <Badge tone="neutral">{event.retention}</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <SearchCheck className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                SEO administrativo
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Conteudos publicos devem ser indexaveis. Areas operacionais como
              admin, moderacao, notificacoes e criacao devem ficar fora do
              indice.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Server className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Observabilidade futura
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              O backend deve publicar metricas de fila, latencia, erros,
              rate-limit, SSO, moderacao e uso de IA em dashboards de operacao.
            </p>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function MetricCard({ metric }: { metric: CommunityAdminMetric }) {
  return (
    <article className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <Badge tone={metric.tone}>{metric.label}</Badge>
      <p className="mt-4 text-3xl font-extrabold text-synap-text">
        {metric.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-synap-muted">
        {metric.description}
      </p>
    </article>
  );
}

function QueueCard({ queue }: { queue: CommunityAdminQueue }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-synap bg-white text-synap-primary">
            {queue.ownerRole === "ADMIN" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-synap-text">
              {queue.title}
            </h3>
            <p className="mt-1 text-xs font-semibold text-synap-muted">
              {queue.ownerRole}
            </p>
          </div>
        </div>
        <Badge tone={getStatusTone(queue.status)}>
          {getCommunityAdminStatusLabel(queue.status)}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-synap-muted">
        {queue.description}
      </p>
      <Button className="mt-4" href={queue.href} variant="ghost">
        Abrir
      </Button>
    </article>
  );
}

function RoleCard({ role }: { role: CommunityAdminRole }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-4">
      <Badge tone={role.role === "ADMIN" ? "accent" : "primary"}>
        {role.role}
      </Badge>
      <p className="mt-3 text-sm font-semibold leading-6 text-synap-muted">
        {role.description}
      </p>
      <ul className="mt-4 space-y-2">
        {role.permissions.map((permission) => (
          <li
            className="text-xs font-semibold leading-5 text-synap-text"
            key={permission}
          >
            {permission}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ContractRow({ contract }: { contract: CommunityAdminApiContract }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="break-words text-sm font-extrabold text-synap-text">
            {contract.path}
          </p>
          <p className="mt-1 text-sm leading-6 text-synap-muted">
            {contract.purpose}
          </p>
        </div>
        <Badge tone="secondary">{contract.method}</Badge>
      </div>
    </article>
  );
}

function getStatusTone(
  status: CommunityAdminQueue["status"],
): CommunityAdminTone {
  if (status === "contract-ready") return "primary";
  if (status === "local") return "secondary";
  return "neutral";
}
