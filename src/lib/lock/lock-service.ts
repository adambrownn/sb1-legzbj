import pino from 'pino';

export interface LockService {
  acquireLock(key: string, ttlMs?: number): Promise<boolean>;
  releaseLock(key: string): Promise<boolean>;
  getAllLocks(): Promise<string[]>;
  clearAllLocks(): Promise<void>;
}

// Create logger without circular dependency
const logger = pino({
  name: 'lock-service',
  level: process.env.NODE_ENV === 'test' ? 'debug' : 'info'
});

class LockServiceImpl implements LockService {
  private locks: Map<string, { expiry: number }>;

  constructor() {
    this.locks = new Map();
    logger.debug('LockService initialized');
  }

  async acquireLock(key: string, ttlMs: number = 30000): Promise<boolean> {
    if (this.locks.has(key)) {
      const lock = this.locks.get(key)!;
      if (lock.expiry > Date.now()) {
        logger.debug(`Lock ${key} is already held`);
        return false;
      }
      // Lock expired, remove it
      this.locks.delete(key);
    }

    this.locks.set(key, { expiry: Date.now() + ttlMs });
    logger.debug(`Acquired lock: ${key}`);
    return true;
  }

  async releaseLock(key: string): Promise<boolean> {
    const existed = this.locks.delete(key);
    logger.debug(`Released lock: ${key}`);
    return existed;
  }

  async getAllLocks(): Promise<string[]> {
    // Only return non-expired locks
    const now = Date.now();
    const locks = Array.from(this.locks.entries())
      .filter(([_, lock]) => lock.expiry > now)
      .map(([key]) => key);
    logger.debug(`Current locks: ${locks.join(', ')}`);
    return locks;
  }

  async clearAllLocks(): Promise<void> {
    const count = this.locks.size;
    this.locks.clear();
    logger.debug(`Cleared ${count} locks`);
  }
}

export const lockService: LockService = new LockServiceImpl();
