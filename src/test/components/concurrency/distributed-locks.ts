import { BaseValidation } from '../../validate-base';
import { lockService } from '../../../lib/lock/lock-service';
import { createLogger } from '../../../lib/logger';
import { Redis } from 'ioredis';
import { retryWithBackoff } from '../../config/unified-test-config';

interface LockOperation {
  key: string;
  duration: number;
  expectedResult: boolean;
}

export class DistributedLocksTest extends BaseValidation {
  private logger = createLogger('distributed-locks');
  private redis: Redis;

  constructor() {
    super('DistributedLocks');
    this.redis = new Redis({
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  protected async runValidation(): Promise<void> {
    try {
      await this.redis.ping(); // Verify Redis connection
      await this.validateLockAcquisition();
      await this.validateLockExpiry();
      await this.validateConcurrentLocks();
      await this.validateLockReentry();
    } finally {
      await this.cleanup();
    }
  }

  private async validateLockAcquisition() {
    this.logger.debug('Testing lock acquisition');

    const lockKey = 'test:lock:acquisition';
    const lockDuration = 5000; // 5 seconds

    try {
      // Ensure lock is released before starting
      await this.redis.del(`lock:${lockKey}`);

      // First acquisition should succeed
      const lock1 = await lockService.acquireLock(lockKey, lockDuration);
      
      if (!lock1.success || !lock1.token) {
        throw new Error('Initial lock acquisition failed');
      }

      // Verify lock exists in Redis
      const lockExists = await this.verifyLockState(lockKey);
      if (!lockExists) {
        throw new Error('Lock not found in Redis after acquisition');
      }

      // Second acquisition should fail
      const lock2 = await Promise.race([
        lockService.acquireLock(lockKey, lockDuration),
        new Promise<{ success: boolean; token?: string }>(resolve => 
          setTimeout(() => resolve({ success: false }), 1000)
        )
      ]);

      if (lock2.success) {
        throw new Error('Second lock should not have been acquired');
      }

      // Release the lock
      await lockService.releaseLock(lockKey, lock1.token);
      
      // Verify lock was released
      const lockState = await this.verifyLockState(lockKey);
      if (lockState) {
        throw new Error('Lock was not properly released');
      }

      // Third acquisition should succeed after release
      const lock3 = await lockService.acquireLock(lockKey, lockDuration);
      
      if (!lock3.success || !lock3.token) {
        throw new Error('Failed to acquire lock after release');
      }

      // Release the lock
      await lockService.releaseLock(lockKey, lock3.token);

      this.logger.info('Lock acquisition test passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Lock acquisition test failed:', { error: errorMessage });
      throw new Error(`Lock acquisition test failed: ${errorMessage}`);
    }
  }

  private async validateLockExpiry() {
    this.logger.debug('Testing lock expiry');

    const lockKey = 'test:lock:expiry';
    const shortDuration = 2000; // 2 seconds

    try {
      // Ensure lock is released before starting
      await this.redis.del(`lock:${lockKey}`);

      // Acquire initial lock
      const initialLock = await lockService.acquireLock(lockKey, shortDuration);
      
      if (!initialLock.success || !initialLock.token) {
        throw new Error('Failed to acquire initial lock');
      }

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, shortDuration + 1000));

      // Try to acquire lock after expiry
      const newLock = await lockService.acquireLock(lockKey, shortDuration);

      if (!newLock.success || !newLock.token) {
        throw new Error('Failed to acquire lock after expiry');
      }

      // Release the lock
      await lockService.releaseLock(lockKey, newLock.token);
      this.logger.info('Lock expiry test passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Lock expiry test failed:', { error: errorMessage });
      throw new Error(`Lock expiry test failed: ${errorMessage}`);
    }
  }

  private async validateConcurrentLocks() {
    this.logger.debug('Testing concurrent locks');

    const baseLockKey = 'test:lock:concurrent';
    const lockOperations: LockOperation[] = Array.from({ length: 5 }, (_, i) => ({
      key: `${baseLockKey}:${i}`,
      duration: 5000,
      expectedResult: true
    }));

    try {
      // Attempt to acquire multiple different locks concurrently
      const results = await Promise.all(
        lockOperations.map(op =>
          lockService.acquireLock(op.key, op.duration)
        )
      );

      // Verify all locks were acquired
      const allLocksAcquired = results.every(result => result.success);

      if (!allLocksAcquired) {
        throw new Error('Failed to acquire all concurrent locks');
      }

      // Cleanup
      await Promise.all(
        lockOperations.map(op => lockService.releaseLock(op.key, results[lockOperations.indexOf(op)].token))
      );
      this.logger.info('Concurrent locks test passed');
    } catch (error) {
      throw new Error(`Concurrent locks test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateLockReentry() {
    this.logger.debug('Testing lock reentry');

    const lockKey = 'test:lock:reentry';
    const lockDuration = 5000;

    try {
      // Acquire initial lock
      const lock1 = await lockService.acquireLock(lockKey, lockDuration);
      
      if (!lock1.success) {
        throw new Error('Failed to acquire initial lock');
      }

      // Attempt to reenter the lock with the same token
      const lock2 = await lockService.acquireLock(lockKey, lockDuration, lock1.token);

      if (!lock2.success || lock2.token !== lock1.token) {
        throw new Error('Lock reentry validation failed');
      }

      // Cleanup
      await lockService.releaseLock(lockKey, lock1.token);
      this.logger.info('Lock reentry test passed');
    } catch (error) {
      throw new Error(`Lock reentry test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async simulateNodeFailure(lockKey: string): Promise<void> {
    // Simulate a node crash by directly removing the lock from Redis
    await this.redis.del(`lock:${lockKey}`);
  }

  private async verifyLockState(lockKey: string): Promise<boolean> {
    const lockExists = await this.redis.exists(`lock:${lockKey}`);
    return lockExists === 1;
  }

  private async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger.error('Error during cleanup:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
