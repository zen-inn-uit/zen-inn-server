import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly lockTTL = 60; // seconds

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    this.client = redisUrl
      ? new Redis(redisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  async acquireLock(key: string, ttl: number = this.lockTTL): Promise<boolean> {
    try {
      const result = await this.client.set(key, '1', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to acquire lock for key ${key}:`, error);
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to release lock for key ${key}:`, error);
    }
  }

  getBookingLockKey(roomId: string, checkIn: Date, checkOut: Date): string {
    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];
    return `booking:lock:${roomId}:${checkInStr}:${checkOutStr}`;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Redis disconnected');
  }
}
