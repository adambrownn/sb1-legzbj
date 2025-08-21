import { parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { BookingStore, bookingStore } from '../store/booking-store';
import { AvailabilityService } from './availability.service';
import { PaymentService } from './payment.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
import { lockManager } from './lock-manager.service';
import { CacheService } from './cache.service';
import type { Booking, BookingStatus } from '../types/booking';
import pino from 'pino';

export interface BookingModification {
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
}

export interface ModificationResult {
  success: boolean;
  booking?: Booking;
  error?: string;
  refundAmount?: number;
  additionalCharge?: number;
}

export class BookingManagementService {
  private static instance: BookingManagementService | null = null;
  private availabilityService: AvailabilityService;
  private paymentService: PaymentService;
  private notificationService: NotificationService;
  private bookingStore: BookingStore;
  private logger: pino.Logger;

  private constructor() {
    const cacheService = CacheService.getInstance();
    this.bookingStore = bookingStore;
    this.availabilityService = new AvailabilityService(cacheService, this.bookingStore);
    this.paymentService = PaymentService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.logger = pino({
      name: 'booking-management',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    });
  }

  public static getInstance(): BookingManagementService {
    if (!BookingManagementService.instance) {
      BookingManagementService.instance = new BookingManagementService();
    }
    return BookingManagementService.instance;
  }

  public static resetInstance(): void {
    BookingManagementService.instance = null;
  }

  public async cleanup(): Promise<void> {
    try {
      // Clean up resources in parallel
      await Promise.all([
        this.bookingStore.clear?.(),
        webSocketService.disconnect()
      ].filter(Boolean));
      
      // Reset instance
      BookingManagementService.instance = null;
    } catch (error) {
      this.logger.error({ error }, 'Error during cleanup');
    }
  }

  async modifyBooking(
    bookingId: string,
    modifications: BookingModification,
    userId: string
  ): Promise<ModificationResult> {
    const lockValue = nanoid();
    let currentBooking: Booking | null = null;

    try {
      // Get booking
      const bookings = await this.bookingStore.getBookings(bookingId);
      const booking = bookings[0];
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      currentBooking = booking;

      // Verify ownership
      if (booking.userId !== userId) {
        return { success: false, error: 'Unauthorized to modify this booking' };
      }

      // Check if booking is modifiable
      if (booking.status !== 'confirmed') {
        return {
          success: false,
          error: `Cannot modify booking with status: ${booking.status}`
        };
      }

      // Acquire lock
      await lockManager.acquireLock({
        resourceId: booking.propertyId,
        ttl: 30000
      });

      // Check availability if dates are being modified
      if (modifications.checkIn || modifications.checkOut) {
        const newCheckIn = modifications.checkIn || booking.checkIn;
        const newCheckOut = modifications.checkOut || booking.checkOut;

        const isAvailable = await this.availabilityService.isAvailable(
          booking.propertyId,
          newCheckIn,
          newCheckOut,
          booking.timezone
        );

        if (!isAvailable) {
          return { success: false, error: 'Selected dates are not available' };
        }

        // Calculate price difference
        const currentDays = differenceInDays(
          parseISO(booking.checkOut),
          parseISO(booking.checkIn)
        );
        const newDays = differenceInDays(
          parseISO(newCheckOut),
          parseISO(newCheckIn)
        );

        if (newDays > currentDays) {
          // Additional payment required
          const additionalCharge = (booking.totalAmount / currentDays) * (newDays - currentDays);
          const paymentResult = await this.paymentService.processPayment({
            amount: additionalCharge,
            currency: 'USD',
            paymentMethod: 'card',
            metadata: {
              type: 'booking_modification',
              bookingId: booking.id
            }
          });

          if (!paymentResult.status.includes('succeeded')) {
            return {
              success: false,
              error: 'Failed to process additional payment',
              additionalCharge
            };
          }
        } else if (newDays < currentDays) {
          // Partial refund
          const refundAmount = (booking.totalAmount / currentDays) * (currentDays - newDays);
          await this.paymentService.processPayment({
            amount: -refundAmount,
            currency: 'USD',
            paymentMethod: 'refund',
            metadata: {
              type: 'booking_modification_refund',
              bookingId: booking.id
            }
          });
        }
      }

      // Update booking
      const updatedBooking: Booking = {
        ...booking,
        ...modifications,
        updatedAt: new Date().toISOString()
      };

      await this.bookingStore.updateBooking(updatedBooking.id, updatedBooking);

      // Notify about modification
      await this.notificationService.sendBookingModificationNotification({
        booking: updatedBooking,
        modifications
      });

      return {
        success: true,
        booking: updatedBooking
      };
    } catch (error) {
      this.logger.error('Failed to modify booking', { bookingId, error });
      return {
        success: false,
        error: 'Internal server error'
      };
    } finally {
      if (currentBooking?.propertyId) {
        await lockManager.releaseLock({
          resourceId: currentBooking.propertyId,
          lockValue
        });
      }
    }
  }

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    try {
      // Validate required fields
      const requiredFields = [
        'userId',
        'propertyId',
        'checkIn',
        'checkOut',
        'guests',
        'totalAmount'
      ] as const;
      
      for (const field of requiredFields) {
        if (!bookingData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check availability
      const isAvailable = await this.availabilityService.isAvailable(
        bookingData.propertyId!,
        bookingData.checkIn!,
        bookingData.checkOut!,
        bookingData.timezone || 'UTC'
      );

      if (!isAvailable) {
        throw new Error('Property not available for selected dates');
      }

      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: bookingData.totalAmount!,
        currency: 'USD',
        paymentMethod: 'card',
        metadata: {
          type: 'booking_creation',
          propertyId: bookingData.propertyId!  // Assert non-null since we validated it above
        }
      });

      if (!paymentResult.status.includes('succeeded')) {
        throw new Error('Payment failed');
      }

      // Create booking
      const newBookingData = {
        ...bookingData as Required<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>,
        status: 'pending' as BookingStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newBooking = await this.bookingStore.addBooking(newBookingData);

      // Notify relevant parties
      await this.notificationService.sendBookingModificationNotification({
        booking: newBooking,
        modifications: {
          checkIn: newBooking.checkIn,
          checkOut: newBooking.checkOut,
          guestCount: newBooking.guests
        }
      });

      return newBooking;
    } catch (error) {
      this.logger.error({ error }, 'Failed to create booking');
      throw error;
    }
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const bookings = await this.bookingStore.getBookings(bookingId);
      const booking = bookings[0];
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Prevent updating certain fields
      const restrictedFields = ['id', 'userId', 'createdAt', 'status'] as const;
      for (const field of restrictedFields) {
        if (field in updates) {
          delete updates[field as keyof typeof updates];
        }
      }

      const updatedBooking = {
        ...booking,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.bookingStore.updateBooking(bookingId, updatedBooking);
      
      // Send notification about the update
      await this.notificationService.sendBookingModificationNotification({
        booking: updatedBooking,
        modifications: updates
      });

      return updatedBooking;
    } catch (error) {
      this.logger.error({ error, bookingId }, 'Failed to update booking');
      throw error;
    }
  }

  async cancelBooking(bookingId: string, userId: string): Promise<ModificationResult> {
    try {
      const bookings = await this.bookingStore.getBookings(bookingId);
      const booking = bookings[0];
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.status === 'cancelled') {
        return { success: false, error: 'Booking is already cancelled' };
      }

      if (booking.userId !== userId) {
        return { success: false, error: 'Unauthorized to cancel this booking' };
      }

      // Check cancellation policy
      const checkInDate = parseISO(booking.checkIn);
      const now = new Date();
      const daysUntilCheckIn = differenceInDays(checkInDate, now);

      let refundAmount = 0;
      if (booking.cancellationPolicy === 'flexible' && daysUntilCheckIn >= 1) {
        refundAmount = booking.totalAmount;
      } else if (booking.cancellationPolicy === 'moderate' && daysUntilCheckIn >= 5) {
        refundAmount = booking.totalAmount * 0.5;
      }

      if (refundAmount > 0) {
        await this.paymentService.processPayment({
          amount: -refundAmount,
          currency: 'USD',
          paymentMethod: 'refund',
          metadata: {
            type: 'booking_cancellation',
            bookingId: booking.id
          }
        });
      }

      // Update booking status
      const updatedBooking = {
        ...booking,
        status: 'cancelled' as BookingStatus,
        updatedAt: new Date().toISOString()
      };

      await this.bookingStore.updateBooking(bookingId, updatedBooking);

      // Notify about cancellation
      await this.notificationService.sendBookingCancellationNotification({
        booking: updatedBooking,
        refundAmount: refundAmount || 0
      });

      return {
        success: true,
        booking: updatedBooking,
        refundAmount
      };
    } catch (error) {
      this.logger.error({ error, bookingId }, 'Failed to cancel booking');
      return { success: false, error: 'Internal server error' };
    }
  }

  async getBookingsForProperty(propertyId: string): Promise<Booking[]> {
    try {
      const bookings = await this.bookingStore.getBookings(propertyId);
      return bookings;
    } catch (error) {
      this.logger.error({ error, propertyId }, 'Failed to get property bookings');
      throw error;
    }
  }
}
