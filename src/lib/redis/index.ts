import { createClient } from 'redis';
import pino from 'pino';

// Create logger without circular dependency
const logger = pino({
  name: 'mock-redis',
  level: process.env.NODE_ENV === 'test' ? 'debug' : 'info'
});

class MockRedisClient {
  private store: Map<string, string>;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;

  constructor() {
    this.store = new Map();
    logger.debug('MockRedisClient initialized');
  }

  get isOpen(): boolean {
    return this.isConnected;
  }

  private async retryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`${operationName} failed (attempt ${attempt}/${this.maxRetries}):`, {
          error: lastError.message,
          attempt,
          maxRetries: this.maxRetries
        });
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error(`${operationName} failed after ${this.maxRetries} attempts`);
  }

  async connect(): Promise<this> {
    if (this.isConnected) {
      logger.debug('Already connected');
      return this;
    }

    if (this.connectionPromise) {
      logger.debug('Connection in progress, waiting...');
      await this.connectionPromise;
      return this;
    }

    this.connectionAttempts++;
    logger.debug(`Connecting (attempt ${this.connectionAttempts})...`);

    this.connectionPromise = this.retryOperation(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('Connected successfully');
    }, 'Redis connection');

    try {
      await this.connectionPromise;
      return this;
    } finally {
      this.connectionPromise = null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.debug('Already disconnected');
      return;
    }

    await this.retryOperation(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      this.isConnected = false;
      this.store.clear();
      logger.info('Disconnected successfully');
    }, 'Redis disconnection');
  }

  private ensureConnected() {
    if (!this.isConnected) {
      throw new Error('Not connected to Redis');
    }
  }

  async ping(): Promise<'PONG'> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      return 'PONG';
    }, 'Redis ping');
  }

  async flushall(): Promise<'OK'> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      this.store.clear();
      return 'OK';
    }, 'Redis flushall');
  }

  async get(key: string): Promise<string | null> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      return this.store.get(key) || null;
    }, 'Redis get');
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      this.store.set(key, value);
      return 'OK';
    }, 'Redis set');
  }

  async del(key: string): Promise<number> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      return this.store.delete(key) ? 1 : 0;
    }, 'Redis del');
  }

  async keys(pattern: string): Promise<string[]> {
    return this.retryOperation(async () => {
      this.ensureConnected();
      return Array.from(this.store.keys());
    }, 'Redis keys');
  }
}

// Export mock client for testing
export const mockRedisClient = new MockRedisClient();

// Export Redis client based on environment
export const getRedisClient = () => {
  if (process.env.NODE_ENV === 'test') {
    logger.debug('Using mock Redis client');
    return mockRedisClient;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  logger.debug(`Creating Redis client with URL: ${url}`);
  
  return createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Max Redis reconnection attempts reached');
          return new Error('Max Redis reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });
};

export default getRedisClient;
