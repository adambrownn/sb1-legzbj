// src/types/promotion.ts
export interface Promotion {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  type: 'EARLY_BOOKING' | 'LAST_MINUTE' | 'SEASONAL' | 'SPECIAL';
  minimumStay?: number;
  terms?: string[];
}

export interface PromotionalProperty {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  price: number;
  promotion: Promotion;
}