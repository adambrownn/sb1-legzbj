import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentSchema } from '@/lib/validations/payment';
import { usePaymentStore } from '@/lib/store/payment-store';
import { useBookingStore } from '@/lib/store/booking-store';
import type { Booking } from '@/lib/types/booking';

interface PaymentFormProps {
  booking: Booking;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ booking, onSuccess, onCancel }: PaymentFormProps) {
  const { addPayment } = usePaymentStore();
  const { updateBooking } = useBookingStore();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = async (data: any) => {
    setIsProcessing(true);
    try {
      // In a real app, this would make an API call to process the payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      addPayment({
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalPrice,
        currency: 'USD',
        status: 'completed',
        method: 'card',
      });

      updateBooking(booking.id, {
        status: 'confirmed',
        paymentStatus: 'completed',
      });

      toast.success('Payment processed successfully');
      onSuccess?.();
    } catch (error) {
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Secure Payment
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Your payment information is encrypted and secure.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Number
        </label>
        <input
          type="text"
          maxLength={16}
          placeholder="1234 5678 9012 3456"
          {...register('cardNumber')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">
            {errors.cardNumber.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Month
          </label>
          <input
            type="text"
            maxLength={2}
            placeholder="MM"
            {...register('expiryMonth')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.expiryMonth && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expiryMonth.message as string}
            </p>
          )}
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            type="text"
            maxLength={4}
            placeholder="YYYY"
            {...register('expiryYear')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.expiryYear && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expiryYear.message as string}
            </p>
          )}
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            CVC
          </label>
          <input
            type="text"
            maxLength={4}
            placeholder="123"
            {...register('cvc')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.cvc && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cvc.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : `Pay $${booking.totalPrice}`}
        </Button>
      </div>
    </form>
  );
}