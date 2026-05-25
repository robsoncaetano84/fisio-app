'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  createSsoTokenRecord,
  exchangeSsoToken,
  SSO_RECEIVED_AT_STORAGE_KEY,
  SSO_RECORD_STORAGE_KEY,
  SSO_TOKEN_STORAGE_KEY,
  type CommunitySsoTokenRecord,
} from '@/lib/community-session';

export function SsoCallbackPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeStarted = useRef(false);
  const token = searchParams.get('token') || '';
  const returnTo = searchParams.get('returnTo');
  const source = searchParams.get('source');
  const [record, setRecord] = useState<CommunitySsoTokenRecord | null>(null);
  const [exchangeState, setExchangeState] = useState<
    'idle' | 'exchanging' | 'authenticated' | 'failed'
  >('idle');
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const tokenPreview = useMemo(() => {
    return record?.tokenPreview || null;
  }, [record]);

  const finalReturnTo = useMemo(() => {
    return record?.returnTo || '/';
  }, [record]);

  const expiresAt = useMemo(() => {
    if (!record) return null;
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(record.expiresAt));
  }, [record]);

  useEffect(() => {
    if (!token) return;
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const nextRecord = createSsoTokenRecord({
      token,
      returnTo,
      source,
    });
    window.sessionStorage.setItem(SSO_TOKEN_STORAGE_KEY, token);
    window.sessionStorage.setItem(
      SSO_RECEIVED_AT_STORAGE_KEY,
      nextRecord.receivedAt,
    );
    window.sessionStorage.setItem(
      SSO_RECORD_STORAGE_KEY,
      JSON.stringify(nextRecord),
    );
    setRecord(nextRecord);

    setExchangeState('exchanging');
    exchangeSsoToken(token)
      .then((session) => {
        const authenticatedRecord: CommunitySsoTokenRecord = {
          ...nextRecord,
          status: 'authenticated',
          returnTo: session.returnTo || nextRecord.returnTo,
          userName: session.profile.nome,
          userRole: session.profile.role,
        };
        window.sessionStorage.removeItem(SSO_TOKEN_STORAGE_KEY);
        window.sessionStorage.setItem(
          SSO_RECORD_STORAGE_KEY,
          JSON.stringify(authenticatedRecord),
        );
        setRecord(authenticatedRecord);
        setExchangeState('authenticated');
        if (authenticatedRecord.source === 'synap-app') {
          window.setTimeout(() => {
            router.replace(authenticatedRecord.returnTo || '/');
          }, 350);
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Falha ao autenticar sessao';
        setExchangeError(message);
        setExchangeState('failed');
      });
  }, [returnTo, router, source, token]);

  return (
    <section className="w-full max-w-lg rounded-synap border border-synap-border bg-white p-6 shadow-synap">
      <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
        {record ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <ShieldCheck className="h-6 w-6" />
        )}
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-synap-text">
        Acesso SYNAP recebido
      </h1>
      <p className="mt-2 text-sm leading-6 text-synap-muted">
        Esta tela troca o token temporario por uma sessao segura emitida pelo
        backend em cookie HttpOnly.
      </p>
      <div className="mt-5 rounded-synap border border-synap-border bg-synap-background p-4 text-sm font-semibold text-synap-muted">
        {tokenPreview
          ? `Token temporario: ${tokenPreview}`
          : 'Nenhum token temporario informado na URL.'}
      </div>
      {record ? (
        <div className="mt-3 rounded-synap border border-synap-border bg-synap-background p-4 text-sm font-semibold text-synap-muted">
          Status: {labelForExchangeState(exchangeState)}. Expira em {expiresAt}.
          Origem: {record.source}. Destino: {record.returnTo}
          {record.userName ? `. Usuario: ${record.userName}` : null}
        </div>
      ) : null}
      {exchangeError ? (
        <div className="mt-3 rounded-synap border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {exchangeError}
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40"
          href="/sessao"
        >
          Ver sessao
        </Link>
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-synap-primaryDark"
          href={finalReturnTo}
        >
          Ir para comunidade
        </Link>
      </div>
    </section>
  );
}

function labelForExchangeState(
  state: 'idle' | 'exchanging' | 'authenticated' | 'failed',
) {
  if (state === 'exchanging') return 'trocando por cookie HttpOnly';
  if (state === 'authenticated') return 'autenticado';
  if (state === 'failed') return 'falha na troca';
  return 'aguardando token';
}
