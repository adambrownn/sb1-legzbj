import { format, isWithinInterval, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CacheService } from './cache.service';
import { BookingStore } from '../store/booking-store';
import { logger } from '../utils/logger';
import { webSocketService, CalendarSyncEvent } from './websocket.service';
import type { Booking } from '../types/booking';

export class AvailabilityService {
  private cacheService: CacheService;
  private bookingStore: BookingStore;
  private propertySubscriptions: Map<string, () => void> = new Map();

  constructor(cacheService: CacheService, bookingStore: BookingStore) {
    this.cacheService = cacheService;
    this.bookingStore = bookingStore;
  }

  /**
   * Convert a local time to UTC considering the timezone
   */
  private toUtc(date: string, timezone: string): Date {
    try {
      const parsedDate = parseISO(date);
      const zonedDate = toZonedTime(parsedDate, timezone);
      const utcDate = new Date(zonedDate);

      logger.debug('Converting date to UTC', { inputDate: date, timezone });
      logger.debug('Time conversion details', {
        input: date,
        timezone,
        parsedDate: format(parsedDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        zonedDate: format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        utcDate: format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
      });

      return utcDate;
    } catch (error) {
      logger.error('Failed to convert time to UTC', { input: date, timezone, error });
      throw error;
    }
  }

  /**
   * Check if a time slot is available for a property
   */
  async isAvailable(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    timezone: string
  ): Promise<boolean> {
    try {
      // Convert dates to UTC
      const utcCheckIn = this.toUtc(checkIn, timezone);
      const utcCheckOut = this.toUtc(checkOut, timezone);

      // Get existing bookings from cache
      const cacheKey = `bookings:${propertyId}`;
      const existingBookings = await this.cacheService.get<Booking[]>(cacheKey);
      logger.debug('Fetching bookings', { cacheKey });

      if (!existingBookings) {
        logger.info('No cache found. Fetching from store');
        const bookings = await this.bookingStore.getBookings(propertyId);
        logger.debug('Bookings fetched from store:', { bookings });
      } else {
        logger.debug('Using cached bookings:', { existingBookings });
      }
      
      // If not in cache, get from store and cache it
      if (!existingBookings) {
        const bookings = await this.bookingStore.getBookings(propertyId);
        await this.cacheService.set(cacheKey, bookings, 60 * 60); // Cache for 1 hour
        return this.checkAvailability(bookings, utcCheckIn, utcCheckOut);
      }

      return this.checkAvailability(existingBookings, utcCheckIn, utcCheckOut);
    } catch (error) {
      logger.error('Failed to check availability', {
        propertyId,
        checkIn,
        checkOut,
        timezone,
        error
      });
      throw error;
    }
  }

  /**
   * Check if there are any overlapping bookings
   */
  private checkAvailability(bookings: Booking[], checkIn: Date, checkOut: Date): boolean {
    // Check for overlapping bookings
    const overlappingBooking = bookings.find((booking) => {
      const bookingCheckIn = parseISO(booking.checkIn);
      const bookingCheckOut = parseISO(booking.checkOut);
      logger.debug('Checking availability for time slot', { checkIn, checkOut });

      const overlappingBooking = bookings.find((booking) => {
        logger.debug('Comparing against booking', { booking });
        const bookingCheckIn = parseISO(booking.checkIn);
        const bookingCheckOut = parseISO(booking.checkOut);
      
        return (
          isWithinInterval(checkIn, { start: bookingCheckIn, end: bookingCheckOut }) ||
          isWithinInterval(checkOut, { start: bookingCheckIn, end: bookingCheckOut }) ||
          isWithinInterval(bookingCheckIn, { start: checkIn, end: checkOut })
        );
      });
      
      logger.debug('Overlap found:', { overlappingBooking });
      return !overlappingBooking;
      
      return (
        isWithinInterval(checkIn, { start: bookingCheckIn, end: bookingCheckOut }) ||
        isWithinInterval(checkOut, { start: bookingCheckIn, end: bookingCheckOut }) ||
        isWithinInterval(bookingCheckIn, { start: checkIn, end: checkOut })
      );
    });

    return !overlappingBooking;
  }

  /**
   * Subscribe to property updates
   */
  subscribeToPropertyUpdates(propertyId: string): void {
    // Unsubscribe from any existing subscription
    this.unsubscribeFromPropertyUpdates(propertyId);

    // Subscribe to calendar sync events
    const unsubscribe = webSocketService.subscribeToCalendarUpdates(propertyId, (event: CalendarSyncEvent) => {
      if (event.propertyId === propertyId) {
        // Invalidate cache
        const cacheKey = `bookings:${propertyId}`;
        this.cacheService.delete(cacheKey);
      }
    });

    // Store the unsubscribe function
    if (unsubscribe) {
      this.propertySubscriptions.set(propertyId, unsubscribe);
    }
  }

  /**
   * Unsubscribe from property updates
   */
  unsubscribeFromPropertyUpdates(propertyId: string): void {
    const unsubscribe = this.propertySubscriptions.get(propertyId);
    if (unsubscribe) {
      unsubscribe();
      this.propertySubscriptions.delete(propertyId);
    }
  }
}
