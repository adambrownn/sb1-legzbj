import * as z from 'zod';

export const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month'),
  expiryYear: z.string().regex(/^\d{4}$/, 'Invalid expiry year'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
});