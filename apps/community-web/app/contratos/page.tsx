import type { Metadata } from 'next';
import {
  Braces,
  Database,
  FileCode2,
  GitBranch,
  Network,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  communityApiContracts,
  communityEntityContracts,
  getCommunityContractStatusLabel,
  getCommunityMethodTone,
  type CommunityApiContract,
  type CommunityApiDomain,
  type CommunityEntityContract,
} from '@/lib/community-contracts';

export const metadata: Metadata = {
  title: 'Contratos tecnicos | SYNAP Comunidade',
  description:
    'Contratos REST e modelagem PostgreSQL planejada para a comunidade SYNAP.',
  robots: {
    index: false,
    follow: false,
  },
};

const domainLabels: Record<CommunityApiDomain, string> = {
  auth: 'Autenticacao',
  profiles: 'Perfis',
  content: 'Conteudo',
  resources: 'Recursos',
  engagement: 'Engajamento',
  moderation: 'Moderacao',
  search: 'Busca',
  admin: 'Admin',
  ai: 'IA',
  observability: 'Observabilidade',
};

export default function ContractsPage() {
  const groupedContracts = groupContractsByDomain(communityApiContracts);

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">REST</Badge>
                  <Badge tone="secondary">PostgreSQL</Badge>
                  <Badge tone="accent">DDD</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Contratos tecnicos da comunidade
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                  Mapa de APIs e entidades planejadas para quando o backend da
                  comunidade for liberado. Estes contratos orientam a evolucao
                  sem alterar o backend atual do SYNAP.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <FileCode2 className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/admin">Painel admin</Button>
              <Button href="/api/community/openapi" variant="secondary">
                OpenAPI JSON
              </Button>
              <Button href="/seguranca" variant="secondary">
                Seguranca
              </Button>
            </div>
          </div>

          <section className="mt-6 space-y-6">
            {groupedContracts.map(([domain, contracts]) => (
              <div
                className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle"
                key={domain}
              >
                <div className="flex items-center gap-2 text-synap-primary">
                  <Network className="h-5 w-5" />
                  <h2 className="text-base font-extrabold text-synap-text">
                    {domainLabels[domain]}
                  </h2>
                </div>
                <div className="mt-4 divide-y divide-synap-border">
                  {contracts.map((contract) => (
                    <ApiContractRow
                      contract={contract}
                      key={`${contract.method}-${contract.path}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Database className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Entidades PostgreSQL
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {communityEntityContracts.map((entity) => (
                <EntityCard entity={entity} key={entity.table} />
              ))}
            </div>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function ApiContractRow({ contract }: { contract: CommunityApiContract }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={getCommunityMethodTone(contract.method)}>
              {contract.method}
            </Badge>
            <Badge tone="neutral">{contract.auth}</Badge>
            <Badge tone="secondary">
              {getCommunityContractStatusLabel(contract.status)}
            </Badge>
          </div>
          <p className="mt-3 break-words text-sm font-extrabold text-synap-text">
            {contract.path}
          </p>
          <p className="mt-2 text-sm leading-6 text-synap-muted">
            {contract.summary}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <FieldList icon={<Braces className="h-4 w-4" />} label="Request" values={contract.request || []} />
        <FieldList icon={<GitBranch className="h-4 w-4" />} label="Response" values={contract.response || []} />
      </div>
    </article>
  );
}

function EntityCard({ entity }: { entity: CommunityEntityContract }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="break-words text-xs font-extrabold text-synap-text">
          {entity.table}
        </p>
        <Badge tone="neutral">{entity.ownership}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-synap-muted">
        {entity.purpose}
      </p>
      <div className="mt-3 space-y-3">
        <FieldList label="Campos" values={entity.keyFields} />
        <FieldList label="Indices" values={entity.indexes} />
        <FieldList label="Relacoes" values={entity.relations} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={entity.softDelete ? 'secondary' : 'neutral'}>
          {entity.softDelete ? 'soft delete' : 'sem soft delete'}
        </Badge>
        <Badge tone={entity.audit ? 'primary' : 'neutral'}>
          {entity.audit ? 'auditavel' : 'sem auditoria direta'}
        </Badge>
      </div>
    </article>
  );
}

function FieldList({
  icon,
  label,
  values,
}: {
  icon?: React.ReactNode;
  label: string;
  values: string[];
}) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-3">
      <div className="flex items-center gap-2 text-synap-primary">
        {icon}
        <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
          {label}
        </p>
      </div>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {values.map((value) => (
            <li className="break-words text-xs font-semibold leading-5 text-synap-text" key={value}>
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs font-semibold text-synap-muted">
          Sem payload especifico.
        </p>
      )}
    </div>
  );
}

function groupContractsByDomain(
  contracts: CommunityApiContract[],
): Array<[CommunityApiDomain, CommunityApiContract[]]> {
  const domains = Array.from(
    new Set(contracts.map((contract) => contract.domain)),
  );

  return domains.map((domain) => [
    domain,
    contracts.filter((contract) => contract.domain === domain),
  ]);
}
