import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { LockManager } from '../lock-manager.service';
import { mockRedisService, mockAcquireLock, mockExtendLock, mockReleaseLock } from '../../../test/setup-tests';

jest.mock('@/lib/services/redis.service', () => ({
  RedisService: {
    getInstance: jest.fn(() => mockRedisService),
  },
  redisService: mockRedisService,
}));

describe('LockManager', () => {
  let lockManager: LockManager;
  const resourceId = 'test-property-123';
  const mockLockValue = 'mock-lock-value';

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Get fresh instance for each test
    lockManager = LockManager.getInstance();
    
    // Mock random values for consistent testing
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(async () => {
    await Promise.resolve();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('acquireLock', () => {
    it('should acquire a lock successfully', async () => {
      mockAcquireLock.mockResolvedValueOnce(true);

      const lockValue = await lockManager.acquireLock({
        resourceId,
        ttl: 30000,
      });

      expect(lockValue).toBeTruthy();
      expect(mockAcquireLock).toHaveBeenCalledWith(
        `lock:calendar:${resourceId}`,
        expect.any(String),
        30000
      );
      expect(mockAcquireLock).toHaveBeenCalledTimes(1);
    });

    it('should retry acquiring lock on failure', async () => {
      mockAcquireLock
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const lockValue = await lockManager.acquireLock({
        resourceId,
        ttl: 30000,
        maxRetries: 3,
        retryDelay: 100,
      });

      // Fast-forward through retry delays
      for (let i = 0; i < 2; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve(); // Let promises resolve
      }

      expect(lockValue).toBeTruthy();
      expect(mockAcquireLock).toHaveBeenCalledTimes(3);
    });

    it('should return null after max retries', async () => {
      mockAcquireLock.mockResolvedValue(false);

      const lockValue = await lockManager.acquireLock({
        resourceId,
        ttl: 30000,
        maxRetries: 3,
        retryDelay: 100,
      });

      // Fast-forward through all retry delays
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve(); // Let promises resolve
      }

      expect(lockValue).toBeNull();
      expect(mockAcquireLock).toHaveBeenCalledTimes(4); // Initial try + 3 retries
    });
  });

  describe('releaseLock', () => {
    it('should release a lock successfully', async () => {
      mockReleaseLock.mockResolvedValueOnce(true);

      const result = await lockManager.releaseLock({
        resourceId,
        lockValue: mockLockValue,
      });

      expect(result).toBe(true);
      expect(mockReleaseLock).toHaveBeenCalledWith(
        `lock:calendar:${resourceId}`,
        mockLockValue
      );
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });

    it('should handle failed lock release', async () => {
      mockReleaseLock.mockResolvedValueOnce(false);

      const result = await lockManager.releaseLock({
        resourceId,
        lockValue: mockLockValue,
      });

      expect(result).toBe(false);
      expect(mockReleaseLock).toHaveBeenCalledWith(
        `lock:calendar:${resourceId}`,
        mockLockValue
      );
      expect(mockReleaseLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('lock extension', () => {
    it('should extend lock periodically after acquisition', async () => {
      mockAcquireLock.mockResolvedValueOnce(true);
      mockExtendLock.mockResolvedValue(true);

      const lockValue = await lockManager.acquireLock({
        resourceId,
        ttl: 30000,
      });

      expect(lockValue).toBeTruthy();
      expect(mockAcquireLock).toHaveBeenCalledTimes(1);

      // Fast-forward to first extension (2/3 of TTL)
      jest.advanceTimersByTime(20000);
      await Promise.resolve();

      expect(mockExtendLock).toHaveBeenCalledWith(
        `lock:calendar:${resourceId}`,
        expect.any(String),
        30000
      );
      expect(mockExtendLock).toHaveBeenCalledTimes(1);

      // Fast-forward to second extension
      jest.advanceTimersByTime(20000);
      await Promise.resolve();

      expect(mockExtendLock).toHaveBeenCalledTimes(2);
    });

    it('should stop extending lock after release', async () => {
      mockAcquireLock.mockResolvedValueOnce(true);
      mockExtendLock.mockResolvedValue(true);
      mockReleaseLock.mockResolvedValueOnce(true);

      const lockValue = await lockManager.acquireLock({
        resourceId,
        ttl: 30000,
      });

      expect(lockValue).toBeTruthy();

      // Release the lock
      await lockManager.releaseLock({
        resourceId,
        lockValue: lockValue!,
      });

      // Fast-forward past extension interval
      jest.advanceTimersByTime(20000);
      await Promise.resolve();

      expect(mockExtendLock).not.toHaveBeenCalled();
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple lock requests for the same resource', async () => {
      mockAcquireLock
        .mockResolvedValueOnce(true)   // First request succeeds
        .mockResolvedValueOnce(false)  // Second request fails
        .mockResolvedValueOnce(false)  // Second request retry 1
        .mockResolvedValueOnce(true);  // Second request retry 2

      // First request
      const lock1Promise = lockManager.acquireLock({
        resourceId,
        ttl: 30000,
      });

      // Second request
      const lock2Promise = lockManager.acquireLock({
        resourceId,
        ttl: 30000,
        maxRetries: 3,
        retryDelay: 100,
      });

      // Fast-forward through retry delays
      for (let i = 0; i < 2; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      }

      const [lock1, lock2] = await Promise.all([lock1Promise, lock2Promise]);

      expect(lock1).toBeTruthy();
      expect(lock2).toBeTruthy();
      expect(lock1).not.toBe(lock2);
      expect(mockAcquireLock).toHaveBeenCalledTimes(4);
    });
  });
});
