import * as z from 'zod';

export const reviewSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review cannot exceed 500 characters'),
  cleanliness: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  checkIn: z.number().min(1).max(5).optional(),
  accuracy: z.number().min(1).max(5).optional(),
  location: z.number().min(1).max(5).optional(),
  value: z.number().min(1).max(5).optional(),
  photos: z.array(z.string().url('Invalid photo URL')).optional(),
  wouldRecommend: z.boolean().optional(),
});

export const reviewQuerySchema = z.object({
  propertyId: z.string().optional(),
  rating: z.number().optional(),
  sortBy: z.enum(['date', 'rating']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type ReviewQueryParams = z.infer<typeof reviewQuerySchema>;