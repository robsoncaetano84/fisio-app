import type { Metadata } from 'next';
import {
  Gauge,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  communityCsrfPolicies,
  communityRateLimitPolicies,
  communityRbacPolicies,
  communitySecurityControls,
  communitySecurityHeaders,
  getCommunitySecurityStatusLabel,
  type CommunityRbacPolicy,
  type CommunitySecurityControl,
} from '@/lib/community-security';

export const metadata: Metadata = {
  title: 'Seguranca | SYNAP Comunidade',
  description:
    'Controles de seguranca, headers, RBAC, CSRF, rate limit e contratos futuros da comunidade SYNAP.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SecurityPage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Seguranca</Badge>
                  <Badge tone="secondary">RBAC</Badge>
                  <Badge tone="accent">LGPD</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Seguranca da comunidade
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                  Controles ativos no frontend e contratos para backend futuro:
                  headers defensivos, RBAC, CSRF, rate limit, anti-spam,
                  auditoria e upload seguro.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/admin">Painel admin</Button>
              <Button href="/status" variant="secondary">
                Status
              </Button>
            </div>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {communitySecurityControls.map((control) => (
              <ControlCard control={control} key={control.title} />
            ))}
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <ServerCog className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Headers ativos
              </h2>
            </div>
            <div className="mt-4 divide-y divide-synap-border">
              {communitySecurityHeaders.map((header) => (
                <article className="py-4 first:pt-0 last:pb-0" key={header.header}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-synap-text">
                        {header.header}
                      </p>
                      <p className="mt-1 break-words text-xs font-bold text-synap-primary">
                        {header.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-synap-muted">
                        {header.purpose}
                      </p>
                    </div>
                    <Badge tone="primary">Ativo</Badge>
                  </div>
                </article>
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
              {communityRbacPolicies.map((policy) => (
                <RbacCard key={policy.role} policy={policy} />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Gauge className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Rate limit futuro
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {communityRateLimitPolicies.map((policy) => (
                <div
                  className="rounded-synap border border-synap-border bg-synap-background p-3"
                  key={policy.scope}
                >
                  <p className="text-xs font-extrabold text-synap-text">
                    {policy.scope}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-synap-muted">
                    {policy.limit} em {policy.window}.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-synap-muted">
                    {policy.action}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <KeyRound className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                CSRF e sessao
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {communityCsrfPolicies.map((policy) => (
                <div
                  className="rounded-synap border border-synap-border bg-synap-background p-3"
                  key={policy.surface}
                >
                  <p className="text-xs font-extrabold text-synap-text">
                    {policy.surface}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-synap-muted">
                    {policy.strategy}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-synap-muted">
                    {policy.notes}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function ControlCard({ control }: { control: CommunitySecurityControl }) {
  return (
    <article className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-synap-text">
            {control.title}
          </h2>
          <p className="mt-1 text-xs font-semibold text-synap-muted">
            {control.owner}
          </p>
        </div>
        <Badge tone={control.tone}>
          {getCommunitySecurityStatusLabel(control.status)}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-synap-muted">
        {control.description}
      </p>
    </article>
  );
}

function RbacCard({ policy }: { policy: CommunityRbacPolicy }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-4">
      <Badge tone={policy.role === 'ADMIN' ? 'accent' : 'primary'}>
        {policy.role}
      </Badge>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        Permitido
      </p>
      <ul className="mt-2 space-y-1">
        {policy.allowed.map((item) => (
          <li className="text-xs font-semibold leading-5 text-synap-text" key={item}>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        Bloqueado
      </p>
      <ul className="mt-2 space-y-1">
        {policy.denied.map((item) => (
          <li className="text-xs font-semibold leading-5 text-synap-muted" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
