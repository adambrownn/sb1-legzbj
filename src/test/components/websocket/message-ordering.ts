import { BaseValidation } from '../../validate-base';
import { mockWebSocketService } from '../../mocks/websocket.mock';
import { createLogger } from '../../../lib/logger';
import { retryWithBackoff } from '../../config/unified-test-config';

interface TestMessage {
  id: number;
  timestamp: number;
  content: string;
}

export class MessageOrderingTest extends BaseValidation {
  private logger = createLogger('message-ordering');
  private wsService = mockWebSocketService;

  constructor() {
    super('MessageOrdering');
  }

  protected async runValidation(): Promise<void> {
    await this.validateSequentialDelivery();
    await this.validateConcurrentMessages();
    await this.validateReconnectionOrdering();
  }

  private async validateSequentialDelivery() {
    this.logger.debug('Testing sequential message delivery');

    try {
      const messages: TestMessage[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        timestamp: Date.now() + i * 1000,
        content: `Message ${i + 1}`
      }));

      // Clear any existing messages
      this.wsService.clearMessages();

      // Send messages sequentially
      for (const msg of messages) {
        await this.wsService.send(msg);
      }

      // Verify message order
      const receivedMessages = this.wsService.getReceivedMessages();
      
      if (receivedMessages.length !== messages.length) {
        throw new Error(`Expected ${messages.length} messages, got ${receivedMessages.length}`);
      }

      for (let i = 0; i < messages.length - 1; i++) {
        if (receivedMessages[i].id >= receivedMessages[i + 1].id) {
          throw new Error(`Messages out of order at index ${i}`);
        }
      }

      this.logger.info('Sequential delivery test passed');
    } catch (error) {
      throw new Error(`Sequential delivery test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateConcurrentMessages() {
    this.logger.debug('Testing concurrent message delivery');

    try {
      const messages: TestMessage[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        timestamp: Date.now(),
        content: `Concurrent Message ${i + 1}`
      }));

      // Clear any existing messages
      this.wsService.clearMessages();

      // Send messages concurrently
      await Promise.all(messages.map(msg => this.wsService.send(msg)));

      // Verify all messages were received
      const receivedMessages = this.wsService.getReceivedMessages();
      
      if (receivedMessages.length !== messages.length) {
        throw new Error(`Expected ${messages.length} concurrent messages, got ${receivedMessages.length}`);
      }

      // Verify each message was received exactly once
      const messageIds = new Set(receivedMessages.map(msg => msg.id));
      if (messageIds.size !== messages.length) {
        throw new Error('Duplicate or missing messages detected');
      }

      this.logger.info('Concurrent delivery test passed');
    } catch (error) {
      throw new Error(`Concurrent delivery test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateReconnectionOrdering() {
    this.logger.debug('Testing message ordering during reconnection');

    try {
      // Clear any existing messages
      this.wsService.clearMessages();

      // Send initial messages
      const initialMessages: TestMessage[] = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        timestamp: Date.now(),
        content: `Pre-disconnect Message ${i + 1}`
      }));

      for (const msg of initialMessages) {
        await this.wsService.send(msg);
      }

      // Simulate disconnection
      await this.wsService.disconnect();

      // Queue messages during disconnection
      const queuedMessages: TestMessage[] = Array.from({ length: 3 }, (_, i) => ({
        id: initialMessages.length + i + 1,
        timestamp: Date.now(),
        content: `Queued Message ${i + 1}`
      }));

      for (const msg of queuedMessages) {
        await this.wsService.queueMessage(msg);
      }

      // Simulate reconnection
      this.wsService.simulateReconnect();

      // Verify all messages were delivered in order
      const allReceivedMessages = this.wsService.getReceivedMessages();
      const expectedTotalMessages = initialMessages.length + queuedMessages.length;

      if (allReceivedMessages.length !== expectedTotalMessages) {
        throw new Error(`Expected ${expectedTotalMessages} total messages, got ${allReceivedMessages.length}`);
      }

      // Verify message order maintained across reconnection
      for (let i = 0; i < allReceivedMessages.length - 1; i++) {
        if (allReceivedMessages[i].id >= allReceivedMessages[i + 1].id) {
          throw new Error(`Messages out of order after reconnection at index ${i}`);
        }
      }

      this.logger.info('Reconnection ordering test passed');
    } catch (error) {
      throw new Error(`Reconnection ordering test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
