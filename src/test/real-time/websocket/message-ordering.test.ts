import { BaseValidation } from '../../validate-base';
import { webSocketService } from '../../../lib/services/websocket.service';
import { createLogger } from '../../../lib/logger';
import { retryWithBackoff } from '../../config/unified-test-config';

interface Message {
  id: number;
  type: string;
  timestamp: number;
  data?: any;
}

export class MessageOrderingTests extends BaseValidation {
  private wsService = webSocketService.getInstance();
  private logger = createLogger('message-ordering-tests');
  private successCount = 0;
  private failureCount = 0;

  constructor() {
    super('MessageOrdering');
  }

  protected async runValidation(): Promise<void> {
    await this.runWithErrorHandling(async () => {
      await this.validateSequentialDelivery();
    }, 'Sequential delivery validation');

    await this.runWithErrorHandling(async () => {
      await this.validateConcurrentMessages();
    }, 'Concurrent messages validation');

    await this.runWithErrorHandling(async () => {
      await this.validateReconnectionOrdering();
    }, 'Reconnection message ordering validation');

    this.logger.info('Message ordering validation completed', {
      successCount: this.successCount,
      failureCount: this.failureCount
    });
  }

  private async validateSequentialDelivery() {
    this.logger.debug('Starting sequential delivery validation');

    try {
      const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        type: 'test_message',
        timestamp: Date.now() + i * 100,
        data: { sequence: i + 1 }
      }));

      // Send messages sequentially
      for (const msg of messages) {
        await this.wsService.send(msg);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verify received messages
      const receivedMessages = await this.wsService.getReceivedMessages();
      
      const isSequential = receivedMessages.every((msg, i) => {
        if (i === 0) return true;
        return msg.id === receivedMessages[i - 1].id + 1;
      });

      if (isSequential) {
        this.successCount++;
        this.logger.debug('Successfully validated sequential message delivery');
      } else {
        throw new Error('Messages were not delivered in sequence');
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Sequential delivery validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateConcurrentMessages() {
    this.logger.debug('Starting concurrent messages validation');

    try {
      const messages: Message[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: 'concurrent_test',
        timestamp: Date.now(),
        data: { group: Math.floor(i / 2) }
      }));

      // Send messages concurrently
      await Promise.all(messages.map(msg => this.wsService.send(msg)));

      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify received messages
      const receivedMessages = await this.wsService.getReceivedMessages();
      
      const allReceived = messages.every(msg => 
        receivedMessages.some(received => received.id === msg.id)
      );

      if (allReceived) {
        this.successCount++;
        this.logger.debug('Successfully validated concurrent message handling');
      } else {
        throw new Error('Not all concurrent messages were received');
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Concurrent messages validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateReconnectionOrdering() {
    this.logger.debug('Starting reconnection message ordering validation');

    try {
      const preDisconnectMessages: Message[] = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        type: 'pre_disconnect',
        timestamp: Date.now() + i * 100,
        data: { phase: 'before' }
      }));

      // Send pre-disconnect messages
      for (const msg of preDisconnectMessages) {
        await this.wsService.send(msg);
      }

      // Simulate disconnection
      await this.wsService.disconnect();
      this.logger.debug('Simulated disconnection');

      const postDisconnectMessages: Message[] = Array.from({ length: 3 }, (_, i) => ({
        id: i + 4,
        type: 'post_disconnect',
        timestamp: Date.now() + (i + 3) * 100,
        data: { phase: 'after' }
      }));

      // Queue messages while disconnected
      for (const msg of postDisconnectMessages) {
        await this.wsService.queueMessage(msg);
      }

      // Reconnect and verify message ordering
      await this.wsService.connect();
      
      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const receivedMessages = await this.wsService.getReceivedMessages();
      
      const isOrdered = receivedMessages.every((msg, i) => {
        if (i === 0) return true;
        return msg.timestamp >= receivedMessages[i - 1].timestamp;
      });

      if (isOrdered) {
        this.successCount++;
        this.logger.debug('Successfully validated message ordering through reconnection');
      } else {
        throw new Error('Message ordering was not maintained through reconnection');
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Reconnection message ordering validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
