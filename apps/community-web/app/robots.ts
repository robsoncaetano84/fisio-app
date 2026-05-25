import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/contratos',
        '/moderacao',
        '/notificacoes',
        '/nova-discussao',
        '/novo-recurso',
        '/salvos',
        '/seguranca',
        '/sessao',
        '/status',
        '/sso',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
