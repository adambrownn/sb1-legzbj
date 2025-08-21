import { createLogger } from '../logger';

// Create a namespaced logger for this service
const logger = createLogger('cache-service');

export class CacheService {
  private static instance: CacheService | null = null;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: {
    hits: number;
    misses: number;
    deletes: number;
    invalidations: number;
  } = { hits: 0, misses: 0, deletes: 0, invalidations: 0 };
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    logger.info('CacheService initialized');
    this.startCleanupTask();
  }

  private startCleanupTask(): void {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Run cleanup every minute
    logger.info('Started periodic cleanup task');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      logger.debug({ key, stats: this.stats }, 'Cache miss');
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.stats.misses++;
      logger.debug({ key, stats: this.stats }, 'Cache entry expired');
      await this.delete(key);
      return null;
    }

    this.stats.hits++;
    logger.debug({ key, stats: this.stats }, 'Cache hit');
    return entry.value as T;
  }

  public async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const expiry = Date.now() + ttl;
    logger.debug({ key, ttl, expiry }, 'Setting cache entry');
    
    this.cache.set(key, {
      value,
      expiry
    });

    // Set up automatic cleanup for this entry
    setTimeout(() => {
      if (this.cache.has(key)) {
        const entry = this.cache.get(key);
        if (entry && entry.expiry <= Date.now()) {
          this.delete(key);
        }
      }
    }, ttl);
  }

  public async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug({ key, stats: this.stats }, 'Deleted cache entry');
    }
    return deleted;
  }

  public async del(key: string): Promise<void> {
    try {
      const deleted = await this.delete(key);
      if (deleted) {
        this.stats.deletes++;
        logger.debug('Cache entry deleted', {
          key,
          stats: this.stats
        });
      }
    } catch (error) {
      logger.error('Failed to delete cache entry', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async invalidate(pattern: string): Promise<void> {
    try {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      for (const key of keys) {
        await this.del(key);
      }
      this.stats.invalidations++;
      logger.debug('Cache entries invalidated', {
        pattern,
        invalidatedKeys: keys.length,
        stats: this.stats
      });
    } catch (error) {
      logger.error('Failed to invalidate cache entries', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, deletes: 0, invalidations: 0 };
    
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  public static resetInstance(): void {
    if (CacheService.instance) {
      CacheService.instance.clear();
      CacheService.instance = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    const keysToDelete: string[] = [];

    // Collect all expired keys
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        keysToDelete.push(key);
        expiredCount++;
      }
    }

    // Delete expired keys
    keysToDelete.forEach(key => this.delete(key));

    if (expiredCount > 0) {
      logger.debug({ expiredCount, stats: this.stats }, 'Cleaned up expired cache entries');
    }
  }

  public async getStats(): Promise<{
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
    hitRate: number;
    missRate: number;
    deleteRate: number;
  }> {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiry >= now) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    const deleteRate = this.stats.deletes / (this.stats.hits + this.stats.misses);

    logger.info({
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      hitRate,
      missRate,
      deleteRate,
      stats: this.stats
    }, 'Cache statistics');

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      hitRate,
      missRate,
      deleteRate
    };
  }

  public async reset(): Promise<void> {
    await this.clear();
    this.stats = { hits: 0, misses: 0, deletes: 0, invalidations: 0 };
    logger.info('Cache service reset');
  }
}
