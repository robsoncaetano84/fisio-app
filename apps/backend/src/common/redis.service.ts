import {
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryRecord = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client?: Redis;
  private readonly memory = new Map<string, MemoryRecord>();
  private readonly prefix: string;

  constructor(private readonly configService: ConfigService) {
    this.prefix =
      (this.configService.get<string>('REDIS_KEY_PREFIX') || 'fisio-app')
        .trim()
        .replace(/:+$/g, '') || 'fisio-app';

    const redisUrl = this.configService.get<string>('REDIS_URL')?.trim();
    if (!redisUrl) return;

    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });
    this.client.on('error', (error) => {
      this.logger.warn(`redis_error ${error.message}`);
    });
    this.client.connect().catch((error: Error) => {
      this.logger.warn(`redis_connect_failed ${error.message}`);
    });
  }

  get enabled(): boolean {
    return Boolean(this.client);
  }

  getClient(): Redis | undefined {
    return this.client;
  }

  key(key: string): string {
    const clean = key.replace(/^:+/g, '');
    return `${this.prefix}:${clean}`;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const namespaced = this.key(key);
    const raw = this.client
      ? await this.client.get(namespaced)
      : this.getMemory(namespaced);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      await this.del(key);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const namespaced = this.key(key);
    const payload = JSON.stringify(value);
    const ttl = Math.max(1, Math.floor(ttlSeconds));

    if (this.client) {
      await this.client.set(namespaced, payload, 'EX', ttl);
      return;
    }

    this.memory.set(namespaced, {
      value: payload,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.setJson(key, value, ttlSeconds);
    return value;
  }

  async del(key: string): Promise<void> {
    const namespaced = this.key(key);
    if (this.client) {
      await this.client.del(namespaced);
      return;
    }
    this.memory.delete(namespaced);
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    const namespacedPrefix = this.key(prefix);
    if (!this.client) {
      let deleted = 0;
      for (const key of Array.from(this.memory.keys())) {
        if (key.startsWith(namespacedPrefix)) {
          this.memory.delete(key);
          deleted += 1;
        }
      }
      return deleted;
    }

    let cursor = '0';
    let deleted = 0;
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        `${namespacedPrefix}*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    return deleted;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  private getMemory(key: string): string | null {
    const record = this.memory.get(key);
    if (!record) return null;
    if (record.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return record.value;
  }
}
