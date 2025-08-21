// src/data/promotions.ts
import { PromotionalProperty } from '@/types/promotion';

export const MOCK_PROMOTIONS: PromotionalProperty[] = [
  {
    id: '1',
    name: 'Luxury Beach Villa',
    location: 'Miami Beach, FL',
    imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    price: 299,
    promotion: {
      id: 'promo1',
      propertyId: '1',
      title: 'Early Bird Special',
      description: 'Book 30 days in advance and save big!',
      discountPercentage: 20,
      validFrom: '2024-03-01',
      validUntil: '2024-05-31',
      type: 'EARLY_BOOKING',
      minimumStay: 3,
      terms: ['Non-refundable', 'Subject to availability'],
    },
  },
  {
    id: '2',
    name: 'Mountain Retreat',
    location: 'Aspen, CO',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
    price: 399,
    promotion: {
      id: 'promo2',
      propertyId: '2',
      title: 'Spring Break Deal',
      description: 'Special spring rates for families',
      discountPercentage: 15,
      validFrom: '2024-03-15',
      validUntil: '2024-04-15',
      type: 'SEASONAL',
      terms: ['Blackout dates may apply'],
    },
  },
  // Add more promotional properties as needed
];