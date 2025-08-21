import { stripe } from './stripe.mock';
import { twilio } from './twilio.mock';
import { smtp } from './smtp.mock';

export class MockServiceProvider {
  private static instance: MockServiceProvider;
  private debugMode: boolean = false;

  private constructor() {
    this.log('MockServiceProvider initialized');
  }

  private log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[MockServiceProvider] ${message}`, ...args);
    }
  }

  enableDebug() {
    this.debugMode = true;
    this.log('Debug mode enabled');
    // Enable debug mode for all services
    this.getStripe().enableDebug();
    this.getTwilio().enableDebug();
    this.getSMTP().enableDebug();
  }

  static getInstance(): MockServiceProvider {
    if (!MockServiceProvider.instance) {
      MockServiceProvider.instance = new MockServiceProvider();
    }
    return MockServiceProvider.instance;
  }

  getStripe() {
    this.log('Getting Stripe instance');
    return stripe;
  }

  getTwilio() {
    this.log('Getting Twilio instance');
    return twilio;
  }

  getSMTP() {
    this.log('Getting SMTP instance');
    return smtp;
  }

  // Helper method to set mock environment variables
  setMockEnv() {
    this.log('Setting mock environment variables');
    
    // Stripe configuration
    process.env.STRIPE_SECRET_KEY = 'mock_stripe_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'mock_stripe_webhook_secret';
    this.getStripe().setWebhookSecret(process.env.STRIPE_WEBHOOK_SECRET);
    
    // SMTP configuration
    process.env.SMTP_HOST = 'mock.smtp.host';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'mock_smtp_user';
    process.env.SMTP_PASS = 'mock_smtp_pass';
    
    // Twilio configuration
    process.env.TWILIO_ACCOUNT_SID = 'mock_twilio_sid';
    process.env.TWILIO_AUTH_TOKEN = 'mock_twilio_token';
    
    this.log('Mock environment variables set successfully');
  }

  // Helper method to verify all services are properly mocked
  verifyMocks() {
    this.log('Verifying mock services');
    
    const verificationResults = {
      stripe: {
        available: true,
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      twilio: {
        available: true,
        credentialsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      },
      smtp: {
        available: true,
        credentialsConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      },
    };

    this.log('Mock verification results:', verificationResults);
    return verificationResults;
  }

  // Helper method to reset all mocks to initial state
  resetMocks() {
    this.log('Resetting all mocks to initial state');
    // Re-initialize all service instances
    this.setMockEnv();
  }
}

export const mockServiceProvider = MockServiceProvider.getInstance();
