import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CommunityCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CommunityCacheService.name);
  private readonly client: Redis | null;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL')?.trim();
    this.client = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : null;

    this.client?.on('error', (error) => {
      this.logger.warn(
        `Redis indisponivel para community cache: ${error.message}`,
      );
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Falha ao ler cache ${key}: ${this.messageFrom(error)}`);
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Falha ao gravar cache ${key}: ${this.messageFrom(error)}`,
      );
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length) await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(
        `Falha ao invalidar cache ${prefix}: ${this.messageFrom(error)}`,
      );
    }
  }

  async status(): Promise<'not_configured' | 'operational' | 'degraded'> {
    if (!this.client) return 'not_configured';
    try {
      await this.client.ping();
      return 'operational';
    } catch {
      return 'degraded';
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  private messageFrom(error: unknown) {
    return error instanceof Error ? error.message : 'erro desconhecido';
  }
}
