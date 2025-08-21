import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client disconnected');
    });

    // Connect to Redis
    this.client.connect().catch((error) => {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }

  public async acquireLock(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      const result = await this.client.set(key, value, {
        NX: true,
        PX: ttl,
      });

      const acquired = result === 'OK';
      logger.info('Lock acquisition attempt', {
        key,
        acquired,
        ttl,
      });

      return acquired;
    } catch (error) {
      logger.error('Failed to acquire lock', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async extendLock(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      // Use Lua script to ensure atomic operation
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.client.eval(script, {
        keys: [key],
        arguments: [value, ttl.toString()],
      });

      const extended = result === 1;
      logger.info('Lock extension attempt', {
        key,
        extended,
        ttl,
      });

      return extended;
    } catch (error) {
      logger.error('Failed to extend lock', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async releaseLock(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      // Use Lua script to ensure atomic operation
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.client.eval(script, {
        keys: [key],
        arguments: [value],
      });

      const released = result === 1;
      logger.info('Lock release attempt', {
        key,
        released,
      });

      return released;
    } catch (error) {
      logger.error('Failed to release lock', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }
}

export const redisService = RedisService.getInstance();
