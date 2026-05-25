import type { Metadata } from 'next';
import {
  AlertTriangle,
  Bot,
  BookOpenCheck,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  communityAiCapabilities,
  communityAiContracts,
  communityAiGuardrails,
  getCommunityAiStatusLabel,
  type CommunityAiCapability,
  type CommunityAiCapabilityStatus,
  type CommunityAiContract,
} from '@/lib/community-ai';

export const metadata: Metadata = {
  title: 'IA responsavel | SYNAP Comunidade',
  description:
    'Arquitetura preparada para IA responsavel na comunidade SYNAP, com apoio editorial, moderacao e revisao profissional obrigatoria.',
  alternates: {
    canonical: '/ia',
  },
  openGraph: {
    title: 'IA responsavel | SYNAP Comunidade',
    description:
      'Contratos e guardrails para recursos futuros de IA aplicada a discussoes profissionais em saude.',
    type: 'website',
    url: '/ia',
  },
};

export default function CommunityAiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'IA responsavel na Comunidade SYNAP',
    description:
      'Arquitetura de IA preparada para apoio editorial, busca de referencias, classificacao e moderacao na comunidade SYNAP.',
    url: `${getCommunityUrl()}/ia`,
    publisher: {
      '@type': 'Organization',
      name: 'SYNAP',
      url: getCommunityUrl(),
    },
    about: ['Inteligencia artificial', 'Saude', 'Moderacao', 'Etica'],
  };

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <script
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
          type="application/ld+json"
        />

        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">IA futura</Badge>
                  <Badge tone="secondary">Revisao profissional</Badge>
                  <Badge tone="accent">Etica</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  IA responsavel para a comunidade
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                  A comunidade ja fica preparada para recursos de apoio, como
                  resumo de discussoes, sugestao de tags, referencias e triagem
                  de moderacao. Nada substitui a revisao do profissional.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Bot className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/diretrizes" variant="secondary">
                Diretrizes eticas
              </Button>
              <Button href="/moderacao" variant="ghost">
                Ver moderacao
              </Button>
            </div>
          </div>

          <section className="mt-6">
            <div className="flex items-center gap-2 text-synap-primary">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Capacidades planejadas
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-synap-muted">
              Os cards abaixo representam contratos e pontos de extensao para a
              API futura. Nesta etapa, nenhuma chamada de IA e executada.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {communityAiCapabilities.map((capability) => (
                <CapabilityCard
                  capability={capability}
                  key={capability.key}
                />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <FileText className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Contratos REST previstos
              </h2>
            </div>
            <div className="mt-4 divide-y divide-synap-border">
              {communityAiContracts.map((contract) => (
                <ContractRow contract={contract} key={contract.path} />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Guardrails clinicos
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {communityAiGuardrails.map((guardrail) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-synap-muted"
                  key={guardrail}
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-synap-primary/10 text-synap-primary">
                    <ListChecks className="h-3.5 w-3.5" />
                  </span>
                  {guardrail}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Limite de escopo
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              O papel da IA sera apoiar redacao, organizacao e revisao inicial.
              Diagnostico, conduta e publicacao final continuam sob
              responsabilidade do profissional.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <BookOpenCheck className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Proxima integracao
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Quando o backend da comunidade for liberado, os endpoints de IA
              devem exigir RBAC, rate limit, logs de auditoria e revisao humana.
            </p>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function CapabilityCard({
  capability,
}: {
  capability: CommunityAiCapability;
}) {
  return (
    <article className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={getStatusTone(capability.status)}>
            {getCommunityAiStatusLabel(capability.status)}
          </Badge>
          <h3 className="mt-3 text-base font-extrabold text-synap-text">
            {capability.title}
          </h3>
        </div>
        {capability.requiresProfessionalReview ? (
          <Badge tone="accent">Revisao obrigatoria</Badge>
        ) : (
          <Badge tone="neutral">Automacao tecnica</Badge>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-synap-muted">
        {capability.description}
      </p>

      <div className="mt-4 rounded-synap border border-synap-border bg-synap-background p-3">
        <p className="break-words text-xs font-bold text-synap-text">
          {capability.endpoint}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FieldList label="Entrada" values={capability.inputs} />
        <FieldList label="Saida" values={capability.outputs} />
      </div>
    </article>
  );
}

function ContractRow({ contract }: { contract: CommunityAiContract }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-synap-text">
            {contract.name}
          </h3>
          <p className="mt-1 break-words text-xs font-bold text-synap-primary">
            {contract.method} {contract.path}
          </p>
        </div>
        <Badge tone="secondary">{contract.auditEvents.length} eventos</Badge>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <FieldList label="Request" values={contract.requestFields} />
        <FieldList label="Response" values={contract.responseFields} />
        <FieldList label="Auditoria" values={contract.auditEvents} />
      </div>
    </article>
  );
}

function FieldList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {values.map((value) => (
          <li className="break-words text-xs font-semibold text-synap-text" key={value}>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getStatusTone(
  status: CommunityAiCapabilityStatus,
): 'primary' | 'secondary' | 'neutral' {
  if (status === 'contract-ready') return 'primary';
  if (status === 'requires-backend') return 'secondary';
  return 'neutral';
}

function getCommunityUrl(): string {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');
}

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
