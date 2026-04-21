// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// GAMIFICATION
// ==========================================
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "gamification:streak:v1";

type GamificationState = {
  streak: number;
  lastCheckinDate: string | null;
};

const INITIAL_STATE: GamificationState = {
  streak: 0,
  lastCheckinDate: null,
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const parseState = (raw: string | null): GamificationState => {
  if (!raw) return INITIAL_STATE;
  try {
    const parsed = JSON.parse(raw) as GamificationState;
    return {
      streak: Number.isFinite(parsed.streak) ? parsed.streak : 0,
      lastCheckinDate:
        typeof parsed.lastCheckinDate === "string" ? parsed.lastCheckinDate : null,
    };
  } catch {
    return INITIAL_STATE;
  }
};

const getDiffDays = (aIsoDate: string, bIsoDate: string) => {
  const a = new Date(`${aIsoDate}T00:00:00`);
  const b = new Date(`${bIsoDate}T00:00:00`);
  const diff = a.getTime() - b.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
};

const getStorageKey = (userId: string) => `${KEY_PREFIX}:${userId}`;

export async function getGamificationState(userId: string): Promise<GamificationState> {
  const raw = await AsyncStorage.getItem(getStorageKey(userId));
  return parseState(raw);
}

export async function registerConcludedCheckin(userId: string): Promise<GamificationState> {
  const key = getStorageKey(userId);
  const current = parseState(await AsyncStorage.getItem(key));
  const today = toIsoDate(new Date());

  if (current.lastCheckinDate === today) {
    return current;
  }

  const diff = current.lastCheckinDate ? getDiffDays(today, current.lastCheckinDate) : null;
  let nextStreak = 1;

  if (diff === 1) {
    nextStreak = current.streak + 1;
  } else if (diff === 0) {
    nextStreak = current.streak;
  }

  const next = {
    streak: nextStreak,
    lastCheckinDate: today,
  };
  await AsyncStorage.setItem(key, JSON.stringify(next));
  return next;
}

export function getBadgeLabel(streak: number): string {
  if (streak >= 14) return "Ouro";
  if (streak >= 7) return "Prata";
  if (streak >= 3) return "Bronze";
  return "Iniciante";
}

