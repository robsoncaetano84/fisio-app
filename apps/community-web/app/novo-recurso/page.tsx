import { BookOpenCheck, FileText, ShieldCheck } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { NewResourceForm } from '@/features/resources/new-resource-form';

export const metadata = {
  title: 'Compartilhar recurso',
  description:
    'Compartilhe artigos, referencias e materiais tecnicos na comunidade profissional SYNAP.',
};

export default function NewResourcePage() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <NewResourceForm />
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-synap-primary" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Curadoria tecnica
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              A comunidade prioriza recursos que ajudam a qualificar discussoes
              clinicas, laudos, protocolos e raciocinio profissional.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Bons recursos incluem
            </h2>
            <div className="mt-4 space-y-3">
              <Guideline
                icon={<FileText className="h-4 w-4" />}
                text="Resumo objetivo do material e da fonte."
              />
              <Guideline
                icon={<BookOpenCheck className="h-4 w-4" />}
                text="Aplicabilidade clinica e limites de uso."
              />
              <Guideline
                icon={<ShieldCheck className="h-4 w-4" />}
                text="Ausencia de dados sensiveis ou identificaveis."
              />
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <Badge tone="secondary">Etapa atual</Badge>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              O envio fica salvo localmente agora. Quando o backend da
              comunidade for implementado, este formulario enviara para a API de
              recursos e passara por moderacao.
            </p>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function Guideline({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-3">
      <span className="mt-0.5 text-synap-primary">{icon}</span>
      <p className="text-sm font-semibold leading-6 text-synap-muted">{text}</p>
    </div>
  );
}
