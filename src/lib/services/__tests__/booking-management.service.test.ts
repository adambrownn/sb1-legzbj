// Mock environment variables
process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
process.env.TWILIO_AUTH_TOKEN = 'test_token';
process.env.TWILIO_FROM_NUMBER = '+1234567890';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test_password';

import { jest } from '@jest/globals';
import { BookingManagementService } from '../booking-management.service';
import { bookingStore, BookingStore } from '../../store/booking-store';
import { CacheService } from '../cache.service';
import { webSocketService } from '../websocket.service';
import type { Booking, BookingStatus } from '../../types/booking';
import type { CancellationPolicy } from '../../types/booking';
import { ExternalBooking } from '../../services/calendar-sync.service';

// Mock interfaces
interface BookingState {
  bookings: Booking[];
  externalBookings: Record<string, ExternalBooking[]>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => Booking;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  cancelBooking: (id: string, reason: string) => boolean;
  getPropertyBookings: (propertyId: string) => Booking[];
  getUserBookings: (userId: string) => Booking[];
  getPendingBookings: () => Booking[];
  getBookingsByStatus: (status: BookingStatus) => Booking[];
  updateExternalBookings: (propertyId: string, bookings: ExternalBooking[]) => void;
}

type BookingInput = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

interface MockBookingStore extends Omit<BookingStore, 'store' | 'isInitialized'> {
  addBooking: jest.MockedFunction<BookingStore['addBooking']>;
  getBookings: jest.MockedFunction<BookingStore['getBookings']>;
  updateBooking: jest.MockedFunction<BookingStore['updateBooking']>;
  cancelBooking: jest.MockedFunction<BookingStore['cancelBooking']>;
  getState: jest.MockedFunction<() => BookingState>;
  setInitialized: jest.MockedFunction<(initialized: boolean) => void>;
  isStoreInitialized: jest.MockedFunction<() => boolean>;
  clear: jest.MockedFunction<() => Promise<void>>;
}

interface MockAvailabilityService {
  isAvailable: jest.MockedFunction<(propertyId: string, startDate: string, endDate: string, timezone: string) => Promise<boolean>>;
  checkAvailability: jest.MockedFunction<() => Promise<boolean>>;
  getBlockedDates: jest.MockedFunction<() => Promise<string[]>>;
}

interface MockPaymentService {
  processPayment: jest.MockedFunction<(payload: any) => Promise<{ status: string }>>;
  validateWebhook: jest.MockedFunction<(data: any) => Promise<{ status: string }>>;
}

interface MockNotificationService {
  sendBookingModificationNotification: jest.MockedFunction<(data: any) => Promise<void>>;
  sendBookingCancellationNotification: jest.MockedFunction<(data: any) => Promise<void>>;
  sendEmail: jest.MockedFunction<(to: string, subject: string, body: string) => Promise<void>>;
  sendSMS: jest.MockedFunction<(to: string, message: string) => Promise<void>>;
  emailTransporter: {
    sendMail: jest.MockedFunction<(options: any) => Promise<{ messageId: string }>>;
  };
  twilioClient: {
    messages: {
      create: jest.MockedFunction<(options: any) => Promise<{ sid: string }>>;
    };
  };
}

interface MockCacheService {
  get: jest.MockedFunction<(key: string) => Promise<any>>;
  set: jest.MockedFunction<(key: string, value: any) => Promise<void>>;
  delete: jest.MockedFunction<(key: string) => Promise<void>>;
  clear: jest.MockedFunction<() => Promise<void>>;
  getInstance: jest.MockedFunction<() => MockCacheService | null>;
}

let mockBookingStore: MockBookingStore;
let mockAvailabilityService: MockAvailabilityService;
let mockPaymentService: MockPaymentService;
let mockNotificationService: MockNotificationService;
let mockCacheService: MockCacheService;
let bookingService: BookingManagementService;

jest.mock('../websocket.service', () => ({
  webSocketService: {
    getInstance: jest.fn(),
    initializeSocket: jest.fn(),
    setupEventListeners: jest.fn(),
    disconnect: jest.fn()
  }
}));

