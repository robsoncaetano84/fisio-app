import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCommunityMenu } from '@/components/community/mobile-community-menu';
import { NotificationBell } from '@/features/notifications/notification-bell';

export function CommunityShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-synap-background">
      <header className="sticky top-0 z-20 border-b border-synap-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-synap bg-synap-primary text-sm font-bold text-white">
              S
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-synap-text">
                SYNAP Comunidade
              </p>
              <p className="truncate text-xs font-semibold text-synap-muted">
                conhecimento profissional em saude
              </p>
            </div>
          </Link>

          <form className="hidden flex-1 lg:block" action="/busca">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
              <input
                className="h-10 w-full rounded-synap border-synap-border bg-synap-background pl-10 pr-3 text-sm text-synap-text placeholder:text-synap-muted focus:border-synap-primary focus:ring-synap-primary"
                name="q"
                placeholder="Buscar discussoes, artigos e referencias"
                type="search"
              />
            </label>
          </form>

          <nav className="ml-auto hidden items-center gap-1 xl:flex">
            <Button href="/categorias" variant="ghost">
              Categorias
            </Button>
            <Button href="/artigos" variant="ghost">
              Artigos
            </Button>
            <Button href="/referencias" variant="ghost">
              Referencias
            </Button>
            <Button href="/salvos" variant="ghost">
              Salvos
            </Button>
            <Button href="/colaboradores" variant="ghost">
              Colaboradores
            </Button>
            <Button href="/profissionais" variant="ghost">
              Profissionais
            </Button>
            <Button href="/ia" variant="ghost">
              IA
            </Button>
            <Button href="/diretrizes" variant="ghost">
              Diretrizes
            </Button>
            <Button href="/novo-recurso" variant="ghost">
              Compartilhar
            </Button>
            <Button href="/perfil/equipe-synap" variant="ghost">
              Perfil
            </Button>
            <Button href="/moderacao" variant="ghost">
              <ShieldCheck className="h-4 w-4" />
              Moderacao
            </Button>
          </nav>

          <NotificationBell />
          <Button className="hidden sm:inline-flex" href="/nova-discussao">
            Nova discussao
          </Button>
          <MobileCommunityMenu />
        </div>
      </header>
      {children}
    </div>
  );
}
