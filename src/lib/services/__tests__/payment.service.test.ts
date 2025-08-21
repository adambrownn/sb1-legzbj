import { PaymentService } from '../payment.service';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');

describe('PaymentService', () => {
  let service: PaymentService;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.STRIPE_API_KEY = 'test_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';

    // Get service instance
    service = PaymentService.getInstance();
    
    // Get the mocked Stripe instance and set up default mocks
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        cancel: jest.fn(),
        update: jest.fn()
      },
      refunds: {
        create: jest.fn()
      },
      webhooks: {
        constructEvent: jest.fn()
      }
    } as unknown as jest.Mocked<Stripe>;
    (service as any).stripe = mockStripe;
  });

  describe('processPayment', () => {
    const mockPaymentDetails = {
      amount: 1000,
      currency: 'usd',
      bookingId: 'booking-123',
      customerId: 'customer-123',
      description: 'Test payment',
      paymentMethod: 'pm_card_visa',
      metadata: {
        bookingId: 'booking-123',
        userId: 'user-123'
      }
    };

    it('should successfully process a payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      };

      mockStripe.paymentIntents.create.mockImplementation(() => 
        Promise.resolve(mockPaymentIntent)
      );

      const result = await service.processPayment(mockPaymentDetails);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: mockPaymentDetails.amount,
          currency: mockPaymentDetails.currency,
          customer: mockPaymentDetails.customerId,
          payment_method: mockPaymentDetails.paymentMethod,
          metadata: mockPaymentDetails.metadata
        })
      );
    });

    it('should handle card errors without retrying', async () => {
      const cardError = new Stripe.errors.StripeCardError({
        type: 'StripeCardError',
        message: 'Your card was declined',
        code: 'card_declined',
        charge: 'ch_123',
        payment_intent: { id: 'pi_123', client_secret: 'secret' },
        payment_method: { id: 'pm_123' }
      });

      mockStripe.paymentIntents.create.mockRejectedValueOnce(cardError);

      const result = await service.processPayment(mockPaymentDetails);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors with exponential backoff', async () => {
      const networkError = new Error('Network error');

      mockStripe.paymentIntents.create
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ id: 'pi_123', status: 'succeeded' } as any);

      const result = await service.processPayment(mockPaymentDetails);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_123');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const networkError = new Error('Network error');

      mockStripe.paymentIntents.create.mockRejectedValue(networkError);

      const result = await service.processPayment(mockPaymentDetails);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment failed after');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('refundPayment', () => {
    it('should successfully process a refund', async () => {
      const mockRefund = {
        id: 're_123',
        status: 'succeeded',
        amount: 1000,
      };

      mockStripe.refunds.create.mockResolvedValueOnce(mockRefund as any);

      const result = await service.refundPayment('pi_123', 1000);

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 1000,
      });
    });

    it('should handle refund errors', async () => {
      const refundError = new Error('Refund failed');
      mockStripe.refunds.create.mockRejectedValueOnce(refundError);

      const result = await service.refundPayment('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund failed');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', async () => {
      const mockEvent = { type: 'payment_intent.succeeded' };
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent as any);

      const result = await service.verifyWebhookSignature('payload', 'signature');

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'test_webhook_secret'
      );
    });

    it('should throw error on invalid signature', async () => {
      const signatureError = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockRejectedValueOnce(signatureError);

      await expect(
        service.verifyWebhookSignature('payload', 'invalid_signature')
      ).rejects.toThrow('Invalid signature');
    });
  });
});
