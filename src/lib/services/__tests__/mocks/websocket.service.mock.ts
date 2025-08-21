import { jest } from '@jest/globals';
import type { Booking } from '../../../types/booking';

// Define interfaces locally to avoid dependency on actual service
export interface CalendarSyncEvent {
  type: 'booking' | 'modification' | 'cancellation';
  propertyId: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  userId: string;
  timestamp: number;
}

type CalendarCallback = (event: CalendarSyncEvent) => void;

interface SubscriptionMap {
  [propertyId: string]: Set<CalendarCallback>;
}

export class MockWebSocketService {
  private subscriptions: SubscriptionMap = {};
  private static instance: MockWebSocketService | undefined;
  private isConnected: boolean = false;

  protected constructor() {}

  public static getInstance(): MockWebSocketService {
    if (!MockWebSocketService.instance) {
      MockWebSocketService.instance = new MockWebSocketService();
    }
    return MockWebSocketService.instance;
  }

  public connect = jest.fn().mockImplementation(() => {
    this.isConnected = true;
    return Promise.resolve();
  });

  public notifyCalendarSync = jest.fn<(event: CalendarSyncEvent) => Promise<void>>()
    .mockImplementation(async (event: CalendarSyncEvent): Promise<void> => {
      if (!this.isConnected) {
        return Promise.reject(new Error('WebSocket not connected'));
      }
      const callbacks = this.subscriptions[event.propertyId];
      if (callbacks) {
        callbacks.forEach(callback => callback(event));
      }
      return Promise.resolve();
    });

  public subscribeToCalendarUpdates = jest.fn<
    (propertyId: string, callback: CalendarCallback) => () => void
  >().mockImplementation((propertyId: string, callback: CalendarCallback): () => void => {
    if (!this.subscriptions[propertyId]) {
      this.subscriptions[propertyId] = new Set();
    }
    
    this.subscriptions[propertyId].add(callback);

    return () => {
      const callbacks = this.subscriptions[propertyId];
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          delete this.subscriptions[propertyId];
        }
      }
    };
  });

  public disconnect = jest.fn<() => Promise<void>>()
    .mockImplementation(async (): Promise<void> => {
      this.isConnected = false;
      this.subscriptions = {};
      return Promise.resolve();
    });

  public __reset(): void {
    this.subscriptions = {};
    this.isConnected = false;
    this.connect.mockClear();
    this.notifyCalendarSync.mockClear();
    this.subscribeToCalendarUpdates.mockClear();
    this.disconnect.mockClear();
    MockWebSocketService.instance = undefined;
  }
}

export const mockWebSocketService = MockWebSocketService.getInstance();
