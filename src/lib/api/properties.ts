import type { Property, PropertyType } from '@/lib/types/property';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock featured properties data
const mockProperties: Property[] = [
  {
    id: '1',
    hostId: 'host1',
    title: 'Luxury Beach Villa',
    description: 'Experience luxury living in this stunning beachfront villa with panoramic ocean views.',
    location: {
      address: 'Malibu, California',
      latitude: 34.0259,
      longitude: -118.7798
    },
    price: 299,
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf'
    ],
    amenities: ['wifi', 'parking', 'pool', 'gym', 'ac'],
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: 'villa',
    availability: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    hostId: 'host2',
    title: 'Mountain Retreat',
    description: 'Escape to this cozy mountain retreat surrounded by nature.',
    location: {
      address: 'Aspen, Colorado',
      latitude: 39.1911,
      longitude: -106.8175
    },
    price: 199,
    images: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233'
    ],
    amenities: ['wifi', 'parking', 'ac'],
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'cabin',
    availability: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    hostId: 'host3',
    title: 'Modern City Apartment',
    description: 'Stylish apartment in the heart of downtown.',
    location: {
      address: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060
    },
    price: 150,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'
    ],
    amenities: ['wifi', 'parking', 'gym'],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'apartment',
    availability: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getFeaturedProperties = async (): Promise<Property[]> => {
  await delay(1000); // Simulate network delay
  return mockProperties;
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  await delay(500);
  return mockProperties.find(property => property.id === id);
};