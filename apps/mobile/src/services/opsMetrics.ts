// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// OPS METRICS
// ==========================================
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ops:metrics:v1";
const MAX_ENTRIES = 1500;
const ENABLE_OPS_METRICS = __DEV__;

type ApiMetricEntry = {
  type: "API";
  at: string;
  durationMs: number;
  ok: boolean;
  statusCode?: number | null;
};

type SyncMetricEntry = {
  type: "SYNC";
  at: string;
  synced: number;
  remaining: number;
};

type MetricEntry = ApiMetricEntry | SyncMetricEntry;

const parseEntries = (raw: string | null): MetricEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MetricEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveEntries = async (entries: MetricEntry[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
};

const appendEntry = async (entry: MetricEntry) => {
  const current = parseEntries(await AsyncStorage.getItem(STORAGE_KEY));
  await saveEntries([entry, ...current]);
};

export async function recordApiMetric(
  durationMs: number,
  ok: boolean,
  statusCode?: number | null,
): Promise<void> {
  if (!ENABLE_OPS_METRICS) return;
  await appendEntry({
    type: "API",
    at: new Date().toISOString(),
    durationMs: Math.max(0, Math.round(durationMs)),
    ok,
    statusCode: statusCode ?? null,
  });
}

export async function recordSyncMetric(
  synced: number,
  remaining: number,
): Promise<void> {
  if (!ENABLE_OPS_METRICS) return;
  await appendEntry({
    type: "SYNC",
    at: new Date().toISOString(),
    synced,
    remaining,
  });
}

export async function getOpsHealthSummary(hours = 24): Promise<{
  totalRequests: number;
  errorRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  syncRuns: number;
  lastSyncAt: string | null;
}> {
  if (!ENABLE_OPS_METRICS) {
    return {
      totalRequests: 0,
      errorRequests: 0,
      errorRate: 0,
      avgLatencyMs: 0,
      syncRuns: 0,
      lastSyncAt: null,
    };
  }

  const entries = parseEntries(await AsyncStorage.getItem(STORAGE_KEY));
  const now = Date.now();
  const maxAge = Math.max(1, hours) * 60 * 60 * 1000;

  const filtered = entries.filter((entry) => {
    const ts = new Date(entry.at).getTime();
    return !Number.isNaN(ts) && now - ts <= maxAge;
  });

  const apiEntries = filtered.filter((e): e is ApiMetricEntry => e.type === "API");
  const syncEntries = filtered.filter((e): e is SyncMetricEntry => e.type === "SYNC");

  const totalRequests = apiEntries.length;
  const errorRequests = apiEntries.filter((e) => !e.ok).length;
  const avgLatencyMs =
    totalRequests > 0
      ? Math.round(apiEntries.reduce((acc, e) => acc + e.durationMs, 0) / totalRequests)
      : 0;
  const errorRate = totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 100) : 0;

  return {
    totalRequests,
    errorRequests,
    errorRate,
    avgLatencyMs,
    syncRuns: syncEntries.length,
    lastSyncAt: syncEntries.length ? syncEntries[0].at : null,
  };
}
