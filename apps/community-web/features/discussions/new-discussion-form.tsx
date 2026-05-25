'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpenCheck,
  Eye,
  FileText,
  Pencil,
  Tags,
} from 'lucide-react';
import { EthicsGuidelinesCard } from '@/components/community/ethics-guidelines-card';
import { MarkdownPreview } from '@/components/community/markdown-preview';
import { Button } from '@/components/ui/button';
import { StructuredEvidenceFields } from '@/features/editor/structured-evidence-fields';
import type { CommunityCategory } from '@/lib/community-api';
import {
  isValidHttpUrl,
  type CommunityAttachmentDraft,
  type CommunityReferenceDraft,
} from '@/lib/community-content';
import { createCommunityPost, splitTags } from '@/lib/community-write-api';

type FormState = {
  title: string;
  contentMarkdown: string;
  categoryId: string;
  tags: string;
  references: CommunityReferenceDraft[];
  attachmentsMetadata: CommunityAttachmentDraft[];
  ethicsAccepted: boolean;
};

const initialState = (categoryId: string): FormState => ({
  title: '',
  contentMarkdown: '',
  categoryId,
  tags: '',
  references: [],
  attachmentsMetadata: [],
  ethicsAccepted: false,
});

export function NewDiscussionForm({
  categories,
}: {
  categories: CommunityCategory[];
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() =>
    initialState(categories[0]?.id || ''),
  );
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);
  const [submittedSource, setSubmittedSource] = useState<
    'api' | 'local' | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentMode, setContentMode] = useState<'write' | 'preview'>('write');

  const errors = useMemo(() => {
    const next: string[] = [];
    if (state.title.trim().length < 8) {
      next.push('Informe um titulo com pelo menos 8 caracteres.');
    }
    if (state.contentMarkdown.trim().length < 20) {
      next.push('Descreva o contexto com pelo menos 20 caracteres.');
    }
    if (!state.categoryId) {
      next.push('Selecione uma categoria.');
    }
    if (!state.ethicsAccepted) {
      next.push('Confirme que nao ha dados identificaveis de pacientes.');
    }
    if (
      state.references.some((reference) => !isValidHttpUrl(reference.sourceUrl))
    ) {
      next.push('Corrija URLs invalidas nas referencias estruturadas.');
    }
    if (
      state.attachmentsMetadata.some(
        (attachment) => !isValidHttpUrl(attachment.sourceUrl),
      )
    ) {
      next.push('Corrija URLs invalidas nos anexos e links de apoio.');
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
    window.localStorage.setItem('synap-community:draft', JSON.stringify(state));
    setSubmittedSlug(null);
    setSubmittedSource(null);
  };

  const publishDiscussion = async () => {
    if (errors.length > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const references = sanitizeReferences(state.references);
    const attachmentsMetadata = sanitizeAttachments(state.attachmentsMetadata);

    try {
      const result = await createCommunityPost({
        title: state.title.trim(),
        contentMarkdown: state.contentMarkdown.trim(),
        categoryId: state.categoryId,
        tags: splitTags(state.tags),
        references,
        attachmentsMetadata,
      });
      window.localStorage.removeItem('synap-community:draft');
      setSubmittedSlug(result.slug);
      setSubmittedSource('api');
      return;
    } catch (error) {
      persistLocalPost(references, attachmentsMetadata);
      setSubmitError(
        error instanceof Error
          ? `${error.message}. A discussao foi preservada localmente.`
          : 'API indisponivel. A discussao foi preservada localmente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistLocalPost = (
    references: CommunityReferenceDraft[],
    attachmentsMetadata: CommunityAttachmentDraft[],
  ) => {
    if (typeof window === 'undefined') return;
    const slug =
      state.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || 'nova-discussao';
    const payload = {
      ...state,
      slug,
      references,
      attachmentsMetadata,
      createdAt: new Date().toISOString(),
      status: 'LOCAL_PREVIEW',
    };
    const current = JSON.parse(
      window.localStorage.getItem('synap-community:local-posts') || '[]',
    ) as unknown[];
    window.localStorage.setItem(
      'synap-community:local-posts',
      JSON.stringify([payload, ...current].slice(0, 20)),
    );
    window.localStorage.removeItem('synap-community:draft');
    setSubmittedSlug(slug);
    setSubmittedSource('local');
  };

  return (
    <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
      <h1 className="text-2xl font-extrabold text-synap-text">
        Nova discussao
      </h1>
      <p className="mt-2 text-sm leading-6 text-synap-muted">
        Publique uma discussao tecnica com referencias e anonimizacao. Se a
        sessao SSO ainda nao estiver ativa, o conteudo fica preservado
        localmente.
      </p>

      <div className="mt-5">
        <EthicsGuidelinesCard compact />
      </div>

      {submittedSlug ? (
        <div className="mt-5 rounded-synap border border-synap-primary/25 bg-synap-primary/10 p-4 text-sm font-semibold text-synap-primary">
          {submittedSource === 'api'
            ? `Discussao publicada: ${submittedSlug}`
            : `Discussao preservada localmente: ${submittedSlug}`}
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
            Pendencias antes de publicar
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
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
            <FileText className="h-4 w-4 text-synap-primary" />
            Titulo
          </span>
          <input
            className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
            maxLength={180}
            name="title"
            onChange={(event) => update('title', event.target.value)}
            placeholder="Ex.: Conduta para dor lombar com sinais neurais"
            value={state.title}
          />
        </label>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-synap-text">
              <BookOpenCheck className="h-4 w-4 text-synap-primary" />
              Conteudo
            </span>
            <div className="flex rounded-synap border border-synap-border bg-synap-background p-1">
              <button
                className={`focus-ring inline-flex h-8 items-center gap-2 rounded-synap px-3 text-xs font-extrabold transition ${
                  contentMode === 'write'
                    ? 'bg-white text-synap-primary shadow-subtle'
                    : 'text-synap-muted hover:text-synap-primary'
                }`}
                onClick={() => setContentMode('write')}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
                Escrever
              </button>
              <button
                className={`focus-ring inline-flex h-8 items-center gap-2 rounded-synap px-3 text-xs font-extrabold transition ${
                  contentMode === 'preview'
                    ? 'bg-white text-synap-primary shadow-subtle'
                    : 'text-synap-muted hover:text-synap-primary'
                }`}
                onClick={() => setContentMode('preview')}
                type="button"
              >
                <Eye className="h-3.5 w-3.5" />
                Previa
              </button>
            </div>
          </div>
          {contentMode === 'write' ? (
            <textarea
              className="min-h-56 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
              name="contentMarkdown"
              onChange={(event) =>
                update('contentMarkdown', event.target.value)
              }
              placeholder="Descreva contexto clinico anonimizado, achados, hipoteses, conduta e duvidas objetivas."
              value={state.contentMarkdown}
            />
          ) : (
            <MarkdownPreview
              className="min-h-56"
              value={state.contentMarkdown}
            />
          )}
          <p className="mt-2 text-xs font-semibold text-synap-muted">
            Markdown seguro: titulos com #, listas com -, numeracao e citacoes
            com &gt;.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-synap-text">
              Categoria
            </span>
            <select
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              name="categoryId"
              onChange={(event) => update('categoryId', event.target.value)}
              value={state.categoryId}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-synap-text">
              <Tags className="h-4 w-4 text-synap-primary" />
              Tags
            </span>
            <input
              className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
              name="tags"
              onChange={(event) => update('tags', event.target.value)}
              placeholder="coluna, dor-cronica, evidencias"
              value={state.tags}
            />
          </label>
        </div>

        <StructuredEvidenceFields
          attachments={state.attachmentsMetadata}
          onAttachmentsChange={(attachmentsMetadata) =>
            update('attachmentsMetadata', attachmentsMetadata)
          }
          onReferencesChange={(references) => update('references', references)}
          references={state.references}
        />

        <label className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-4">
          <input
            checked={state.ethicsAccepted}
            className="mt-1 rounded border-synap-border text-synap-primary focus:ring-synap-primary"
            onChange={(event) => update('ethicsAccepted', event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-semibold leading-6 text-synap-muted">
            Confirmo que o caso foi anonimizado e nao contem nome, documento,
            imagem identificavel, contato ou informacao que permita reconhecer o
            paciente.
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-synap-border pt-5">
          <Button href="/" variant="secondary">
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
            onClick={publishDiscussion}
            type="button"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar discussao'}
          </button>
          {submittedSlug ? (
            <button
              className="focus-ring inline-flex h-10 items-center justify-center rounded-synap bg-synap-secondary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-synap-secondaryDark"
              onClick={() => router.push('/')}
              type="button"
            >
              Voltar ao feed
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function sanitizeReferences(
  references: CommunityReferenceDraft[],
): CommunityReferenceDraft[] {
  return references.filter((reference) =>
    [
      reference.title,
      reference.sourceName,
      reference.sourceUrl,
      reference.doi,
      reference.note,
    ].some((value) => value.trim().length > 0),
  );
}

function sanitizeAttachments(
  attachments: CommunityAttachmentDraft[],
): CommunityAttachmentDraft[] {
  return attachments.filter((attachment) =>
    [attachment.title, attachment.sourceUrl, attachment.note].some(
      (value) => value.trim().length > 0,
    ),
  );
}
