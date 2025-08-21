import * as z from 'zod';

export const guestSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const bookingSchema = z.object({
  checkIn: z.date({
    required_error: 'Check-in date is required',
  }),
  checkOut: z.date({
    required_error: 'Check-out date is required',
  }),
}).refine((data) => {
  return data.checkIn < data.checkOut;
}, {
  message: 'Check-in date must be before check-out date',
  path: ['checkIn'],
}).and(z.object({
  guests: z.array(guestSchema).min(1, 'At least one guest is required'),
  totalGuests: z.number().min(1, 'Number of guests is required'),
  specialRequests: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}));

export const bookingQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  propertyId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export type GuestFormValues = z.infer<typeof guestSchema>;
export type BookingFormValues = z.infer<typeof bookingSchema>;