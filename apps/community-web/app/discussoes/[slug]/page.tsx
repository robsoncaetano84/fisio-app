import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityShell } from "@/components/community/community-shell";
import { MarkdownPreview } from "@/components/community/markdown-preview";
import { TagLink } from "@/components/community/tag-link";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/features/bookmarks/bookmark-button";
import { ReportContentButton } from "@/features/moderation/report-content-button";
import { ThanksButton } from "@/features/reactions/thanks-button";
import { DiscussionRepliesPanel } from "@/features/replies/discussion-replies-panel";
import { getCommunityPost } from "@/lib/community-api";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCommunityPost(slug);
  if (!post) return {};

  const url = `/discussoes/${post.slug}`;
  const description =
    post.excerpt ||
    `Discussao tecnica em ${post.category.name} na comunidade SYNAP.`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url,
    },
    authors: [
      {
        name: post.authorProfile.displayName,
        url: `/perfil/${post.authorProfile.username || post.authorProfile.id}`,
      },
    ],
    keywords: [
      post.category.name,
      ...post.tags.map((tag) => tag.name),
      "SYNAP",
      "comunidade profissional",
      "saude",
    ],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      publishedTime: post.publishedAt || post.lastActivityAt,
      modifiedTime: post.lastActivityAt,
      authors: [post.authorProfile.displayName],
      tags: post.tags.map((tag) => tag.name),
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
  };
}

export default async function DiscussionPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getCommunityPost(slug);
  if (!post) notFound();
  const authorHref = `/perfil/${post.authorProfile.username || post.authorProfile.id}`;
  const discussionUrl = `${getCommunityUrl()}/discussoes/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    articleBody: post.contentMarkdown || post.excerpt || post.title,
    url: discussionUrl,
    datePublished: post.publishedAt || post.lastActivityAt,
    dateModified: post.lastActivityAt,
    author: {
      "@type": "Person",
      name: post.authorProfile.displayName,
      jobTitle: post.authorProfile.profession || undefined,
      knowsAbout: post.authorProfile.specialty || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "SYNAP",
      url: getCommunityUrl(),
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: post.viewsCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.repliesCount,
      },
    ],
    about: post.category.name,
    keywords: post.tags.map((tag) => tag.name).join(", "),
    comment: post.replies.map((reply) => ({
      "@type": "Comment",
      text: reply.contentMarkdown,
      dateCreated: reply.createdAt,
      upvoteCount: reply.score,
      author: {
        "@type": "Person",
        name: reply.authorProfile.displayName,
        jobTitle: reply.authorProfile.profession || undefined,
      },
    })),
  };

  return (
    <CommunityShell>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <script
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <article className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">{post.category.name}</Badge>
            {post.tags.map((tag) => (
              <TagLink key={tag.id} tag={tag} />
            ))}
          </div>
          <h1 className="mt-5 text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-synap-muted">
            <Link
              className="font-bold text-synap-text hover:text-synap-primary"
              href={authorHref}
            >
              {post.authorProfile.displayName}
            </Link>
            <span>{post.authorProfile.specialty || "Profissional SYNAP"}</span>
            <span>{post.viewsCount} visualizacoes</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <BookmarkButton
              href={`/discussoes/${post.slug}`}
              id={post.id}
              summary={post.excerpt}
              title={post.title}
              type="post"
            />
            <ThanksButton
              id={post.id}
              initialCount={post.thanksCount || 0}
              type="post"
            />
            <ReportContentButton
              targetHref={`/discussoes/${post.slug}`}
              targetId={post.id}
              targetTitle={post.title}
              targetType="post"
            />
          </div>
          <MarkdownPreview
            className="mt-6 text-base leading-8"
            value={post.contentMarkdown || ""}
            variant="plain"
          />
        </article>

        <DiscussionRepliesPanel
          initialReplies={post.replies}
          postSlug={post.slug}
          postTitle={post.title}
        />
      </main>
    </CommunityShell>
  );
}

function getCommunityUrl(): string {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || "https://community.synap.app"
  ).replace(/\/$/, "");
}

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
