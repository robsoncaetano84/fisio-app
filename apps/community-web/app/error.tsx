'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('community.route.error', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-synap-background px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-synap border border-synap-border bg-white p-6 text-center shadow-subtle">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-synap bg-synap-accent/10 text-synap-accent">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-synap-text">
          Nao foi possivel carregar esta area
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-synap-muted">
          O erro foi capturado pelo boundary da comunidade. Quando a
          observabilidade estiver conectada, este evento deve ser enviado com
          rota, digest e requestId.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-synap bg-synap-background p-3 text-xs font-bold text-synap-muted">
            Digest: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-synap-primaryDark"
            onClick={reset}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            className="focus-ring inline-flex h-10 items-center justify-center rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40"
            href="/"
          >
            Voltar ao feed
          </Link>
        </div>
      </section>
    </main>
  );
}
