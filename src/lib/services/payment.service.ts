import { mockPaymentData } from '../../test/mocks/payment-data';

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {
    // Private constructor for singleton
    console.log('PaymentService initialized');
  }

  // Updated method to make constructor accessible during testing
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public async processPayment(payload: {
    amount: number;
    currency: string;
    paymentMethod: string;
    metadata: Record<string, string>;
  }): Promise<{ status: string }> {
    console.log('Processing payment:', payload);
    if (payload.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    return { status: 'success' };
  }

  public async validateWebhook(webhookData: any): Promise<{ status: string }> {
    console.log('Handling webhook with data:', webhookData);
    if (!webhookData || !webhookData.paymentMethod) {
      throw new Error('Invalid webhook data');
    }
    return { status: 'validated' };
  }
}

// Export the instance for easier testing
export const paymentService = PaymentService.getInstance();
