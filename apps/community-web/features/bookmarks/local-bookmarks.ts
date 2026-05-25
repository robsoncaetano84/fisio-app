export type BookmarkType =
  | "post"
  | "article"
  | "reference"
  | "reply"
  | "profile";

export type LocalBookmark = {
  id: string;
  type: BookmarkType;
  title: string;
  href: string;
  summary: string | null;
  savedAt: string;
};

export const BOOKMARKS_STORAGE_KEY = "synap-community:bookmarks";
export const BOOKMARKS_UPDATED_EVENT = "synap-community:bookmarks-updated";

export const bookmarkTypeLabel: Record<BookmarkType, string> = {
  post: "Discussao",
  article: "Artigo",
  reference: "Referencia",
  reply: "Resposta",
  profile: "Perfil",
};

export function readLocalBookmarks(): LocalBookmark[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(BOOKMARKS_STORAGE_KEY) || "[]",
    ) as LocalBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalBookmarks(bookmarks: LocalBookmark[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    BOOKMARKS_STORAGE_KEY,
    JSON.stringify(bookmarks.slice(0, 100)),
  );
  window.dispatchEvent(new Event(BOOKMARKS_UPDATED_EVENT));
}

export function upsertLocalBookmark(bookmark: LocalBookmark) {
  const current = readLocalBookmarks();
  const withoutDuplicate = current.filter((item) => item.id !== bookmark.id);
  writeLocalBookmarks([bookmark, ...withoutDuplicate]);
}

export function removeLocalBookmark(bookmarkId: string) {
  writeLocalBookmarks(
    readLocalBookmarks().filter((bookmark) => bookmark.id !== bookmarkId),
  );
}
