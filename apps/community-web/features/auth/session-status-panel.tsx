'use client';

import { useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  communitySessionContracts,
  communitySessionSyncFields,
  SSO_RECORD_STORAGE_KEY,
  SSO_TOKEN_STORAGE_KEY,
  type CommunitySsoTokenRecord,
} from '@/lib/community-session';

export function SessionStatusPanel() {
  const [record, setRecord] = useState<CommunitySsoTokenRecord | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const rawRecord = window.sessionStorage.getItem(SSO_RECORD_STORAGE_KEY);
    const token = window.sessionStorage.getItem(SSO_TOKEN_STORAGE_KEY);
    setHasToken(Boolean(token));

    if (!rawRecord) return;
    try {
      setRecord(JSON.parse(rawRecord) as CommunitySsoTokenRecord);
    } catch {
      setRecord(null);
    }
  }, []);

  const expired = useMemo(() => {
    if (!record) return false;
    return new Date(record.expiresAt).getTime() < Date.now();
  }, [record]);

  const clearSession = () => {
    window.sessionStorage.removeItem(SSO_RECORD_STORAGE_KEY);
    window.sessionStorage.removeItem(SSO_TOKEN_STORAGE_KEY);
    setRecord(null);
    setHasToken(false);
  };

  return (
    <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="primary">SSO</Badge>
            <Badge tone="secondary">Sessao</Badge>
            <Badge tone="accent">Perfil</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-synap-text">
            Sessao da comunidade
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
            Estado do fluxo SSO da comunidade. A sessao real fica em cookie
            HttpOnly emitido pelo backend; esta tela exibe apenas metadados
            seguros da ultima troca.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
          <KeyRound className="h-6 w-6" />
        </div>
      </div>

      <section className="mt-6 rounded-synap border border-synap-border bg-synap-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-synap-text">
              Sessao segura
            </h2>
            <p className="mt-1 text-sm leading-6 text-synap-muted">
              O token one-time e removido do navegador apos a troca por cookie.
            </p>
          </div>
          <Badge
            tone={
              record?.status === 'authenticated'
                ? 'primary'
                : hasToken && !expired
                  ? 'accent'
                  : 'neutral'
            }
          >
            {record?.status === 'authenticated'
              ? 'Autenticado'
              : hasToken
                ? expired
                  ? 'Expirado'
                  : 'Token recebido'
                : 'Ausente'}
          </Badge>
        </div>

        {record ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <SessionDetail label="Preview" value={record.tokenPreview} />
            <SessionDetail label="Origem" value={record.source} />
            <SessionDetail label="Destino" value={record.returnTo} />
            {record.userName ? (
              <SessionDetail label="Usuario" value={record.userName} />
            ) : null}
            {record.userRole ? (
              <SessionDetail label="Perfil" value={record.userRole} />
            ) : null}
            <SessionDetail
              label="Recebido em"
              value={formatDate(record.receivedAt)}
            />
            <SessionDetail
              label="Expira em"
              value={formatDate(record.expiresAt)}
            />
            <SessionDetail label="Status" value={record.status} />
          </dl>
        ) : (
          <p className="mt-4 rounded-synap border border-dashed border-synap-border bg-white p-4 text-sm font-semibold text-synap-muted">
            Nenhum token SSO foi recebido nesta aba.
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button
            href="/sso/callback?token=demo-synap-token&source=web&returnTo=/"
            variant="secondary"
          >
            Simular callback
          </Button>
          <button
            className="focus-ring inline-flex h-10 items-center justify-center rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40"
            onClick={clearSession}
            type="button"
          >
            Limpar sessao local
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-synap border border-synap-border bg-white p-4">
          <div className="flex items-center gap-2 text-synap-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-synap-text">
              Fluxo contratado
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {communitySessionContracts.map((contract) => (
              <article
                className="rounded-synap border border-synap-border bg-synap-background p-3"
                key={contract.step}
              >
                <Badge tone="neutral">{contract.responsibility}</Badge>
                <p className="mt-2 text-sm font-extrabold text-synap-text">
                  {contract.step}
                </p>
                <p className="mt-1 text-sm leading-6 text-synap-muted">
                  {contract.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-synap border border-synap-border bg-white p-4">
          <div className="flex items-center gap-2 text-synap-primary">
            <UserRound className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-synap-text">
              Sincronizacao de perfil
            </h2>
          </div>
          <div className="mt-4 divide-y divide-synap-border">
            {communitySessionSyncFields.map((field) => (
              <article className="py-3 first:pt-0 last:pb-0" key={field.field}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-synap-text">
                      {field.field}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-synap-muted">
                      {field.source} {'->'} {field.destination}
                    </p>
                  </div>
                  <Badge tone={field.required ? 'accent' : 'neutral'}>
                    {field.required ? 'Obrigatorio' : 'Opcional'}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SessionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-synap border border-synap-border bg-white p-3">
      <dt className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-synap-text">
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}
