import type { MetadataRoute } from 'next';
import {
  getCommunityCategories,
  getCommunityFeed,
  getCommunityProfiles,
  getCommunityResources,
  getCommunityTags,
} from '@/lib/community-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');
  const [categories, feed, profiles, resources, tags] = await Promise.all([
    getCommunityCategories(),
    getCommunityFeed({ sort: 'recent' }),
    getCommunityProfiles(),
    getCommunityResources(),
    getCommunityTags(),
  ]);

  return [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/artigos`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/referencias`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/colaboradores`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contribuicoes`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profissionais`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/diretrizes`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ia`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...categories.map((category) => ({
      url: `${baseUrl}/categorias/${category.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...tags.map((tag) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...profiles.items.map((profile) => ({
      url: `${baseUrl}/perfil/${profile.username || profile.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...feed.items.map((post) => ({
      url: `${baseUrl}/discussoes/${post.slug}`,
      lastModified: post.lastActivityAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...resources.items.map((resource) => ({
      url:
        resource.kind === 'article'
          ? `${baseUrl}/artigos/${resource.slug}`
          : `${baseUrl}/referencias/${resource.slug}`,
      lastModified: resource.sharedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
