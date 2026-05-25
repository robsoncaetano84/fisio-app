import { Bookmark, ShieldCheck } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Button } from '@/components/ui/button';
import { SavedItemsPanel } from '@/features/bookmarks/saved-items-panel';

export const metadata = {
  title: 'Salvos',
  description:
    'Discussões, artigos e referências salvos na comunidade profissional SYNAP.',
};

export default function SavedItemsPage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-5 rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-synap-text">
                  Salvos
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Guarde discussões, artigos e referências para revisão
                  posterior sem criar competição ou métricas públicas.
                </p>
              </div>
            </div>
          </div>

          <SavedItemsPanel />
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-synap-primary" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Uso privado
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Salvos são uma ferramenta pessoal de estudo e acompanhamento. No
              backend futuro, devem ficar associados ao usuário autenticado.
            </p>
            <Button className="mt-4 w-full" href="/">
              Voltar ao feed
            </Button>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}
