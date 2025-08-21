import { jest } from '@jest/globals';
import { RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { EventEmitter } from 'events';
import { RedisService } from '@/lib/services/redis.service';

// Configure Jest timeout and fake timers
jest.setTimeout(30000);

// Define Redis client type
type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

// Define mock function types
type AcquireLockFn = (key: string, value: string, ttl: number) => Promise<boolean>;
type ExtendLockFn = (key: string, value: string, ttl: number) => Promise<boolean>;
type ReleaseLockFn = (key: string, value: string) => Promise<boolean>;
type DisconnectFn = () => Promise<void>;

// Create mock Redis client
const mockRedisClient = {
  set: jest.fn().mockImplementation(async () => 'OK'),
  eval: jest.fn().mockImplementation(async () => 1),
  quit: jest.fn().mockImplementation(async () => 'OK'),
  connect: jest.fn().mockImplementation(async () => mockRedisClient),
  exists: jest.fn().mockImplementation(async () => 1),
  get: jest.fn().mockImplementation(async () => null),
  del: jest.fn().mockImplementation(async () => 1),
  ping: jest.fn().mockImplementation(async () => 'PONG'),
  disconnect: jest.fn().mockImplementation(async () => undefined),
  unref: jest.fn().mockReturnThis(),
  ref: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  removeAllListeners: jest.fn().mockReturnThis(),
  isOpen: false,
  isReady: false,
  options: {},
} as unknown as RedisClientType;

// Create mock functions with proper types
export const mockAcquireLock = jest.fn(async () => true) as jest.MockedFunction<AcquireLockFn>;
export const mockExtendLock = jest.fn(async () => true) as jest.MockedFunction<ExtendLockFn>;
export const mockReleaseLock = jest.fn(async () => true) as jest.MockedFunction<ReleaseLockFn>;
export const mockDisconnect = jest.fn(async () => undefined) as jest.MockedFunction<DisconnectFn>;

// Create mock RedisService instance
export const mockRedisService = {
  acquireLock: mockAcquireLock,
  extendLock: mockExtendLock,
  releaseLock: mockReleaseLock,
  disconnect: mockDisconnect,
} as unknown as RedisService;

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

// Mock RedisService module
jest.mock('@/lib/services/redis.service', () => ({
  RedisService: {
    getInstance: jest.fn(() => mockRedisService),
  },
  ...mockRedisService,
}));

// Mock logger to prevent error messages during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset mock implementations
  mockAcquireLock.mockImplementation(async () => true);
  mockExtendLock.mockImplementation(async () => true);
  mockReleaseLock.mockImplementation(async () => true);
  mockDisconnect.mockImplementation(async () => undefined);

  // Reset Redis client mocks
  (mockRedisClient.set as jest.Mock).mockImplementation(async () => 'OK');
  (mockRedisClient.eval as jest.Mock).mockImplementation(async () => 1);
  (mockRedisClient.quit as jest.Mock).mockImplementation(async () => 'OK');
  (mockRedisClient.exists as jest.Mock).mockImplementation(async () => 1);
  (mockRedisClient.get as jest.Mock).mockImplementation(async () => null);
  (mockRedisClient.del as jest.Mock).mockImplementation(async () => 1);
  (mockRedisClient.ping as jest.Mock).mockImplementation(async () => 'PONG');
});

// Clean up after each test
afterEach(async () => {
  mockRedisClient.removeAllListeners();
});

// Global cleanup
afterAll(async () => {
  jest.clearAllMocks();
  mockRedisClient.removeAllListeners();
});

// Export mocks for use in tests
export {
  mockRedisClient,
};
