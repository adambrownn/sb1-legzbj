import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCurrencyStore } from '@/lib/store/currency-store';

interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  imageUrl: string;
}

// This would be replaced with an actual API call
const fetchBookings = async (userId: string): Promise<Booking[]> => {
  // Simulated API response
  return [
    {
      id: '1',
      propertyId: 'prop1',
      propertyName: 'Luxury Beach Villa',
      location: 'Miami Beach, FL',
      checkIn: '2024-03-15',
      checkOut: '2024-03-20',
      totalPrice: 1495,
      status: 'confirmed',
      imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    },
    // Add more mock bookings here
  ];
};

export function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { formatPrice } = useCurrencyStore();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => fetchBookings(user?.id || ''),
    enabled: !!user,
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">My Bookings</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings?.map((booking) => (
            <div
              key={booking.id}
              className="overflow-hidden rounded-lg bg-white shadow-md"
            >
              <img
                src={booking.imageUrl}
                alt={booking.propertyName}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="mb-2 text-xl font-semibold">{booking.propertyName}</h3>
                <div className="mb-4 flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{booking.location}</span>
                </div>
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Check-in: {format(new Date(booking.checkIn), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Check-out: {format(new Date(booking.checkOut), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {formatPrice(booking.totalPrice)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {bookings?.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600">You don't have any bookings yet.</p>
            <button
              onClick={() => navigate('/properties')}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
}