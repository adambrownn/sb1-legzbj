import { BaseValidation } from '../../validate-base';
import { createLogger } from '../../../lib/logger';
import { Redis } from 'ioredis';
import { retryWithBackoff } from '../../config/unified-test-config';

interface BookingRequest {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export class BookingConflictsTest extends BaseValidation {
  private logger = createLogger('booking-conflicts');
  private redis: Redis;

  constructor() {
    super('BookingConflicts');
    this.redis = new Redis({
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  protected async runValidation(): Promise<void> {
    try {
      await this.redis.ping(); // Verify Redis connection
      await this.validateSimultaneousBookings();
      await this.validateLockBehavior();
      await this.validateAvailabilityConsistency();
    } finally {
      await this.redis.quit();
    }
  }

  private async validateSimultaneousBookings() {
    this.logger.debug('Testing simultaneous bookings');

    try {
      const propertyId = 'test-property-1';
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      // Set initial availability
      await this.setAvailability(propertyId, startDate, endDate, true);

      // Create multiple booking requests for the same period
      const bookingRequests: BookingRequest[] = Array.from({ length: 3 }, (_, i) => ({
        id: `booking-${i + 1}`,
        propertyId,
        startDate,
        endDate,
        userId: `user-${i + 1}`
      }));

      // Try to book simultaneously with proper locking
      const results = await Promise.allSettled(
        bookingRequests.map(async request => {
          try {
            const isAvailable = await this.checkAvailability(
              request.propertyId,
              request.startDate,
              request.endDate
            );

            if (!isAvailable) {
              return { success: false, reason: 'Property not available' };
            }

            const lockKey = `booking:${request.propertyId}:${request.startDate}:${request.endDate}`;
            const lock = await this.acquireLock(lockKey, 5000);
            
            if (!lock.success) {
              return { success: false, reason: 'Failed to acquire lock' };
            }

            try {
              // Double-check availability after acquiring lock
              const stillAvailable = await this.checkAvailability(
                request.propertyId,
                request.startDate,
                request.endDate
              );

              if (!stillAvailable) {
                return { success: false, reason: 'Property no longer available' };
              }

              // Simulate booking creation
              await new Promise(resolve => setTimeout(resolve, 100));

              // Update availability
              await this.setAvailability(request.propertyId, request.startDate, request.endDate, false);

              return { success: true };
            } finally {
              await this.releaseLock(lockKey);
            }
          } catch (error) {
            return { 
              success: false, 
              reason: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );

      // Verify only one booking succeeded
      const successfulBookings = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      if (successfulBookings.length !== 1) {
        throw new Error(`Expected exactly 1 successful booking, got ${successfulBookings.length}`);
      }

      // Verify failed bookings were rejected with appropriate error
      const failedBookings = results.filter(
        result => result.status === 'fulfilled' && !result.value.success
      );

      if (failedBookings.length !== bookingRequests.length - 1) {
        throw new Error('Not all conflicting bookings were rejected');
      }

      // Reset availability for cleanup
      await this.setAvailability(propertyId, startDate, endDate, true);
      this.logger.info('Simultaneous bookings test passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Simultaneous bookings test failed:', { error: errorMessage });
      throw new Error(`Simultaneous bookings test failed: ${errorMessage}`);
    }
  }

  private async validateLockBehavior() {
    this.logger.debug('Testing lock behavior');

    try {
      const lockKey = 'test:booking:lock';
      const lockDuration = 5000; // 5 seconds

      // Acquire initial lock
      const lock1 = await this.acquireLock(lockKey, lockDuration);
      
      if (!lock1.success) {
        throw new Error('Failed to acquire initial lock');
      }

      // Try to acquire same lock
      const lock2 = await this.acquireLock(lockKey, lockDuration);
      
      if (lock2.success) {
        throw new Error('Second lock acquisition should have failed');
      }

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, lockDuration + 1000));

      // Try to acquire lock after expiry
      const lock3 = await this.acquireLock(lockKey, lockDuration);
      
      if (!lock3.success) {
        throw new Error('Failed to acquire lock after expiry');
      }

      this.logger.info('Lock behavior test passed');
    } catch (error) {
      throw new Error(`Lock behavior test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateAvailabilityConsistency() {
    this.logger.debug('Testing availability consistency');

    try {
      const propertyId = 'test-property-2';
      const startDate = '2024-02-01';
      const endDate = '2024-02-07';

      // Set initial availability
      await this.setAvailability(propertyId, startDate, endDate, true);

      // Create concurrent availability checks
      const checkResults = await Promise.all(
        Array.from({ length: 5 }, () => this.checkAvailability(propertyId, startDate, endDate))
      );

      // Verify all checks return same result
      if (!checkResults.every(result => result === checkResults[0])) {
        throw new Error('Inconsistent availability results');
      }

      // Update availability and verify immediate consistency
      await this.setAvailability(propertyId, startDate, endDate, false);
      
      const updatedResults = await Promise.all(
        Array.from({ length: 5 }, () => this.checkAvailability(propertyId, startDate, endDate))
      );

      if (!updatedResults.every(result => result === false)) {
        throw new Error('Availability not immediately consistent after update');
      }

      this.logger.info('Availability consistency test passed');
    } catch (error) {
      throw new Error(`Availability consistency test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async attemptBooking(request: BookingRequest): Promise<boolean> {
    const lockKey = `booking:${request.propertyId}:${request.startDate}:${request.endDate}`;
    const lockDuration = 5000; // 5 seconds

    try {
      // Try to acquire lock
      const lock = await this.acquireLock(lockKey, lockDuration);
      
      if (!lock.success) {
        throw new Error('Failed to acquire booking lock');
      }

      // Check availability
      const isAvailable = await this.checkAvailability(
        request.propertyId,
        request.startDate,
        request.endDate
      );

      if (!isAvailable) {
        throw new Error('Property not available for requested dates');
      }

      // Simulate booking creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update availability
      await this.setAvailability(request.propertyId, request.startDate, request.endDate, false);

      return true;
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  private async acquireLock(key: string, duration: number): Promise<{ success: boolean; token?: string }> {
    const token = Math.random().toString(36).substring(7);
    const acquired = await this.redis.set(`lock:${key}`, token, 'PX', duration, 'NX');
    
    return {
      success: acquired === 'OK',
      token: acquired === 'OK' ? token : undefined
    };
  }

  private async releaseLock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }

  private async setAvailability(propertyId: string, startDate: string, endDate: string, available: boolean): Promise<void> {
    await this.redis.hset(
      `property:${propertyId}:availability`,
      `${startDate}:${endDate}`,
      available ? '1' : '0'
    );
  }

  private async checkAvailability(propertyId: string, startDate: string, endDate: string): Promise<boolean> {
    const result = await this.redis.hget(
      `property:${propertyId}:availability`,
      `${startDate}:${endDate}`
    );
    return result === '1';
  }
}
