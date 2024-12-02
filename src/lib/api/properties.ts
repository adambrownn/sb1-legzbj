import type { Property } from '@/lib/types/property';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock featured properties data
const mockProperties: Property[] = [
  {
    id: '1',
    hostId: 'host1',
    title: 'Luxury Beach Villa',
    description: 'Experience luxury living in this stunning beachfront villa with panoramic ocean views. Perfect for family gatherings or special occasions.',
    location: 'Malibu, California',
    price: 299,
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
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
    description: 'Escape to this cozy mountain retreat surrounded by nature. Perfect for those seeking peace and tranquility.',
    location: 'Aspen, Colorado',
    price: 199,
    images: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
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
    title: 'Urban Loft',
    description: 'Modern urban living at its finest. This stylish loft offers the perfect base for exploring the city.',
    location: 'New York City',
    price: 159,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'
    ],
    amenities: ['wifi', 'gym', 'ac'],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'apartment',
    availability: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function getFeaturedProperties(): Promise<Property[]> {
  await delay(1500); // Simulate network delay
  return mockProperties;
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  await delay(1000);
  return mockProperties.find(p => p.id === id);
}