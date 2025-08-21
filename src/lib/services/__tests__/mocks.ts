import { jest } from '@jest/globals';
import { Booking } from '../../types/booking';
import { BookingModification } from '../services/booking-management.service';

export type MockFunction<T extends (...args: any) => any> = jest.Mock<ReturnType<T>, Parameters<T>>;

export interface MockAvailabilityService {
  isAvailable: MockFunction<(propertyId: string, startDate: string, endDate: string) => Promise<boolean>>;
}

export interface MockPaymentService {
  processPayment: MockFunction<(amount: number, currency: string) => Promise<{ status: string }>>;
}

export interface MockNotificationService {
  sendBookingModificationNotification: MockFunction<(params: { booking: Booking, modifications: BookingModification }) => Promise<void>>;
  sendBookingCancellationNotification: MockFunction<(params: { booking: Booking, refundAmount: number }) => Promise<void>>;
  sendEmail: MockFunction<(params: { to: string, subject: string, text: string }) => Promise<void>>;
  sendSMS: MockFunction<(params: { to: string, message: string }) => Promise<void>>;
  emailTransporter: {
    sendMail: MockFunction<(mailOptions: any) => Promise<{ messageId: string }>>;
  };
  twilioClient: {
    messages: {
      create: MockFunction<(options: any) => Promise<{ sid: string }>>;
    };
  };
}

export interface MockCacheService {
  get: MockFunction<(key: string) => Promise<any>>;
  set: MockFunction<(key: string, value: any) => Promise<void>>;
  delete: MockFunction<(key: string) => Promise<void>>;
}

export interface MockNodemailerTransport {
  sendMail: MockFunction<(mailOptions: any) => Promise<{ messageId: string }>>;
}

export interface MockTwilioClient {
  messages: {
    create: MockFunction<(options: any) => Promise<{ sid: string }>>;
  };
}
