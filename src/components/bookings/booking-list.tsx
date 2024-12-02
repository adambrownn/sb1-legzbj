import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { usePropertyStore } from '@/lib/store/property-store';
import type { Booking } from '@/lib/types/booking';

interface BookingListProps {
  bookings: Booking[];
  onCancel?: (booking: Booking) => void;
  showProperty?: boolean;
}

export function BookingList({ bookings, onCancel, showProperty = true }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const properties = usePropertyStore((state) => state.properties);

  const getPropertyDetails = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId);
  };

  const handleCancel = () => {
    if (selectedBooking && onCancel) {
      onCancel(selectedBooking);
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const property = getPropertyDetails(booking.propertyId);
        if (!property) return null;

        return (
          <div
            key={booking.id}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            {showProperty && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{property.title}</h3>
                <div className="mt-1 flex items-center text-gray-500">
                  <MapPin className="mr-1 h-4 w-4" />
                  {property.location}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Check-in</p>
                  <p className="text-gray-600">
                    {format(new Date(booking.checkIn), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Check-out</p>
                  <p className="text-gray-600">
                    {format(new Date(booking.checkOut), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Guests</p>
                  <p className="text-gray-600">{booking.guestCount} guests</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <span className="text-gray-600">
                  Total: ${booking.totalPrice}
                </span>
              </div>

              {booking.status === 'confirmed' && onCancel && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowCancelDialog(true);
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        );
      })}

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
              onClick={handleCancel}
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