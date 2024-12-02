import type { z } from 'zod';
import type { paymentSchema } from '@/lib/validations/payment';

export type PaymentMethod = 'card' | 'paypal';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Payment = z.infer<typeof paymentSchema> & {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: string;
  updatedAt: string;
};