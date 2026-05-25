import { Bell, ShieldCheck } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Button } from '@/components/ui/button';
import { NotificationsPanel } from '@/features/notifications/notifications-panel';

export const metadata = {
  title: 'Notificacoes',
  description:
    'Notificacoes profissionais da comunidade SYNAP para respostas, mencoes, moderacao e recursos.',
};

export default function NotificationsPage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-5 rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-synap-text">
                  Notificacoes
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Acompanhe respostas, mencoes, recursos recomendados e avisos
                  de moderacao sem transformar a comunidade em rede social.
                </p>
              </div>
            </div>
          </div>

          <NotificationsPanel />
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-synap-primary" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Notificacoes saudaveis
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              O foco e alertar sobre colaboracao tecnica, qualidade cientifica e
              seguranca profissional, sem usar gatilhos agressivos de engajamento.
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
