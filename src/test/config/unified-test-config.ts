import { mockServiceProvider } from '../mocks/service-provider.mock';
import { bookingStore } from '../../lib/store/booking-store';
import { nanoid } from 'nanoid';
import { pino } from 'pino';
import type { CalendarSyncService } from '../../lib/services/calendar-sync.service';
import type { PaymentService } from '../../lib/services/payment.service';
import { Redis } from 'ioredis';
import { createLogger } from '../../lib/logger';
import { spawn } from 'child_process';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { Server } from 'http';
import { mockRedisClient } from '../../lib/redis';
import { lockService } from '../../lib/lock/lock-service';
import type { BookingStore } from '../../lib/store/booking-store';
import type { Response } from 'node-fetch';

// Create __TEST_SERVER__ global type
declare global {
  var __TEST_SERVER__: any;
}

// Enable debug mode for all services
mockServiceProvider.enableDebug();

// Set mock environment variables
mockServiceProvider.setMockEnv();

// Test Configuration Interface
export interface TestConfig {
  timeouts: {
    lockAcquisition: number;   // Time to wait for lock acquisition
    lockRetry: number;         // Time between lock retry attempts
    lockExpiry: number;        // Time until lock expires
    testCleanup: number;       // Time allowed for cleanup operations
    networkRequest: number;    // Timeout for external API calls
  };
  retries: {
    maxLockAttempts: number;      // Maximum attempts to acquire a lock
    maxPaymentAttempts: number;   // Maximum attempts for payment processing
    backoffMultiplier: number;    // Multiplier for exponential backoff
    maxBackoffDelay: number;      // Maximum delay between retries
    minBackoffDelay: number;      // Minimum delay between retries
  };
  testIsolation: {
    useUniquePropertyIds: boolean;    // Generate unique property IDs per test
    clearStateBeforeEach: boolean;    // Clear all state before each test
    clearStateAfterEach: boolean;     // Clear all state after each test
    parallelExecutionEnabled: boolean; // Allow parallel test execution
    uniqueNamespacePerTest: boolean;  // Use unique namespace for each test
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeTimestamps: boolean;
    includeTestExecutionState: boolean;
    detailedLockLogs: boolean;     // Log detailed lock operations
    detailedPaymentLogs: boolean;  // Log detailed payment operations
    detailedCleanupLogs: boolean;  // Log detailed cleanup operations
  };
  mocks: {
    payment: {
      defaultCardToken: string;
      validTestCards: {
        [key: string]: string;
      };
      simulatedDelays: {
        processing: number;
        validation: number;
      };
    };
    calendar: {
      defaultPropertyId: string;
      externalSources: string[];
      simulatedDelays: {
        sync: number;
        update: number;
      };
    };
  };
  stateVerification: {
    enabled: boolean;
    verifyAfterEach: boolean;
    components: {
      locks: boolean;
      bookings: boolean;
      cache: boolean;
      payments: boolean;
    };
    maxVerificationAttempts: number;
    verificationTimeout: number;
  };
}

