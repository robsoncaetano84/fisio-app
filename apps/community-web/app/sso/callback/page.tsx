import { Suspense } from 'react';
import { SsoCallbackPanel } from '@/features/auth/sso-callback-panel';

export const metadata = {
  title: 'Acesso SYNAP',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-synap-background px-4 py-10">
      <Suspense
        fallback={
          <section className="w-full max-w-lg rounded-synap border border-synap-border bg-white p-6 shadow-synap">
            <h1 className="text-2xl font-extrabold text-synap-text">
              Preparando acesso
            </h1>
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              Aguarde enquanto a comunidade valida o retorno do SYNAP.
            </p>
          </section>
        }
      >
        <SsoCallbackPanel />
      </Suspense>
    </main>
  );
}
