import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { ResourceCard } from '@/components/community/resource-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCommunityResources } from '@/lib/community-api';

export const metadata = {
  title: 'Referencias bibliograficas',
  description:
    'Referencias bibliograficas e guias de apoio para discussoes clinicas no SYNAP.',
};

export default async function ReferencesPage() {
  const resources = await getCommunityResources({ kind: 'reference' });

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <Badge tone="primary">Base de conhecimento</Badge>
                <h1 className="mt-3 text-2xl font-extrabold text-synap-text">
                  Referencias bibliograficas
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Materiais de apoio para qualificar respostas, condutas,
                  protocolos e interpretacao tecnica dentro da comunidade.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {resources.items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-synap-primary" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Uso profissional
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Referencias ajudam a sustentar o raciocinio, mas nao substituem a
              avaliacao e decisao do profissional responsavel.
            </p>
            <Button className="mt-4 w-full" href="/novo-recurso">
              Compartilhar referencia
            </Button>
            <Button className="mt-2 w-full" href="/nova-discussao" variant="secondary">
              Discutir referencia
            </Button>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}
