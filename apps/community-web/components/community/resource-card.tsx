import Link from "next/link";
import { BookOpen, ExternalLink, FileText, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagLink } from "@/components/community/tag-link";
import { BookmarkButton } from "@/features/bookmarks/bookmark-button";
import { ThanksButton } from "@/features/reactions/thanks-button";
import type { CommunityResource } from "@/lib/community-api";

export function ResourceCard({ resource }: { resource: CommunityResource }) {
  const authorHref = `/perfil/${resource.sharedBy.username || resource.sharedBy.id}`;
  const detailHref =
    resource.kind === "article"
      ? `/artigos/${resource.slug}`
      : `/referencias/${resource.slug}`;
  const Icon = resource.kind === "article" ? FileText : BookOpen;

  return (
    <article className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle transition hover:border-synap-primary/30 hover:shadow-synap">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={resource.kind === "article" ? "secondary" : "primary"}>
          {resource.kind === "article" ? "Artigo" : "Referencia"}
        </Badge>
        {resource.category ? <Badge>{resource.category.name}</Badge> : null}
        {resource.publishedYear ? (
          <Badge>{resource.publishedYear}</Badge>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <Link href={detailHref}>
            <h2 className="text-lg font-extrabold leading-7 text-synap-text hover:text-synap-primary">
              {resource.title}
            </h2>
          </Link>
          <p className="mt-2 text-sm leading-6 text-synap-muted">
            {resource.summary}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-synap border border-synap-border bg-synap-background p-4">
        <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
          Uso clinico
        </p>
        <p className="mt-1 text-sm leading-6 text-synap-text">
          {resource.clinicalUse}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <TagLink key={tag.id} tag={tag} />
        ))}
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-4">
        <Link
          className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-synap-text hover:text-synap-primary"
          href={authorHref}
        >
          <UserRound className="h-4 w-4 shrink-0 text-synap-primary" />
          <span className="truncate">{resource.sharedBy.displayName}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <BookmarkButton
            compact
            href={detailHref}
            id={resource.id}
            summary={resource.summary}
            title={resource.title}
            type={resource.kind}
          />
          <ThanksButton
            compact
            id={resource.id}
            initialCount={resource.thanksCount || 0}
            type="resource"
          />
          {resource.sourceUrl ? (
            <a
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
              href={resource.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              Fonte
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link
              className="text-xs font-bold text-synap-muted hover:text-synap-primary"
              href={detailHref}
            >
              Ver detalhe
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
