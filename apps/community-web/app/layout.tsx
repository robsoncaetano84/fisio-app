import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app',
  ),
  title: {
    default: 'SYNAP Comunidade',
    template: '%s | SYNAP Comunidade',
  },
  description:
    'Comunidade técnica e científica para profissionais da saúde, fisioterapia e reabilitação.',
  openGraph: {
    type: 'website',
    siteName: 'SYNAP Comunidade',
    title: 'SYNAP Comunidade',
    description:
      'Discussões profissionais, evidências científicas e colaboração técnica em saúde.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
