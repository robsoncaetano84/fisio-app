import { SearchX } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <CommunityShell>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-synap border border-synap-border bg-white p-6 text-center shadow-subtle">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
            <SearchX className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-synap-text">
            Conteudo nao encontrado
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-synap-muted">
            A discussao, perfil, categoria ou recurso pode ter sido removido,
            estar em revisao ou ainda nao existir na comunidade.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/">Voltar ao feed</Button>
            <Button href="/busca" variant="secondary">
              Buscar na comunidade
            </Button>
          </div>
        </section>
      </main>
    </CommunityShell>
  );
}
