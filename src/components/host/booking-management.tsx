import React from 'react';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useBookingStore } from '@/lib/store/booking-store';
import { usePropertyStore } from '@/lib/store/property-store';
import type { Booking } from '@/lib/types/booking';

interface BookingManagementProps {
  hostId: string;
}

export function BookingManagement({ hostId }: BookingManagementProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [showRequestDialog, setShowRequestDialog] = React.useState(false);
  const { bookings, updateBooking } = useBookingStore();
  const { properties } = usePropertyStore();

  const hostBookings = bookings.filter((booking) => {
    const property = properties.find((p) => p.id === booking.propertyId);
    return property?.hostId === hostId;
  });

  const upcomingBookings = hostBookings.filter(
    (booking) => booking.status === 'confirmed' && new Date(booking.checkIn) > new Date()
  );

  const handleSpecialRequest = (booking: Booking, approved: boolean) => {
    updateBooking(booking.id, {
      hostApproval: approved,
      status: approved ? 'confirmed' : 'cancelled',
    });
    toast.success(
      approved ? 'Special request approved' : 'Special request declined'
    );
    setShowRequestDialog(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
        <div className="mt-4 grid gap-4">
          {upcomingBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Check-in: {format(new Date(booking.checkIn), 'PPP')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Check-out: {format(new Date(booking.checkOut), 'PPP')}
                  </p>
                  {booking.specialRequests && (
                    <p className="mt-2 text-sm text-blue-600">
                      Special Request: {booking.specialRequests}
                    </p>
                  )}
                </div>
                {booking.specialRequests && !booking.hostApproval && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSpecialRequest(booking, true)}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSpecialRequest(booking, false)}
                      className="gap-1 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {upcomingBookings.length === 0 && (
            <p className="text-center text-gray-600">No upcoming bookings</p>
          )}
        </div>
      </div>

      <Dialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        title="Special Request"
      >
        {selectedBooking?.specialRequests && (
          <div className="space-y-4">
            <p className="text-gray-600">{selectedBooking.specialRequests}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleSpecialRequest(selectedBooking, false)}
              >
                Decline
              </Button>
              <Button
                onClick={() => handleSpecialRequest(selectedBooking, true)}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}