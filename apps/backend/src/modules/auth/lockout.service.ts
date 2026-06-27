// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L OC KO UT.SERVICE
// ==========================================
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isRecord, parseJsonObject } from '../../common/safe-json';
import { RedisService } from '../../common/redis.service';

type LockoutRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

const isLockoutRecord = (value: unknown): value is LockoutRecord =>
  isRecord(value) &&
  typeof value.count === 'number' &&
  typeof value.firstAttemptAt === 'number' &&
  (value.lockedUntil === undefined || typeof value.lockedUntil === 'number');

@Injectable()
export class LockoutService {
  private readonly inMemory = new Map<string, LockoutRecord>();

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

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
    const client = this.redisService.getClient();
    if (client) {
      const raw = await client.get(this.redisService.key(this.getKey(email)));
      const parsed = parseJsonObject(raw);
      return isLockoutRecord(parsed) ? parsed : null;
    }
    return this.inMemory.get(email) ?? null;
  }

  private async setRecord(email: string, record: LockoutRecord): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      const ttlMs = Math.max(this.lockoutWindowMs(), this.lockoutDurationMs());
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await client.set(
        this.redisService.key(this.getKey(email)),
        JSON.stringify(record),
        'EX',
        ttlSeconds,
      );
      return;
    }
    this.inMemory.set(email, record);
  }

  async reset(email: string): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      await client.del(this.redisService.key(this.getKey(email)));
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
