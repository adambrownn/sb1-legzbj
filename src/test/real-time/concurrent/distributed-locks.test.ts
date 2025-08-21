import { BaseValidation } from '../../validate-base';
import { lockService } from '../../../lib/lock/lock-service';
import { createLogger } from '../../../lib/logger';
import { retryWithBackoff } from '../../config/unified-test-config';
import { Redis } from 'ioredis';

interface LockOperation {
  key: string;
  duration: number;
  expectedResult: boolean;
}

export class DistributedLocksTest extends BaseValidation {
  private logger = createLogger('distributed-locks');
  private successCount = 0;
  private failureCount = 0;
  private redis: Redis;

  constructor() {
    super('DistributedLocks');
    this.redis = new Redis(); // Using default connection settings
  }

  protected async runValidation(): Promise<void> {
    await this.runWithErrorHandling(async () => {
      await this.validateLockAcquisition();
    }, 'Lock acquisition validation');

    await this.runWithErrorHandling(async () => {
      await this.validateLockExpiry();
    }, 'Lock expiry validation');

    await this.runWithErrorHandling(async () => {
      await this.validateConcurrentLocks();
    }, 'Concurrent locks validation');

    await this.runWithErrorHandling(async () => {
      await this.validateLockReentry();
    }, 'Lock reentry validation');

    this.logger.info('Distributed locks validation completed', {
      successCount: this.successCount,
      failureCount: this.failureCount
    });
  }

  private async validateLockAcquisition() {
    this.logger.debug('Starting lock acquisition validation');

    const lockKey = 'test:lock:acquisition';
    const lockDuration = 5000; // 5 seconds

    try {
      // First acquisition should succeed
      const lock1 = await lockService.acquireLock(lockKey, lockDuration);
      
      // Second acquisition should fail
      const lock2 = await Promise.race([
        lockService.acquireLock(lockKey, lockDuration),
        new Promise(resolve => setTimeout(() => resolve({ success: false }), 1000))
      ]);

      if (lock1.success && !lock2.success) {
        this.successCount++;
        this.logger.debug('Successfully validated lock acquisition');
      } else {
        throw new Error('Unexpected lock acquisition behavior');
      }

      // Cleanup
      await lockService.releaseLock(lockKey);
    } catch (error) {
      this.failureCount++;
      this.logger.error('Lock acquisition validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateLockExpiry() {
    this.logger.debug('Starting lock expiry validation');

    const lockKey = 'test:lock:expiry';
    const shortDuration = 2000; // 2 seconds

    try {
      // Acquire initial lock
      const initialLock = await lockService.acquireLock(lockKey, shortDuration);
      
      if (!initialLock.success) {
        throw new Error('Failed to acquire initial lock');
      }

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, shortDuration + 1000));

      // Try to acquire lock after expiry
      const newLock = await lockService.acquireLock(lockKey, shortDuration);

      if (newLock.success) {
        this.successCount++;
        this.logger.debug('Successfully validated lock expiry');
      } else {
        throw new Error('Failed to acquire lock after expiry');
      }

      // Cleanup
      await lockService.releaseLock(lockKey);
    } catch (error) {
      this.failureCount++;
      this.logger.error('Lock expiry validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateConcurrentLocks() {
    this.logger.debug('Starting concurrent locks validation');

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

      if (allLocksAcquired) {
        this.successCount++;
        this.logger.debug('Successfully validated concurrent locks');
      } else {
        throw new Error('Failed to acquire all concurrent locks');
      }

      // Cleanup
      await Promise.all(
        lockOperations.map(op => lockService.releaseLock(op.key))
      );
    } catch (error) {
      this.failureCount++;
      this.logger.error('Concurrent locks validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateLockReentry() {
    this.logger.debug('Starting lock reentry validation');

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

      if (lock2.success && lock2.token === lock1.token) {
        this.successCount++;
        this.logger.debug('Successfully validated lock reentry');
      } else {
        throw new Error('Lock reentry validation failed');
      }

      // Cleanup
      await lockService.releaseLock(lockKey);
    } catch (error) {
      this.failureCount++;
      this.logger.error('Lock reentry validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
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
