import { PaymentService } from '../lib/services/payment.service';
import { mockPaymentData } from './mocks/payment-data';

export class PaymentValidation {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = PaymentService.getInstance();
  }

  public async processValidPayment() {
    console.log('\n1. Testing Valid Payment...');
    const validPayload = {
      amount: mockPaymentData.validCard.amount || 1000,
      currency: mockPaymentData.validCard.currency || 'USD',
      paymentMethod: 'credit_card',
      metadata: { bookingId: 'booking-123' },
    };

    const result = await this.paymentService.processPayment(validPayload);
    console.log('Payment Result:', result);
    return result;
  }

  public async processInvalidPayment() {
    console.log('\n2. Testing Invalid Payment...');
    const invalidPayload = {
      amount: -100, // Invalid amount
      currency: 'USD',
      paymentMethod: 'credit_card',
      metadata: { bookingId: 'booking-123' },
    };

    try {
      await this.paymentService.processPayment(invalidPayload);
    } catch (error: any) {
      console.error('Error Handling Invalid Payment:', error.message);
    }
  }

  public async validateWebhook() {
    console.log('\n3. Testing Webhook Validation...');
    const webhookData = {
      paymentMethod: 'credit_card',
      metadata: { bookingId: 'booking-123' },
    };

    const result = await this.paymentService.validateWebhook(webhookData);
    console.log('Webhook Validation Result:', result);
    return result;
  }

  public async validateInvalidWebhook() {
    console.log('\n4. Testing Invalid Webhook...');
    const webhookData = {}; // Invalid data

    try {
      await this.paymentService.validateWebhook(webhookData);
    } catch (error: any) {
      console.error('Error Handling Invalid Webhook:', error.message);
    }
  }
}

export default PaymentValidation;
