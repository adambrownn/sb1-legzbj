export const mockBookings = [
  {
    id: 'booking-123',
    propertyId: 'property-123',
    userId: 'user-123',
    checkIn: '2024-12-18T12:00:00+05:30',
    checkOut: '2024-12-19T12:00:00+05:30',
    status: 'confirmed',
    totalPrice: 1000,
    paymentIntentId: 'pi_123',
    timezone: 'Asia/Kolkata',
    metadata: {
      guestCount: 2,
      specialRequests: ''
    }
  }
];

export const testTimezones = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'Europe/London'
];

export const mockPropertyData = {
  id: 'property-123',
  name: 'Test Property',
  timezone: 'Asia/Kolkata',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  minStayDays: 1,
  maxStayDays: 30,
  pricePerNight: 1000
};
