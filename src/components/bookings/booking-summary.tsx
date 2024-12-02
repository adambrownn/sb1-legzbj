import React from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Check } from 'lucide-react';
import type { BookingDetails } from '@/lib/types/booking';
import type { Property } from '@/lib/types/property';

interface BookingSummaryProps {
  booking: BookingDetails;
  property: Property;
}

export function BookingSummary({ booking, property }: BookingSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold">Booking Confirmed!</h3>
        <p className="mt-1 text-sm text-gray-600">
          Your stay at {property.title} has been confirmed.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Check-in</p>
              <p className="text-sm text-gray-600">
                {format(booking.checkIn, 'PPP')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Check-out</p>
              <p className="text-sm text-gray-600">
                {format(booking.checkOut, 'PPP')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Guests</p>
              <p className="text-sm text-gray-600">
                {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between font-medium">
            <span>Total Amount</span>
            <span>${booking.totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-700">
        <p>
          A confirmation email has been sent to {booking.email}. Please check your
          inbox for further details about your stay.
        </p>
      </div>
    </div>
  );
}