import * as z from 'zod';

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});