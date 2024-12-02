import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookingAnalytics } from '@/components/admin/booking-analytics';
import { BookingTable } from '@/components/admin/booking-table';
import { FeedbackManagement } from '@/components/admin/feedback-management';
import { FeedbackTrends } from '@/components/admin/feedback-trends';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBookingStore } from '@/lib/store/booking-store';
import { useAuthStore } from '@/lib/store/auth-store';
import type { Booking } from '@/lib/types/booking';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const bookings = useBookingStore((state) => state.bookings);
  const { updateBooking, cancelBooking } = useBookingStore();
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = () => {
    if (selectedBooking) {
      const success = cancelBooking(selectedBooking.id, 'Cancelled by admin');
      if (success) {
        toast.success('Booking cancelled successfully');
      } else {
        toast.error('Failed to cancel booking');
      }
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Booking Analytics</h2>
          <BookingAnalytics />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Feedback Overview</h2>
          <FeedbackTrends />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Feedback Management</h2>
          <FeedbackManagement />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">All Bookings</h2>
          <BookingTable
            bookings={bookings}
            onEditBooking={handleEditBooking}
            onCancelBooking={handleCancelBooking}
          />
        </div>
      </div>

      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Booking
            </Button>
            <Button
              onClick={confirmCancelBooking}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}