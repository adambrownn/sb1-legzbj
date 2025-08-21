import { createLogger } from '../lib/logger';
import { WebSocketReconnectionTest } from './components/websocket/reconnection';
import { MessageOrderingTest } from './components/websocket/message-ordering';
import { BookingConflictsTest } from './components/concurrency/booking-conflicts';
import { DistributedLocksTest } from './components/concurrency/distributed-locks';
import { testExecutionState } from './config/unified-test-config';
import { setupTestEnvironment, teardownTestEnvironment } from './setup/test-setup';

const logger = createLogger('component-tests');

async function runComponentTests() {
  logger.info('Starting component tests...');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  let testEnv;

  try {
    // Setup test environment
    testEnv = await setupTestEnvironment();
    logger.info('Test environment initialized');

    const tests = [
      { name: 'WebSocket Reconnection', test: new WebSocketReconnectionTest() },
      { name: 'Message Ordering', test: new MessageOrderingTest() },
      { name: 'Booking Conflicts', test: new BookingConflictsTest() },
      { name: 'Distributed Locks', test: new DistributedLocksTest() }
    ];

    for (const { name, test } of tests) {
      results.total++;
      try {
        logger.info(`Running ${name} test...`);
        await testExecutionState.beforeEach(name);
        
        await test.validate();
        
        results.passed++;
        logger.info(`✓ ${name} test passed`);
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`✗ ${name} test failed:`, { error: errorMessage });
        results.errors.push(`${name}: ${errorMessage}`);
      } finally {
        try {
          await testExecutionState.afterEach(name);
        } catch (cleanupError) {
          logger.error(`Error during test cleanup for ${name}:`, {
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
          });
        }
      }
    }

    // Print summary
    logger.info('\nTest Summary:', {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      success_rate: `${((results.passed / results.total) * 100).toFixed(1)}%`
    });

    if (results.errors.length > 0) {
      logger.error('\nTest Failures:', {
        errors: results.errors
      });
    }
  } catch (error) {
    logger.error('Fatal error during test execution:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    // Cleanup test environment
    if (testEnv) {
      await teardownTestEnvironment(testEnv);
    }
  }

  return results;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComponentTests()
    .then(results => {
      if (results.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      logger.error('Test execution failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    });
}