// Default configuration
export const defaultTestConfig: TestConfig = {
  timeouts: {
    lockAcquisition: 30000,    // Increased to 30 seconds
    lockRetry: 500,           // Decreased to 500ms for faster retries
    lockExpiry: 60000,        // Decreased to 1 minute
    testCleanup: 30000,       // Increased to 30 seconds
    networkRequest: 10000     // Increased to 10 seconds
  },
  retries: {
    maxLockAttempts: 15,      // Increased attempts
    maxPaymentAttempts: 5,    // Increased attempts
    backoffMultiplier: 1.5,
    maxBackoffDelay: 8000,    // Increased to 8 seconds
    minBackoffDelay: 100      // 100ms
  },
  testIsolation: {
    useUniquePropertyIds: true,
    clearStateBeforeEach: true,
    clearStateAfterEach: true,
    parallelExecutionEnabled: false,  // Disabled parallel execution
    uniqueNamespacePerTest: true
  },
  logging: {
    level: 'debug',
    includeTimestamps: true,
    includeTestExecutionState: true,
    detailedLockLogs: true,
    detailedPaymentLogs: true,
    detailedCleanupLogs: true
  },
  mocks: {
    payment: {
      defaultCardToken: 'tok_visa_test',
      validTestCards: {
        visa: 'tok_visa_test',
        mastercard: 'tok_mastercard_test',
        amex: 'tok_amex_test'
      },
      simulatedDelays: {
        processing: 200,   // Decreased to 200ms
        validation: 100    // Decreased to 100ms
      }
    },
    calendar: {
      defaultPropertyId: 'test_property_default',
      externalSources: ['airbnb', 'booking', 'vrbo'],
      simulatedDelays: {
        sync: 150,    // Decreased to 150ms
        update: 100   // Decreased to 100ms
      }
    }
  },
  stateVerification: {
    enabled: true,
    verifyAfterEach: true,
    components: {
      locks: true,
      bookings: true,
      cache: true,
      payments: true
    },
    maxVerificationAttempts: 3,
    verificationTimeout: 5000
  }
};

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Enhanced logger setup with better context
const createLogger = (context: string) => pino({
  name: context,
  level: 'debug',
  timestamp: true,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Test execution tracking
export interface TestExecutionState {
  currentTest: string;
  currentSuite: string;
  startTime: Date;
  config?: TestConfig;
  testIds: Map<string, string>;
  logger: pino.Logger;
}

// Test lifecycle hooks
export interface TestHooks {
  beforeEach: (testName?: string, suiteName?: string) => Promise<void>;
  afterEach: (testName?: string) => Promise<void>;
}

export const testLifecycle: TestHooks = {
  beforeEach: async (testName?: string, suiteName?: string) => {
    const logger = createLogger('test-lifecycle');
    try {
      logger.info('Running before each test hook', { testName, suiteName });
      await beforeEachTestHookNew();
    } catch (error) {
      logger.error('Failed in before each hook:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testName,
        suiteName
      });
      throw error;
    }
  },

  afterEach: async (testName?: string) => {
    const logger = createLogger('test-lifecycle');
    try {
      logger.info('Running after each test hook', { testName });
      await customAfterEachTest(testName);
    } catch (error) {
      logger.error('Failed in after each hook:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testName
      });
      throw error;
    }
  }
};

// Export lifecycle hooks for backward compatibility
export const beforeEachTest = testLifecycle.beforeEach;
export const afterEachTest = testLifecycle.afterEach;

// Test execution state
export const testState: TestExecutionState = {
  currentTest: '',
  currentSuite: '',
  startTime: new Date(),
  config: defaultTestConfig,
  testIds: new Map(),
  logger: createLogger('test-execution-state')
};

// Error handling utilities
const handleTestError = (error: Error, phase: string) => {
  const logger = createLogger('test-error');
  logger.error({
    error: error.message,
    stack: error.stack,
    phase,
  }, `Error during ${phase}`);
  throw error;
};

