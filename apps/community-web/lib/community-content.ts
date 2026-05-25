export type CommunityAttachmentKind =
  | "pdf"
  | "image"
  | "video"
  | "external-link";

export type CommunityAttachmentDraft = {
  id: string;
  kind: CommunityAttachmentKind;
  title: string;
  sourceUrl: string;
  note: string;
  storageKey?: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
};

export type CommunityReferenceDraft = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  doi: string;
  note: string;
};

export type CommunityContentContract = {
  references: CommunityReferenceDraft[];
  attachmentsMetadata: CommunityAttachmentDraft[];
};

export const communityAttachmentKindLabel: Record<
  CommunityAttachmentKind,
  string
> = {
  pdf: "PDF",
  image: "Imagem",
  video: "Video",
  "external-link": "Link externo",
};

export function createReferenceDraft(): CommunityReferenceDraft {
  return {
    id: createDraftId("reference"),
    title: "",
    sourceName: "",
    sourceUrl: "",
    doi: "",
    note: "",
  };
}

export function createAttachmentDraft(
  kind: CommunityAttachmentKind = "pdf",
): CommunityAttachmentDraft {
  return {
    id: createDraftId("attachment"),
    kind,
    title: "",
    sourceUrl: "",
    note: "",
  };
}

export function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createDraftId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
