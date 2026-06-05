import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SimpleCacheService } from './simple-cache.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new SimpleCacheService();
  private redis: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2_000,
        lazyConnect: true,
      });
      await this.redis.connect();
      await this.redis.ping();
      this.logger.log('Redis cache connected');
    } catch (error) {
      this.logger.warn(
        `Redis unavailable, falling back to in-memory cache: ${(error as Error).message}`
      );
      this.redis?.disconnect();
      this.redis = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      } catch {
        return this.memory.get<T>(key);
      }
    }
    return this.memory.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'PX', ttlMs);
        return;
      } catch {
        this.memory.set(key, value, ttlMs);
        return;
      }
    }
    this.memory.set(key, value, ttlMs);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.redis) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            100
          );
          cursor = nextCursor;
          if (keys.length) {
            await this.redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        this.memory.invalidatePrefix(prefix);
      }
    }
    this.memory.invalidatePrefix(prefix);
  }
}
