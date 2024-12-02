import * as z from 'zod';

export const guestDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  guests: z.number().min(1, 'At least one guest is required'),
});

export const bookingSchema = z.object({
  checkIn: z.date(),
  checkOut: z.date(),
  guests: z.number().min(1),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  totalAmount: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});