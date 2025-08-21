export class MockStripe {
  private static instance: MockStripe;
  private charges: Map<string, any>;
  private customers: Map<string, any>;
  private webhookSecrets: Map<string, string>;
  private debugMode: boolean = false;

  private constructor() {
    this.charges = new Map();
    this.customers = new Map();
    this.webhookSecrets = new Map();
    this.log('MockStripe initialized');
  }

  private log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[MockStripe] ${message}`, ...args);
    }
  }

  enableDebug() {
    this.debugMode = true;
    this.log('Debug mode enabled');
  }

  setWebhookSecret(secret: string) {
    this.webhookSecrets.set('default', secret);
    this.log('Webhook secret set');
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    this.log('Validating webhook signature', { signature });
    const secret = this.webhookSecrets.get('default');
    if (!secret) {
      throw new Error('No webhook secret configured');
    }
    // Simple mock validation - in real Stripe this would use crypto
    return signature === `mock_valid_${secret}`;
  }

  async createCharge(amount: number, currency: string, source: string) {
    this.log('Creating charge', { amount, currency, source });
    
    if (!source) {
      throw new Error('Source is required');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const chargeId = `ch_mock_${Date.now()}`;
    const charge = {
      id: chargeId,
      amount,
      currency,
      source,
      status: 'succeeded',
      created: Date.now(),
    };
    this.charges.set(chargeId, charge);
    this.log('Charge created', charge);
    return charge;
  }

  async createRefund(chargeId: string) {
    this.log('Creating refund for charge', { chargeId });
    
    const charge = await this.retrieveCharge(chargeId);
    if (!charge) {
      throw new Error('Charge not found');
    }

    const refundId = `re_mock_${Date.now()}`;
    const refund = {
      id: refundId,
      charge: chargeId,
      amount: charge.amount,
      status: 'succeeded',
      created: Date.now(),
    };
    
    this.log('Refund created', refund);
    return refund;
  }

  async createCustomer(email: string, source: string) {
    this.log('Creating customer', { email, source });
    
    if (!email) {
      throw new Error('Email is required');
    }

    const customerId = `cus_mock_${Date.now()}`;
    const customer = {
      id: customerId,
      email,
      source,
      created: Date.now(),
    };
    this.customers.set(customerId, customer);
    this.log('Customer created', customer);
    return customer;
  }

  async retrieveCharge(chargeId: string) {
    this.log('Retrieving charge', { chargeId });
    const charge = this.charges.get(chargeId);
    if (!charge) {
      throw new Error('Charge not found');
    }
    return charge;
  }

  static getInstance(): MockStripe {
    if (!MockStripe.instance) {
      MockStripe.instance = new MockStripe();
    }
    return MockStripe.instance;
  }
}

// Export a configured instance
export const stripe = MockStripe.getInstance();
