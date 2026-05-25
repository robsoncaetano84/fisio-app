"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  BOOKMARKS_UPDATED_EVENT,
  type BookmarkType,
  readLocalBookmarks,
  removeLocalBookmark,
  upsertLocalBookmark,
} from "@/features/bookmarks/local-bookmarks";
import {
  createCommunityBookmark,
  removeCommunityBookmark,
} from "@/lib/community-write-api";

type BookmarkButtonProps = {
  id: string;
  type: BookmarkType;
  title: string;
  href: string;
  summary?: string | null;
  compact?: boolean;
};

export function BookmarkButton({
  id,
  type,
  title,
  href,
  summary = null,
  compact = false,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const syncSaved = () => {
      setSaved(readLocalBookmarks().some((bookmark) => bookmark.id === id));
    };

    syncSaved();
    window.addEventListener(BOOKMARKS_UPDATED_EVENT, syncSaved);
    window.addEventListener("storage", syncSaved);

    return () => {
      window.removeEventListener(BOOKMARKS_UPDATED_EVENT, syncSaved);
      window.removeEventListener("storage", syncSaved);
    };
  }, [id]);

  const toggleBookmark = async () => {
    if (pending) return;
    setPending(true);

    if (saved) {
      removeLocalBookmark(id);
      setSaved(false);
      try {
        await removeCommunityBookmark({ id, type });
      } catch {
        // Local fallback keeps the interface usable without an active session.
      } finally {
        setPending(false);
      }
      return;
    }

    upsertLocalBookmark({
      id,
      type,
      title,
      href,
      summary,
      savedAt: new Date().toISOString(),
    });
    setSaved(true);
    try {
      await createCommunityBookmark({ id, type });
    } catch {
      // Local fallback keeps the interface usable without an active session.
    } finally {
      setPending(false);
    }
  };

  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <button
      aria-pressed={saved}
      className={`focus-ring inline-flex h-9 items-center gap-2 rounded-synap border px-3 text-xs font-bold transition ${
        saved
          ? "border-synap-primary/30 bg-synap-primary/10 text-synap-primary"
          : "border-synap-border bg-white text-synap-muted hover:border-synap-primary/40 hover:text-synap-primary"
      }`}
      disabled={pending}
      onClick={toggleBookmark}
      type="button"
    >
      <Icon className="h-3.5 w-3.5" />
      {compact ? null : saved ? "Salvo" : "Salvar"}
    </button>
  );
}
