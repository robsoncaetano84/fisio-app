import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import type { CommunityCategory } from '@/lib/community-api';

export function CategoryRail({
  categories,
}: {
  categories: CommunityCategory[];
}) {
  const visibleCategories = [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 10);

  return (
    <aside className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
          <Layers3 className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-extrabold text-synap-text">Categorias</h2>
      </div>
      <div className="space-y-2">
        {visibleCategories.map((category) => (
          <Link
            className="group flex items-start justify-between gap-3 rounded-synap border border-transparent p-2 transition hover:border-synap-primary/20 hover:bg-synap-primary/5"
            href={`/categorias/${category.slug}`}
            key={category.id}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-synap-text">
                {category.name}
              </span>
              {category.description ? (
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-synap-muted">
                  {category.description}
                </span>
              ) : null}
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-synap-muted transition group-hover:text-synap-primary" />
          </Link>
        ))}
      </div>
      {categories.length > visibleCategories.length ? (
        <Link
          className="mt-3 inline-flex text-xs font-extrabold text-synap-primary hover:text-synap-primaryDark"
          href="/categorias"
        >
          Ver todas as categorias
        </Link>
      ) : null}
    </aside>
  );
}
