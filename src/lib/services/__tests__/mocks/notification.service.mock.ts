import { jest } from '@jest/globals';
import type { Booking, BookingModification } from '../../../types/booking';

export class MockNotificationService {
  private static instance: MockNotificationService | undefined;

  protected constructor() {}

  public static getInstance(): MockNotificationService {
    if (!MockNotificationService.instance) {
      MockNotificationService.instance = new MockNotificationService();
    }
    return MockNotificationService.instance;
  }

  public sendBookingModificationNotification = jest.fn<
    (params: { booking: Booking; modifications: BookingModification }) => Promise<void>
  >().mockImplementation(async () => Promise.resolve());

  public sendBookingCancellationNotification = jest.fn<
    (params: { booking: Booking; refundAmount: number }) => Promise<void>
  >().mockImplementation(async () => Promise.resolve());

  public __reset(): void {
    this.sendBookingModificationNotification.mockClear();
    this.sendBookingCancellationNotification.mockClear();
    MockNotificationService.instance = undefined;
  }
}

export const mockNotificationService = MockNotificationService.getInstance();
