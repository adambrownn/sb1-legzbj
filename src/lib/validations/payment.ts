import * as z from 'zod';

export const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal']),
  cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number').optional(),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month').optional(),
  expiryYear: z.string().regex(/^\d{4}$/, 'Invalid expiry year').optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional(),
  billingAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().min(2, 'Country is required'),
  }).optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  paymentMethod: paymentMethodSchema,
  savePaymentMethod: z.boolean().optional(),
});

export const paymentQuerySchema = z.object({
  bookingId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional(),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;