// Before each test hook
export async function beforeEachTestHookNew(): Promise<void> {
  const logger = createLogger('test-hook');
  
  try {
    logger.info('Running before each test hook...');
    
    // Reset all state
    await resetTestStore();
    
    // Verify server is healthy
    const isHealthy = await verifyServiceHealth(3001, 5, 1000);
    if (!isHealthy) {
      logger.error('Server health check failed');
      throw new Error('Server health check failed');
    }
    
    logger.info('Before each test hook completed successfully');
  } catch (error) {
    logger.error('Failed in before each test hook:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// After each test hook
export async function afterEachTestHookNew(): Promise<void> {
  const logger = createLogger('test-hook');
  
  try {
    logger.info('Running after each test hook...');
    await resetTestStore();
    logger.info('After each test hook completed successfully');
  } catch (error) {
    logger.error('Failed in after each test hook:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Setup test hooks
export const beforeEachTestHook = async (testName?: string, suiteName?: string) => {
  const logger = createLogger('test-setup');
  
  try {
    logger.info({ testName, suiteName }, 'Setting up test');
    await testExecutionState.beforeEach(testName || 'unnamed-test');
    await resetTestStore();
    logger.info({ testName, suiteName }, 'Test setup completed');
  } catch (error) {
    handleTestError(error instanceof Error ? error : new Error(String(error)), 'beforeEachTest');
  }
};

export const afterEachTestHook = async (testName?: string) => {
  const logger = createLogger('test-cleanup');
  
  try {
    logger.info({ testName: testName || testState.currentTest }, 'Cleaning up test');
    await testExecutionState.afterEach(testName || testState.currentTest);
    await resetTestStore();
    logger.info({ testName: testName || testState.currentTest }, 'Test cleanup completed');
  } catch (error) {
    handleTestError(error instanceof Error ? error : new Error(String(error)), 'afterEachTest');
  }
};

// Initialize store with test data
const initializeTestStore = async () => {
  const logger = createLogger('test-store');
  logger.info('Initializing test store');
  
  try {
    // Reset store to initial state
    bookingStore.setState({
      initialized: false,
      bookings: [],
      locks: new Map(),
      cache: new Map()
    });
    
    logger.info('Test store initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize test store:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Enhanced retry utility with exponential backoff and detailed logging
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    testId: string;
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    multiplier: number;
  },
  logger: pino.Logger
): Promise<T> {
  let attempt = 1;
  let lastError: Error | null = null;

  while (attempt <= context.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === context.maxAttempts) {
        break;
      }

      const delay = Math.min(
        context.baseDelay * Math.pow(context.multiplier, attempt - 1),
        context.maxDelay
      );

      logger.debug(`Retry attempt ${attempt}/${context.maxAttempts} for ${context.operationName}`, {
        testId: context.testId,
        delay,
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error(
    `${context.operationName} failed after ${context.maxAttempts} attempts: ${lastError?.message}`
  );
}

// Enhanced state verification
export async function verifyTestState(): Promise<void> {
  const logger = createLogger('test-state-verifier');
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Check Redis connection first
      const { mockRedisClient } = await import('../../lib/redis');
      if (!mockRedisClient.isOpen) {
        logger.debug('Redis not connected, connecting...');
        await mockRedisClient.connect();
      }

      // Verify Redis connection with ping
      try {
        await mockRedisClient.ping();
        logger.debug('Redis connection verified');
      } catch (pingError) {
        throw new Error(`Redis connection check failed: ${pingError instanceof Error ? pingError.message : 'Unknown error'}`);
      }
      
      // Check Redis state
      let keys: string[] = [];
      try {
        keys = await mockRedisClient.keys('*');
        logger.debug('Redis keys check completed', { keyCount: keys.length });
      } catch (keysError) {
        throw new Error(`Failed to check Redis keys: ${keysError instanceof Error ? keysError.message : 'Unknown error'}`);
      }

      if (keys.length > 0) {
        logger.warn('Found residual Redis keys', { keys });
        // Try to clean up the keys
        for (const key of keys) {
          try {
            await mockRedisClient.del(key);
            logger.debug(`Cleaned up key: ${key}`);
          } catch (delError) {
            logger.warn(`Failed to clean up key ${key}:`, {
              error: delError instanceof Error ? delError.message : 'Unknown error'
            });
          }
        }
        // Verify again after cleanup
        keys = await mockRedisClient.keys('*');
        if (keys.length > 0) {
          throw new Error(`Still found residual Redis keys after cleanup: ${keys.join(', ')}`);
        }
      }
      
      // Check locks
      const { lockService } = await import('../../lib/lock/lock-service');
      let locks: string[] = [];
      try {
        locks = await lockService.getAllLocks();
        logger.debug('Lock check completed', { lockCount: locks.length });
      } catch (locksError) {
        throw new Error(`Failed to check locks: ${locksError instanceof Error ? locksError.message : 'Unknown error'}`);
      }

      if (locks.length > 0) {
        logger.warn('Found residual locks', { locks });
        // Try to clean up the locks
        try {
          await lockService.clearAllLocks();
          logger.debug('Cleaned up all locks');
          // Verify again after cleanup
          locks = await lockService.getAllLocks();
          if (locks.length > 0) {
            throw new Error(`Still found residual locks after cleanup: ${locks.join(', ')}`);
          }
        } catch (clearError) {
          throw new Error(`Failed to clear locks: ${clearError instanceof Error ? clearError.message : 'Unknown error'}`);
        }
      }
      
      // Check booking store
      const { bookingStore } = await import('../../lib/store/booking-store');
      if (bookingStore.getState().initialized) {
        logger.warn('Booking store still initialized, resetting...');
        try {
          bookingStore.reset();
          bookingStore.setInitialized(false);
          logger.debug('Booking store reset completed');
        } catch (resetError) {
          throw new Error(`Failed to reset booking store: ${resetError instanceof Error ? resetError.message : 'Unknown error'}`);
        }
      }
      
      logger.info('Test state verified successfully');
      return;
      
    } catch (error) {
      attempt++;
      const isLastAttempt = attempt === maxRetries;
      
      logger.warn(`State verification attempt ${attempt}/${maxRetries} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        isLastAttempt
      });
      
      if (isLastAttempt) {
        logger.error('State verification failed after all attempts', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          attempts: attempt
        });
        throw error;
      }
      
      // Exponential backoff with jitter
      const baseDelay = 1000;
      const maxJitter = 500;
      const delay = Math.min(Math.pow(2, attempt) * baseDelay + Math.random() * maxJitter, 10000);
      logger.debug(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Reset store between tests with enhanced verification and cleanup
export async function resetTestStore(): Promise<void> {
  const logger = createLogger('test-store');
  
  try {
    logger.info('Resetting test store...');
    
    // Clear Redis mock with retries
    const { mockRedisClient } = await import('../../lib/redis');
    
    // Ensure Redis is connected
    if (!mockRedisClient.isOpen) {
      logger.debug('Redis not connected, connecting...');
      await mockRedisClient.connect();
    }
    
    // Flush Redis with retries
    let retries = 3;
    while (retries > 0) {
      try {
        await mockRedisClient.flushall();
        logger.debug('Redis flushed successfully');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(`Failed to flush Redis (${retries} retries left):`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Reset booking store
    const { bookingStore } = await import('../../lib/store/booking-store');
    await bookingStore.clear();
    bookingStore.setInitialized(false);
    logger.debug('Booking store reset successfully');
    
    // Clear all locks with retries
    const { lockService } = await import('../../lib/lock/lock-service');
    retries = 3;
    while (retries > 0) {
      try {
        await lockService.clearAllLocks();
        logger.debug('Locks cleared successfully');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(`Failed to clear locks (${retries} retries left):`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Wait for changes to propagate with progress tracking
    logger.debug('Waiting for changes to propagate...');
    const propagationDelay = 1000;
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, propagationDelay));
    logger.debug(`Changes propagated after ${Date.now() - startTime}ms`);
    
    // Verify state with retries
    retries = 3;
    while (retries > 0) {
      try {
        await verifyTestState();
        logger.debug('State verification successful');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(`State verification failed (${retries} retries left):`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info('Test store reset complete');
  } catch (error) {
    logger.error('Failed to reset test store:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      phase: 'store-reset'
    });
    throw error;
  }
}

// Verify service health
export async function verifyServiceHealth(port: number, retries = 3, delay = 1000): Promise<boolean> {
  const logger = createLogger('health-check');
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy') {
          logger.info('Service is healthy');
          return true;
        }
      }
      logger.warn(`Health check failed (attempt ${attempts + 1}/${retries})`);
    } catch (error) {
      logger.warn(`Health check failed (attempt ${attempts + 1}/${retries}):`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    attempts++;
    if (attempts < retries) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}

// Date validation utility
export function validateDateRange(checkIn: Date, checkOut: Date, context: string = ''): boolean {
  const logger = createLogger('date-validation');
  
  try {
    if (!(checkIn instanceof Date) || !(checkOut instanceof Date)) {
      logger.error('Invalid date objects provided', {
        context,
        checkIn: checkIn?.toString(),
        checkOut: checkOut?.toString(),
        checkInType: typeof checkIn,
        checkOutType: typeof checkOut
      });
      return false;
    }

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      logger.error('Invalid date values provided', {
        context,
        checkIn: checkIn.toString(),
        checkOut: checkOut.toString()
      });
      return false;
    }

    // For IST (UTC+5:30), we'll use the exact timestamps without normalization
    const checkInTime = checkIn.getTime();
    const checkOutTime = checkOut.getTime();
    
    if (checkInTime >= checkOutTime) {
      logger.warn('Check-in time must be before check-out time', {
        context,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        difference: checkOutTime - checkInTime
      });
      return false;
    }

    // Use current time for comparisons
    const now = new Date();
    const maxFutureDate = new Date(now);
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2); // 2 years into future

    if (checkInTime < now.getTime()) {
      logger.warn('Check-in time cannot be in the past', {
        context,
        checkIn: checkIn.toISOString(),
        now: now.toISOString()
      });
      return false;
    }

    if (checkOutTime > maxFutureDate.getTime()) {
      logger.warn('Check-out time too far in the future', {
        context,
        checkOut: checkOut.toISOString(),
        maxAllowed: maxFutureDate.toISOString()
      });
      return false;
    }

    logger.debug('Date validation passed', {
      context,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString()
    });

    return true;
  } catch (error) {
    logger.error('Error during date validation', {
      context,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Test Execution State Class
export class TestExecutionState {
  private static instance: TestExecutionState;
  private readonly config: TestConfig;
  private readonly testIds: Map<string, string> = new Map();
  private readonly logger: pino.Logger;

  private constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...defaultTestConfig, ...config };
    this.logger = createLogger('test-execution-state');
  }

  public static getInstance(config?: Partial<TestConfig>): TestExecutionState {
    if (!TestExecutionState.instance) {
      TestExecutionState.instance = new TestExecutionState(config);
    }
    return TestExecutionState.instance;
  }

  public getConfig(): TestConfig {
    return this.config;
  }

  public getCurrentTestId(): string {
    return testState.currentTest || 'unknown-test';
  }

  public generateUniquePropertyId(): string {
    return `test-property-${nanoid()}`;
  }

  public getTestCardToken(scenario: 'success' | 'decline' | 'insufficient_funds' | 'expired'): string {
    const tokens = {
      success: 'tok_visa_success',
      decline: 'tok_visa_decline',
      insufficient_funds: 'tok_visa_insufficient_funds',
      expired: 'tok_visa_expired'
    };
    return tokens[scenario] || tokens.success;
  }

  public async beforeEach(testName: string): Promise<void> {
    this.logger.info(`Running beforeEach for test: ${testName}`);
    try {
      // Clear any existing state
      await this.clearState();
      
      // Initialize test-specific data
      const testId = nanoid();
      this.testIds.set(testName, testId);
      
      // Set test context
      testState.currentTest = testName;
      testState.startTime = new Date();
      
      this.logger.info('Test initialization complete', {
        testName,
        testId,
        startTime: testState.startTime
      });
    } catch (error) {
      this.logger.error('Failed to initialize test', {
        testName,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  public async afterEach(testName: string): Promise<void> {
    this.logger.info(`Running afterEach for test: ${testName}`);
    try {
      // Clean up test-specific data
      await this.clearState();
      this.testIds.delete(testName);
      
      // Clear test context
      testState.currentTest = '';
      testState.currentSuite = '';
      testState.startTime = undefined;
      
      this.logger.info('Test cleanup complete', { testName });
    } catch (error) {
      this.logger.error('Failed to clean up test', {
        testName,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async clearState(): Promise<void> {
    this.logger.info('Clearing test state');
    try {
      // Clear bookings
      await bookingStore.clear();
      
      // Clear cache if needed
      if (this.config.testIsolation.clearStateBeforeEach) {
        // Add cache clearing logic here if needed
      }
      
      this.logger.info('Test state cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear test state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// Create and export singleton instance
export const testExecutionState = TestExecutionState.getInstance();

// Export the unified test config
export const unifiedTestConfig = {
  testSuites: {
    availability: {
      enabled: true,
      timeout: 300000, // 5 minutes
      retries: 3,
      debug: true,
      beforeEach: beforeEachTestHookNew,
      afterEach: afterEachTestHookNew,
      isolationLevel: 'strict', // New setting for test isolation
      cleanupTimeout: 5000, // Timeout for cleanup operations
      tests: [
        {
          name: 'Availability Tests',
          file: resolve(__dirname, '../validate-availability'),  // Resolve path relative to current file
          description: 'Tests for property availability validation'
        }
      ]
    },
    calendarSync: {
      enabled: true,
      timeout: 300000,
      retries: 3,
      debug: true,
      beforeEach: beforeEachTestHookNew,
      afterEach: afterEachTestHookNew,
    },
    payment: {
      enabled: true,
      timeout: 300000,
      retries: 3,
      debug: true,
      beforeEach: beforeEachTestHookNew,
      afterEach: afterEachTestHookNew,
      isolationLevel: 'strict',
      cleanupTimeout: 5000,
      testCards: {
        valid: 'tok_visa_test',
        declined: 'tok_declined_test',
        expired: 'tok_expired_test'
      }
    },
    bookingModification: {
      enabled: true,
      timeout: 300000,
      retries: 3,
      debug: true,
      beforeEach: beforeEachTestHookNew,
      afterEach: afterEachTestHookNew,
    },
    loadTesting: {
      enabled: true,
      timeout: 300000,
      virtualUsers: 1000,
      duration: 300, // 5 minutes
      debug: true,
      beforeEach: beforeEachTestHookNew,
      afterEach: afterEachTestHookNew,
    },
  },
  environment: {
    redis: {
      enabled: false, // Use mock Redis
      url: 'redis://localhost:6379',
      prefix: 'test:',
      ttl: 3600
    }
  },
  logging: {
    level: 'debug',
    colorize: true,
    timestamps: true,
    testContext: true
  }
};

// Start server process
export async function startTestServer(): Promise<void> {
  const logger = createLogger('test-server');
  const maxRetries = 3;
  const portCheckDelay = 2000; // 2 seconds
  const port = Number(process.env.PORT) || 3001;
  
  // Check if server is already running
  if (global.__TEST_SERVER__) {
    logger.info('Test server is already running');
    return;
  }
  
  try {
    logger.info('Starting test server...');
    
    // Kill any existing process on port
    try {
      const { execSync } = await import('child_process');
      execSync(`lsof -i :${port} -t | xargs kill -9`, { stdio: 'ignore' });
      logger.info(`Killed existing processes on port ${port}`);
    } catch (error) {
      // Ignore errors if no process found
      logger.debug('No existing process found on port');
    }

    // Wait and verify port is available
    let portAvailable = false;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, portCheckDelay));
      
      try {
        const { execSync } = await import('child_process');
        execSync(`lsof -i :${port}`, { stdio: 'ignore' });
        logger.warn(`Port ${port} still in use, retrying...`);
      } catch {
        // Port is available
        portAvailable = true;
        break;
      }
    }

    if (!portAvailable) {
      throw new Error(`Port ${port} is still in use after ${maxRetries} attempts`);
    }

    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = String(port);
    process.env.CLIENT_PORT = '3005';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.REDIS_ENABLED = 'false';

    // Import and start server
    logger.debug('Importing server module...');
    const serverModule = await import('../../../server').catch(error => {
      logger.error('Failed to import server module:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    });

    if (!serverModule.app) {
      throw new Error('Server module does not export app');
    }

    // Create server with timeout
    logger.debug('Creating server instance...');
    const server = serverModule.app.listen(port);
    
    // Add error handler
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is still in use. Please ensure no other process is using it.`, {
          port,
          error: error.message,
          code: error.code
        });
      } else {
        logger.error('Server error:', {
          error: error instanceof Error ? error.message : error,
          code: error.code,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      throw error;
    });

    // Set connection timeout
    server.setTimeout(5000);

    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const timeoutError = new Error('Server failed to start within timeout');
        logger.error('Server startup timeout:', {
          error: timeoutError.message,
          stack: timeoutError.stack
        });
        reject(timeoutError);
      }, 5000);

      server.once('listening', () => {
        clearTimeout(timeoutId);
        logger.info(`Server is running on port ${port}`);
        logger.info('Client URL: http://localhost:3005');
        resolve();
      });
      
      server.once('error', (error) => {
        clearTimeout(timeoutId);
        logger.error('Server startup error:', {
          error: error instanceof Error ? error.message : error,
          code: (error as any).code,
          stack: error instanceof Error ? error.stack : undefined
        });
        reject(error);
      });
    });

    // Store server instance for cleanup
    global.__TEST_SERVER__ = server;

  } catch (error) {
    logger.error('Failed to start test server:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any).code
    });
    
    // Attempt cleanup if server was created but failed to start
    if (global.__TEST_SERVER__) {
      try {
        await cleanupTestServer();
      } catch (cleanupError) {
        logger.error('Failed to cleanup server after startup failure:', {
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
          stack: cleanupError instanceof Error ? cleanupError.stack : undefined
        });
      }
    }
    
    throw error;
  }
}

// Add cleanup function
export async function cleanupTestServer(): Promise<void> {
  const logger = createLogger('test-server');
  
  try {
    if ((global as any).__TEST_SERVER__) {
      await new Promise<void>((resolve, reject) => {
        (global as any).__TEST_SERVER__.close((err: Error | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      delete (global as any).__TEST_SERVER__;
      logger.info('Test server cleaned up successfully');
    }
  } catch (error) {
    logger.error('Failed to cleanup test server:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Runner
export async function runTests() {
  const logger = createLogger('test-runner');
  logger.info('Starting unified test suite...', {
    environment: process.env.NODE_ENV,
    redis: process.env.REDIS_ENABLED,
    port: process.env.PORT
  });

  try {
    // Initialize Redis first
    logger.info('Initializing Redis...');
    const { mockRedisClient } = await import('../../lib/redis');
    
    try {
      if (!mockRedisClient.isOpen) {
        await mockRedisClient.connect();
      }
      await mockRedisClient.ping();
      logger.info('Redis initialized successfully');
    } catch (redisError) {
      logger.error('Redis initialization failed:', {
        error: redisError instanceof Error ? redisError.message : 'Unknown error',
        stack: redisError instanceof Error ? redisError.stack : undefined,
        type: redisError?.constructor?.name
      });
      throw redisError;
    }

    // Reset test state before starting
    logger.info('Resetting initial test state...');
    await resetTestStore();
    logger.info('Initial test state reset complete');

    // Start the test server
    logger.info('Starting test server...');
    await startTestServer();
    
    // Verify server health
    logger.info('Verifying server health...');
    const isHealthy = await verifyServiceHealth(3001, 5, 2000);
    if (!isHealthy) {
      throw new Error('Server health check failed after startup');
    }
    logger.info('Server health verified');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const failedTestDetails: Array<{
      name: string;
      suite: string;
      error: string;
      stack?: string;
    }> = [];

    for (const [suiteName, suite] of Object.entries(unifiedTestConfig.testSuites)) {
      if (!suite.enabled) {
        logger.info(`Skipping disabled test suite: ${suiteName}`);
        continue;
      }

      logger.info(`Running test suite: ${suiteName}`);
      
      if (suite.tests) {
        for (const test of suite.tests) {
          totalTests++;
          try {
            logger.info(`Running test: ${test.name}`);
            
            // Run beforeEach hook
            if (suite.beforeEach) {
              try {
                await suite.beforeEach(test.name, suiteName);
              } catch (hookError) {
                logger.error(`Failed to run beforeEach hook for ${test.name}`, {
                  error: hookError instanceof Error ? hookError.message : 'Unknown error',
                  stack: hookError instanceof Error ? hookError.stack : undefined,
                  type: hookError?.constructor?.name
                });
                throw hookError;
              }
            }

            // Import and run the test file
            try {
              const testPath = resolve(__dirname, test.file);
              logger.debug(`Importing test file from: ${testPath}`);
              
              const testModule = await import(testPath);
              logger.debug('Test module imported:', {
                hasDefault: !!testModule.default,
                exports: Object.keys(testModule)
              });

              if (typeof testModule.default !== 'function') {
                throw new Error(`Test file ${test.file} does not export a default function`);
              }
              
              logger.info(`Starting test execution: ${test.name}`);
              const result = await testModule.default();
              logger.debug('Test execution completed', { result });
              
              passedTests++;
              logger.info(`✓ Test passed: ${test.name}`);
            } catch (testError) {
              failedTests++;
              const errorDetails = {
                name: test.name,
                suite: suiteName,
                error: testError instanceof Error ? testError.message : 'Unknown error',
                stack: testError instanceof Error ? testError.stack : undefined
              };
              failedTestDetails.push(errorDetails);
              
              logger.error(`✗ Test failed: ${test.name}`, errorDetails);
              continue;
            }

            // Run afterEach hook
            if (suite.afterEach) {
              try {
                await suite.afterEach(test.name);
              } catch (hookError) {
                logger.error(`Failed to run afterEach hook for ${test.name}`, {
                  error: hookError instanceof Error ? hookError.message : 'Unknown error',
                  stack: hookError instanceof Error ? hookError.stack : undefined,
                  type: hookError?.constructor?.name
                });
              }
            }
          } catch (error) {
            failedTests++;
            const errorDetails = {
              name: test.name,
              suite: suiteName,
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            };
            failedTestDetails.push(errorDetails);
            
            logger.error(`✗ Test failed: ${test.name}`, errorDetails);
            continue;
          }
        }
      }
    }

    // Log test results
    logger.info('Test run completed', {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      failedTests: failedTestDetails
    });

    if (failedTests > 0) {
      throw new Error(`${failedTests} test(s) failed`);
    }

  } catch (error) {
    logger.error('Test run failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    });
    throw error;
  } finally {
    // Cleanup
    try {
      logger.info('Cleaning up test environment...');
      await cleanupTestServer();
      const { mockRedisClient } = await import('../../lib/redis');
      if (mockRedisClient.isOpen) {
        await mockRedisClient.disconnect();
      }
      logger.info('Cleanup completed');
    } catch (cleanupError) {
      logger.error('Cleanup failed:', {
        error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
        stack: cleanupError instanceof Error ? cleanupError.stack : undefined,
        type: cleanupError?.constructor?.name
      });
    }
  }
}

// Export test lifecycle helper
export const runTestWithLifecycle = async (testName: string, suiteName: string, testFn: () => Promise<void>) => {
  await testHooks.beforeEach(testName, suiteName);
  try {
    await testFn();
  } finally {
    await testHooks.afterEach(testName);
  }
};

export const customAfterEachTest = async (testName?: string) => {
  console.log('Running customAfterEachTest to clean up state...');
  await resetTestStore();
  const { mockRedisClient } = await import('../../lib/redis');
  await mockRedisClient.flushAll();
  console.log('State has been reset and Redis flushed.');
};

// Run the tests
runTests().catch(error => {
  const logger = createLogger('test-runner');
  logger.error('Failed to run tests:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    type: error?.constructor?.name
  });
  process.exit(1);
});
