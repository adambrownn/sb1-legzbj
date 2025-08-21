import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, isBefore } from 'date-fns';
import type { Booking, BookingStatus, CancellationPolicy } from '@/lib/types/booking';
import { ExternalBooking } from '../services/calendar-sync.service';
import pino from 'pino';

// Create logger without circular dependency
const logger = pino({
  name: 'booking-store',
  level: process.env.NODE_ENV === 'test' ? 'debug' : 'info'
});

// Simple ID generator
const generateId = () => `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

const canCancelBooking = (booking: Booking, policy: CancellationPolicy): boolean => {
  const checkIn = new Date(booking.checkIn);
  const today = new Date();

  switch (policy) {
    case 'flexible':
      return isBefore(today, addDays(checkIn, -1));
    case 'moderate':
      return isBefore(today, addDays(checkIn, -5));
    case 'strict':
      return isBefore(today, addDays(checkIn, -14));
    default:
      return false;
  }
};

// Create the store with memory storage for tests
const createStore = () => {
  // Use in-memory storage for tests
  if (process.env.NODE_ENV === 'test') {
    let memoryState = { bookings: [], externalBookings: {} };
    const memoryStorage = {
      getItem: () => JSON.stringify({ state: memoryState }),
      setItem: (_key: string, value: string) => {
        const parsed = JSON.parse(value);
        memoryState = parsed.state;
      },
      removeItem: () => {
        memoryState = { bookings: [], externalBookings: {} };
      }
    };

    return create<BookingState>()(
      persist(
        (set, get) => ({
          bookings: [],
          externalBookings: {},
          addBooking: (booking) => {
            const newBooking = {
              ...booking,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            set((state) => ({
              bookings: [...state.bookings, newBooking]
            }));
            logger.debug(`Added booking: ${newBooking.id}`);
            return newBooking;
          },
          updateBooking: (id, updatedFields) => {
            set((state) => ({
              bookings: state.bookings.map((booking) =>
                booking.id === id
                  ? { ...booking, ...updatedFields, updatedAt: new Date().toISOString() }
                  : booking
              )
            }));
            logger.debug(`Updated booking: ${id}`);
          },
          cancelBooking: (id, reason) => {
            const booking = get().bookings.find((b) => b.id === id);
            if (!booking) return false;

            const canCancel = canCancelBooking(booking, booking.cancellationPolicy);
            if (!canCancel) return false;

            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.id === id
                  ? {
                      ...b,
                      status: 'cancelled',
                      cancellationReason: reason,
                      updatedAt: new Date().toISOString()
                    }
                  : b
              )
            }));

            logger.debug(`Cancelled booking: ${id}`);
            return true;
          },
          getPropertyBookings: (propertyId) => {
            return get().bookings.filter((booking) => booking.propertyId === propertyId);
          },
          getUserBookings: (userId) => {
            return get().bookings.filter((booking) => booking.userId === userId);
          },
          getPendingBookings: () => {
            return get().bookings.filter((booking) => booking.status === 'pending');
          },
          getBookingsByStatus: (status) => {
            return get().bookings.filter((booking) => booking.status === status);
          },
          updateExternalBookings: (propertyId, bookings) => {
            set((state) => ({
              externalBookings: {
                ...state.externalBookings,
                [propertyId]: bookings
              }
            }));
            logger.debug(`Updated external bookings for property: ${propertyId}`);
          }
        }),
        {
          name: 'booking-store',
          storage: createJSONStorage(() => memoryStorage)
        }
      )
    );
  }

  // Use persistent storage for non-test environments
  return create<BookingState>()(
    persist(
      (set, get) => ({
        bookings: [],
        externalBookings: {},
        addBooking: (booking) => {
          const newBooking = {
            ...booking,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          set((state) => ({
            bookings: [...state.bookings, newBooking]
          }));
          logger.debug(`Added booking: ${newBooking.id}`);
          return newBooking;
        },
        updateBooking: (id, updatedFields) => {
          set((state) => ({
            bookings: state.bookings.map((booking) =>
              booking.id === id
                ? { ...booking, ...updatedFields, updatedAt: new Date().toISOString() }
                : booking
            )
          }));
          logger.debug(`Updated booking: ${id}`);
        },
        cancelBooking: (id, reason) => {
          const booking = get().bookings.find((b) => b.id === id);
          if (!booking) return false;

          const canCancel = canCancelBooking(booking, booking.cancellationPolicy);
          if (!canCancel) return false;

          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === id
                ? {
                    ...b,
                    status: 'cancelled',
                    cancellationReason: reason,
                    updatedAt: new Date().toISOString()
                  }
                : b
            )
          }));

          logger.debug(`Cancelled booking: ${id}`);
          return true;
        },
        getPropertyBookings: (propertyId) => {
          return get().bookings.filter((booking) => booking.propertyId === propertyId);
        },
        getUserBookings: (userId) => {
          return get().bookings.filter((booking) => booking.userId === userId);
        },
        getPendingBookings: () => {
          return get().bookings.filter((booking) => booking.status === 'pending');
        },
        getBookingsByStatus: (status) => {
          return get().bookings.filter((booking) => booking.status === status);
        },
        updateExternalBookings: (propertyId, bookings) => {
          set((state) => ({
            externalBookings: {
              ...state.externalBookings,
              [propertyId]: bookings
            }
          }));
          logger.debug(`Updated external bookings for property: ${propertyId}`);
        }
      }),
      {
        name: 'booking-store',
        storage: createJSONStorage(() => localStorage)
      }
    )
  );
};

// Create a wrapper class for the store
export class BookingStore {
  private store;
  private isInitialized: boolean = false;

  constructor() {
    this.store = createStore();
    logger.debug('BookingStore initialized');
  }

  async addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    return this.store.getState().addBooking(booking);
  }

  async getBookings(propertyId: string): Promise<Booking[]> {
    return this.store.getState().getPropertyBookings(propertyId);
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<void> {
    this.store.getState().updateBooking(id, booking);
  }

  async cancelBooking(id: string, reason: string): Promise<boolean> {
    return this.store.getState().cancelBooking(id, reason);
  }

  getState() {
    return this.store.getState();
  }

  setInitialized(value: boolean = true) {
    this.isInitialized = value;
    logger.debug(`BookingStore initialized set to: ${value}`);
  }

  isStoreInitialized() {
    return this.isInitialized;
  }

  async clear(): Promise<void> {
    this.store.setState((state) => ({
      ...state,
      bookings: [],
      externalBookings: {}
    }));
    logger.debug('BookingStore reset');
  }
}

// Export a singleton instance for direct use
export const bookingStore = new BookingStore();

// Export the store API for components that need direct store access
export const bookingStoreApi = createStore();

// Export the hook for React components
export const useBookingStore = createStore;