import Link from 'next/link';
import { Activity, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';
import { CategoryRail } from '@/components/community/category-rail';
import { CommunityShell } from '@/components/community/community-shell';
import { EmptyFeed } from '@/components/community/empty-feed';
import { PostCard } from '@/components/community/post-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getCommunityCategories,
  getCommunityFeed,
  type CommunityFeedSort,
} from '@/lib/community-api';

type PageProps = {
  searchParams: Promise<{ sort?: string }>;
};

const feedLabels: Record<
  CommunityFeedSort,
  { title: string; description: string; label: string }
> = {
  recent: {
    title: 'Discussoes recentes',
    description: 'Conteudo tecnico priorizado por atualizacao.',
    label: 'Recentes',
  },
  relevant: {
    title: 'Discussoes relevantes',
    description:
      'Ordenacao por contribuicao tecnica, respostas e atividade recente.',
    label: 'Relevantes',
  },
  unanswered: {
    title: 'Discussoes sem resposta',
    description: 'Perguntas que ainda precisam de apoio da comunidade.',
    label: 'Sem resposta',
  },
};

export default async function CommunityHomePage({ searchParams }: PageProps) {
  const { sort } = await searchParams;
  const activeSort = parseFeedSort(sort);
  const [categories, feed] = await Promise.all([
    getCommunityCategories(),
    getCommunityFeed({ sort: activeSort }),
  ]);
  const feedCopy = feedLabels[activeSort];

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Profissional</Badge>
                  <Badge tone="secondary">Cientifica</Badge>
                  <Badge tone="accent">Colaborativa</Badge>
                </div>
                <h1 className="max-w-2xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Comunidade profissional SYNAP
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Discussoes clinicas, laudos, protocolos, referencias e
                  raciocinio tecnico para profissionais da saude.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="discussoes"
                  value={feed.total}
                />
                <Metric
                  icon={<BookOpen className="h-4 w-4" />}
                  label="categorias"
                  value={categories.length}
                />
                <Metric
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="etica"
                  value="LGPD"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-synap-text">
                {feedCopy.title}
              </h2>
              <p className="text-sm font-semibold text-synap-muted">
                {feedCopy.description}
              </p>
            </div>
            <FeedControls activeSort={activeSort} />
          </div>

          <div className="mt-4 space-y-4">
            {feed.items.length > 0 ? (
              feed.items.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyFeed />
            )}
          </div>
        </section>

        <div className="space-y-4">
          <CategoryRail categories={categories} />
          <aside className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <BookOpen className="h-4 w-4" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Base de conhecimento
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Artigos e referencias ajudam a qualificar respostas e discussoes
              clinicas.
            </p>
            <div className="mt-4 grid gap-2">
              <Button href="/artigos" variant="secondary">
                Artigos
              </Button>
              <Button href="/referencias" variant="secondary">
                Referencias
              </Button>
              <Button href="/novo-recurso" variant="secondary">
                Compartilhar recurso
              </Button>
            </div>
          </aside>
          <aside className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Activity className="h-4 w-4" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Reconhecimento saudavel
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              A reputacao tecnica reconhece ajuda, referencias uteis e
              colaboracao profissional, sem metricas comerciais.
            </p>
            <div className="mt-4">
              <Button className="w-full" href="/colaboradores" variant="secondary">
                Ver colaboradores
              </Button>
            </div>
            <div className="mt-2">
              <Button className="w-full" href="/contribuicoes" variant="secondary">
                Entender reputacao
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </CommunityShell>
  );
}

function FeedControls({ activeSort }: { activeSort: CommunityFeedSort }) {
  const options: CommunityFeedSort[] = ['recent', 'relevant', 'unanswered'];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((sort) => {
        const active = activeSort === sort;
        return (
          <Link
            className={`focus-ring inline-flex h-9 items-center rounded-full border px-3 text-xs font-extrabold transition ${
              active
                ? 'border-synap-primary/20 bg-synap-primary/10 text-synap-primary'
                : 'border-synap-border bg-white text-synap-muted hover:border-synap-primary/30 hover:text-synap-primary'
            }`}
            href={sort === 'recent' ? '/' : `/?sort=${sort}`}
            key={sort}
          >
            {feedLabels[sort].label}
          </Link>
        );
      })}
    </div>
  );
}

function parseFeedSort(value?: string): CommunityFeedSort {
  if (value === 'relevant' || value === 'unanswered') return value;
  return 'recent';
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-20 rounded-synap border border-synap-border bg-synap-background px-3 py-2">
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white text-synap-primary">
        {icon}
      </div>
      <p className="mt-1 text-sm font-extrabold text-synap-text">{value}</p>
      <p className="text-[11px] font-semibold text-synap-muted">{label}</p>
    </div>
  );
}
