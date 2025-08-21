// Mock Payment Data for Tests

// Custom Refund Interface
export interface Refund {
  id: string;
  amount: number;
  status: string;
  reason?: string;
}

// Mock Bookings Data
export const mockBookings = [
  { id: 'booking-123', amount: 1000, currency: 'USD', status: 'confirmed' },
  { id: 'booking-456', amount: 2000, currency: 'USD', status: 'refunded' },
];

// Mock Payment Methods
export const validCard = {
  id: 'card-valid-123',
  type: 'credit_card',
  card: {
    brand: 'Visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2030,
  },
};

export const declinedCard = {
  id: 'card-declined-456',
  type: 'credit_card',
  card: {
    brand: 'Mastercard',
    last4: '0000',
    exp_month: 11,
    exp_year: 2025,
  },
};

export const invalidCard = {
  id: 'card-invalid-789',
  type: 'credit_card',
  card: {
    brand: 'Amex',
    last4: '9999',
    exp_month: 0o1,
    exp_year: 2022,
  },
};

// Mock Webhook Data
export const mockWebhooks = {
  validWebhook: {
    id: 'evt-webhook-123',
    amount: 1000,
    currency: 'USD',
    paymentMethod: 'credit_card',
    metadata: { bookingId: 'booking-123' },
  },
  invalidWebhook: {
    id: 'evt-webhook-456',
    metadata: {},
  },
};

// Mock Refund Data
export const mockRefunds: Refund[] = [
  { id: 'refund-123', amount: 1000, status: 'completed', reason: 'requested_by_customer' },
  { id: 'refund-456', amount: 500, status: 'pending', reason: 'duplicate_charge' },
];

// Cancellation Policies
export const cancellationPolicies = {
  flexible: { refundPercentage: 100, cancellationPeriod: '24 hours' },
  moderate: { refundPercentage: 50, cancellationPeriod: '48 hours' },
  strict: { refundPercentage: 0, cancellationPeriod: '72 hours' },
};

// Combined Mock Data Export
export const mockPaymentData = {
  mockBookings,
  validCard,
  declinedCard,
  invalidCard,
  mockWebhooks,
  mockRefunds,
  cancellationPolicies,
};
