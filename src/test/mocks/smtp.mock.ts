export class MockSMTP {
  private static instance: MockSMTP;
  private emails: Map<string, any>;
  private debugMode: boolean = false;
  private invalidEmails: Set<string> = new Set(['invalid@example.com']);

  private constructor() {
    this.emails = new Map();
    this.log('MockSMTP initialized');
  }

  private log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[MockSMTP] ${message}`, ...args);
    }
  }

  enableDebug() {
    this.debugMode = true;
    this.log('Debug mode enabled');
  }

  private validateEmail(email: string): boolean {
    if (this.invalidEmails.has(email)) {
      return false;
    }
    // Basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private validateAttachments(attachments?: any[]): void {
    if (!attachments) return;

    for (const attachment of attachments) {
      if (!attachment.filename) {
        throw new Error('Attachment filename is required');
      }
      if (!attachment.content) {
        throw new Error(`Missing content for attachment: ${attachment.filename}`);
      }
    }
  }

  async sendMail(options: {
    from: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }) {
    this.log('Sending email', options);

    const to = Array.isArray(options.to) ? options.to : [options.to];

    // Validate sender
    if (!this.validateEmail(options.from)) {
      const error = new Error('Invalid sender email address');
      this.log('Error sending email', error);
      throw error;
    }

    // Validate recipients
    for (const recipient of to) {
      if (!this.validateEmail(recipient)) {
        const error = new Error(`Invalid recipient email address: ${recipient}`);
        this.log('Error sending email', error);
        throw error;
      }
    }

    // Validate content
    if (!options.text && !options.html) {
      const error = new Error('Either text or html content is required');
      this.log('Error sending email', error);
      throw error;
    }

    // Validate attachments if present
    if (options.attachments) {
      try {
        this.validateAttachments(options.attachments);
      } catch (error) {
        this.log('Error validating attachments', error);
        throw error;
      }
    }

    const messageId = `email_mock_${Date.now()}`;
    const email = {
      id: messageId,
      ...options,
      status: 'sent',
      created: Date.now(),
    };
    this.emails.set(messageId, email);

    this.log('Email sent successfully', email);
    return {
      messageId,
      accepted: to,
      rejected: [],
      response: '250 Message accepted',
    };
  }

  async getEmail(messageId: string) {
    this.log('Retrieving email', { messageId });
    const email = this.emails.get(messageId);
    if (!email) {
      const error = new Error('Email not found');
      this.log('Error retrieving email', error);
      throw error;
    }
    return email;
  }

  async listEmails() {
    this.log('Listing all emails');
    return Array.from(this.emails.values());
  }

  // Method to simulate email delivery failure
  async simulateDeliveryFailure(messageId: string, reason: string) {
    this.log('Simulating delivery failure', { messageId, reason });
    const email = await this.getEmail(messageId);
    email.status = 'failed';
    email.errorReason = reason;
    this.emails.set(messageId, email);
    return email;
  }

  static getInstance(): MockSMTP {
    if (!MockSMTP.instance) {
      MockSMTP.instance = new MockSMTP();
    }
    return MockSMTP.instance;
  }
}

// Export a configured instance
export const smtp = MockSMTP.getInstance();
