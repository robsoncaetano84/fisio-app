/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Proxy same-origin para o backend (producao em *.onrender.com):
  // onrender.com esta na Public Suffix List, entao front e backend em
  // subdominios distintos sao "sites" diferentes e o cookie de sessao
  // (SameSite=Lax) nem seria aceito nem enviado em fetch cross-site.
  // Com o rewrite, o navegador fala so com o proprio dominio do front
  // (NEXT_PUBLIC_COMMUNITY_API_URL=/api) e o cookie vira first-party.
  // Rotas proprias em app/api (health, openapi) tem precedencia sobre
  // o rewrite. Sem COMMUNITY_API_URL definido, nenhum proxy e criado.
  async rewrites() {
    const target = (process.env.COMMUNITY_API_URL || '')
      .trim()
      .replace(/\/$/, '');
    if (!target || !/^https?:\/\//.test(target)) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
  async headers() {
    const scriptSrc =
      process.env.NODE_ENV === 'development'
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'";

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              scriptSrc,
              "connect-src 'self' https:",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
