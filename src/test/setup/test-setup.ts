import { createLogger } from '../../lib/logger';
import { mockServiceProvider } from '../mocks/service-provider.mock';
import { Redis } from 'ioredis';
import { mockWebSocketService } from '../mocks/websocket.mock';

const logger = createLogger('test-setup');

export async function setupTestEnvironment() {
  logger.info('Setting up test environment...');

  try {
    // Enable debug mode for all services
    mockServiceProvider.enableDebug();
    mockServiceProvider.setMockEnv();

    // Initialize Redis
    const redis = new Redis();
    await redis.ping();
    logger.info('Redis connection established');

    // Initialize Mock WebSocket service
    await mockWebSocketService.connect();
    logger.info('Mock WebSocket service initialized');

    return {
      redis,
      webSocket: mockWebSocketService,
      cleanup: async () => {
        logger.info('Cleaning up test environment...');
        await redis.quit();
        await mockWebSocketService.disconnect();
        mockWebSocketService.clearMessages();
      }
    };
  } catch (error) {
    logger.error('Failed to setup test environment:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function teardownTestEnvironment(env: { cleanup: () => Promise<void> }) {
  try {
    await env.cleanup();
    logger.info('Test environment cleaned up successfully');
  } catch (error) {
    logger.error('Error during test environment cleanup:', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
