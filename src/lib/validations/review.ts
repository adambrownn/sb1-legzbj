import * as z from 'zod';

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  content: z.string().min(10, 'Review must be at least 10 characters'),
});