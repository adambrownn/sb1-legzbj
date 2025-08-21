// Set test environment
process.env.NODE_ENV = 'test';

jest.mock('../lib/services/websocket.service', () => ({
  webSocketService: {
    subscribeToCalendarUpdates: jest.fn((propertyId, callback) => {
      // Simulate callback invocation for testing
      const unsubscribe = jest.fn();
      callback({
        type: 'booking',
        propertyId,
        bookingId: 'mockBookingId',
        checkIn: '2024-12-21T12:00:00+05:30',
        checkOut: '2024-12-22T12:00:00+05:30',
        userId: 'mockUserId',
        timestamp: Date.now(),
      });
      return unsubscribe;
    }),
  },
}));

import { logger, createLogger } from '../lib/logger';
import { AvailabilityService } from '../lib/services/availability.service';
import { CacheService } from '../lib/services/cache.service';
import { BookingStore } from '../lib/store/booking-store';
import { mockBookings } from './mocks/availability-data';

export class AvailabilityValidation {
  private availabilityService: AvailabilityService;
  private cacheService: CacheService;
  private bookingStore: BookingStore;

  constructor() {
    this.cacheService = new CacheService();
    this.bookingStore = new BookingStore();
    this.availabilityService = new AvailabilityService(this.cacheService, this.bookingStore);
  }

  async validate() {
    try {
      logger.info('Starting availability validation tests...');

      // Load mock data
      this.bookingStore.clear();
      this.cacheService.clear();
      mockBookings.forEach((booking) => this.bookingStore.addBooking(booking));

      logger.info('Mock data loaded successfully');

            // Mock WebSocket behavior
const propertyId = 'property-123';
const { webSocketService } = require('../lib/services/websocket.service');


// Subscribe to calendar updates
const mockCallback = jest.fn();
const unsubscribe = webSocketService.subscribeToCalendarUpdates(propertyId, mockCallback);

// Validate subscription callback
if (!mockCallback.mock.calls.length) {
  throw new Error('WebSocket callback was not triggered');
}

logger.info('WebSocket subscription verified', { propertyId });

// Assert cache invalidation
const cacheKey = `bookings:${propertyId}`;
if (this.cacheService.has(cacheKey)) {
  throw new Error(`Cache was not invalidated for property: ${propertyId}`);
} else {
  logger.info('Cache invalidation verified for property', { propertyId });
}

// Cleanup
unsubscribe();
      
            // Simulate the subscription callback and check cache invalidation
            const cacheKey = `bookings:${propertyId}`;
            const mockEvent = {
              type: 'booking',
              propertyId,
              bookingId: 'mockBookingId',
              checkIn: '2024-12-21T12:00:00+05:30',
              checkOut: '2024-12-22T12:00:00+05:30',
              userId: 'mockUserId',
              timestamp: Date.now(),
            };

            // Log the simulated WebSocket event
logger.info('Simulating WebSocket event', { event: mockEvent });

// Invoke the callback to simulate a WebSocket event
mockCallback(mockEvent);

            // Invoke the callback to simulate a WebSocket event
            mockCallback(mockEvent);
         // Log cache status before invalidation
logger.debug('Cache status before invalidation', { hasCache: this.cacheService.has(cacheKey) });

// Assert cache invalidation
if (this.cacheService.has(cacheKey)) {
  throw new Error(`Cache was not invalidated for property: ${propertyId}`);
} else {
  logger.info('Cache invalidation verified for property', { propertyId });
}
            // Assert cache invalidation
            if (this.cacheService.has(cacheKey)) {
              throw new Error(`Cache was not invalidated for property: ${propertyId}`);
            } else {
              logger.info('Cache invalidation verified for property', { propertyId });
            }      

            // Log results of test case 1
logger.debug('Test Case 1: Checking availability', {
  checkIn: '2024-12-21T12:00:00+05:30',
  checkOut: '2024-12-22T12:00:00+05:30',
});
const result1 = await this.availabilityService.isAvailable(
  'property-123',
  '2024-12-21T12:00:00+05:30',
  '2024-12-22T12:00:00+05:30',
  'Asia/Kolkata'
);
logger.debug('Test Case 1 Result:', { result: result1 });

      // Test Case 1: No overlapping bookings
      const result1 = await this.availabilityService.isAvailable(
        'property-123',
        '2024-12-21T12:00:00+05:30',
        '2024-12-22T12:00:00+05:30',
        'Asia/Kolkata'
      );
      logger.info('Test Case 1 Result:', { result: result1 });
      if (!result1) {
        throw new Error('Test Case 1 Failed: Expected true, got false');
      }

      // Test Case 2: Overlapping booking
      const result2 = await this.availabilityService.isAvailable(
        'property-123',
        '2024-12-18T12:00:00+05:30',
        '2024-12-19T12:00:00+05:30',
        'Asia/Kolkata'
      );
      logger.info('Test Case 2 Result:', { result: result2 });
      if (result2) {
        throw new Error('Test Case 2 Failed: Expected false, got true');
      }

      // Test Case: WebSocket error handling
logger.info('Testing WebSocket error handling...');
try {
  const { webSocketService } = require('../lib/services/websocket.service');
  webSocketService.subscribeToCalendarUpdates('invalid-property', () => {
    throw new Error('Invalid subscription');
  });
  logger.error('WebSocket error handling test failed - expected error not thrown');
} catch (error) {
  logger.info('WebSocket error handling test passed', { error: error.message });
}
      logger.info('All availability validation tests passed successfully.');
    } catch (error) {
      logger.error('Availability validation tests failed', { error });
      throw error;
    }
  }
}

// Run validation
(async () => {
  const validator = new AvailabilityValidation();
  await validator.validate();
})();
