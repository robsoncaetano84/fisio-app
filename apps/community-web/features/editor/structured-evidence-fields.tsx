"use client";

import { useState } from "react";
import { BookOpenCheck, FileUp, Link2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  communityAttachmentKindLabel,
  createAttachmentDraft,
  createReferenceDraft,
  isValidHttpUrl,
  type CommunityAttachmentDraft,
  type CommunityAttachmentKind,
  type CommunityReferenceDraft,
} from "@/lib/community-content";
import { uploadCommunityAttachment } from "@/lib/community-write-api";

type StructuredEvidenceFieldsProps = {
  attachments: CommunityAttachmentDraft[];
  references: CommunityReferenceDraft[];
  onAttachmentsChange: (attachments: CommunityAttachmentDraft[]) => void;
  onReferencesChange: (references: CommunityReferenceDraft[]) => void;
};

const attachmentKinds: CommunityAttachmentKind[] = [
  "pdf",
  "image",
  "video",
  "external-link",
];

export function StructuredEvidenceFields({
  attachments,
  references,
  onAttachmentsChange,
  onReferencesChange,
}: StructuredEvidenceFieldsProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addReference = () => {
    onReferencesChange([...references, createReferenceDraft()]);
  };

  const updateReference = <Key extends keyof CommunityReferenceDraft>(
    id: string,
    key: Key,
    value: CommunityReferenceDraft[Key],
  ) => {
    onReferencesChange(
      references.map((reference) =>
        reference.id === id ? { ...reference, [key]: value } : reference,
      ),
    );
  };

  const removeReference = (id: string) => {
    onReferencesChange(references.filter((reference) => reference.id !== id));
  };

  const addAttachment = () => {
    onAttachmentsChange([...attachments, createAttachmentDraft()]);
  };

  const updateAttachment = <Key extends keyof CommunityAttachmentDraft>(
    id: string,
    key: Key,
    value: CommunityAttachmentDraft[Key],
  ) => {
    onAttachmentsChange(
      attachments.map((attachment) =>
        attachment.id === id ? { ...attachment, [key]: value } : attachment,
      ),
    );
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(
      attachments.filter((attachment) => attachment.id !== id),
    );
  };

  const uploadAttachmentFile = async (id: string, file: File | null) => {
    if (!file || uploadingId) return;
    setUploadingId(id);
    setUploadError(null);

    try {
      const result = await uploadCommunityAttachment({
        file,
        purpose: "community-discussion-attachment",
      });
      onAttachmentsChange(
        attachments.map((attachment) =>
          attachment.id === id
            ? {
                ...attachment,
                kind: inferAttachmentKind(file.type),
                title: attachment.title || file.name,
                sourceUrl: result.publicUrl,
                storageKey: result.storageKey,
                contentType: result.contentType,
                sizeBytes: result.sizeBytes,
                uploadedAt: result.uploadedAt,
              }
            : attachment,
        ),
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar o arquivo.",
      );
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <section className="rounded-synap border border-synap-border bg-synap-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-synap-primary">
            <BookOpenCheck className="h-4 w-4" />
            <h2 className="text-sm font-extrabold text-synap-text">
              Evidencias e anexos
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-synap-muted">
            Registre DOI, links e metadados de anexos. Arquivos usam upload S3
            por URL assinada quando o storage da comunidade esta configurado.
          </p>
        </div>
        <Badge tone="secondary">S3 presign</Badge>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-synap-text">
              Referencias estruturadas
            </h3>
            <button
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
              onClick={addReference}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar referencia
            </button>
          </div>

          {references.length > 0 ? (
            <div className="space-y-3">
              {references.map((reference) => (
                <article
                  className="rounded-synap border border-synap-border bg-white p-3"
                  key={reference.id}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Titulo">
                      <input
                        className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                        onChange={(event) =>
                          updateReference(
                            reference.id,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="Titulo do artigo, guideline ou livro"
                        value={reference.title}
                      />
                    </Field>
                    <Field label="Fonte">
                      <input
                        className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                        onChange={(event) =>
                          updateReference(
                            reference.id,
                            "sourceName",
                            event.target.value,
                          )
                        }
                        placeholder="Revista, instituicao ou editora"
                        value={reference.sourceName}
                      />
                    </Field>
                    <Field label="DOI">
                      <input
                        className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                        onChange={(event) =>
                          updateReference(
                            reference.id,
                            "doi",
                            event.target.value,
                          )
                        }
                        placeholder="10.xxxx/xxxxx"
                        value={reference.doi}
                      />
                    </Field>
                    <Field label="URL">
                      <div>
                        <input
                          className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                          onChange={(event) =>
                            updateReference(
                              reference.id,
                              "sourceUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          value={reference.sourceUrl}
                        />
                        {!isValidHttpUrl(reference.sourceUrl) ? (
                          <p className="mt-1 text-xs font-semibold text-synap-accent">
                            URL invalida.
                          </p>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                  <Field className="mt-3" label="Nota clinica">
                    <textarea
                      className="min-h-20 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
                      onChange={(event) =>
                        updateReference(
                          reference.id,
                          "note",
                          event.target.value,
                        )
                      }
                      placeholder="Como essa referencia apoia a discussao?"
                      value={reference.note}
                    />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <RemoveButton
                      onClick={() => removeReference(reference.id)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhuma referencia estruturada adicionada." />
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-synap-text">
              Anexos e links de apoio
            </h3>
            <button
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
              onClick={addAttachment}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar anexo
            </button>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <article
                  className="rounded-synap border border-synap-border bg-white p-3"
                  key={attachment.id}
                >
                  <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                    <Field label="Tipo">
                      <select
                        className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                        onChange={(event) =>
                          updateAttachment(
                            attachment.id,
                            "kind",
                            event.target.value as CommunityAttachmentKind,
                          )
                        }
                        value={attachment.kind}
                      >
                        {attachmentKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {communityAttachmentKindLabel[kind]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Titulo">
                      <input
                        className="h-10 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                        onChange={(event) =>
                          updateAttachment(
                            attachment.id,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="Nome do arquivo, exame ou link"
                        value={attachment.title}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 rounded-synap border border-dashed border-synap-border bg-synap-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
                          Upload seguro
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-synap-muted">
                          PDF, imagem ou video ate 20 MB. Remova dados
                          identificaveis antes do envio.
                        </p>
                      </div>
                      <label className="focus-ring inline-flex h-9 cursor-pointer items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary">
                        <FileUp className="h-3.5 w-3.5" />
                        {uploadingId === attachment.id
                          ? "Enviando..."
                          : "Enviar arquivo"}
                        <input
                          accept="application/pdf,image/*,video/*"
                          className="sr-only"
                          disabled={Boolean(uploadingId)}
                          onChange={(event) => {
                            void uploadAttachmentFile(
                              attachment.id,
                              event.target.files?.[0] || null,
                            );
                            event.target.value = "";
                          }}
                          type="file"
                        />
                      </label>
                    </div>
                    {attachment.storageKey ? (
                      <p className="mt-2 text-xs font-semibold text-synap-primary">
                        Arquivo enviado: {attachment.storageKey}
                      </p>
                    ) : null}
                  </div>
                  <Field className="mt-3" label="URL ou fonte">
                    <div>
                      <div className="relative">
                        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
                        <input
                          className="h-10 w-full rounded-synap border-synap-border pl-10 text-sm focus:border-synap-primary focus:ring-synap-primary"
                          onChange={(event) =>
                            updateAttachment(
                              attachment.id,
                              "sourceUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://... ou deixe em branco ate o upload S3"
                          value={attachment.sourceUrl}
                        />
                      </div>
                      {!isValidHttpUrl(attachment.sourceUrl) ? (
                        <p className="mt-1 text-xs font-semibold text-synap-accent">
                          URL invalida.
                        </p>
                      ) : null}
                    </div>
                  </Field>
                  <Field className="mt-3" label="Nota de privacidade">
                    <textarea
                      className="min-h-20 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
                      onChange={(event) =>
                        updateAttachment(
                          attachment.id,
                          "note",
                          event.target.value,
                        )
                      }
                      placeholder="Confirme se o material esta anonimizado e qual e sua finalidade."
                      value={attachment.note}
                    />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <RemoveButton
                      onClick={() => removeAttachment(attachment.id)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhum anexo ou link de apoio adicionado." />
          )}
          {uploadError ? (
            <p className="mt-3 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-3 text-sm font-semibold text-synap-text">
              {uploadError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function inferAttachmentKind(contentType: string): CommunityAttachmentKind {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "external-link";
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-synap border border-dashed border-synap-border bg-white p-4 text-sm font-semibold text-synap-muted">
      {text}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-muted transition hover:border-synap-accent/40 hover:text-synap-accent"
      onClick={onClick}
      type="button"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remover
    </button>
  );
}
