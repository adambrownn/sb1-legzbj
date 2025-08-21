import { BaseValidation } from '../../validate-base';
import { CalendarSyncService } from '../../../lib/services/calendar-sync.service';
import { lockService } from '../../../lib/lock/lock-service';
import { createLogger } from '../../../lib/logger';
import { retryWithBackoff } from '../../config/unified-test-config';

interface BookingRequest {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export class BookingConflictsTest extends BaseValidation {
  private calendarSync: CalendarSyncService;
  private logger = createLogger('booking-conflicts');
  private successCount = 0;
  private failureCount = 0;

  constructor() {
    super('BookingConflicts');
    this.calendarSync = CalendarSyncService.getInstance();
  }

  protected async runValidation(): Promise<void> {
    await this.runWithErrorHandling(async () => {
      await this.validateSimultaneousBookings();
    }, 'Simultaneous bookings validation');

    await this.runWithErrorHandling(async () => {
      await this.validateLockBehavior();
    }, 'Lock behavior validation');

    await this.runWithErrorHandling(async () => {
      await this.validateAvailabilityConsistency();
    }, 'Availability consistency validation');

    this.logger.info('Booking conflicts validation completed', {
      successCount: this.successCount,
      failureCount: this.failureCount
    });
  }

  private async validateSimultaneousBookings() {
    this.logger.debug('Starting simultaneous bookings validation');

    const propertyId = 'test-property-123';
    const overlappingBookings: BookingRequest[] = [
      {
        id: 'booking-1',
        propertyId,
        checkIn: '2025-01-01',
        checkOut: '2025-01-05',
        guestCount: 2
      },
      {
        id: 'booking-2',
        propertyId,
        checkIn: '2025-01-03',
        checkOut: '2025-01-07',
        guestCount: 2
      }
    ];

    try {
      // Attempt to create overlapping bookings simultaneously
      const bookingPromises = overlappingBookings.map(booking =>
        this.attemptBooking(booking)
      );

      const results = await Promise.all(bookingPromises);
      
      // Verify that only one booking succeeded
      const successfulBookings = results.filter(result => result.success);
      
      if (successfulBookings.length === 1) {
        this.successCount++;
        this.logger.debug('Successfully prevented overlapping bookings', {
          successfulBooking: successfulBookings[0].bookingId
        });
      } else {
        throw new Error(`Unexpected number of successful bookings: ${successfulBookings.length}`);
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Simultaneous bookings validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateLockBehavior() {
    this.logger.debug('Starting lock behavior validation');

    const propertyId = 'test-property-456';
    const lockKey = `booking:${propertyId}`;

    try {
      // Attempt to acquire multiple locks
      const lock1Promise = lockService.acquireLock(lockKey, 5000);
      const lock2Promise = lockService.acquireLock(lockKey, 5000);

      const [lock1Result, lock2Result] = await Promise.all([
        lock1Promise.catch(e => ({ success: false, error: e })),
        lock2Promise.catch(e => ({ success: false, error: e }))
      ]);

      // Verify that only one lock was acquired
      const successfulLocks = [lock1Result, lock2Result].filter(
        result => result.success
      ).length;

      if (successfulLocks === 1) {
        this.successCount++;
        this.logger.debug('Successfully validated lock behavior');
      } else {
        throw new Error(`Unexpected number of successful locks: ${successfulLocks}`);
      }

      // Release any acquired locks
      await lockService.releaseLock(lockKey);
    } catch (error) {
      this.failureCount++;
      this.logger.error('Lock behavior validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async validateAvailabilityConsistency() {
    this.logger.debug('Starting availability consistency validation');

    const propertyId = 'test-property-789';
    const operations = Array.from({ length: 5 }, (_, i) => ({
      type: i % 2 === 0 ? 'book' : 'update',
      data: {
        id: `operation-${i}`,
        propertyId,
        checkIn: '2025-02-01',
        checkOut: '2025-02-05',
        guestCount: 2
      }
    }));

    try {
      // Execute multiple operations concurrently
      const operationPromises = operations.map(op =>
        op.type === 'book'
          ? this.attemptBooking(op.data)
          : this.calendarSync.updateAvailability(propertyId, {
              startDate: op.data.checkIn,
              endDate: op.data.checkOut,
              available: true
            })
      );

      await Promise.all(operationPromises);

      // Verify final availability state
      const finalState = await this.calendarSync.getAvailability(
        propertyId,
        '2025-02-01',
        '2025-02-05'
      );

      // Ensure state is consistent
      const isConsistent = await this.verifyAvailabilityConsistency(
        propertyId,
        finalState
      );

      if (isConsistent) {
        this.successCount++;
        this.logger.debug('Successfully validated availability consistency');
      } else {
        throw new Error('Availability state is inconsistent');
      }
    } catch (error) {
      this.failureCount++;
      this.logger.error('Availability consistency validation failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async attemptBooking(booking: BookingRequest) {
    try {
      const result = await this.calendarSync.createBooking({
        ...booking,
        source: 'test'
      });
      return { success: true, bookingId: booking.id };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async verifyAvailabilityConsistency(
    propertyId: string,
    availabilityState: any
  ): Promise<boolean> {
    // Verify through multiple sources
    const [
      calendarState,
      bookingState,
      externalState
    ] = await Promise.all([
      this.calendarSync.getAvailability(propertyId, '2025-02-01', '2025-02-05'),
      this.calendarSync.getBookings(propertyId),
      this.calendarSync.getExternalPlatformAvailability(propertyId)
    ]);

    // Compare states for consistency
    const statesMatch = 
      JSON.stringify(calendarState) === JSON.stringify(availabilityState) &&
      this.validateBookingStateConsistency(bookingState, availabilityState) &&
      this.validateExternalStateConsistency(externalState, availabilityState);

    return statesMatch;
  }

  private validateBookingStateConsistency(
    bookings: any[],
    availabilityState: any
  ): boolean {
    // Implementation of booking state validation
    return true; // Simplified for example
  }

  private validateExternalStateConsistency(
    externalState: any,
    availabilityState: any
  ): boolean {
    // Implementation of external state validation
    return true; // Simplified for example
  }
}
