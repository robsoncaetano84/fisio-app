"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { EthicsGuidelinesCard } from "@/components/community/ethics-guidelines-card";
import { MarkdownPreview } from "@/components/community/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { ReportContentButton } from "@/features/moderation/report-content-button";
import { pushLocalNotification } from "@/features/notifications/local-notifications";
import { ThanksButton } from "@/features/reactions/thanks-button";
import {
  createLocalReply,
  type LocalDiscussionReply,
  readLocalReplies,
  REPLIES_UPDATED_EVENT,
} from "@/features/replies/local-replies";
import type { CommunityReply } from "@/lib/community-api";
import { createCommunityReplyBySlug } from "@/lib/community-write-api";

type DiscussionRepliesPanelProps = {
  postSlug: string;
  postTitle: string;
  initialReplies: CommunityReply[];
};

export function DiscussionRepliesPanel({
  postSlug,
  postTitle,
  initialReplies,
}: DiscussionRepliesPanelProps) {
  const [localReplies, setLocalReplies] = useState<LocalDiscussionReply[]>([]);
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [ethicsAccepted, setEthicsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSource, setSubmittedSource] = useState<
    "api" | "local" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncReplies = () => setLocalReplies(readLocalReplies(postSlug));
    syncReplies();

    window.addEventListener(REPLIES_UPDATED_EVENT, syncReplies);
    window.addEventListener("storage", syncReplies);

    return () => {
      window.removeEventListener(REPLIES_UPDATED_EVENT, syncReplies);
      window.removeEventListener("storage", syncReplies);
    };
  }, [postSlug]);

  const errors = useMemo(() => {
    const next: string[] = [];
    if (content.trim().length < 20) {
      next.push("Escreva uma resposta com pelo menos 20 caracteres.");
    }
    if (!ethicsAccepted) {
      next.push("Confirme que a resposta nao contem dados identificaveis.");
    }
    return next;
  }, [content, ethicsAccepted]);

  const replies = [...localReplies, ...initialReplies];

  const publishReply = async () => {
    if (errors.length > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createCommunityReplyBySlug(postSlug, {
        contentMarkdown: content.trim(),
        ethicsAccepted,
      });
      pushLocalNotification({
        id: `notification-api-reply-${Date.now()}`,
        type: "reply",
        title: "Resposta publicada",
        body: `Sua resposta em "${postTitle}" foi enviada para a comunidade.`,
        href: `/discussoes/${postSlug}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      setSubmittedSource("api");
    } catch (error) {
      createLocalReply(postSlug, content.trim());
      pushLocalNotification({
        id: `notification-local-reply-${Date.now()}`,
        type: "reply",
        title: "Resposta preservada localmente",
        body: `Sua resposta em "${postTitle}" foi salva no navegador e ficara pronta para envio quando a API estiver disponivel.`,
        href: `/discussoes/${postSlug}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      setSubmitError(
        error instanceof Error
          ? `${error.message}. A resposta foi preservada localmente.`
          : "API indisponivel. A resposta foi preservada localmente.",
      );
      setSubmittedSource("local");
    } finally {
      setContent("");
      setEthicsAccepted(false);
      setSubmitted(true);
      setMode("write");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-synap-primary" />
        <h2 className="text-lg font-extrabold text-synap-text">Respostas</h2>
        <Badge>{replies.length}</Badge>
      </div>

      <div className="space-y-3">
        {replies.map((reply) => (
          <ReplyCard
            key={reply.id}
            postSlug={postSlug}
            postTitle={postTitle}
            reply={reply}
          />
        ))}
      </div>

      <div className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
        <h2 className="text-base font-extrabold text-synap-text">
          Adicionar resposta
        </h2>
        <p className="mt-2 text-sm leading-6 text-synap-muted">
          Contribua com raciocinio clinico, referencia, limite de aplicacao ou
          criterio de reavaliacao. A resposta e enviada para a API quando a
          sessao SSO esta ativa.
        </p>

        <div className="mt-4">
          <EthicsGuidelinesCard compact />
        </div>

        {submitted ? (
          <div className="mt-4 rounded-synap border border-synap-primary/25 bg-synap-primary/10 p-3 text-sm font-semibold text-synap-primary">
            {submittedSource === "api"
              ? "Resposta publicada."
              : "Resposta preservada localmente."}
          </div>
        ) : null}

        {submitError ? (
          <div className="mt-4 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-3 text-sm font-semibold text-synap-text">
            {submitError}
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div className="mt-4 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-synap-text">
              <AlertTriangle className="h-4 w-4 text-synap-accent" />
              Pendencias
            </div>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-synap-muted">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-synap-text">Conteudo</span>
            <div className="flex rounded-synap border border-synap-border bg-synap-background p-1">
              <button
                className={`focus-ring inline-flex h-8 items-center gap-2 rounded-synap px-3 text-xs font-extrabold transition ${
                  mode === "write"
                    ? "bg-white text-synap-primary shadow-subtle"
                    : "text-synap-muted hover:text-synap-primary"
                }`}
                onClick={() => setMode("write")}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
                Escrever
              </button>
              <button
                className={`focus-ring inline-flex h-8 items-center gap-2 rounded-synap px-3 text-xs font-extrabold transition ${
                  mode === "preview"
                    ? "bg-white text-synap-primary shadow-subtle"
                    : "text-synap-muted hover:text-synap-primary"
                }`}
                onClick={() => setMode("preview")}
                type="button"
              >
                <Eye className="h-3.5 w-3.5" />
                Previa
              </button>
            </div>
          </div>

          {mode === "write" ? (
            <textarea
              className="min-h-36 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva uma contribuicao objetiva, etica e tecnicamente revisavel."
              value={content}
            />
          ) : (
            <MarkdownPreview className="min-h-36" value={content} />
          )}
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-4">
          <input
            checked={ethicsAccepted}
            className="mt-1 rounded border-synap-border text-synap-primary focus:ring-synap-primary"
            onChange={(event) => setEthicsAccepted(event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-semibold leading-6 text-synap-muted">
            Confirmo que a resposta nao contem dados identificaveis de pacientes
            e nao substitui avaliacao profissional individualizada.
          </span>
        </label>

        <div className="mt-4 flex justify-end border-t border-synap-border pt-4">
          <button
            className="focus-ring inline-flex h-10 items-center justify-center rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition enabled:hover:bg-synap-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={errors.length > 0 || isSubmitting}
            onClick={publishReply}
            type="button"
          >
            {isSubmitting ? "Enviando..." : "Enviar resposta"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ReplyCard({
  postSlug,
  postTitle,
  reply,
}: {
  postSlug: string;
  postTitle: string;
  reply: CommunityReply | LocalDiscussionReply;
}) {
  const isLocal = "status" in reply;

  return (
    <article className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            className="font-bold text-synap-text hover:text-synap-primary"
            href={`/perfil/${reply.authorProfile.username || reply.authorProfile.id}`}
          >
            {reply.authorProfile.displayName}
          </Link>
          <p className="text-xs font-semibold text-synap-muted">
            {reply.authorProfile.specialty || "Profissional SYNAP"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {reply.isUseful ? (
            <Badge tone="primary">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Resposta mais util
            </Badge>
          ) : null}
          {isLocal ? <Badge tone="secondary">Local</Badge> : null}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="flex flex-wrap gap-2">
          <ThanksButton
            id={reply.id}
            initialCount={"thanksCount" in reply ? reply.thanksCount || 0 : 0}
            type="reply"
          />
          <ReportContentButton
            targetHref={`/discussoes/${postSlug}`}
            targetId={reply.id}
            targetTitle={`Resposta em: ${postTitle}`}
            targetType="reply"
          />
        </div>
      </div>
      <MarkdownPreview
        className="mt-4"
        value={reply.contentMarkdown}
        variant="plain"
      />
    </article>
  );
}
