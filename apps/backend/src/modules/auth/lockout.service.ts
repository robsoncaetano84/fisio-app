// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L OC KO UT.SERVICE
// ==========================================
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type LockoutRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

@Injectable()
export class LockoutService {
  private readonly inMemory = new Map<string, LockoutRecord>();
  private readonly redis?: Redis;
  private readonly useRedis: boolean;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
      this.useRedis = true;
    } else {
      this.useRedis = false;
    }
  }

  private getKey(email: string) {
    return `lockout:${email.toLowerCase()}`;
  }

  private lockoutWindowMs() {
    return (
      (this.configService.get<number>('LOCKOUT_WINDOW_MIN') ?? 15) * 60_000
    );
  }

  private lockoutDurationMs() {
    return (
      (this.configService.get<number>('LOCKOUT_DURATION_MIN') ?? 30) * 60_000
    );
  }

  private maxAttempts() {
    return this.configService.get<number>('LOCKOUT_MAX_ATTEMPTS') ?? 5;
  }

  private async getRecord(email: string): Promise<LockoutRecord | null> {
    if (this.useRedis && this.redis) {
      const raw = await this.redis.get(this.getKey(email));
      return raw ? (JSON.parse(raw) as LockoutRecord) : null;
    }
    return this.inMemory.get(email) ?? null;
  }

  private async setRecord(email: string, record: LockoutRecord): Promise<void> {
    if (this.useRedis && this.redis) {
      const ttlMs = Math.max(this.lockoutWindowMs(), this.lockoutDurationMs());
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.redis.set(
        this.getKey(email),
        JSON.stringify(record),
        'EX',
        ttlSeconds,
      );
      return;
    }
    this.inMemory.set(email, record);
  }

  async reset(email: string): Promise<void> {
    if (this.useRedis && this.redis) {
      await this.redis.del(this.getKey(email));
      return;
    }
    this.inMemory.delete(email);
  }

  async isLocked(email: string): Promise<boolean> {
    const record = await this.getRecord(email);
    if (!record?.lockedUntil) {
      return false;
    }
    return record.lockedUntil > Date.now();
  }

  async registerFailure(email: string): Promise<LockoutRecord> {
    const now = Date.now();
    const windowMs = this.lockoutWindowMs();
    const durationMs = this.lockoutDurationMs();
    const maxAttempts = this.maxAttempts();

    const current = (await this.getRecord(email)) ?? {
      count: 0,
      firstAttemptAt: now,
    };

    const withinWindow = now - current.firstAttemptAt <= windowMs;
    const nextCount = withinWindow ? current.count + 1 : 1;
    const nextRecord: LockoutRecord = {
      count: nextCount,
      firstAttemptAt: withinWindow ? current.firstAttemptAt : now,
      lockedUntil: nextCount >= maxAttempts ? now + durationMs : undefined,
    };

    await this.setRecord(email, nextRecord);
    return nextRecord;
  }
}
