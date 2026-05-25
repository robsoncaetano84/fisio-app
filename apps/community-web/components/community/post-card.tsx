import Link from "next/link";
import { MessageSquare, Star, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagLink } from "@/components/community/tag-link";
import { BookmarkButton } from "@/features/bookmarks/bookmark-button";
import { ThanksButton } from "@/features/reactions/thanks-button";
import type { CommunityPost } from "@/lib/community-api";

export function PostCard({ post }: { post: CommunityPost }) {
  const authorHref = `/perfil/${post.authorProfile.username || post.authorProfile.id}`;

  return (
    <article className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle transition hover:border-synap-primary/30 hover:shadow-synap">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{post.category.name}</Badge>
        {post.tags.slice(0, 3).map((tag) => (
          <TagLink key={tag.id} tag={tag} />
        ))}
      </div>
      <Link href={`/discussoes/${post.slug}`}>
        <h2 className="mt-4 text-lg font-extrabold leading-7 text-synap-text hover:text-synap-primary">
          {post.title}
        </h2>
      </Link>
      {post.excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-synap-muted">
          {post.excerpt}
        </p>
      ) : null}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-4">
        <div className="min-w-0">
          <Link
            className="block truncate text-sm font-bold text-synap-text hover:text-synap-primary"
            href={authorHref}
          >
            {post.authorProfile.displayName}
          </Link>
          <p className="truncate text-xs font-semibold text-synap-muted">
            {post.authorProfile.specialty ||
              post.authorProfile.profession ||
              "Profissional SYNAP"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-synap-muted">
          <BookmarkButton
            compact
            href={`/discussoes/${post.slug}`}
            id={post.id}
            summary={post.excerpt}
            title={post.title}
            type="post"
          />
          <ThanksButton
            compact
            id={post.id}
            initialCount={post.thanksCount || 0}
            type="post"
          />
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {post.repliesCount}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {post.score}
          </span>
          <span className="flex items-center gap-1">
            <Tags className="h-4 w-4" />
            {post.tags.length}
          </span>
        </div>
      </footer>
    </article>
  );
}
