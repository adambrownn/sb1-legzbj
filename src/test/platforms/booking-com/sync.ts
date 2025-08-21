import { BaseValidation } from '../../validate-base';
import { createLogger } from '../../../lib/logger';
import { BookingComService } from '../../../lib/services/platforms/booking-com.service';
import { RateLimiter } from '../../../lib/utils/rate-limiter';
import { delay } from '../../../lib/utils/time';

export class BookingComSyncTest extends BaseValidation {
  private bookingComService: BookingComService;
  private logger = createLogger('booking-com-sync');
  private rateLimiter: RateLimiter;

  constructor() {
    super('BookingComSync');
    this.bookingComService = new BookingComService();
    this.rateLimiter = new RateLimiter({
      maxRequests: 40,  // Booking.com has stricter rate limits
      timeWindow: 60000 // 1 minute
    });
  }

  protected async runValidation(): Promise<void> {
    await this.validateCalendarSync();
    await this.validateRateLimiting();
    await this.validateErrorHandling();
    await this.validateBulkUpdate();
  }

  private async validateCalendarSync(): Promise<void> {
    this.logger.debug('Testing calendar sync');
    
    try {
      // Test property sync
      const propertyId = 'test-property-1';
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      // Update availability on Booking.com
      await this.rateLimiter.execute(async () => {
        await this.bookingComService.updateAvailability(propertyId, startDate, endDate, false);
      });

      // Verify sync status
      const syncStatus = await this.bookingComService.getSyncStatus(propertyId);
      if (!syncStatus.success) {
        throw new Error('Calendar sync failed');
      }

      // Verify availability is reflected
      const availability = await this.bookingComService.checkAvailability(propertyId, startDate, endDate);
      if (availability.isAvailable) {
        throw new Error('Availability not updated correctly');
      }

      this.logger.info('Calendar sync test passed');
    } catch (error) {
      this.logger.error('Calendar sync test failed:', { error });
      throw error;
    }
  }

  private async validateRateLimiting(): Promise<void> {
    this.logger.debug('Testing rate limiting');
    
    try {
      const propertyId = 'test-property-2';
      const requests = Array.from({ length: 50 }, (_, i) => ({
        propertyId,
        startDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
        endDate: `2024-02-${String(i + 2).padStart(2, '0')}`,
      }));

      // Send multiple requests rapidly
      const results = await Promise.all(
        requests.map(req => 
          this.rateLimiter.execute(async () => {
            try {
              await this.bookingComService.checkAvailability(
                req.propertyId,
                req.startDate,
                req.endDate
              );
              return { success: true };
            } catch (error) {
              return { success: false, error };
            }
          })
        )
      );

      // Verify rate limiting worked
      const successfulRequests = results.filter(r => r.success);
      if (successfulRequests.length > 40) {
        throw new Error('Rate limiting failed to restrict requests');
      }

      this.logger.info('Rate limiting test passed');
    } catch (error) {
      this.logger.error('Rate limiting test failed:', { error });
      throw error;
    }
  }

  private async validateErrorHandling(): Promise<void> {
    this.logger.debug('Testing error handling');
    
    try {
      // Test invalid property ID
      const invalidPropertyId = 'invalid-property';
      await this.rateLimiter.execute(async () => {
        try {
          await this.bookingComService.checkAvailability(
            invalidPropertyId,
            '2024-03-01',
            '2024-03-02'
          );
          throw new Error('Should have failed for invalid property');
        } catch (error) {
          // Expected error
          if (!(error instanceof Error) || !error.message.includes('invalid')) {
            throw error;
          }
        }
      });

      // Test API error handling
      await this.bookingComService.simulateAPIError();
      await this.rateLimiter.execute(async () => {
        try {
          await this.bookingComService.checkAvailability(
            'test-property-1',
            '2024-03-01',
            '2024-03-02'
          );
          throw new Error('Should have failed for API error');
        } catch (error) {
          // Expected error
          if (!(error instanceof Error) || !error.message.includes('API')) {
            throw error;
          }
        }
      });

      this.logger.info('Error handling test passed');
    } catch (error) {
      this.logger.error('Error handling test failed:', { error });
      throw error;
    }
  }

  private async validateBulkUpdate(): Promise<void> {
    this.logger.debug('Testing bulk update functionality');
    
    try {
      const propertyId = 'test-property-3';
      const updates = Array.from({ length: 7 }, (_, i) => ({
        startDate: `2024-04-${String(i + 1).padStart(2, '0')}`,
        endDate: `2024-04-${String(i + 2).padStart(2, '0')}`,
        isAvailable: i % 2 === 0
      }));

      // Perform bulk update
      await this.rateLimiter.execute(async () => {
        await this.bookingComService.bulkUpdateAvailability(propertyId, updates);
      });

      // Verify updates
      for (const update of updates) {
        const availability = await this.bookingComService.checkAvailability(
          propertyId,
          update.startDate,
          update.endDate
        );
        if (availability.isAvailable !== update.isAvailable) {
          throw new Error('Bulk update not reflected correctly');
        }
      }

      this.logger.info('Bulk update test passed');
    } catch (error) {
      this.logger.error('Bulk update test failed:', { error });
      throw error;
    }
  }
}
