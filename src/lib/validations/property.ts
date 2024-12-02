import * as z from 'zod';

export const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(5, 'Location is required'),
  price: z.number().min(1, 'Price must be greater than 0'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  amenities: z.array(z.string()).min(1, 'At least one amenity is required'),
  maxGuests: z.number().min(1, 'Maximum guests must be at least 1'),
  bedrooms: z.number().min(1, 'Number of bedrooms must be at least 1'),
  bathrooms: z.number().min(1, 'Number of bathrooms must be at least 1'),
});