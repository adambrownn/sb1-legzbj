import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookingList } from '@/components/bookings/booking-list';
import { useBookingStore } from '@/lib/store/booking-store';
import { useAuthStore } from '@/lib/store/auth-store';
import type { Booking } from '@/lib/types/booking';

export function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getUserBookings, cancelBooking } = useBookingStore();

  if (!user) {
    navigate('/auth?type=login');
    return null;
  }

  const bookings = getUserBookings(user.id);
  const activeBookings = bookings.filter((b) => b.status === 'confirmed');
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  const handleCancelBooking = (booking: Booking) => {
    const success = cancelBooking(booking.id, 'Guest cancelled the booking');
    if (success) {
      toast.success('Booking cancelled successfully');
    } else {
      toast.error('Unable to cancel booking due to cancellation policy');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">My Bookings</h1>

      {activeBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Upcoming Stays</h2>
          <BookingList
            bookings={activeBookings}
            onCancel={handleCancelBooking}
          />
        </div>
      )}

      {pastBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Past Stays</h2>
          <BookingList bookings={pastBookings} />
        </div>
      )}

      {bookings.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-gray-600">You don't have any bookings yet.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Start exploring places to stay
          </button>
        </div>
      )}
    </div>
  );
}