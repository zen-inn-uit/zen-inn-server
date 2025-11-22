import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly lockTTL = 10; // seconds

  constructor() {
    // Use REDIS_URL if available, otherwise fall back to individual config
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

  /**
   * Acquire a distributed lock
   * @param key Lock key
   * @param ttl Time to live in seconds (default: 10s)
   * @returns true if lock acquired, false otherwise
   */
  async acquireLock(key: string, ttl: number = this.lockTTL): Promise<boolean> {
    try {
      // SET key value NX EX ttl
      // NX: Only set if key doesn't exist
      // EX: Set expiration time in seconds
      const result = await this.client.set(key, '1', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to acquire lock for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Release a distributed lock
   * @param key Lock key
   */
  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to release lock for key ${key}:`, error);
    }
  }

  /**
   * Generate booking lock key
   * @param roomId Room ID
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   */
  getBookingLockKey(roomId: string, checkIn: Date, checkOut: Date): string {
    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];
    return `booking:lock:${roomId}:${checkInStr}:${checkOutStr}`;
  }

  /**
   * Set a value in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Redis disconnected');
  }
}
