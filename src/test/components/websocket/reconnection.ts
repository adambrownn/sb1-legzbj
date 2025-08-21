import { BaseValidation } from '../../validate-base';
import { mockWebSocketService } from '../../mocks/websocket.mock';
import { createLogger } from '../../../lib/logger';
import { retryWithBackoff } from '../../config/unified-test-config';

export class WebSocketReconnectionTest extends BaseValidation {
  private logger = createLogger('websocket-reconnection');
  private wsService = mockWebSocketService;

  constructor() {
    super('WebSocketReconnection');
  }

  protected async runValidation(): Promise<void> {
    await this.validateTestPreconditions();

    const scenarios = [
      { type: 'networkDisruption', duration: 1000 },
      { type: 'serverRestart', duration: 2000 },
      { type: 'clientTimeout', duration: 500 }
    ];

    for (const scenario of scenarios) {
      await this.validateScenario(scenario);
    }
  }

  private async validateTestPreconditions() {
    this.logger.debug('Validating test preconditions');
    
    try {
      // Ensure WebSocket is connected initially
      if (!this.wsService.isConnected()) {
        await this.wsService.connect();
      }

      // Verify initial connection
      if (!this.wsService.isConnected()) {
        throw new Error('Failed to establish initial WebSocket connection');
      }

      // Clear any existing messages
      this.wsService.clearMessages();

      this.logger.debug('Test preconditions validated successfully');
    } catch (error) {
      throw new Error(`Test precondition validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateScenario(scenario: { type: string; duration: number }) {
    this.logger.debug(`Testing ${scenario.type} scenario`);

    try {
      // Simulate disconnection
      await this.wsService.disconnect();
      this.logger.debug(`Simulated ${scenario.type}`);
      
      // Wait for the specified duration
      await new Promise(resolve => setTimeout(resolve, scenario.duration));

      // Attempt reconnection with backoff
      const reconnected = await retryWithBackoff(
        async () => {
          if (!this.wsService.isConnected()) {
            await this.wsService.connect();
          }
          return this.wsService.isConnected();
        },
        {
          operationName: 'WebSocket Reconnection',
          testId: `reconnect-${scenario.type}`,
          maxAttempts: 3,
          baseDelay: 100,
          maxDelay: 1000,
          multiplier: 2
        },
        this.logger
      );

      if (!reconnected) {
        throw new Error(`Failed to reconnect after ${scenario.type}`);
      }

      // Send a test message to verify connection
      const testMessage = {
        type: 'test',
        content: `Test message after ${scenario.type}`,
        timestamp: Date.now()
      };

      await this.wsService.send(testMessage);
      
      // Verify message was sent
      const messages = this.wsService.getReceivedMessages();
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage || lastMessage.content !== testMessage.content) {
        throw new Error(`Failed to send test message after ${scenario.type}`);
      }

      this.logger.info(`Successfully handled ${scenario.type} scenario`);
    } catch (error) {
      throw new Error(`${scenario.type} scenario failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
