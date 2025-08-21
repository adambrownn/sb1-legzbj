// src/types/property.ts

export interface PropertyMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  details?: string;
  category: 'essential' | 'comfort' | 'safety' | 'outdoor' | 'entertainment';
  included: boolean;
  isPremium?: boolean;
  availability?: string;
  restrictions?: string;
}

export interface PropertyLocation {
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  nearbyPlaces?: NearbyPlace[];
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating?: number;
  description?: string;
}

export interface PropertyAvailability {
  date: string;
  status: 'available' | 'booked' | 'partial' | 'maintenance';
  price: number;
  bookingDetails?: {
    checkIn: boolean;
    checkOut: boolean;
    guestCount?: number;
  };
}

export interface PropertyPricing {
  baseRate: number;
  cleaningFee?: number;
  serviceFeePercentage?: number;
  taxRate?: number;
  includedGuests?: number;
  extraGuestFee?: number;
  seasonalRates?: {
    startDate: string;
    endDate: string;
    adjustmentPercentage: number;
  }[];
  longStayThreshold?: number;
  longStayDiscountPercentage?: number;
  earlyBirdDiscount?: {
    daysInAdvance: number;
    percentage: number;
  };
  cancellationPolicy?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'villa' | 'room';
  media: PropertyMedia[];
  amenities: PropertyAmenity[];
  location: PropertyLocation;
  pricing: PropertyPricing;
  availability: PropertyAvailability[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating?: {
    average: number;
    count: number;
  };
}