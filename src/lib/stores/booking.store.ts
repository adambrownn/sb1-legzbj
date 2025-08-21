import { Booking, BookingStatus } from '../types/booking';

export class BookingStore {
  private static instance: BookingStore;
  private bookings: Map<string, Booking>;

  private constructor() {
    this.bookings = new Map();
  }

  public static getInstance(): BookingStore {
    if (!BookingStore.instance) {
      BookingStore.instance = new BookingStore();
    }
    return BookingStore.instance;
  }

  public async addBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const id = `booking-${Date.now()}`;
    const newBooking: Booking = {
      ...booking,
      id,
      status: 'confirmed' as BookingStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  public async getBookings(propertyId?: string): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    if (propertyId) {
      return bookings.filter(booking => booking.propertyId === propertyId);
    }
    return bookings;
  }

  public async getBookingById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) || null;
  }

  public async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    const updatedBooking = {
      ...booking,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  public async cancelBooking(id: string): Promise<{ success: boolean }> {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    this.bookings.set(id, booking);
    return { success: true };
  }
}
