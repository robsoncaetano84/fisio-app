import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Hash, MessageSquare } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { EmptyFeed } from '@/components/community/empty-feed';
import { PostCard } from '@/components/community/post-card';
import { ResourceCard } from '@/components/community/resource-card';
import { Badge } from '@/components/ui/badge';
import {
  getCommunityFeed,
  getCommunityResources,
  getCommunityTag,
} from '@/lib/community-api';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getCommunityTag(slug);
  if (!tag) return {};

  const description =
    tag.description ||
    `Discussoes, artigos e referencias marcados com ${tag.name}.`;

  return {
    title: `Tag ${tag.name}`,
    description,
    alternates: {
      canonical: `/tags/${tag.slug}`,
    },
    keywords: [
      tag.name,
      'SYNAP',
      'comunidade profissional',
      'saude',
      'fisioterapia',
      'evidencias cientificas',
    ],
    openGraph: {
      title: `Tag ${tag.name}`,
      description,
      type: 'website',
      url: `/tags/${tag.slug}`,
    },
    twitter: {
      card: 'summary',
      title: `Tag ${tag.name}`,
      description,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getCommunityTag(slug);
  if (!tag) notFound();

  const [feed, resources] = await Promise.all([
    getCommunityFeed({ tag: slug, sort: 'recent' }),
    getCommunityResources({ tag: slug }),
  ]);

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <Badge tone="primary">Tag tecnica</Badge>
                <h1 className="mt-3 text-2xl font-extrabold text-synap-text">
                  {tag.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  {tag.description ||
                    'Conteudos agrupados por tema tecnico para facilitar estudo, busca e colaboracao.'}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-synap-primary" />
              <h2 className="text-lg font-extrabold text-synap-text">
                Discussões
              </h2>
            </div>
            <div className="space-y-4">
              {feed.items.length > 0 ? (
                feed.items.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <EmptyFeed />
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-extrabold text-synap-text">
              Artigos e referencias
            </h2>
            <p className="mt-1 text-sm font-semibold text-synap-muted">
              Recursos de apoio relacionados a esta tag.
            </p>
            <div className="mt-4 space-y-4">
              {resources.items.length > 0 ? (
                resources.items.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))
              ) : (
                <div className="rounded-synap border border-dashed border-synap-border bg-white p-6 text-sm font-semibold text-synap-muted">
                  Nenhum recurso encontrado para esta tag.
                </div>
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Uso da tag
            </h2>
            <p className="mt-3 text-3xl font-extrabold text-synap-primary">
              {tag.usageCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              Conteudos relacionados no fallback local. No backend real, essa
              contagem vira um dado indexado e paginado.
            </p>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}
