import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommunityShell } from '@/components/community/community-shell';
import { ResourceDetail } from '@/components/community/resource-detail';
import { getCommunityResource } from '@/lib/community-api';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getCommunityResource(slug);
  if (!resource || resource.kind !== 'reference') return {};

  return {
    title: `${resource.title} | Referencias SYNAP`,
    description: resource.summary,
    openGraph: {
      title: resource.title,
      description: resource.summary,
      type: 'article',
    },
  };
}

export default async function ReferenceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await getCommunityResource(slug);
  if (!resource || resource.kind !== 'reference') notFound();

  return (
    <CommunityShell>
      <ResourceDetail resource={resource} />
    </CommunityShell>
  );
}
