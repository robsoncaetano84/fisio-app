import type {
  CommunityAttachmentDraft,
  CommunityReferenceDraft,
} from "./community-content";

const communityApiUrl = (
  process.env.NEXT_PUBLIC_COMMUNITY_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

type CreatePostInput = {
  title: string;
  contentMarkdown: string;
  categoryId: string;
  tags: string[];
  references: CommunityReferenceDraft[];
  attachmentsMetadata: CommunityAttachmentDraft[];
};

type CreatePostResponse = {
  postId: string;
  slug: string;
  moderationStatus: string;
};

type CreateReplyInput = {
  contentMarkdown: string;
  ethicsAccepted: boolean;
};

type CreateReplyResponse = {
  replyId: string;
  moderationStatus: string;
};

type CreateResourceInput = {
  kind: "article" | "reference";
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl?: string;
  doi?: string;
  publishedYear?: number;
  authors: string[];
  clinicalUse: string;
  tags: string[];
};

type CreateResourceResponse = {
  resourceId: string;
  slug: string;
  moderationStatus: string;
};

type CreateReportInput = {
  targetType: "post" | "reply" | "resource" | "profile";
  targetId: string;
  reason: string;
  details?: string;
};

type CreateReportResponse = {
  reportId: string;
  status: string;
};

type PresignCommunityUploadResponse = {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
};

export type CommunityBookmarkType =
  | "post"
  | "article"
  | "reference"
  | "reply"
  | "profile";

type CommunityBookmarkTargetType = "post" | "reply" | "resource" | "profile";

export type CommunityBookmarkItem = {
  id: string;
  targetType: CommunityBookmarkTargetType;
  targetId: string;
  type: CommunityBookmarkType;
  title: string;
  href: string;
  summary: string | null;
  savedAt: string;
};

export type CommunityNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type CommunityModerationReportItem = {
  id: string;
  targetType: "post" | "reply" | "resource" | "profile";
  targetId: string;
  targetTitle: string;
  targetHref: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  createdAt: string;
};

type CommunityAdminOverview = {
  metrics: {
    posts: number;
    replies: number;
    resources: number;
    openReports: number;
    notifications: number;
  };
};

export type CommunityAuditLogItem = {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  event: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CommunitySessionProfile = {
  id: string;
  username: string;
  displayName: string;
  profession: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl: string | null;
  cityState: string | null;
  areasOfPractice: string[];
  reputationScore: number;
  contributionCount: number;
};

type UpdateCommunitySessionProfileInput = {
  displayName?: string;
  profession?: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  cityState?: string;
  areasOfPractice?: string[];
};

export function splitTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

export function createCommunityPost(input: CreatePostInput) {
  return communityWrite<CreatePostResponse>("/community/posts", input);
}

export function createCommunityReplyBySlug(
  postSlug: string,
  input: CreateReplyInput,
) {
  return communityWrite<CreateReplyResponse>(
    `/community/posts/by-slug/${encodeURIComponent(postSlug)}/replies`,
    input,
  );
}

export function createCommunityResource(input: CreateResourceInput) {
  return communityWrite<CreateResourceResponse>("/community/resources", input);
}

export function createCommunityReport(input: CreateReportInput) {
  return communityWrite<CreateReportResponse>(
    "/community/moderation/reports",
    input,
  );
}

export async function uploadCommunityAttachment(input: {
  file: File;
  purpose: string;
}) {
  const presigned = await communityWrite<PresignCommunityUploadResponse>(
    "/community/uploads/presign",
    {
      fileName: input.file.name,
      contentType: input.file.type || "application/octet-stream",
      sizeBytes: input.file.size,
      purpose: input.purpose,
    },
  );

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: presigned.headers,
    body: input.file,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Falha ao enviar arquivo para o storage (${uploadResponse.status})`,
    );
  }

  return {
    storageKey: presigned.storageKey,
    publicUrl: presigned.publicUrl,
    contentType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export function getCommunityBookmarks() {
  return communityRequest<CommunityBookmarkItem[]>("/community/bookmarks");
}

export function createCommunityBookmark(input: {
  id: string;
  type: CommunityBookmarkType;
}) {
  return communityWrite<{ bookmarkId: string }>("/community/bookmarks", {
    targetType: resolveBookmarkTargetType(input.type),
    targetId: input.id,
  });
}

export function removeCommunityBookmark(input: {
  id: string;
  type: CommunityBookmarkType;
}) {
  return communityRequest<{ success: boolean }>(
    `/community/bookmarks/${resolveBookmarkTargetType(input.type)}/${encodeURIComponent(
      input.id,
    )}`,
    { method: "DELETE" },
  );
}

export function reactToCommunityTarget(input: {
  id: string;
  type: CommunityBookmarkType;
}) {
  return communityRequest<{ reactionId: string; created: boolean }>(
    `/community/reactions/${resolveBookmarkTargetType(input.type)}/${encodeURIComponent(
      input.id,
    )}`,
    { method: "POST" },
  );
}

export function thankCommunityTarget(input: {
  id: string;
  type: "post" | "reply" | "resource" | "profile";
}) {
  return communityRequest<{ reactionId: string; created: boolean }>(
    `/community/reactions/${input.type}/${encodeURIComponent(input.id)}`,
    { method: "POST" },
  );
}

export function getCommunityNotifications() {
  return communityRequest<CommunityNotificationItem[]>(
    "/community/notifications",
  );
}

export function markCommunityNotificationRead(notificationId: string) {
  return communityRequest<{ success: boolean }>(
    `/community/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}

export function markAllCommunityNotificationsRead() {
  return communityRequest<{ success: boolean }>(
    "/community/notifications/read-all",
    { method: "PATCH" },
  );
}

export function getCommunityModerationReports() {
  return communityRequest<CommunityModerationReportItem[]>(
    "/community/moderation/reports",
  );
}

export function updateCommunityModerationReport(
  reportId: string,
  input: {
    status: CommunityModerationReportItem["status"];
    resolutionNote?: string;
  },
) {
  return communityRequest<{ reportId: string; status: string }>(
    `/community/moderation/reports/${encodeURIComponent(reportId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function getCommunityAdminOverview() {
  return communityRequest<CommunityAdminOverview>("/community/admin/overview");
}

export function getCommunityAuditLogs() {
  return communityRequest<CommunityAuditLogItem[]>(
    "/community/admin/audit-logs",
  );
}

export function getCommunitySessionProfile() {
  return communityRequest<CommunitySessionProfile>(
    "/community/session/profile",
  );
}

export function updateCommunitySessionProfile(
  input: UpdateCommunitySessionProfileInput,
) {
  return communityRequest<CommunitySessionProfile>(
    "/community/session/profile",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

async function communityWrite<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  return communityRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function communityRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${communityApiUrl}${path}`, {
    method: init.method || "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    body: init.body,
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

function resolveBookmarkTargetType(
  type: CommunityBookmarkType,
): CommunityBookmarkTargetType {
  if (type === "article" || type === "reference") return "resource";
  if (type === "reply") return "reply";
  if (type === "profile") return "profile";
  return "post";
}

async function resolveErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(payload.message)) return payload.message.join(" ");
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  } catch {
    // Keep the generic message below when the API does not return JSON.
  }
  return `Falha ao enviar para a API da comunidade (${response.status})`;
}
