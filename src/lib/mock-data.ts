import type { Property } from '@/types/property';

export const mockProperty: Property = {
  id: '1',
  title: 'Luxury Beachfront Villa',
  description: 'Stunning beachfront villa with panoramic ocean views and modern amenities.',
  type: 'villa',
  media: [
    {
      id: '1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=60',
      title: 'Villa Exterior',
    },
    {
      id: '2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60',
      title: 'Living Room',
    },
  ],
  amenities: [
    {
      id: '1',
      name: 'Wi-Fi',
      icon: '/icons/wifi.svg',
      category: 'essential',
      included: true,
      description: 'High-speed wireless internet',
    },
    {
      id: '2',
      name: 'Pool',
      icon: '/icons/pool.svg',
      category: 'outdoor',
      included: true,
      isPremium: true,
      description: 'Private infinity pool',
      availability: '7 AM - 10 PM',
    },
  ],
  location: {
    address: '123 Beach Road, Paradise Island',
    latitude: 25.7617,
    longitude: -80.1918,
    description: 'Located on a pristine beach with easy access to restaurants and shops.',
    nearbyPlaces: [
      {
        id: '1',
        name: 'Beach Club Restaurant',
        type: 'restaurant',
        latitude: 25.7620,
        longitude: -80.1915,
        distance: 200,
        rating: 4.5,
      },
    ],
  },
  pricing: {
    baseRate: 500,
    cleaningFee: 150,
    serviceFeePercentage: 10,
    taxRate: 8,
    includedGuests: 4,
    extraGuestFee: 50,
    seasonalRates: [
      {
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        adjustmentPercentage: 20,
      },
    ],
    longStayThreshold: 7,
    longStayDiscountPercentage: 15,
    earlyBirdDiscount: {
      daysInAdvance: 90,
      percentage: 10,
    },
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
  },
  availability: [
    {
      date: '2024-04-01',
      status: 'available',
      price: 500,
    },
  ],
  maxGuests: 8,
  bedrooms: 4,
  bathrooms: 3,
  size: 300,
  rating: {
    average: 4.8,
    count: 45,
  },
};