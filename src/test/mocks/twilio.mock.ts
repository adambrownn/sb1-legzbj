export class MockTwilio {
  private static instance: MockTwilio;
  private messages: Map<string, any>;
  private debugMode: boolean = false;
  private invalidPhoneNumbers: Set<string> = new Set(['1234567890']); // Example invalid numbers

  private constructor() {
    this.messages = new Map();
    this.log('MockTwilio initialized');
  }

  private log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[MockTwilio] ${message}`, ...args);
    }
  }

  enableDebug() {
    this.debugMode = true;
    this.log('Debug mode enabled');
  }

  private validatePhoneNumber(phoneNumber: string): boolean {
    if (this.invalidPhoneNumbers.has(phoneNumber)) {
      return false;
    }
    // Basic phone number validation
    return /^\+?[\d\s-]{10,}$/.test(phoneNumber);
  }

  async sendMessage(to: string, from: string, body: string) {
    this.log('Sending message', { to, from, body });

    if (!this.validatePhoneNumber(to)) {
      const error = new Error('Invalid recipient phone number');
      this.log('Error sending message', error);
      throw error;
    }

    if (!this.validatePhoneNumber(from)) {
      const error = new Error('Invalid sender phone number');
      this.log('Error sending message', error);
      throw error;
    }

    if (!body || body.length === 0) {
      const error = new Error('Message body is required');
      this.log('Error sending message', error);
      throw error;
    }

    const messageId = `msg_mock_${Date.now()}`;
    const message = {
      id: messageId,
      to,
      from,
      body,
      status: 'delivered',
      created: Date.now(),
    };
    this.messages.set(messageId, message);
    this.log('Message sent successfully', message);
    return message;
  }

  async getMessage(messageId: string) {
    this.log('Retrieving message', { messageId });
    const message = this.messages.get(messageId);
    if (!message) {
      const error = new Error('Message not found');
      this.log('Error retrieving message', error);
      throw error;
    }
    return message;
  }

  async listMessages() {
    this.log('Listing all messages');
    return Array.from(this.messages.values());
  }

  // Method to simulate message delivery failure
  async simulateDeliveryFailure(messageId: string, reason: string) {
    this.log('Simulating delivery failure', { messageId, reason });
    const message = await this.getMessage(messageId);
    message.status = 'failed';
    message.errorReason = reason;
    this.messages.set(messageId, message);
    return message;
  }

  static getInstance(): MockTwilio {
    if (!MockTwilio.instance) {
      MockTwilio.instance = new MockTwilio();
    }
    return MockTwilio.instance;
  }
}

// Export a configured instance
export const twilio = MockTwilio.getInstance();
