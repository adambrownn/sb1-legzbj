import { BaseValidation } from '../../validate-base';
import { createLogger } from '../../../lib/logger';
import { AirbnbService } from '../../../lib/services/platforms/airbnb.service';
import { RateLimiter } from '../../../lib/utils/rate-limiter';
import { delay } from '../../../lib/utils/time';

export class AirbnbSyncTest extends BaseValidation {
  private airbnbService: AirbnbService;
  private logger = createLogger('airbnb-sync');
  private rateLimiter: RateLimiter;

  constructor() {
    super('AirbnbSync');
    this.airbnbService = new AirbnbService();
    this.rateLimiter = new RateLimiter({
      maxRequests: 50,
      timeWindow: 60000 // 1 minute
    });
  }

  protected async runValidation(): Promise<void> {
    await this.validateCalendarSync();
    await this.validateRateLimiting();
    await this.validateErrorHandling();
  }

  private async validateCalendarSync(): Promise<void> {
    this.logger.debug('Testing calendar sync');
    
    try {
      // Test property sync
      const propertyId = 'test-property-1';
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      // Update availability on Airbnb
      await this.rateLimiter.execute(async () => {
        await this.airbnbService.updateAvailability(propertyId, startDate, endDate, false);
      });

      // Verify sync status
      const syncStatus = await this.airbnbService.getSyncStatus(propertyId);
      if (!syncStatus.success) {
        throw new Error('Calendar sync failed');
      }

      // Verify availability is reflected
      const availability = await this.airbnbService.checkAvailability(propertyId, startDate, endDate);
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
      const requests = Array.from({ length: 60 }, (_, i) => ({
        propertyId,
        startDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
        endDate: `2024-02-${String(i + 2).padStart(2, '0')}`,
      }));

      // Send multiple requests rapidly
      const results = await Promise.all(
        requests.map(req => 
          this.rateLimiter.execute(async () => {
            try {
              await this.airbnbService.checkAvailability(
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
      if (successfulRequests.length > 50) {
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
          await this.airbnbService.checkAvailability(
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

      // Test network error handling
      await this.airbnbService.simulateNetworkError();
      await this.rateLimiter.execute(async () => {
        try {
          await this.airbnbService.checkAvailability(
            'test-property-1',
            '2024-03-01',
            '2024-03-02'
          );
          throw new Error('Should have failed for network error');
        } catch (error) {
          // Expected error
          if (!(error instanceof Error) || !error.message.includes('network')) {
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
}
