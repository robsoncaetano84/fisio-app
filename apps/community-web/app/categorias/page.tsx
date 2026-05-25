import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import {
  getCommunityCategories,
  type CommunityCategory,
} from '@/lib/community-api';

export const metadata = {
  title: 'Categorias',
  description: 'Categorias tecnicas da comunidade profissional SYNAP.',
  alternates: {
    canonical: '/categorias',
  },
  openGraph: {
    title: 'Categorias',
    description: 'Categorias tecnicas da comunidade profissional SYNAP.',
    type: 'website',
    url: '/categorias',
  },
};

export default async function CategoriesPage() {
  const categories = await getCommunityCategories();
  const groupedCategories = groupCategories(categories);

  return (
    <CommunityShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="primary">Especialidades</Badge>
            <Badge tone="secondary">Evidencias</Badge>
            <Badge tone="accent">Tecnologia</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-synap-text">
            Categorias
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
            Areas de conhecimento para organizar discussoes clinicas, artigos,
            referencias, laudos e sugestoes do ecossistema SYNAP.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-synap-muted">
            <span>{categories.length} categorias iniciais</span>
            <span aria-hidden="true">-</span>
            <span>{groupedCategories.length} eixos de navegacao</span>
          </div>
        </div>

        <div className="space-y-6">
          {groupedCategories.map((group) => (
            <section key={group.name}>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                  <Layers3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-synap-text">
                    {group.name}
                  </h2>
                  <p className="text-xs font-semibold text-synap-muted">
                    {group.items.length} categorias
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((category) => (
                  <CategoryCard category={category} key={category.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </CommunityShell>
  );
}

function CategoryCard({ category }: { category: CommunityCategory }) {
  return (
    <Link
      className="group flex h-full min-h-36 flex-col justify-between rounded-synap border border-synap-border bg-white p-4 shadow-subtle transition hover:border-synap-primary/30 hover:bg-synap-primary/5"
      href={`/categorias/${category.slug}`}
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-extrabold text-synap-text">
            {category.name}
          </span>
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: category.color || '#2E7D5E' }}
          />
        </span>
        {category.description ? (
          <span className="mt-2 line-clamp-3 block text-sm leading-6 text-synap-muted">
            {category.description}
          </span>
        ) : null}
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-synap-primary">
        Ver discussoes
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function groupCategories(categories: CommunityCategory[]) {
  const groups = new Map<string, CommunityCategory[]>();

  for (const category of [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )) {
    const groupName = category.group || 'Outras categorias';
    groups.set(groupName, [...(groups.get(groupName) || []), category]);
  }

  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
}
