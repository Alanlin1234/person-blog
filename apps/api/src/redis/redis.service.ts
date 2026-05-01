import { Global, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('REDIS_URL')?.trim();
    if (url) {
      try {
        this.client = new Redis(url, { maxRetriesPerRequest: 3, enableOfflineQueue: false });
        this.client.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
      } catch (e) {
        this.logger.warn(`Redis disabled: ${(e as Error).message}`);
        this.client = null;
      }
    }
  }

  get(): Redis | null {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  async setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return false;
    try {
      const r = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
      return r === 'OK';
    } catch (e) {
      this.logger.warn(`Redis SET NX failed, falling back to DB dedup: ${(e as Error).message}`);
      return false;
    }
  }
}