describe('BookingManagementService', () => {
  let mockBookingStore: MockBookingStore;
  let mockAvailabilityService: MockAvailabilityService;
  let mockPaymentService: MockPaymentService;
  let mockNotificationService: MockNotificationService;
  let mockCacheService: MockCacheService;
  let bookingService: BookingManagementService;

  const defaultBooking: Booking = {
    id: 'test-booking-id',
    propertyId: 'test-property-id',
    userId: 'test-user-id',
    checkIn: '2024-01-07',
    checkOut: '2024-01-14',
    guests: 2,
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    totalAmount: 1000,
    status: 'confirmed' as BookingStatus,
    cancellationPolicy: 'strict' as CancellationPolicy,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    timezone: 'UTC'
  };

  beforeAll(() => {
    jest.setTimeout(30000); // Increase global timeout
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    const mockState: BookingState = {
      bookings: [defaultBooking],
      externalBookings: {},
      addBooking: (booking) => ({
        ...booking,
        id: 'test-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Booking),
      updateBooking: () => {},
      cancelBooking: () => true,
      getPropertyBookings: () => [defaultBooking],
      getUserBookings: () => [defaultBooking],
      getPendingBookings: () => [defaultBooking],
      getBookingsByStatus: () => [defaultBooking],
      updateExternalBookings: () => {}
    };

    mockBookingStore = {
      addBooking: jest.fn<BookingStore['addBooking']>().mockResolvedValue(defaultBooking),
      getBookings: jest.fn<BookingStore['getBookings']>().mockResolvedValue([defaultBooking]),
      updateBooking: jest.fn<BookingStore['updateBooking']>().mockResolvedValue(undefined),
      cancelBooking: jest.fn<BookingStore['cancelBooking']>().mockResolvedValue(true),
      getState: jest.fn<() => BookingState>().mockReturnValue(mockState),
      setInitialized: jest.fn<(initialized: boolean) => void>(),
      isStoreInitialized: jest.fn<() => boolean>().mockReturnValue(true),
      clear: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    } as MockBookingStore;

    mockAvailabilityService = {
      isAvailable: jest.fn<(propertyId: string, startDate: string, endDate: string, timezone: string) => Promise<boolean>>().mockResolvedValue(true),
      checkAvailability: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
      getBlockedDates: jest.fn<() => Promise<string[]>>().mockResolvedValue([])
    } as MockAvailabilityService;

    mockPaymentService = {
      processPayment: jest.fn<(payload: any) => Promise<{ status: string }>>().mockResolvedValue({ status: 'succeeded' }),
      validateWebhook: jest.fn<(data: any) => Promise<{ status: string }>>().mockResolvedValue({ status: 'success' })
    } as MockPaymentService;

    mockNotificationService = {
      sendBookingModificationNotification: jest.fn<(data: any) => Promise<void>>().mockResolvedValue(undefined),
      sendBookingCancellationNotification: jest.fn<(data: any) => Promise<void>>().mockResolvedValue(undefined),
      sendEmail: jest.fn<(to: string, subject: string, body: string) => Promise<void>>().mockResolvedValue(undefined),
      sendSMS: jest.fn<(to: string, message: string) => Promise<void>>().mockResolvedValue(undefined),
      emailTransporter: {
        sendMail: jest.fn<(options: any) => Promise<{ messageId: string }>>().mockResolvedValue({ messageId: 'test' })
      },
      twilioClient: {
        messages: {
          create: jest.fn<(options: any) => Promise<{ sid: string }>>().mockResolvedValue({ sid: 'test' })
        }
      }
    } as MockNotificationService;

    mockCacheService = {
      get: jest.fn<(key: string) => Promise<any>>().mockResolvedValue(null),
      set: jest.fn<(key: string, value: any) => Promise<void>>().mockResolvedValue(undefined),
      delete: jest.fn<(key: string) => Promise<void>>().mockResolvedValue(undefined),
      clear: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getInstance: jest.fn<() => MockCacheService | null>().mockReturnValue(null)
    } as MockCacheService;

    BookingManagementService.resetInstance();
    CacheService.resetInstance();
    bookingService = BookingManagementService.getInstance();

    // Inject mocks
    (bookingService as any).bookingStore = mockBookingStore;
    (bookingService as any).availabilityService = mockAvailabilityService;
    (bookingService as any).paymentService = mockPaymentService;
    (bookingService as any).notificationService = mockNotificationService;
    (bookingService as any).cacheService = mockCacheService;
  });

  afterEach(async () => {
    // Increase timeout for cleanup
    jest.setTimeout(30000);

    try {
      // Clear all timers first
      jest.clearAllTimers();
      jest.useRealTimers();

      // Clean up services in parallel
      await Promise.all([
        webSocketService?.disconnect(),
        bookingService?.cleanup?.(),
        mockCacheService?.clear(),
        mockBookingStore?.clear()
      ].filter(Boolean));
      
      // Reset instances
      BookingManagementService.resetInstance();
      CacheService.resetInstance();
      
      // Clear all mocks and restore modules
      jest.clearAllMocks();
      jest.resetModules();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const bookingData: Partial<Booking> = {
        propertyId: 'test-property-id',
        userId: 'test-user-id',
        checkIn: '2024-01-07',
        checkOut: '2024-01-14',
        guests: 2,
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        totalAmount: 1000,
        timezone: 'UTC',
        status: 'pending' as BookingStatus,
        cancellationPolicy: 'flexible' as CancellationPolicy
      };

      const result = await bookingService.createBooking(bookingData);

      expect(mockAvailabilityService.isAvailable).toHaveBeenCalledWith(
        bookingData.propertyId,
        bookingData.checkIn,
        bookingData.checkOut,
        bookingData.timezone
      );
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: bookingData.totalAmount,
        currency: 'USD',
        paymentMethod: 'card',
        metadata: {
          type: 'booking_creation',
          propertyId: bookingData.propertyId
        }
      });
      expect(mockBookingStore.addBooking).toHaveBeenCalled();
      expect(result).toEqual(defaultBooking);
    });
  });

  describe('getBookingsForProperty', () => {
    it('should retrieve all bookings for a property', async () => {
      const propertyId = 'test-property-id';
      const mockBookings = [defaultBooking];
      mockBookingStore.getBookings.mockResolvedValueOnce(mockBookings);

      const result = await bookingService.getBookingsForProperty(propertyId);
      expect(result).toEqual(mockBookings);
      expect(mockBookingStore.getBookings).toHaveBeenCalledWith(propertyId);
    });
  });

  describe('updateBooking', () => {
    it('should update a booking successfully', async () => {
      const bookingId = 'test-booking-id';
      const updateData = {
        guests: 3,
        totalAmount: 1500
      };

      mockBookingStore.getBookings.mockResolvedValueOnce([defaultBooking]);

      await bookingService.updateBooking(bookingId, updateData);

      expect(mockBookingStore.updateBooking).toHaveBeenCalledWith(
        bookingId,
        expect.objectContaining(updateData)
      );
      expect(mockNotificationService.sendBookingModificationNotification).toHaveBeenCalled();
    });

    it('should throw an error when booking does not exist', async () => {
      const bookingId = 'non-existent-id';
      const updateData = { guests: 3 };

      mockBookingStore.getBookings.mockResolvedValueOnce([]);

      await expect(
        bookingService.updateBooking(bookingId, updateData)
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully with full refund', async () => {
      const bookingId = 'test-booking-id';
      const userId = 'test-user-id';
      const existingBooking = {
        ...defaultBooking,
        checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in future
        status: 'confirmed' as BookingStatus,
        cancellationPolicy: 'flexible' as CancellationPolicy
      };

      mockBookingStore.getBookings.mockResolvedValueOnce([existingBooking]);
      mockBookingStore.cancelBooking.mockResolvedValueOnce(true);

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result).toEqual({
        success: true,
        booking: {
          ...existingBooking,
          status: 'cancelled',
          updatedAt: expect.any(String)
        },
        refundAmount: existingBooking.totalAmount
      });
    });

    it('should return error when booking does not exist', async () => {
      const bookingId = 'non-existent-id';
      const userId = 'test-user-id';

      mockBookingStore.getBookings.mockResolvedValueOnce([]);

      const result = await bookingService.cancelBooking(bookingId, userId);
      expect(result).toEqual({
        success: false,
        error: 'Booking not found'
      });
    });

    it('should return error when user is not authorized', async () => {
      const bookingId = 'test-booking-id';
      const wrongUserId = 'wrong-user-id';

      mockBookingStore.getBookings.mockResolvedValueOnce([defaultBooking]);

      const result = await bookingService.cancelBooking(bookingId, wrongUserId);
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized to cancel this booking'
      });
    });

    it('should return error for already cancelled bookings', async () => {
      const bookingId = 'test-booking-id';
      const userId = 'test-user-id';
      const cancelledBooking = {
        ...defaultBooking,
        status: 'cancelled' as BookingStatus
      };

      mockBookingStore.getBookings.mockResolvedValueOnce([cancelledBooking]);

      const result = await bookingService.cancelBooking(bookingId, userId);
      expect(result).toEqual({
        success: false,
        error: 'Booking is already cancelled'
      });
    });
  });
});
