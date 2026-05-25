import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Hash,
  Layers3,
  MessageSquare,
  Search,
  UserRound,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { EmptyFeed } from '@/components/community/empty-feed';
import { PostCard } from '@/components/community/post-card';
import { ResourceCard } from '@/components/community/resource-card';
import { Badge } from '@/components/ui/badge';
import {
  getCommunitySearch,
  type CommunityCategory,
  type CommunityProfile,
  type CommunitySearchResponse,
  type CommunityTagDetails,
} from '@/lib/community-api';

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export const metadata: Metadata = {
  title: 'Busca',
  description:
    'Busca global da comunidade SYNAP para discussoes, artigos, referencias, categorias, tags e profissionais.',
  alternates: {
    canonical: '/busca',
  },
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams;
  const search = await getCommunitySearch(q);

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Busca tecnica</Badge>
                  <Badge tone="secondary">Conteudo</Badge>
                  <Badge tone="accent">Profissionais</Badge>
                </div>
                <h1 className="text-2xl font-extrabold text-synap-text">
                  Busca
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  {search.query
                    ? `Resultados para "${search.query}"`
                    : 'Pesquise discussoes, artigos, referencias, categorias, tags e profissionais.'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Search className="h-6 w-6" />
              </div>
            </div>

            <form action="/busca" className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
                <input
                  className="h-11 w-full rounded-synap border-synap-border bg-synap-background pl-10 pr-3 text-sm text-synap-text placeholder:text-synap-muted focus:border-synap-primary focus:ring-synap-primary"
                  defaultValue={search.query}
                  name="q"
                  placeholder="Ex.: dor lombar, LGPD, neurofuncional, evidencias"
                  type="search"
                />
              </label>
            </form>
          </div>

          <SearchSection
            count={search.discussions.length}
            description="Perguntas, casos anonimizados e discussoes tecnicas."
            icon={<MessageSquare className="h-5 w-5" />}
            title="Discussoes"
          >
            {search.discussions.length > 0 ? (
              <div className="space-y-4">
                {search.discussions.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyFeed />
            )}
          </SearchSection>

          <SearchSection
            count={search.resources.length}
            description="Artigos, referencias e materiais de apoio."
            icon={<BookOpen className="h-5 w-5" />}
            title="Artigos e referencias"
          >
            {search.resources.length > 0 ? (
              <div className="space-y-4">
                {search.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <EmptyResult text="Nenhum artigo ou referencia encontrado." />
            )}
          </SearchSection>
        </section>

        <aside className="space-y-4">
          <SearchSummary search={search} />
          <CategoryResults categories={search.categories} />
          <TagResults tags={search.tags} />
          <ProfileResults profiles={search.profiles} />
        </aside>
      </main>
    </CommunityShell>
  );
}

function SearchSection({
  children,
  count,
  description,
  icon,
  title,
}: {
  children: React.ReactNode;
  count: number;
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-synap-primary">
            {icon}
            <h2 className="text-base font-extrabold text-synap-text">
              {title}
            </h2>
          </div>
          <p className="mt-1 text-sm font-semibold text-synap-muted">
            {description}
          </p>
        </div>
        <Badge tone="neutral">{count} resultados</Badge>
      </div>
      {children}
    </section>
  );
}

function SearchSummary({ search }: { search: CommunitySearchResponse }) {
  const items = [
    ['Discussoes', search.discussions.length],
    ['Recursos', search.resources.length],
    ['Categorias', search.categories.length],
    ['Tags', search.tags.length],
    ['Perfis', search.profiles.length],
  ] as const;

  return (
    <section className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <h2 className="text-sm font-extrabold text-synap-text">
        Resumo da busca
      </h2>
      <p className="mt-2 text-3xl font-extrabold text-synap-primary">
        {search.total}
      </p>
      <p className="text-sm font-semibold text-synap-muted">
        resultados encontrados
      </p>
      <div className="mt-4 space-y-2">
        {items.map(([label, value]) => (
          <div
            className="flex items-center justify-between rounded-synap bg-synap-background px-3 py-2 text-sm"
            key={label}
          >
            <span className="font-semibold text-synap-muted">{label}</span>
            <span className="font-extrabold text-synap-text">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryResults({
  categories,
}: {
  categories: CommunityCategory[];
}) {
  return (
    <section className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="mb-3 flex items-center gap-2 text-synap-primary">
        <Layers3 className="h-4 w-4" />
        <h2 className="text-sm font-extrabold text-synap-text">Categorias</h2>
      </div>
      {categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              className="block rounded-synap border border-synap-border bg-synap-background p-3 transition hover:border-synap-primary/30 hover:bg-synap-primary/5"
              href={`/categorias/${category.slug}`}
              key={category.id}
            >
              <span className="block text-sm font-extrabold text-synap-text">
                {category.name}
              </span>
              {category.group ? (
                <span className="mt-1 block text-xs font-semibold text-synap-muted">
                  {category.group}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyResult compact text="Nenhuma categoria encontrada." />
      )}
    </section>
  );
}

function TagResults({ tags }: { tags: CommunityTagDetails[] }) {
  return (
    <section className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="mb-3 flex items-center gap-2 text-synap-primary">
        <Hash className="h-4 w-4" />
        <h2 className="text-sm font-extrabold text-synap-text">Tags</h2>
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              className="inline-flex h-8 items-center rounded-full border border-synap-border bg-synap-background px-3 text-xs font-bold text-synap-muted transition hover:border-synap-primary/30 hover:text-synap-primary"
              href={`/tags/${tag.slug}`}
              key={tag.id}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyResult compact text="Nenhuma tag encontrada." />
      )}
    </section>
  );
}

function ProfileResults({ profiles }: { profiles: CommunityProfile[] }) {
  return (
    <section className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="mb-3 flex items-center gap-2 text-synap-primary">
        <UserRound className="h-4 w-4" />
        <h2 className="text-sm font-extrabold text-synap-text">Profissionais</h2>
      </div>
      {profiles.length > 0 ? (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <Link
              className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-3 transition hover:border-synap-primary/30 hover:bg-synap-primary/5"
              href={`/perfil/${profile.username || profile.id}`}
              key={profile.id}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-synap-primary">
                {getInitials(profile.displayName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-synap-text">
                  {profile.displayName}
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-synap-muted">
                  {profile.specialty || profile.profession || 'Profissional SYNAP'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyResult compact text="Nenhum perfil encontrado." />
      )}
    </section>
  );
}

function EmptyResult({
  compact,
  text,
}: {
  compact?: boolean;
  text: string;
}) {
  return (
    <div
      className={`rounded-synap border border-dashed border-synap-border bg-white text-sm font-semibold text-synap-muted ${
        compact ? 'p-3' : 'p-6'
      }`}
    >
      {text}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
