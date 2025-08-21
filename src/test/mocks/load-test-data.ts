import { addDays } from 'date-fns';

const baseDate = new Date('2024-12-13T13:55:28+05:30');

export const loadTestData = {
  properties: Array.from({ length: 100 }, (_, i) => ({
    id: `property-${i + 1}`,
    name: `Test Property ${i + 1}`,
    basePrice: Math.floor(Math.random() * 20000) + 10000,
  })),
  
  bookingRequests: Array.from({ length: 1000 }, (_, i) => ({
    propertyId: `property-${Math.floor(Math.random() * 100) + 1}`,
    checkIn: addDays(baseDate, Math.floor(Math.random() * 30)),
    checkOut: addDays(baseDate, Math.floor(Math.random() * 30) + 30),
    guestCount: Math.floor(Math.random() * 4) + 1,
    userId: `user-${Math.floor(Math.random() * 1000) + 1}`,
  })),

  modificationRequests: Array.from({ length: 500 }, (_, i) => ({
    bookingId: `booking-${i + 1}`,
    changes: {
      checkIn: addDays(baseDate, Math.floor(Math.random() * 30)),
      checkOut: addDays(baseDate, Math.floor(Math.random() * 30) + 30),
      guestCount: Math.floor(Math.random() * 4) + 1,
    },
  })),

  availabilityRequests: Array.from({ length: 1000 }, (_, i) => ({
    propertyId: `property-${Math.floor(Math.random() * 100) + 1}`,
    startDate: addDays(baseDate, Math.floor(Math.random() * 30)),
    endDate: addDays(baseDate, Math.floor(Math.random() * 30) + 30),
  })),

  generateRandomBooking: () => {
    const propertyIndex = Math.floor(Math.random() * 100);
    const startOffset = Math.floor(Math.random() * 30);
    return {
      propertyId: `property-${propertyIndex + 1}`,
      checkIn: addDays(baseDate, startOffset),
      checkOut: addDays(baseDate, startOffset + Math.floor(Math.random() * 7) + 1),
      guestCount: Math.floor(Math.random() * 4) + 1,
      userId: `user-${Math.floor(Math.random() * 1000) + 1}`,
    };
  },
};
