import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommunityShell } from '@/components/community/community-shell';
import { EmptyFeed } from '@/components/community/empty-feed';
import { PostCard } from '@/components/community/post-card';
import { getCommunityCategories, getCommunityFeed } from '@/lib/community-api';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCommunityCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};

  const description =
    category.description ||
    `Discussoes tecnicas em ${category.name} na comunidade SYNAP.`;

  return {
    title: category.name,
    description,
    alternates: {
      canonical: `/categorias/${category.slug}`,
    },
    keywords: [
      category.name,
      category.group || 'comunidade profissional',
      'SYNAP',
      'saude',
      'fisioterapia',
      'reabilitacao',
    ],
    openGraph: {
      title: category.name,
      description,
      type: 'website',
      url: `/categorias/${category.slug}`,
    },
    twitter: {
      card: 'summary',
      title: category.name,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categories = await getCommunityCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const feed = await getCommunityFeed({ category: slug, sort: 'recent' });

  return (
    <CommunityShell>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <h1 className="text-2xl font-extrabold text-synap-text">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              {category.description}
            </p>
          ) : null}
        </div>
        <div className="space-y-4">
          {feed.items.length > 0 ? (
            feed.items.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyFeed />
          )}
        </div>
      </main>
    </CommunityShell>
  );
}
