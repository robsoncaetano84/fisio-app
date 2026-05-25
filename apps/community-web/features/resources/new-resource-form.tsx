'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Link2,
  Tags,
} from 'lucide-react';
import { EthicsGuidelinesCard } from '@/components/community/ethics-guidelines-card';
import { Button } from '@/components/ui/button';
import type { CommunityResourceKind } from '@/lib/community-api';
import { createCommunityResource, splitTags } from '@/lib/community-write-api';

type FormState = {
  kind: CommunityResourceKind;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  doi: string;
  publishedYear: string;
  authors: string;
  clinicalUse: string;
  tags: string;
  ethicsAccepted: boolean;
};

const initialState: FormState = {
  kind: 'article',
  title: '',
  summary: '',
  sourceName: '',
  sourceUrl: '',
  doi: '',
  publishedYear: '',
  authors: '',
  clinicalUse: '',
  tags: '',
  ethicsAccepted: false,
};

export function NewResourceForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);
  const [submittedSource, setSubmittedSource] = useState<
    'api' | 'local' | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => {
    const next: string[] = [];
    if (state.title.trim().length < 8) {
      next.push('Informe um titulo com pelo menos 8 caracteres.');
    }
    if (state.summary.trim().length < 30) {
      next.push('Descreva o recurso em pelo menos 30 caracteres.');
    }
    if (state.sourceName.trim().length < 3) {
      next.push('Informe a fonte, revista, guideline ou origem do material.');
    }
    if (state.clinicalUse.trim().length < 30) {
      next.push('Explique a aplicabilidade clinica do recurso.');
    }
    if (state.sourceUrl && !isValidUrl(state.sourceUrl)) {
      next.push('Informe uma URL valida ou deixe o campo em branco.');
    }
    if (state.publishedYear && !isValidYear(state.publishedYear)) {
      next.push('Informe um ano valido com 4 digitos.');
    }
    if (!state.ethicsAccepted) {
      next.push(
        'Confirme que o recurso nao expoe dados sensiveis de pacientes.',
      );
    }
    return next;
  }, [state]);

  const update = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      'synap-community:resource-draft',
      JSON.stringify(state),
    );
    setSubmittedSlug(null);
    setSubmittedSource(null);
  };

  const publishResource = async () => {
    if (errors.length > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createCommunityResource({
        kind: state.kind,
        title: state.title.trim(),
        summary: state.summary.trim(),
        sourceName: state.sourceName.trim(),
        sourceUrl: state.sourceUrl.trim() || undefined,
        doi: state.doi.trim() || undefined,
        publishedYear: state.publishedYear
          ? Number(state.publishedYear)
          : undefined,
        authors: splitTags(state.authors),
        clinicalUse: state.clinicalUse.trim(),
        tags: splitTags(state.tags),
      });
      window.localStorage.removeItem('synap-community:resource-draft');
      setSubmittedSlug(result.slug);
      setSubmittedSource('api');
      return;
    } catch (error) {
      persistLocalResource();
      setSubmitError(
        error instanceof Error
          ? `${error.message}. O recurso foi preservado localmente.`
          : 'API indisponivel. O recurso foi preservado localmente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistLocalResource = () => {
    if (typeof window === 'undefined') return;
    const slug = slugify(state.title) || 'novo-recurso';
    const payload = {
      ...state,
      slug,
      sharedAt: new Date().toISOString(),
      status: 'LOCAL_PREVIEW',
    };
    const current = JSON.parse(
      window.localStorage.getItem('synap-community:local-resources') || '[]',
    ) as unknown[];
    window.localStorage.setItem(
      'synap-community:local-resources',
      JSON.stringify([payload, ...current].slice(0, 20)),
    );
    window.localStorage.removeItem('synap-community:resource-draft');
    setSubmittedSlug(slug);
    setSubmittedSource('local');
  };

  return (
    <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
      <h1 className="text-2xl font-extrabold text-synap-text">
        Compartilhar recurso
      </h1>
      <p className="mt-2 text-sm leading-6 text-synap-muted">
        Cadastre artigos, guidelines, livros ou referencias para apoiar
        discussoes tecnicas. O envio usa a API real quando a sessao SSO esta
        ativa e preserva fallback local em caso de indisponibilidade.
      </p>

      <div className="mt-5">
        <EthicsGuidelinesCard compact />
      </div>

      {submittedSlug ? (
        <div className="mt-5 rounded-synap border border-synap-primary/25 bg-synap-primary/10 p-4 text-sm font-semibold text-synap-primary">
          {submittedSource === 'api'
            ? `Recurso publicado: ${submittedSlug}`
            : `Recurso preservado localmente: ${submittedSlug}`}
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-5 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-4 text-sm font-semibold text-synap-text">
          {submitError}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="mt-5 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-synap-text">
            <AlertTriangle className="h-4 w-4 text-synap-accent" />
            Pendencias antes de compartilhar
          </div>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-synap-muted">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <span className="mb-2 block text-sm font-bold text-synap-text">
            Tipo de recurso
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResourceKindButton
              active={state.kind === 'article'}
              icon={<FileText className="h-4 w-4" />}
              label="Artigo"
              onClick={() => update('kind', 'article')}
            />
            <ResourceKindButton
              active={state.kind === 'reference'}
              icon={<BookOpen className="h-4 w-4" />}
              label="Referencia"
              onClick={() => update('kind', 'reference')}
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
            <FileText className="h-4 w-4 text-synap-primary" />
            Titulo
          </span>
          <input
            className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
            maxLength={180}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Ex.: Guideline para dor lombar inespecifica"
            value={state.title}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-synap-text">
            Resumo tecnico
          </span>
          <textarea
            className="min-h-28 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
            onChange={(event) => update('summary', event.target.value)}
            placeholder="Resuma o recurso e o ponto principal para a pratica profissional."
            value={state.summary}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-synap-text">
              Fonte
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              onChange={(event) => update('sourceName', event.target.value)}
              placeholder="Revista, guideline, livro ou instituicao"
              value={state.sourceName}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
              <Link2 className="h-4 w-4 text-synap-primary" />
              URL da fonte
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="https://..."
              value={state.sourceUrl}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-synap-text">
              DOI
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              onChange={(event) => update('doi', event.target.value)}
              placeholder="10.xxxx/xxxxx"
              value={state.doi}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-synap-text">
              Ano
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => update('publishedYear', event.target.value)}
              placeholder="2026"
              value={state.publishedYear}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
              <Tags className="h-4 w-4 text-synap-primary" />
              Tags
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              onChange={(event) => update('tags', event.target.value)}
              placeholder="evidencias, coluna"
              value={state.tags}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-synap-text">
            Autores
          </span>
          <input
            className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
            onChange={(event) => update('authors', event.target.value)}
            placeholder="Separe autores por virgula"
            value={state.authors}
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
            <CheckCircle2 className="h-4 w-4 text-synap-primary" />
            Aplicabilidade clinica
          </span>
          <textarea
            className="min-h-32 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
            onChange={(event) => update('clinicalUse', event.target.value)}
            placeholder="Explique como o recurso pode apoiar condutas, discussoes, laudos ou raciocinio clinico."
            value={state.clinicalUse}
          />
        </label>

        <label className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-4">
          <input
            checked={state.ethicsAccepted}
            className="mt-1 rounded border-synap-border text-synap-primary focus:ring-synap-primary"
            onChange={(event) => update('ethicsAccepted', event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-semibold leading-6 text-synap-muted">
            Confirmo que o material compartilhado e apropriado para uso
            profissional, nao contem dados identificaveis de pacientes e sera
            revisado por moderacao conforme as regras da comunidade.
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-synap-border pt-5">
          <Button
            href={state.kind === 'article' ? '/artigos' : '/referencias'}
            variant="secondary"
          >
            Cancelar
          </Button>
          <button
            className="focus-ring inline-flex h-10 items-center justify-center rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40"
            onClick={saveDraft}
            type="button"
          >
            Salvar rascunho
          </button>
          <button
            className="focus-ring inline-flex h-10 items-center justify-center rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition enabled:hover:bg-synap-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={errors.length > 0 || isSubmitting}
            onClick={publishResource}
            type="button"
          >
            {isSubmitting ? 'Enviando...' : 'Publicar recurso'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ResourceKindButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`focus-ring flex h-12 items-center justify-center gap-2 rounded-synap border px-4 text-sm font-extrabold transition ${
        active
          ? 'border-synap-primary bg-synap-primary/10 text-synap-primary'
          : 'border-synap-border bg-white text-synap-muted hover:border-synap-primary/40 hover:text-synap-primary'
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidYear(value: string) {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= 2100;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}
