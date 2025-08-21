import { BaseValidation } from './validate-base';
import { CalendarSyncService } from '../lib/services/calendar-sync.service';
import { WebSocketReconnectionTest } from './components/websocket/reconnection';
import { MessageOrderingTest } from './components/websocket/message-ordering';
import { BookingConflictsTest } from './components/concurrency/booking-conflicts';
import { DistributedLocksTest } from './components/concurrency/distributed-locks';
import { AirbnbSyncTest } from './platforms/airbnb/sync';
import { BookingComSyncTest } from './platforms/booking-com/sync';
import { createLogger } from '../lib/logger';
import { testExecutionState } from './config/unified-test-config';

export class CalendarSyncValidation extends BaseValidation {
  private calendarSync: CalendarSyncService;
  private logger = createLogger('calendar-sync-validation');
  private successCount = 0;
  private failureCount = 0;

  constructor() {
    super('CalendarSync');
    this.calendarSync = CalendarSyncService.getInstance();
  }

  protected async runValidation(): Promise<void> {
    // WebSocket Tests
    await this.runWithErrorHandling(async () => {
      const wsTest = new WebSocketReconnectionTest();
      await wsTest.validate();
    }, 'WebSocket reconnection validation');

    await this.runWithErrorHandling(async () => {
      const msgTest = new MessageOrderingTest();
      await msgTest.validate();
    }, 'Message ordering validation');

    // Concurrency Tests
    await this.runWithErrorHandling(async () => {
      const conflictsTest = new BookingConflictsTest();
      await conflictsTest.validate();
    }, 'Booking conflicts validation');

    await this.runWithErrorHandling(async () => {
      const locksTest = new DistributedLocksTest();
      await locksTest.validate();
    }, 'Distributed locks validation');

    // Platform-Specific Tests
    await this.runWithErrorHandling(async () => {
      const airbnbTest = new AirbnbSyncTest();
      await airbnbTest.validate();
    }, 'Airbnb sync validation');

    await this.runWithErrorHandling(async () => {
      const bookingComTest = new BookingComSyncTest();
      await bookingComTest.validate();
    }, 'Booking.com sync validation');

    this.logger.info('Calendar sync validation completed', {
      successCount: this.successCount,
      failureCount: this.failureCount
    });
  }

  private async runWithErrorHandling(
    testFn: () => Promise<void>,
    testName: string
  ): Promise<void> {
    try {
      await testFn();
      this.successCount++;
      this.logger.info(`✓ ${testName} passed`);
    } catch (error) {
      this.failureCount++;
      this.logger.error(`✗ ${testName} failed:`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = new CalendarSyncValidation();
  validation.runValidation().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}
