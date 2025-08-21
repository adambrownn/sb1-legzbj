import { ExternalBooking } from '../../lib/services/calendar-sync.service';
import { addDays, format } from 'date-fns';

export class MockBookingAPIs {
  private static instance: MockBookingAPIs;
  private airbnbBookings: Map<string, ExternalBooking[]>;
  private bookingComBookings: Map<string, ExternalBooking[]>;

  private constructor() {
    this.airbnbBookings = new Map();
    this.bookingComBookings = new Map();
  }

  static getInstance(): MockBookingAPIs {
    if (!MockBookingAPIs.instance) {
      MockBookingAPIs.instance = new MockBookingAPIs();
    }
    return MockBookingAPIs.instance;
  }

  // Helper to generate mock bookings
  private generateMockBookings(propertyId: string, source: 'airbnb' | 'booking.com', offset = 0): ExternalBooking[] {
    const now = new Date('2024-12-14T12:37:35+05:30');
    const mockBookings: ExternalBooking[] = [];

    // Generate non-overlapping bookings with proper spacing
    for (let i = 0; i < 3; i++) {
      // Start each booking with a 7-day gap from the previous checkout
      // Add offset for different sources to avoid overlaps
      const checkIn = addDays(now, (i * 14) + offset + 1); // Start from tomorrow
      const checkOut = addDays(checkIn, 5); // 5-day stays with 9 days between stays

      mockBookings.push({
        id: `mock_${source}_${i}`,
        propertyId,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        guestCount: Math.floor(Math.random() * 4) + 1,
        source,
        externalId: `ext_${source}_${i}`,
        status: i === 0 ? 'confirmed' : i === 1 ? 'pending' : 'cancelled',
      });
    }

    return mockBookings;
  }

  async getAirbnbBookings(propertyId: string): Promise<ExternalBooking[]> {
    if (!this.airbnbBookings.has(propertyId)) {
      // Generate Airbnb bookings starting from day 0
      this.airbnbBookings.set(propertyId, this.generateMockBookings(propertyId, 'airbnb', 0));
    }
    return this.airbnbBookings.get(propertyId) || [];
  }

  async getBookingComBookings(propertyId: string): Promise<ExternalBooking[]> {
    if (!this.bookingComBookings.has(propertyId)) {
      // Generate Booking.com bookings starting from day 7 to avoid overlaps with Airbnb
      this.bookingComBookings.set(propertyId, this.generateMockBookings(propertyId, 'booking.com', 7));
    }
    return this.bookingComBookings.get(propertyId) || [];
  }

  async addAirbnbBooking(booking: ExternalBooking): Promise<void> {
    const bookings = this.airbnbBookings.get(booking.propertyId) || [];
    bookings.push(booking);
    this.airbnbBookings.set(booking.propertyId, bookings);
  }

  async addBookingComBooking(booking: ExternalBooking): Promise<void> {
    const bookings = this.bookingComBookings.get(booking.propertyId) || [];
    bookings.push(booking);
    this.bookingComBookings.set(booking.propertyId, bookings);
  }

  // Reset all mock data
  async reset(): Promise<void> {
    this.airbnbBookings.clear();
    this.bookingComBookings.clear();
  }
}

export const mockBookingAPIs = MockBookingAPIs.getInstance();
