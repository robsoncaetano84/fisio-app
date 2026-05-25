"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BOOKMARKS_UPDATED_EVENT,
  bookmarkTypeLabel,
  type LocalBookmark,
  readLocalBookmarks,
  removeLocalBookmark,
} from "@/features/bookmarks/local-bookmarks";
import {
  getCommunityBookmarks,
  removeCommunityBookmark,
} from "@/lib/community-write-api";

export function SavedItemsPanel() {
  const [items, setItems] = useState<LocalBookmark[]>([]);

  useEffect(() => {
    let mounted = true;
    const syncItems = async () => {
      try {
        const remoteItems = await getCommunityBookmarks();
        if (!mounted) return;
        setItems(
          remoteItems.map((item) => ({
            id: item.targetId,
            type: item.type,
            title: item.title,
            href: item.href,
            summary: item.summary,
            savedAt: item.savedAt,
          })),
        );
      } catch {
        if (mounted) setItems(readLocalBookmarks());
      }
    };
    syncItems();

    window.addEventListener(BOOKMARKS_UPDATED_EVENT, syncItems);
    window.addEventListener("storage", syncItems);

    return () => {
      mounted = false;
      window.removeEventListener(BOOKMARKS_UPDATED_EVENT, syncItems);
      window.removeEventListener("storage", syncItems);
    };
  }, []);

  const counts = useMemo(
    () => ({
      post: items.filter((item) => item.type === "post").length,
      article: items.filter((item) => item.type === "article").length,
      reference: items.filter((item) => item.type === "reference").length,
    }),
    [items],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Counter label="Discussoes" value={counts.post} />
        <Counter label="Artigos" value={counts.article} />
        <Counter label="Referencias" value={counts.reference} />
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle"
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone={item.type === "post" ? "primary" : "secondary"}>
                    {bookmarkTypeLabel[item.type]}
                  </Badge>
                  <h2 className="mt-3 text-base font-extrabold leading-7 text-synap-text">
                    {item.title}
                  </h2>
                  {item.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-synap-muted">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
                    href={item.href}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </Link>
                  <button
                    aria-label={`Remover ${item.title} dos salvos`}
                    className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-synap border border-synap-border bg-white text-synap-muted transition hover:border-synap-accent/40 hover:text-synap-accent"
                    onClick={async () => {
                      removeLocalBookmark(item.id);
                      setItems(readLocalBookmarks());
                      try {
                        await removeCommunityBookmark({
                          id: item.id,
                          type: item.type,
                        });
                      } catch {
                        // Local fallback keeps saved items usable offline.
                      }
                    }}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-synap border border-dashed border-synap-border bg-white p-6">
          <div className="flex items-center gap-2 text-synap-primary">
            <Bookmark className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-synap-text">
              Nenhum item salvo
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-synap-muted">
            Salve discussoes, artigos e referencias para revisar depois. Com a
            sessao ativa, esses itens sao sincronizados na conta profissional.
          </p>
        </div>
      )}
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-4">
      <p className="text-2xl font-extrabold text-synap-text">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-normal text-synap-muted">
        {label}
      </p>
    </div>
  );
}
