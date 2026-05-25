import type { CommunityReply } from '@/lib/community-api';

export type LocalDiscussionReply = CommunityReply & {
  status: 'LOCAL_PREVIEW';
};

export const REPLIES_STORAGE_PREFIX = 'synap-community:local-replies:';
export const REPLIES_UPDATED_EVENT = 'synap-community:replies-updated';

const localAuthor = {
  id: 'local-author',
  username: 'profissional-local',
  displayName: 'Profissional SYNAP',
  profession: 'Fisioterapia',
  specialty: 'Participante da comunidade',
  reputationScore: 0,
};

export function readLocalReplies(postSlug: string): LocalDiscussionReply[] {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(getRepliesStorageKey(postSlug)) || '[]',
    ) as LocalDiscussionReply[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalReplies(
  postSlug: string,
  replies: LocalDiscussionReply[],
) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    getRepliesStorageKey(postSlug),
    JSON.stringify(replies.slice(0, 100)),
  );
  window.dispatchEvent(new Event(REPLIES_UPDATED_EVENT));
}

export function createLocalReply(
  postSlug: string,
  contentMarkdown: string,
): LocalDiscussionReply {
  const reply: LocalDiscussionReply = {
    id: `local-reply-${Date.now()}`,
    contentMarkdown,
    score: 0,
    isUseful: false,
    createdAt: new Date().toISOString(),
    authorProfile: localAuthor,
    status: 'LOCAL_PREVIEW',
  };

  writeLocalReplies(postSlug, [reply, ...readLocalReplies(postSlug)]);
  return reply;
}

function getRepliesStorageKey(postSlug: string) {
  return `${REPLIES_STORAGE_PREFIX}${postSlug}`;
}
