import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from './redis.service';

type MemoryThrottleRecord = {
  totalHits: number;
  expiresAt: number;
  blockExpiresAt: number;
};

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly memory = new Map<string, MemoryThrottleRecord>();

  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const ttlMs = this.normalizeDurationMs(ttl);
    const blockMs = this.normalizeDurationMs(blockDuration || ttl);
    const storageKey = `throttle:${throttlerName}:${key}`;
    const client = this.redisService.getClient();

    if (!client) {
      return this.incrementMemory(storageKey, ttlMs, limit, blockMs);
    }

    const hitsKey = this.redisService.key(`${storageKey}:hits`);
    const blockKey = this.redisService.key(`${storageKey}:block`);
    const blockedTtl = await client.pttl(blockKey);
    if (blockedTtl > 0) {
      const currentHits = Number(await client.get(hitsKey)) || limit + 1;
      return {
        totalHits: currentHits,
        timeToExpire: await this.getTtlSeconds(client, hitsKey, ttlMs),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedTtl / 1000),
      };
    }

    const totalHits = await client.incr(hitsKey);
    if (totalHits === 1) {
      await client.pexpire(hitsKey, ttlMs);
    }
    const hitTtl = await this.getTtlSeconds(client, hitsKey, ttlMs);

    if (totalHits > limit) {
      await client.set(blockKey, '1', 'PX', blockMs);
      return {
        totalHits,
        timeToExpire: hitTtl,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockMs / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire: hitTtl,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  private incrementMemory(
    key: string,
    ttlMs: number,
    limit: number,
    blockMs: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const current = this.memory.get(key);

    if (!current || current.expiresAt <= now) {
      const next = {
        totalHits: 1,
        expiresAt: now + ttlMs,
        blockExpiresAt: 0,
      };
      this.memory.set(key, next);
      return {
        totalHits: next.totalHits,
        timeToExpire: Math.ceil(ttlMs / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    if (current.blockExpiresAt > now) {
      return {
        totalHits: current.totalHits,
        timeToExpire: Math.ceil((current.expiresAt - now) / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil((current.blockExpiresAt - now) / 1000),
      };
    }

    current.totalHits += 1;
    if (current.totalHits > limit) {
      current.blockExpiresAt = now + blockMs;
    }
    this.memory.set(key, current);

    return {
      totalHits: current.totalHits,
      timeToExpire: Math.ceil((current.expiresAt - now) / 1000),
      isBlocked: current.blockExpiresAt > now,
      timeToBlockExpire:
        current.blockExpiresAt > now
          ? Math.ceil((current.blockExpiresAt - now) / 1000)
          : 0,
    };
  }

  private normalizeDurationMs(value: number): number {
    const duration = Number.isFinite(value) ? Number(value) : 0;
    if (duration <= 0) return 1000;

    // Legacy compatibility: existing controllers use ttl: 60 intending seconds.
    return duration <= 1000 ? duration * 1000 : duration;
  }

  private async getTtlSeconds(
    client: NonNullable<ReturnType<RedisService['getClient']>>,
    key: string,
    fallbackMs: number,
  ): Promise<number> {
    const ttl = await client.pttl(key);
    return Math.ceil((ttl > 0 ? ttl : fallbackMs) / 1000);
  }
}
