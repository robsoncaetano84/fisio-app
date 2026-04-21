// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// OFFLINE CHECKIN QUEUE
// ==========================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { recordAuditAction } from "./auditTrail";
import { recordSyncMetric } from "./opsMetrics";

const STORAGE_KEY = "offline:checkins:v1";

type CheckinPayload = {
  concluiu: boolean;
  dorAntes: number | null;
  dorDepois: number | null;
  tempoMinutos: number | null;
  dificuldade: string | null;
  melhoriaSessao: string | null;
  melhoriaDescricao: string | null;
  motivoNaoExecucao: string | null;
  feedbackLivre: string | null;
};

type PendingCheckin = {
  id: string;
  atividadeId: string;
  payload: CheckinPayload;
  createdAt: string;
  retryCount: number;
  nextRetryAt: string | null;
};

const MAX_QUEUE_ITEMS = 200;
const MAX_ITEM_AGE_HOURS = 72;

const parseQueue = (raw: string | null): PendingCheckin[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<
      PendingCheckin & {
        retryCount?: number;
        nextRetryAt?: string | null;
      }
    >;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      retryCount: Number.isFinite(item.retryCount) ? Number(item.retryCount) : 0,
      nextRetryAt:
        typeof item.nextRetryAt === "string" || item.nextRetryAt === null
          ? item.nextRetryAt
          : null,
    }));
  } catch {
    return [];
  }
};

const persistQueue = async (queue: PendingCheckin[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

const getPayloadFingerprint = (item: PendingCheckin) =>
  `${item.atividadeId}:${JSON.stringify(item.payload)}:${item.createdAt.slice(0, 16)}`;

const dedupeQueue = (queue: PendingCheckin[]) => {
  const seen = new Set<string>();
  const deduped: PendingCheckin[] = [];
  let removed = 0;

  for (const item of queue) {
    const fingerprint = getPayloadFingerprint(item);
    if (seen.has(fingerprint)) {
      removed += 1;
      continue;
    }
    seen.add(fingerprint);
    deduped.push(item);
  }

  return { queue: deduped, removed };
};

const purgeOldItems = (queue: PendingCheckin[]) => {
  const maxAgeMs = MAX_ITEM_AGE_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  const kept = queue.filter((item) => {
    const createdAtTs = new Date(item.createdAt).getTime();
    if (Number.isNaN(createdAtTs)) return true;
    return now - createdAtTs <= maxAgeMs;
  });
  return { queue: kept, removed: queue.length - kept.length };
};

async function sanitizeQueue(current: PendingCheckin[]) {
  const purged = purgeOldItems(current);
  const deduped = dedupeQueue(purged.queue);
  const sanitized = deduped.queue.slice(0, MAX_QUEUE_ITEMS);
  const removedByCap = Math.max(0, deduped.queue.length - sanitized.length);
  const changed =
    purged.removed > 0 || deduped.removed > 0 || removedByCap > 0 || sanitized.length !== current.length;

  if (changed) {
    await persistQueue(sanitized);
  }

  return {
    queue: sanitized,
    removedStale: purged.removed,
    removedDuplicates: deduped.removed,
    removedByCap,
  };
}

export async function enqueueOfflineCheckin(
  atividadeId: string,
  payload: CheckinPayload,
): Promise<void> {
  const current = parseQueue(await AsyncStorage.getItem(STORAGE_KEY));
  const { queue: sanitizedCurrent } = await sanitizeQueue(current);
  const item: PendingCheckin = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    atividadeId,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    nextRetryAt: null,
  };
  await persistQueue([item, ...sanitizedCurrent].slice(0, MAX_QUEUE_ITEMS));
  await recordAuditAction("CHECKIN_OFFLINE_ENQUEUED", {
    atividadeId,
    concluiu: payload.concluiu,
  });
}

export async function getOfflineCheckinQueueCount(): Promise<number> {
  const current = parseQueue(await AsyncStorage.getItem(STORAGE_KEY));
  const { queue } = await sanitizeQueue(current);
  return queue.length;
}

export async function getOfflineCheckinQueueStats(): Promise<{
  total: number;
  readyToSync: number;
  waitingRetry: number;
  oldestCreatedAt: string | null;
  staleRemoved: number;
  duplicateRemoved: number;
}> {
  const current = parseQueue(await AsyncStorage.getItem(STORAGE_KEY));
  const { queue, removedStale, removedDuplicates } = await sanitizeQueue(current);
  const now = Date.now();
  const readyToSync = queue.filter((item) => {
    if (!item.nextRetryAt) return true;
    const retryTs = new Date(item.nextRetryAt).getTime();
    return Number.isNaN(retryTs) || retryTs <= now;
  }).length;
  const waitingRetry = queue.length - readyToSync;
  const oldestCreatedAt = queue.length
    ? queue
        .map((item) => item.createdAt)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
    : null;
  return {
    total: queue.length,
    readyToSync,
    waitingRetry,
    oldestCreatedAt,
    staleRemoved: removedStale,
    duplicateRemoved: removedDuplicates,
  };
}

const computeNextRetryAt = (retryCount: number) => {
  const baseSeconds = 30;
  const backoffSeconds = Math.min(3600, baseSeconds * 2 ** Math.max(0, retryCount - 1));
  return new Date(Date.now() + backoffSeconds * 1000).toISOString();
};

export async function syncOfflineCheckins(options?: {
  force?: boolean;
}): Promise<{ synced: number; remaining: number }> {
  const force = options?.force === true;
  const current = parseQueue(await AsyncStorage.getItem(STORAGE_KEY));
  const { queue } = await sanitizeQueue(current);
  const safeQueue = [...queue];
  if (!safeQueue.length) {
    return { synced: 0, remaining: 0 };
  }

  let synced = 0;
  const remaining: PendingCheckin[] = [];
  const now = Date.now();

  for (const item of safeQueue.reverse()) {
    const retryTs = item.nextRetryAt ? new Date(item.nextRetryAt).getTime() : NaN;
    const canRetryNow =
      force || !item.nextRetryAt || Number.isNaN(retryTs) || retryTs <= now;

    if (!canRetryNow) {
      remaining.unshift(item);
      continue;
    }

    try {
      await api.post(`/atividades/${item.atividadeId}/checkins`, item.payload);
      synced += 1;
      await recordAuditAction("CHECKIN_OFFLINE_SYNCED", {
        atividadeId: item.atividadeId,
        offlineCreatedAt: item.createdAt,
        retryCount: item.retryCount,
      });
    } catch {
      const nextRetryCount = item.retryCount + 1;
      remaining.unshift({
        ...item,
        retryCount: nextRetryCount,
        nextRetryAt: computeNextRetryAt(nextRetryCount),
      });
      await recordAuditAction("CHECKIN_OFFLINE_SYNC_FAILED", {
        atividadeId: item.atividadeId,
        offlineCreatedAt: item.createdAt,
        retryCount: nextRetryCount,
      });
    }
  }

  await persistQueue(remaining);
  await recordSyncMetric(synced, remaining.length);
  return { synced, remaining: remaining.length };
}
