import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, isBefore } from 'date-fns';
import type { Booking, BookingStatus, CancellationPolicy } from '@/lib/types/booking';

interface BookingState {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => Booking;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  cancelBooking: (id: string, reason: string) => boolean;
  getPropertyBookings: (propertyId: string) => Booking[];
  getUserBookings: (userId: string) => Booking[];
  getPendingBookings: () => Booking[];
  getBookingsByStatus: (status: BookingStatus) => Booking[];
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
      return isBefore(today, addDays(checkIn, -7));
    default:
      return false;
  }
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: [],
      addBooking: (booking) => {
        const newBooking = {
          ...booking,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));
        return newBooking;
      },
      updateBooking: (id, updates) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
              : booking
          ),
        }));
      },
      cancelBooking: (id, reason) => {
        const booking = get().bookings.find((b) => b.id === id);
        if (!booking) return false;

        if (canCancelBooking(booking, booking.cancellationPolicy)) {
          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === id
                ? {
                    ...b,
                    status: 'cancelled',
                    cancellationReason: reason,
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
          }));
          return true;
        }
        return false;
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
    }),
    {
      name: 'booking-storage',
    }
  )
);