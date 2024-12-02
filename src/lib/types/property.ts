export type PropertyType = 'house' | 'apartment' | 'villa' | 'cabin';

export interface PropertyLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface PropertyAvailability {
  startDate: string;
  endDate: string;
  isBooked: boolean;
}

export interface PropertyDetails {
  id: string;
  hostId: string;
  title: string;
  description: string;
  location: PropertyLocation;
  price: number;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  availability: PropertyAvailability[];
  nearbyAttractions?: Array<{
    name: string;
    location: PropertyLocation;
    type: string;
    distance: number;
  }>;
  createdAt: string;
  updatedAt: string;
}