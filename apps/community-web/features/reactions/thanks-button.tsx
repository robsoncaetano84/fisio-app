"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { thankCommunityTarget } from "@/lib/community-write-api";

type ThanksButtonProps = {
  id: string;
  type: "post" | "reply" | "resource" | "profile";
  initialCount?: number;
  compact?: boolean;
};

const THANKS_STORAGE_KEY = "synap-community:thanks";

export function ThanksButton({
  id,
  type,
  initialCount = 0,
  compact = false,
}: ThanksButtonProps) {
  const key = `${type}:${id}`;
  const [thanked, setThanked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setThanked(readThanks().includes(key));
  }, [key]);

  const label = useMemo(() => {
    if (compact) return String(count);
    return thanked ? `Agradecido (${count})` : `Agradecer (${count})`;
  }, [compact, count, thanked]);

  const thank = async () => {
    if (pending || thanked) return;
    setPending(true);
    setThanked(true);
    setCount((current) => current + 1);
    writeThanks([...readThanks(), key]);

    try {
      const response = await thankCommunityTarget({ id, type });
      if (!response.created) {
        setCount((current) => Math.max(initialCount, current - 1));
      }
    } catch {
      // Local fallback keeps the acknowledgement visible without a session.
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      aria-pressed={thanked}
      className={`focus-ring inline-flex h-9 items-center gap-2 rounded-synap border px-3 text-xs font-bold transition ${
        thanked
          ? "border-synap-primary/30 bg-synap-primary/10 text-synap-primary"
          : "border-synap-border bg-white text-synap-muted hover:border-synap-primary/40 hover:text-synap-primary"
      }`}
      disabled={pending || thanked}
      onClick={() => void thank()}
      type="button"
    >
      <HeartHandshake className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function readThanks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(THANKS_STORAGE_KEY) || "[]",
    ) as string[];
    return Array.isArray(parsed) ? Array.from(new Set(parsed)) : [];
  } catch {
    return [];
  }
}

function writeThanks(values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    THANKS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(values)).slice(-500)),
  );
}
