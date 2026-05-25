import { ShieldCheck } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Button } from '@/components/ui/button';
import { ModerationDashboard } from '@/features/moderation/moderation-dashboard';

export const metadata = {
  title: 'Moderacao',
};

export default function ModerationPage() {
  return (
    <CommunityShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-synap-text">
                Moderacao
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-synap-muted">
                Revisao de denuncias, protecao etica e manutencao da qualidade
                tecnica da comunidade.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button href="/admin" variant="secondary">
                  Painel admin
                </Button>
                <Button href="/diretrizes" variant="ghost">
                  Diretrizes
                </Button>
              </div>
            </div>
          </div>

          <ModerationDashboard />
        </div>
      </main>
    </CommunityShell>
  );
}
