import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagLink } from "@/components/community/tag-link";
import { BookmarkButton } from "@/features/bookmarks/bookmark-button";
import { ReportContentButton } from "@/features/moderation/report-content-button";
import { ThanksButton } from "@/features/reactions/thanks-button";
import type { CommunityResource } from "@/lib/community-api";

type ResourceDetailProps = {
  resource: CommunityResource;
};

export function ResourceDetail({ resource }: ResourceDetailProps) {
  const authorHref = `/perfil/${resource.sharedBy.username || resource.sharedBy.id}`;
  const listHref = resource.kind === "article" ? "/artigos" : "/referencias";
  const detailHref =
    resource.kind === "article"
      ? `/artigos/${resource.slug}`
      : `/referencias/${resource.slug}`;
  const listLabel = resource.kind === "article" ? "Artigos" : "Referencias";
  const typeLabel = resource.kind === "article" ? "Artigo" : "Referencia";
  const Icon = resource.kind === "article" ? FileText : BookOpen;
  const jsonLd = buildResourceJsonLd(resource);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        type="application/ld+json"
      />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <article className="min-w-0 rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={resource.kind === "article" ? "secondary" : "primary"}>
              {typeLabel}
            </Badge>
            {resource.category ? <Badge>{resource.category.name}</Badge> : null}
            {resource.publishedYear ? (
              <Badge>{resource.publishedYear}</Badge>
            ) : null}
          </div>

          <div className="mt-5 flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                {resource.title}
              </h1>
              <p className="mt-3 text-base leading-8 text-synap-muted">
                {resource.summary}
              </p>
            </div>
          </div>

          <section className="mt-6 rounded-synap border border-synap-border bg-synap-background p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-synap-primary" />
              <h2 className="text-base font-extrabold text-synap-text">
                Aplicabilidade clinica
              </h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-synap-text">
              {resource.clinicalUse}
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-extrabold text-synap-text">
              Referencia
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <DetailItem label="Fonte" value={resource.sourceName} />
              <DetailItem
                label="Ano"
                value={resource.publishedYear?.toString() || "Nao informado"}
              />
              <DetailItem label="DOI" value={resource.doi || "Nao informado"} />
              <DetailItem label="Autores" value={resource.authors.join(", ")} />
            </dl>
          </section>

          <section className="mt-6">
            <h2 className="text-base font-extrabold text-synap-text">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <TagLink key={tag.id} tag={tag} />
              ))}
            </div>
          </section>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-5">
            <Button href={listHref} variant="secondary">
              Voltar para {listLabel}
            </Button>
            {resource.sourceUrl ? (
              <a
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-synap-primaryDark"
                href={resource.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir fonte
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </footer>
        </article>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Compartilhado por
            </h2>
            <Link
              className="mt-4 flex items-center gap-3 rounded-synap border border-synap-border bg-synap-background p-3 transition hover:border-synap-primary/40"
              href={authorHref}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary text-sm font-extrabold text-white">
                {getInitials(resource.sharedBy.displayName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-synap-text">
                  {resource.sharedBy.displayName}
                </span>
                <span className="block truncate text-xs font-semibold text-synap-muted">
                  {resource.sharedBy.specialty ||
                    resource.sharedBy.profession ||
                    "Profissional SYNAP"}
                </span>
              </span>
            </Link>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Calendar className="h-4 w-4" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Atualizacao
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Este recurso foi preparado para discussao profissional e pode ser
              revisado quando houver novas evidencias ou diretrizes.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Link2 className="h-4 w-4" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Proxima acao
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Use o recurso como apoio ao raciocinio, sempre preservando a
              avaliacao profissional e dados sensiveis de pacientes.
            </p>
            <Button className="mt-4 w-full" href="/nova-discussao">
              Criar discussao
            </Button>
            <div className="mt-3">
              <BookmarkButton
                href={detailHref}
                id={resource.id}
                summary={resource.summary}
                title={resource.title}
                type={resource.kind}
              />
            </div>
            <div className="mt-3">
              <ThanksButton
                id={resource.id}
                initialCount={resource.thanksCount || 0}
                type="resource"
              />
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Revisao da comunidade
            </h2>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Sinalize recursos com problemas eticos, fonte inadequada ou risco
              de interpretacao clinica insegura.
            </p>
            <div className="mt-4">
              <ReportContentButton
                targetHref={detailHref}
                targetId={resource.id}
                targetTitle={resource.title}
                targetType="resource"
              />
            </div>
          </section>
        </aside>
      </main>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-4">
      <dt className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-synap-text">
        {value}
      </dd>
    </div>
  );
}

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function buildResourceJsonLd(resource: CommunityResource) {
  return {
    "@context": "https://schema.org",
    "@type": resource.kind === "article" ? "ScholarlyArticle" : "CreativeWork",
    name: resource.title,
    headline: resource.title,
    description: resource.summary,
    author: resource.authors.map((author) => ({
      "@type": "Person",
      name: author,
    })),
    datePublished: resource.publishedYear
      ? `${resource.publishedYear}-01-01`
      : undefined,
    dateModified: resource.sharedAt,
    keywords: resource.tags.map((tag) => tag.name).join(", "),
    publisher: {
      "@type": "Organization",
      name: "SYNAP",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "SYNAP Comunidade",
    },
    url: resource.sourceUrl || undefined,
  };
}

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
