import { logger } from '../utils/logger';
import { redisService } from './redis.service';

export interface LockOptions {
  resourceId: string;
  ttl: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ReleaseLockOptions {
  resourceId: string;
  lockValue: string;
}

export class LockManager {
  private static instance: LockManager;
  private readonly DEFAULT_TTL = 30000; // 30 seconds
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // 1 second
  private activeLocks: Map<string, string> = new Map();
  private extensionIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): LockManager {
    if (!LockManager.instance) {
      LockManager.instance = new LockManager();
    }
    return LockManager.instance;
  }

  private generateLockKey(resourceId: string): string {
    return `lock:calendar:${resourceId}`;
  }

  private generateLockValue(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public async acquireLock({
    resourceId,
    ttl = this.DEFAULT_TTL,
    maxRetries = this.DEFAULT_MAX_RETRIES,
    retryDelay = this.DEFAULT_RETRY_DELAY,
  }: LockOptions): Promise<string | null> {
    const lockKey = this.generateLockKey(resourceId);
    const lockValue = this.generateLockValue();
    let attempts = 0;

    do {
      try {
        const acquired = await redisService.acquireLock(lockKey, lockValue, ttl);

        if (acquired) {
          this.activeLocks.set(lockKey, lockValue);
          logger.info('Lock acquired successfully', {
            resourceId,
            lockKey,
            attempt: attempts + 1,
          });

          // Start lock extension loop
          this.startLockExtension(lockKey, lockValue, ttl);
          return lockValue;
        }

        logger.warn('Failed to acquire lock, retrying...', {
          resourceId,
          lockKey,
          attempt: attempts + 1,
          maxRetries,
        });

        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        logger.error('Error acquiring lock', {
          resourceId,
          lockKey,
          attempt: attempts + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        attempts++;
      }
    } while (attempts < maxRetries);

    logger.error('Failed to acquire lock after max retries', {
      resourceId,
      lockKey,
      maxRetries,
    });
    return null;
  }

  private startLockExtension(lockKey: string, lockValue: string, ttl: number) {
    // Extend lock at 2/3 of TTL interval
    const extensionInterval = Math.floor(ttl * 0.66);

    const intervalId = setInterval(async () => {
      if (!this.activeLocks.has(lockKey)) {
        this.clearLockExtension(lockKey);
        return;
      }

      try {
        const extended = await redisService.extendLock(lockKey, lockValue, ttl);
        if (!extended) {
          logger.error('Failed to extend lock, clearing interval', {
            lockKey,
          });
          this.clearLockExtension(lockKey);
          this.activeLocks.delete(lockKey);
        }
      } catch (error) {
        logger.error('Error extending lock', {
          lockKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, extensionInterval);

    this.extensionIntervals.set(lockKey, intervalId);
  }

  private clearLockExtension(lockKey: string) {
    const intervalId = this.extensionIntervals.get(lockKey);
    if (intervalId) {
      clearInterval(intervalId);
      this.extensionIntervals.delete(lockKey);
    }
  }

  public async releaseLock({ resourceId, lockValue }: ReleaseLockOptions): Promise<boolean> {
    const lockKey = this.generateLockKey(resourceId);

    try {
      // Clear extension interval if exists
      this.clearLockExtension(lockKey);

      const released = await redisService.releaseLock(lockKey, lockValue);
      if (released) {
        this.activeLocks.delete(lockKey);
        logger.info('Lock released successfully', {
          resourceId,
          lockKey,
        });
        return true;
      }

      logger.warn('Failed to release lock', {
        resourceId,
        lockKey,
      });
      return false;
    } catch (error) {
      logger.error('Error releasing lock', {
        resourceId,
        lockKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const lockManager = LockManager.getInstance();
