import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PaymentForm } from '@/components/bookings/payment-form';
import { bookingSchema } from '@/lib/validations/booking';
import { useBookingStore } from '@/lib/store/booking-store';
import { useAuthStore } from '@/lib/store/auth-store';
import type { PropertyDetails } from '@/lib/types/property';

interface BookingFormProps {
  property: PropertyDetails;
  selectedDates: { checkIn?: Date; checkOut?: Date };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BookingForm({
  property,
  selectedDates,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [showPayment, setShowPayment] = React.useState(false);
  const [currentBooking, setCurrentBooking] = React.useState<any>(null);
  const { user } = useAuthStore();
  const { addBooking } = useBookingStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkIn: selectedDates.checkIn ? format(selectedDates.checkIn, 'yyyy-MM-dd') : '',
      checkOut: selectedDates.checkOut ? format(selectedDates.checkOut, 'yyyy-MM-dd') : '',
      guestCount: 1,
      specialRequests: '',
      totalPrice: 0,
    },
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guestCount = watch('guestCount');

  const numberOfNights = checkIn && checkOut
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn))
    : 0;

  const totalPrice = numberOfNights * property.price;

  const onSubmit = async (data: any) => {
    if (!user) {
      toast.error('Please log in to make a booking');
      return;
    }

    try {
      const booking = {
        ...data,
        propertyId: property.id,
        userId: user.id,
        status: 'pending',
        paymentStatus: 'pending',
        totalPrice,
      };

      const newBooking = addBooking(booking);
      setCurrentBooking(newBooking);
      setShowConfirmation(false);
      setShowPayment(true);
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Number of Guests
        </label>
        <input
          type="number"
          min={1}
          max={property.maxGuests}
          {...register('guestCount', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.guestCount && (
          <p className="mt-1 text-sm text-red-600">
            {errors.guestCount.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Special Requests
        </label>
        <textarea
          {...register('specialRequests')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Any special requirements?"
        />
      </div>

      <div className="rounded-md bg-gray-50 p-4">
        <h3 className="text-lg font-semibold">Price Summary</h3>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Price per night</span>
            <span>${property.price}</span>
          </div>
          <div className="flex justify-between">
            <span>Number of nights</span>
            <span>{numberOfNights}</span>
          </div>
          <div className="border-t pt-1">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault();
            setShowConfirmation(true);
          }}
        >
          Continue to Payment
        </Button>
      </div>

      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Booking Details"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{property.title}</h3>
            <div className="text-sm text-gray-600">
              <p>Check-in: {format(parseISO(checkIn), 'PPP')}</p>
              <p>Check-out: {format(parseISO(checkOut), 'PPP')}</p>
              <p>Guests: {guestCount}</p>
              <p className="mt-2 font-semibold">Total: ${totalPrice}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              onClick={handleSubmit(onSubmit)}
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title="Payment Details"
      >
        {currentBooking && (
          <PaymentForm
            booking={currentBooking}
            onSuccess={() => {
              setShowPayment(false);
              onSuccess?.();
            }}
            onCancel={() => {
              setShowPayment(false);
              onCancel?.();
            }}
          />
        )}
      </Dialog>
    </form>
  );
}