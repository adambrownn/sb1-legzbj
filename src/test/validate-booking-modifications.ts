import { BookingManagementService } from '../lib/services/booking-management.service';
import { NotificationService } from '../lib/services/notification.service';
import { mockBookingData } from './mocks/booking-modification-data';
import pino from 'pino';
import { addDays, subDays } from 'date-fns';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export class BookingModificationValidation {
  private bookingService: BookingManagementService;
  private notificationService: NotificationService;
  private successCount = 0;
  private failureCount = 0;

  constructor() {
    this.bookingService = new BookingManagementService();
    this.notificationService = new NotificationService();
  }

  private logResult(testName: string, success: boolean, error?: any) {
    if (success) {
      logger.info(`✓ ${testName} passed`);
      this.successCount++;
    } else {
      logger.error(`✗ ${testName} failed: ${error?.message || 'Unknown error'}`);
      this.failureCount++;
    }
  }

  async validateBookingModifications() {
    logger.info('Testing booking modifications...');

    // Test date modification with price increase
    try {
      const { bookingId, changes, expectedPriceChange } = mockBookingData.modificationRequests[0];
      const result = await this.bookingService.modifyBooking(bookingId, changes);
      
      const isValid = result.success &&
        result.priceChange === expectedPriceChange &&
        result.newTotalAmount === mockBookingData.validBookings[0].totalAmount + expectedPriceChange;
      
      this.logResult('Booking modification - extended stay', isValid);
    } catch (error) {
      this.logResult('Booking modification - extended stay', false, error);
    }

    // Test date modification with price decrease
    try {
      const { bookingId, changes, expectedPriceChange } = mockBookingData.modificationRequests[1];
      const result = await this.bookingService.modifyBooking(bookingId, changes);
      
      const isValid = result.success &&
        result.priceChange === expectedPriceChange &&
        result.newTotalAmount === mockBookingData.validBookings[1].totalAmount + expectedPriceChange;
      
      this.logResult('Booking modification - shortened stay', isValid);
    } catch (error) {
      this.logResult('Booking modification - shortened stay', false, error);
    }

    // Test invalid modification (overlapping dates)
    try {
      const result = await this.bookingService.modifyBooking('booking-1', {
        checkIn: mockBookingData.validBookings[1].checkIn,
        checkOut: mockBookingData.validBookings[1].checkOut,
      });
      this.logResult('Invalid modification - overlapping dates', !result.success);
    } catch (error) {
      this.logResult('Invalid modification - overlapping dates', true);
    }

    // Test guest count modification
    try {
      const result = await this.bookingService.modifyBooking('booking-1', {
        guestCount: 5,
      });
      this.logResult('Guest count modification', result.success);
    } catch (error) {
      this.logResult('Guest count modification', false, error);
    }
  }

  async validateBookingCancellations() {
    logger.info('Testing booking cancellations...');

    // Test full refund cancellation
    try {
      const booking = mockBookingData.validBookings[0];
      const result = await this.bookingService.cancelBooking(booking.id);
      
      const isValid = result.success &&
        result.refundAmount === booking.totalAmount &&
        result.refundStatus === 'full';
      
      this.logResult('Cancellation with full refund', isValid);
    } catch (error) {
      this.logResult('Cancellation with full refund', false, error);
    }

    // Test partial refund cancellation
    try {
      const booking = mockBookingData.validBookings[1];
      const result = await this.bookingService.cancelBooking(booking.id);
      
      const expectedRefund = booking.totalAmount * 
        (mockBookingData.cancellationPolicies.moderate.partialRefundPercentage / 100);
      
      const isValid = result.success &&
        result.refundAmount === expectedRefund &&
        result.refundStatus === 'partial';
      
      this.logResult('Cancellation with partial refund', isValid);
    } catch (error) {
      this.logResult('Cancellation with partial refund', false, error);
    }

    // Test no refund cancellation
    try {
      const booking = mockBookingData.validBookings[2];
      const result = await this.bookingService.cancelBooking(booking.id);
      
      const isValid = result.success &&
        result.refundAmount === 0 &&
        result.refundStatus === 'none';
      
      this.logResult('Cancellation with no refund', isValid);
    } catch (error) {
      this.logResult('Cancellation with no refund', false, error);
    }

    // Test invalid cancellation (booking not found)
    try {
      await this.bookingService.cancelBooking('invalid-booking-id');
      this.logResult('Invalid cancellation - booking not found', false);
    } catch (error) {
      this.logResult('Invalid cancellation - booking not found', true);
    }

    // Test unauthorized cancellation
    try {
      await this.bookingService.cancelBooking('booking-1', 'unauthorized-user');
      this.logResult('Unauthorized cancellation', false);
    } catch (error) {
      this.logResult('Unauthorized cancellation', true);
    }
  }

  async validateNotifications() {
    logger.info('Testing notification handling...');

    // Test modification email notification
    try {
      const result = await this.notificationService.sendEmail(
        mockBookingData.mockNotifications.email.modification
      );
      this.logResult('Modification email notification', result.sent);
    } catch (error) {
      this.logResult('Modification email notification', false, error);
    }

    // Test cancellation email notification
    try {
      const result = await this.notificationService.sendEmail(
        mockBookingData.mockNotifications.email.cancellation
      );
      this.logResult('Cancellation email notification', result.sent);
    } catch (error) {
      this.logResult('Cancellation email notification', false, error);
    }

    // Test modification SMS notification
    try {
      const result = await this.notificationService.sendSMS(
        mockBookingData.mockNotifications.sms.modification
      );
      this.logResult('Modification SMS notification', 
        result.sid === mockBookingData.mockTwilioResponses.success.sid);
    } catch (error) {
      this.logResult('Modification SMS notification', false, error);
    }

    // Test cancellation SMS notification
    try {
      const result = await this.notificationService.sendSMS(
        mockBookingData.mockNotifications.sms.cancellation
      );
      this.logResult('Cancellation SMS notification',
        result.sid === mockBookingData.mockTwilioResponses.success.sid);
    } catch (error) {
      this.logResult('Cancellation SMS notification', false, error);
    }

    // Test invalid phone number SMS notification
    try {
      await this.notificationService.sendSMS({
        to: 'invalid-number',
        template: 'test',
      });
      this.logResult('Invalid SMS notification handling', false);
    } catch (error) {
      this.logResult('Invalid SMS notification handling', true);
    }
  }

  async runAll() {
    logger.info('Starting booking modification and cancellation validation...\n');
    
    await this.validateBookingModifications();
    await this.validateBookingCancellations();
    await this.validateNotifications();
    
    this.printSummary();
    return {
      success: this.successCount,
      failure: this.failureCount,
    };
  }

  printSummary() {
    logger.info('\nTest Summary:');
    logger.info(`Total tests: ${this.successCount + this.failureCount}`);
    logger.info(`Successful: ${this.successCount}`);
    logger.info(`Failed: ${this.failureCount}`);
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = new BookingModificationValidation();
  validation.runAll().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}
