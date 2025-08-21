import { EventEmitter } from 'events';
import { createLogger } from '../../lib/logger';

const logger = createLogger('websocket-mock');

class MockWebSocketService extends EventEmitter {
  private static instance: MockWebSocketService;
  private connected: boolean = false;
  private messages: any[] = [];
  private queuedMessages: any[] = [];

  private constructor() {
    super();
  }

  static getInstance(): MockWebSocketService {
    if (!MockWebSocketService.instance) {
      MockWebSocketService.instance = new MockWebSocketService();
    }
    return MockWebSocketService.instance;
  }

  async connect(): Promise<void> {
    this.connected = true;
    logger.debug('Mock WebSocket connected');
    this.emit('connect');
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.debug('Mock WebSocket disconnected');
    this.emit('disconnect');
    return Promise.resolve();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(message: any): Promise<void> {
    if (this.connected) {
      this.messages.push({
        ...message,
        timestamp: Date.now()
      });
      logger.debug('Message sent', { message });
      return Promise.resolve();
    } else {
      logger.debug('Message queued (disconnected)', { message });
      this.queuedMessages.push(message);
      return Promise.reject(new Error('WebSocket not connected'));
    }
  }

  async queueMessage(message: any): Promise<void> {
    this.queuedMessages.push(message);
    logger.debug('Message queued', { message });
    return Promise.resolve();
  }

  getReceivedMessages(): any[] {
    return [...this.messages];
  }

  getQueuedMessages(): any[] {
    return [...this.queuedMessages];
  }

  clearMessages(): void {
    this.messages = [];
    this.queuedMessages = [];
  }

  simulateIncomingMessage(message: any): void {
    this.emit('message', message);
  }

  simulateError(error: Error): void {
    this.emit('error', error);
  }

  simulateReconnect(): void {
    this.connected = true;
    this.emit('reconnect');
    
    // Process queued messages
    while (this.queuedMessages.length > 0) {
      const message = this.queuedMessages.shift();
      if (message) {
        this.messages.push({
          ...message,
          timestamp: Date.now()
        });
      }
    }
  }
}

// Export the mock service
export const mockWebSocketService = MockWebSocketService.getInstance();
