import { addDays, subDays } from 'date-fns';

const baseDate = new Date('2024-12-13T13:52:38+05:30');

export const mockBookingData = {
  validBookings: [
    {
      id: 'booking-1',
      userId: 'user-1',
      propertyId: 'property-1',
      checkIn: baseDate,
      checkOut: addDays(baseDate, 3),
      guestCount: 2,
      totalAmount: 30000, // $300.00
      status: 'confirmed',
      cancellationPolicy: 'flexible',
      createdAt: subDays(baseDate, 5),
    },
    {
      id: 'booking-2',
      userId: 'user-2',
      propertyId: 'property-1',
      checkIn: addDays(baseDate, 5),
      checkOut: addDays(baseDate, 8),
      guestCount: 4,
      totalAmount: 45000, // $450.00
      status: 'confirmed',
      cancellationPolicy: 'moderate',
      createdAt: subDays(baseDate, 10),
    },
    {
      id: 'booking-3',
      userId: 'user-3',
      propertyId: 'property-2',
      checkIn: addDays(baseDate, 10),
      checkOut: addDays(baseDate, 15),
      guestCount: 3,
      totalAmount: 75000, // $750.00
      status: 'confirmed',
      cancellationPolicy: 'strict',
      createdAt: subDays(baseDate, 15),
    },
  ],
  modificationRequests: [
    {
      bookingId: 'booking-1',
      changes: {
        checkIn: addDays(baseDate, 1),
        checkOut: addDays(baseDate, 5),
        guestCount: 3,
      },
      expectedPriceChange: 20000, // $200.00 increase
    },
    {
      bookingId: 'booking-2',
      changes: {
        checkIn: addDays(baseDate, 5),
        checkOut: addDays(baseDate, 7), // shortened stay
        guestCount: 4,
      },
      expectedPriceChange: -15000, // $150.00 decrease
    },
  ],
  cancellationPolicies: {
    flexible: {
      fullRefundWindow: 24, // hours before check-in
      partialRefundWindow: 12,
      partialRefundPercentage: 50,
    },
    moderate: {
      fullRefundWindow: 72,
      partialRefundWindow: 48,
      partialRefundPercentage: 25,
    },
    strict: {
      fullRefundWindow: 168, // 7 days
      partialRefundWindow: 120, // 5 days
      partialRefundPercentage: 10,
    },
  },
  mockNotifications: {
    email: {
      modification: {
        to: 'guest@example.com',
        subject: 'Booking Modified - Confirmation',
        template: 'booking-modified',
      },
      cancellation: {
        to: 'guest@example.com',
        subject: 'Booking Cancelled - Confirmation',
        template: 'booking-cancelled',
      },
    },
    sms: {
      modification: {
        to: '+1234567890',
        template: 'booking-modified',
      },
      cancellation: {
        to: '+1234567890',
        template: 'booking-cancelled',
      },
    },
  },
  mockTwilioResponses: {
    success: {
      sid: 'SM123',
      status: 'queued',
    },
    failure: {
      status: 400,
      message: 'Invalid phone number',
    },
  },
};
