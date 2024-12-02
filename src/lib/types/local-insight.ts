import type { PropertyLocation } from './property';

export type InsightType = 'restaurant' | 'cafe' | 'activity' | 'attraction';

export interface LocalInsight {
  id: string;
  name: string;
  type: InsightType;
  description?: string;
  rating: number;
  reviews: number;
  distance: number;
  location: PropertyLocation;
  image?: string;
  priceRange?: string;
  openingHours?: string;
  website?: string;
}

export interface InsightCategory {
  id: InsightType;
  label: string;
  description: string;
}