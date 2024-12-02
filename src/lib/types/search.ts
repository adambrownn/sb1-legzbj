import type { PropertyType } from './property';

export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  amenities?: string[];
  guestCapacity?: number;
  petFriendly?: boolean;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  type: 'city' | 'region' | 'country';
}